// Универсальная функция для привязки обработчика к кнопке
function attachButtonHandler(button, handlerFunction) {
    button.addEventListener("click", handlerFunction);
}

// Получаем коллекцию всех кнопок на странице
const buttons = document.querySelectorAll("button");

// Перебираем кнопки и привязываем обработчик событий
buttons.forEach(button => {
    button.addEventListener("click", () => {
        console.log(`Вы нажали на кнопку: ${button.innerText}`);
        
    });
});

document.addEventListener("DOMContentLoaded", async () => {
    const fpvDataManager = new FPVChannelData();
    await fpvDataManager.loadData();

    const modulationSelect = document.getElementById("modulationSelect");
    const bandRangeSelect = document.getElementById("bandRangeSelect");
    const bandListSelect = document.getElementById("bandListSelect");
    const channelListSelect = document.getElementById("channelListSelect");
    const getMetadataBtn = document.getElementById("getMetadataBtn");
    const output = document.getElementById("output");

    // ✅ Заполняем список модуляций
    function populateModulations() {
        let modulations = fpvDataManager.getModulationTypes();
        modulationSelect.innerHTML = `<option value="">Choose...</option>`;
        modulations.forEach(mod => {
            let option = document.createElement("option");
            option.value = mod;
            option.textContent = mod;
            modulationSelect.appendChild(option);
        });
        modulationSelect.disabled = false;
    }

    // ✅ Заполняем список диапазонов
    function populateBandRanges(modulation) {
        let ranges = fpvDataManager.getBandRanges(modulation);
        bandRangeSelect.innerHTML = `<option value="">Choose...</option>`;
        ranges.forEach(range => {
            let option = document.createElement("option");
            option.value = range;
            option.textContent = range;
            bandRangeSelect.appendChild(option);
        });
        bandRangeSelect.disabled = false;
    }

    // ✅ Заполняем список бендов
    function populateBands(modulation, bandRange) {
        let bands = fpvDataManager.getBandList(modulation, bandRange);
        bandListSelect.innerHTML = `<option value="">Choose...</option>`;
        bands.forEach(band => {
            let option = document.createElement("option");
            option.value = band;
            option.textContent = band;
            bandListSelect.appendChild(option);
        });
        bandListSelect.disabled = false;
    }

    // ✅ Заполняем список каналов
    function populateChannels(modulation, bandRange, bandName) {
        let channels = fpvDataManager.getChannelList(modulation, bandRange, bandName);
        channelListSelect.innerHTML = `<option value="">Choose...</option>`;
        for (let channel in channels) {
            let option = document.createElement("option");
            option.value = channel;
            option.textContent = `Channel ${channel} - ${channels[channel]} MHz`;
            channelListSelect.appendChild(option);
        }
        channelListSelect.disabled = false;
    }

    // ✅ Обработчик выбора модуляции
    modulationSelect.addEventListener("change", () => {
        let selectedModulation = modulationSelect.value;
        if (selectedModulation) {
            populateBandRanges(selectedModulation);
            bandRangeSelect.disabled = false;
            bandListSelect.innerHTML = `<option value="">Choose...</option>`;
            bandListSelect.disabled = true;
            channelListSelect.innerHTML = `<option value="">Choose...</option>`;
            channelListSelect.disabled = true;
            getMetadataBtn.disabled = true;
        }
    });

    // ✅ Обработчик выбора диапазона
    bandRangeSelect.addEventListener("change", () => {
        let selectedModulation = modulationSelect.value;
        let selectedRange = bandRangeSelect.value;
        if (selectedRange) {
            populateBands(selectedModulation, selectedRange);
            bandListSelect.disabled = false;
            channelListSelect.innerHTML = `<option value="">Choose...</option>`;
            channelListSelect.disabled = true;
            getMetadataBtn.disabled = true;
        }
    });

    // ✅ Обработчик выбора бенда
    bandListSelect.addEventListener("change", () => {
        let selectedModulation = modulationSelect.value;
        let selectedRange = bandRangeSelect.value;
        let selectedBand = bandListSelect.value;
        if (selectedBand) {
            populateChannels(selectedModulation, selectedRange, selectedBand);
            channelListSelect.disabled = false;
            getMetadataBtn.disabled = false;
        }
    });

    // ✅ Обработчик кнопки "Get Metadata"
    getMetadataBtn.addEventListener("click", () => {
        let selectedModulation = modulationSelect.value;
        let selectedRange = bandRangeSelect.value;
        let selectedBand = bandListSelect.value;
        if (selectedModulation && selectedRange && selectedBand) {
            let metadata = fpvDataManager.getBandMetadata(selectedModulation, selectedRange, selectedBand);
            output.textContent = JSON.stringify(metadata, null, 2);
        }
    });

    // Запускаем начальное заполнение модуляций
    populateModulations();
});
