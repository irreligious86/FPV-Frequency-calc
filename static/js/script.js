console.log("test log");


document.addEventListener("DOMContentLoaded", () => {
    FPVAnalyzer.loadData();
});

const FPVAnalyzer = {
    data: {},

    async loadData() {
        try {
            const response = await fetch("/api/data");
            this.data = await response.json();
            console.log("Данные загружены:", this.data);
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
        }
    },

    filterByModulation(modulationType) {
        return Object.keys(this.data).reduce((filtered, range) => {
            const bands = this.data[range];
            const matchedBands = {};

            for (let band in bands) {
                if (bands[band].modulation === modulationType || modulationType === "all") {
                    matchedBands[band] = bands[band];
                }
            }

            if (Object.keys(matchedBands).length > 0) {
                filtered[range] = matchedBands;
            }
            return filtered;
        }, {});
    },

    async getFrequency(range, band, channel) {
        const response = await fetch(`/api/frequency?range=${range}&band=${band}&channel=${channel}`);
        return response.json();
    },

    sortChannelsByInterference(range, band, selectedChannel) {
        const selectedFreq = this.data[range][band].channels[selectedChannel];
        const bandwidth = this.data[range][band].bandwidth;
        const selectedMin = selectedFreq - bandwidth / 2;
        const selectedMax = selectedFreq + bandwidth / 2;

        let sortedChannels = [];

        for (let ch in this.data[range][band].channels) {
            let freq = this.data[range][band].channels[ch];
            let chMin = freq - bandwidth / 2;
            let chMax = freq + bandwidth / 2;

            let overlap = Math.max(0, Math.min(selectedMax, chMax) - Math.max(selectedMin, chMin));
            let overlapPercent = (overlap / bandwidth) * 100;

            let category;
            if (ch === selectedChannel) {
                category = "Исходный канал";
            } else if (overlapPercent >= 10) {
                category = "🔴 Красная зона (Полное перекрытие)";
            } else if (overlapPercent > 0) {
                category = "🟠 Оранжевая зона (Частичное перекрытие)";
            } else if (Math.abs(freq - selectedFreq) <= 0.5 * bandwidth) {
                category = "🟡 Желтая зона (Близость < 50%)";
            } else if (Math.abs(freq - selectedFreq) <= 1.5 * bandwidth) {
                category = "🟢 Зеленая зона (50–150% ширины)";
            } else {
                category = "⚪ Безопасная зона";
            }

            sortedChannels.push({ channel: ch, frequency: freq, category: category });
        }

        return sortedChannels.sort((a, b) => a.frequency - b.frequency);
    }
};

// 🟢 Тестовая функция
async function testAnalyzer() {
    console.log("🔍 Фильтр аналоговых:", FPVAnalyzer.filterByModulation("Analog"));
    console.log("🔍 Фильтр цифровых:", FPVAnalyzer.filterByModulation("Digital"));

    let sorted = FPVAnalyzer.sortChannelsByInterference("5.8GHz", "Band A (Boscam)", "1");
    console.log("📡 Сортировка по интерференции:", sorted);
}
