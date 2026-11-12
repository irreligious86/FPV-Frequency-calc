/**
 * Interference model for FPV video channels. Pure functions, no DOM.
 *
 * A channel is `{ name, frequency, width }` with frequency and width in MHz.
 *
 * Two effects are rated on the same four-step scale (see LEVELS):
 *  - Direct: how much clear spectrum is left between the edges of two channels.
 *  - IMD3: third-order intermodulation products of the other transmitters
 *    (2a - b and a + b - c) that land inside or next to a channel.
 *
 * The model looks at frequencies only. It knows nothing about output power,
 * antennas, polarisation or distance between pilots, so treat the result as
 * a channel-planning aid, not as a link budget.
 */

export const LEVELS = ['none', 'low', 'medium', 'high'];

/** Clear spectrum (MHz) between channel edges below which a level applies. */
export const GUARD = { medium: 10, low: 25 };

/** Extra distance (MHz) past the channel edge where an IMD product still matters. */
export const IMD_MARGIN = 10;

/** Above this many combinations the optimiser switches from exhaustive to greedy. */
const MAX_COMBINATIONS = 50000;

const rank = (level) => LEVELS.indexOf(level);

export function worstLevel(a, b) {
    return rank(a) >= rank(b) ? a : b;
}

/** Clear spectrum between the edges of two channels. Negative means they overlap. */
export function directGap(a, b) {
    return Math.abs(a.frequency - b.frequency) - (a.width + b.width) / 2;
}

export function directLevel(a, b) {
    const gap = directGap(a, b);
    if (gap < 0) return 'high';
    if (gap < GUARD.medium) return 'medium';
    if (gap < GUARD.low) return 'low';
    return 'none';
}

/**
 * Third-order intermodulation products of a set of transmitters.
 * Returns `{ frequency, sources, label }`; `sources` are the channels involved.
 */
export function imdProducts(transmitters) {
    const products = [];
    const n = transmitters.length;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (i === j) continue;
            const a = transmitters[i];
            const b = transmitters[j];
            products.push({
                frequency: 2 * a.frequency - b.frequency,
                sources: [a, b],
                label: `2×${a.name} − ${b.name}`,
            });
        }
    }
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            for (let k = 0; k < n; k++) {
                if (k === i || k === j) continue;
                const a = transmitters[i];
                const b = transmitters[j];
                const c = transmitters[k];
                products.push({
                    frequency: a.frequency + b.frequency - c.frequency,
                    sources: [a, b, c],
                    label: `${a.name} + ${b.name} − ${c.name}`,
                });
            }
        }
    }
    return products;
}

/** How badly a single IMD product affects a channel. IMD never rates above medium. */
export function imdLevel(channel, product) {
    const offset = Math.abs(product.frequency - channel.frequency);
    const half = channel.width / 2;
    if (offset < half) return 'medium';
    if (offset < half + IMD_MARGIN) return 'low';
    return 'none';
}

/** Worst direct neighbour and worst IMD product for one channel among the others. */
function rateChannel(channel, others) {
    let direct = { level: 'none', gap: Infinity, with: null };
    for (const other of others) {
        const gap = directGap(channel, other);
        if (gap < direct.gap) {
            direct = { level: directLevel(channel, other), gap, with: other };
        }
    }

    let imd = { level: 'none', offset: Infinity, product: null };
    for (const product of imdProducts(others)) {
        const level = imdLevel(channel, product);
        if (level === 'none') continue;
        const offset = Math.abs(product.frequency - channel.frequency);
        if (rank(level) > rank(imd.level) || offset < imd.offset) {
            imd = { level, offset, product };
        }
    }

    return { channel, level: worstLevel(direct.level, imd.level), direct, imd };
}

/**
 * Rates every channel of a set against all the others.
 * Returns `{ level, minGap, channels: [{ channel, level, direct, imd }] }`.
 */
export function analyzeSet(channels) {
    const rated = channels.map((channel, i) =>
        rateChannel(channel, channels.filter((_, j) => j !== i))
    );
    return {
        level: rated.reduce((acc, r) => worstLevel(acc, r.level), 'none'),
        minGap: rated.reduce((acc, r) => Math.min(acc, r.direct.gap), Infinity),
        channels: rated,
    };
}

/** Human-readable explanation of one rated channel, or null when it is clean. */
export function describeRating(rating) {
    if (rating.level === 'none') return null;
    const { direct, imd } = rating;
    if (rank(direct.level) >= rank(imd.level)) {
        const gap = Math.round(direct.gap);
        return gap < 0
            ? `overlaps ${direct.with.name} by ${-gap} MHz`
            : `only ${gap} MHz clear of ${direct.with.name}`;
    }
    return `IMD ${imd.product.label} lands ${Math.round(imd.offset)} MHz from centre`;
}

/**
 * What happens if `candidate` joins the already selected channels.
 * Takes the candidate's own rating and any selected channel it would make worse.
 * Returns `{ level, reason }`.
 */
export function rateCandidate(selected, candidate) {
    if (selected.length === 0) return { level: 'none', reason: null };

    const before = analyzeSet(selected);
    const after = analyzeSet([...selected, candidate]);
    const own = after.channels[after.channels.length - 1];

    let result = { level: own.level, reason: describeRating(own) };
    for (let i = 0; i < selected.length; i++) {
        const now = after.channels[i];
        if (rank(now.level) > rank(before.channels[i].level) && rank(now.level) > rank(result.level)) {
            result = { level: now.level, reason: `${now.channel.name}: ${describeRating(now)}` };
        }
    }
    return result;
}

/** Lower is better. Compared lexicographically. */
function scoreSet(channels) {
    const analysis = analyzeSet(channels);
    const total = analysis.channels.reduce((sum, r) => sum + rank(r.level), 0);
    return [rank(analysis.level), total, -analysis.minGap];
}

function isBetter(a, b) {
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return a[i] < b[i];
    }
    return false;
}

function combinationCount(n, k) {
    let result = 1;
    for (let i = 1; i <= k; i++) {
        result = (result * (n - k + i)) / i;
        if (result > MAX_COMBINATIONS) return Infinity;
    }
    return result;
}

function* combinations(items, k, start = 0, prefix = []) {
    if (prefix.length === k) {
        yield prefix;
        return;
    }
    for (let i = start; i <= items.length - (k - prefix.length); i++) {
        yield* combinations(items, k, i + 1, [...prefix, items[i]]);
    }
}

/**
 * Picks channels from `pool` to bring `selected` up to `count` pilots with the
 * least interference. Returns the channels to add, or null when the pool is too
 * small or every option contains a "high" conflict.
 */
export function suggestChannels(selected, pool, count) {
    const needed = count - selected.length;
    if (needed <= 0) return [];

    const taken = new Set(selected.map((c) => c.frequency));
    const candidates = [];
    for (const channel of pool) {
        if (taken.has(channel.frequency)) continue;
        taken.add(channel.frequency);
        candidates.push(channel);
    }
    if (candidates.length < needed) return null;

    let best = null;
    let bestScore = null;

    if (combinationCount(candidates.length, needed) <= MAX_COMBINATIONS) {
        for (const combo of combinations(candidates, needed)) {
            const score = scoreSet([...selected, ...combo]);
            if (!bestScore || isBetter(score, bestScore)) {
                best = combo;
                bestScore = score;
            }
        }
    } else {
        best = [];
        for (let step = 0; step < needed; step++) {
            let pick = null;
            bestScore = null;
            for (const channel of candidates) {
                if (best.includes(channel)) continue;
                const score = scoreSet([...selected, ...best, channel]);
                if (!bestScore || isBetter(score, bestScore)) {
                    pick = channel;
                    bestScore = score;
                }
            }
            best.push(pick);
        }
    }

    return bestScore[0] >= rank('high') ? null : best;
}
