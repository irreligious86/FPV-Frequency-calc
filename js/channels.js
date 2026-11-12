/** Channel data access: loading the JSON table and turning it into flat channel objects. */

export const RANGES = [
    { key: '5G8', label: '5.8 GHz' },
    { key: '5G3', label: '5.3 GHz' },
    { key: '4G9', label: '4.9 GHz' },
    { key: '3G3', label: '3.3 GHz' },
    { key: '2G4', label: '2.4 GHz' },
    { key: '1G3', label: '1.3 GHz' },
    { key: '900', label: '900 MHz' },
];

export const MODULATIONS = ['analog', 'digital'];

export async function loadChannelData(url = 'data/channels.json') {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
    }
    return response.json();
}

/** Short band titles read as "R1"; long ones as "DJI_FCC ch1". */
function channelName(title, number) {
    return title.length <= 2 ? `${title}${number}` : `${title} ch${number}`;
}

/**
 * Turns the nested table into bands with ready-to-use channel objects:
 * `[{ id, modulation, range, key, title, name, region, width, channels: [...] }]`.
 */
export function buildBands(data) {
    const bands = [];
    for (const modulation of MODULATIONS) {
        for (const [range, rangeBands] of Object.entries(data[modulation] ?? {})) {
            for (const [key, raw] of Object.entries(rangeBands)) {
                const title = raw.bandTitle || key;
                const width = Number(raw.channelWidth);
                const band = {
                    id: `${modulation}:${range}:${key}`,
                    modulation,
                    range,
                    key,
                    title,
                    name: raw.bandName || title,
                    region: raw.region || 'N/A',
                    width,
                    channels: [],
                };
                for (const [number, value] of Object.entries(raw.channels)) {
                    const frequency = Number(value);
                    if (!(frequency > 0) || !(width > 0)) continue;
                    band.channels.push({
                        id: `${band.id}:${number}`,
                        bandId: band.id,
                        number,
                        name: channelName(title, number),
                        frequency,
                        width,
                    });
                }
                if (band.channels.length > 0) bands.push(band);
            }
        }
    }
    return bands;
}
