import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
    analyzeSet,
    directGap,
    directLevel,
    imdLevel,
    imdProducts,
    rateCandidate,
    suggestChannels,
} from '../js/interference.js';
import { buildBands } from '../js/channels.js';

const data = JSON.parse(readFileSync(new URL('../data/channels.json', import.meta.url), 'utf8'));
const bands = buildBands(data);
const band = (id) => bands.find((b) => b.id === id);
const raceband = band('analog:5G8:R').channels;
const fatshark = band('analog:5G8:F').channels;
const R = (n) => raceband[n - 1];

test('channel data is complete and well formed', () => {
    assert.ok(bands.length > 20);
    for (const b of bands) {
        assert.ok(b.width > 0, `${b.id} has a width`);
        for (const c of b.channels) {
            assert.ok(c.frequency > 0, `${c.id} has a frequency`);
        }
    }
    assert.equal(R(1).frequency, 5658);
    assert.equal(R(1).name, 'R1');
    assert.equal(band('digital:5G8:DJI_FCC').channels[0].name, 'DJI_FCC ch1');
});

test('direct gap uses the width of both channels', () => {
    assert.equal(directGap(R(1), R(2)), 7);
    assert.equal(directGap(R(1), R(3)), 44);
    assert.equal(directGap({ frequency: 5800, width: 40 }, { frequency: 5830, width: 20 }), 0);
});

test('direct level thresholds', () => {
    assert.equal(directLevel(fatshark[0], fatshark[1]), 'high'); // 20 MHz apart, 30 wide
    assert.equal(directLevel(R(1), R(1)), 'high');
    assert.equal(directLevel(R(1), R(2)), 'medium');
    assert.equal(directLevel(R(1), R(3)), 'none');
    assert.equal(directLevel({ frequency: 5800, width: 20 }, { frequency: 5835, width: 20 }), 'low');
});

test('two transmitters produce the two classic IMD3 products', () => {
    const freqs = imdProducts([R(1), R(2)]).map((p) => p.frequency).sort();
    assert.deepEqual(freqs, [5621, 5732]);
});

test('three transmitters add the a + b - c products', () => {
    const products = imdProducts([R(1), R(2), R(4)]);
    assert.equal(products.length, 9);
    assert.ok(products.some((p) => p.frequency === 5658 + 5695 - 5769));
});

test('IMD product inside a channel is rated, far away is not', () => {
    const product = imdProducts([R(1), R(2)]).find((p) => p.frequency === 5732);
    assert.equal(imdLevel(R(3), product), 'medium');
    assert.equal(imdLevel(R(5), product), 'none');
});

test('a single channel and well separated pairs are clean', () => {
    assert.equal(analyzeSet([R(1)]).level, 'none');
    assert.equal(analyzeSet([R(1), R(8)]).level, 'none');
    assert.equal(analyzeSet([]).level, 'none');
});

test('R1 + R2 + R3 is flagged through IMD on the outer channels', () => {
    const analysis = analyzeSet([R(1), R(2), R(3)]);
    assert.equal(analysis.level, 'medium');
    assert.equal(analysis.channels[0].imd.level, 'medium');
});

test('candidate rating', () => {
    assert.equal(rateCandidate([], R(1)).level, 'none');
    assert.equal(rateCandidate([R(1)], R(8)).level, 'none');
    assert.equal(rateCandidate([R(1)], R(2)).level, 'medium');

    const sameFrequency = band('digital:5G8:HDZ').channels[0];
    const blocked = rateCandidate([R(1)], sameFrequency);
    assert.equal(blocked.level, 'high');
    assert.match(blocked.reason, /overlaps R1/);
});

test('candidate is penalised for IMD it causes on a selected channel', () => {
    // 2 x R3 - R5 = 5658, exactly R1.
    const result = rateCandidate([R(1), R(3)], R(5));
    assert.equal(result.level, 'medium');
    assert.match(result.reason, /IMD/);
});

test('optimiser fills up to the requested number of pilots', () => {
    const added = suggestChannels([R(1)], raceband, 4);
    assert.equal(added.length, 3);
    const set = [R(1), ...added];
    assert.equal(new Set(set.map((c) => c.frequency)).size, 4);
    assert.notEqual(analyzeSet(set).level, 'high');
});

test('optimiser finds the clean three-pilot raceband set', () => {
    const added = suggestChannels([R(1)], raceband, 3);
    assert.equal(analyzeSet([R(1), ...added]).level, 'none');
});

test('optimiser result is never worse than a hand-picked set', () => {
    const rank = ['none', 'low', 'medium', 'high'];
    const added = suggestChannels([], raceband, 4);
    const manual = analyzeSet([R(1), R(3), R(6), R(8)]);
    assert.ok(rank.indexOf(analyzeSet(added).level) <= rank.indexOf(manual.level));
});

test('optimiser gives up instead of returning a conflicting set', () => {
    assert.equal(suggestChannels([R(1)], raceband, 12), null);
    assert.equal(suggestChannels([fatshark[0]], fatshark.slice(0, 2), 2), null);
    assert.deepEqual(suggestChannels([R(1), R(8)], raceband, 2), []);
});

test('optimiser falls back to greedy search on a large pool', () => {
    const pool = bands.filter((b) => b.range === '5G8').flatMap((b) => b.channels);
    const added = suggestChannels([R(1)], pool, 5);
    assert.equal(added.length, 4);
    assert.notEqual(analyzeSet([R(1), ...added]).level, 'high');
});
