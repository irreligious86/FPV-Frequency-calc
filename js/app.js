import { loadChannelData, buildBands } from './channels.js';
import { MatrixAnimation } from './matrix.js';
import { App } from './ui.js';

async function main() {
    new MatrixAnimation(document.getElementById('matrixCanvas'));

    const app = new App();
    try {
        app.start(buildBands(await loadChannelData()));
    } catch (error) {
        console.error(error);
        app.showToast('Could not load channel data. Reload the page.');
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch((error) => {
            console.warn('Service worker registration failed:', error);
        });
    }
}

main();
