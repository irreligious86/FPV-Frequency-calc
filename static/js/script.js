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
    const findOverlapBtn = document.getElementById("findOverlapBtn"); // КНОПКА
    const output = document.getElementById("output");            

    function displayOutput(data) {
        output.textContent = JSON.stringify(data, null, 2);
    }

    function clearOutput() {
        output.textContent = "";
    }

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

    channelListSelect.addEventListener("change", () => {
        let selectedChannel = document.getElementById("channelListSelect").value;
        let findOverlapBtn = document.getElementById("findOverlapBtn");
    
        findOverlapBtn.disabled = !selectedChannel; // Разблокируем кнопку, если выбран канал
        console.log("Выбран канал:", selectedChannel); // Отладочный вывод в консоль
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

    findOverlapBtn.addEventListener("click", () => {
        let selectedModulation = modulationSelect.value;
        let selectedRange = bandRangeSelect.value;
        let selectedBand = bandListSelect.value;
        let selectedChannel = channelListSelect.value;
    
        if (selectedModulation && selectedRange && selectedBand && selectedChannel) {
            clearOutput();
    
            // Получаем частоту и ширину канала
            let bandData = fpvDataManager.getBandMetadata(selectedModulation, selectedRange, selectedBand);
            let channelFrequency = fpvDataManager.getChannelList(selectedModulation, selectedRange, selectedBand)[selectedChannel];
            let bandwidth = bandData.bandwidth || 20; // По умолчанию 20 МГц
    
            let selectedMin = channelFrequency - bandwidth / 2;
            let selectedMax = channelFrequency + bandwidth / 2;
    
            let criticalOverlap = [];
            let mediumOverlap = [];
            let closeNeighbor = [];
            let safeChannels = [];
    
            // 🔍 Проверяем все каналы в JSON
            for (let modulation in fpvDataManager.data) {
                for (let range in fpvDataManager.data[modulation]) {
                    for (let band in fpvDataManager.data[modulation][range]) {
                        let bandMeta = fpvDataManager.getBandMetadata(modulation, range, band);
                        let bandChannels = fpvDataManager.getChannelList(modulation, range, band);
                        
                        for (let channel in bandChannels) {
                            let freq = bandChannels[channel];
                            let bandWidth = bandMeta.bandwidth || 20;
    
                            let minFreq = freq - bandWidth / 2;
                            let maxFreq = freq + bandWidth / 2;

                            // ❌ Исключаем исходный канал из вывода
                            if (
                                modulation === selectedModulation &&
                                range === selectedRange &&
                                band === selectedBand &&
                                channel === selectedChannel
                            ) {
                                continue; // Пропускаем этот канал
                            }
    
                            // 📌 Вычисляем уровень пересечения
                            let overlapAmount = Math.min(selectedMax, maxFreq) - Math.max(selectedMin, minFreq);
                            let overlapPercentage = (overlapAmount / bandwidth) * 100;
    
                            // 🔴 Критичное пересечение (10%+)
                            if (overlapPercentage >= 10) {
                                criticalOverlap.push({ modulation, range, band, channel, frequency: freq, bandwidth: bandWidth, level: "🔴" });
                            }
                            // 🟠 Средний уровень помех (менее 10% или соседство до 50% ширины)
                            else if (overlapPercentage > 0 || Math.abs(channelFrequency - freq) <= bandwidth / 2) {
                                mediumOverlap.push({ modulation, range, band, channel, frequency: freq, bandwidth: bandWidth, level: "🟠" });
                            }
                            // 🟡 Близкое соседство (от 50% до 150% ширины)
                            else if (Math.abs(channelFrequency - freq) <= 1.5 * bandwidth) {
                                closeNeighbor.push({ modulation, range, band, channel, frequency: freq, bandwidth: bandWidth, level: "🟡" });
                            }
                            // 🟢 Безопасное соседство (более 150% ширины)
                            else {
                                safeChannels.push({ modulation, range, band, channel, frequency: freq, bandwidth: bandWidth, level: "🟢" });
                            }
                        }
                    }
                }
            }
            
            // 🛠️ Вызываем визуализацию после обработки кнопки
            function visualizeBands(overlaps) {
                let container = document.getElementById("channelVisualization");
                container.innerHTML = ""; // Очищаем предыдущий вывод
            
                let bands = {};
            
                // Сортируем каналы по бендам
                overlaps.forEach(channel => {
                    if (!bands[channel.band]) {
                        bands[channel.band] = [];
                    }
                    bands[channel.band].push(channel);
                });
            
                for (let band in bands) {
                    let row = document.createElement("div");
                    row.classList.add("channel-row");
            
                    let bandLabel = document.createElement("div");
                    bandLabel.classList.add("band-name");
                    bandLabel.textContent = band;
                    row.appendChild(bandLabel);
            
                    let maxChannels = 12;
                    let channelBlocks = Array(maxChannels).fill(null);
            
                    bands[band].forEach(channelData => {
                        let channelIndex = parseInt(channelData.channel) - 1;
                        if (channelIndex < maxChannels) {
                            channelBlocks[channelIndex] = channelData;
                        }
                    });
            
                    channelBlocks.forEach(channelData => {
                        let block = document.createElement("div");
                        block.classList.add("channel-block");
            
                        if (channelData) {
                            block.textContent = `${channelData.frequency}`;
                            block.setAttribute("data-channel", channelData.channel);
                            if (channelData.level === "🔴") block.classList.add("critical");
                            else if (channelData.level === "🟠") block.classList.add("medium");
                            else if (channelData.level === "🟡") block.classList.add("close");
                            else block.classList.add("safe");
                                // Добавляем всплывающую подсказку с номером канала
                                createTooltip(block, `Channel ${channelData.channel}`);

                        } else {
                            block.classList.add("transparent");
                        }
            
                        row.appendChild(block);
                    });
            
                    container.appendChild(row);
                }
            }
            
            // 🛠️ Вызываем визуализацию после обработки кнопки
            findOverlapBtn.addEventListener("click", () => {
                let selectedModulation = modulationSelect.value;
                let selectedRange = bandRangeSelect.value;
                let selectedBand = bandListSelect.value;
                let selectedChannel = channelListSelect.value;
            
                if (selectedModulation && selectedRange && selectedBand && selectedChannel) {
                    clearOutput();
            
                    let bandData = fpvDataManager.getBandMetadata(selectedModulation, selectedRange, selectedBand);
                    let channelFrequency = fpvDataManager.getChannelList(selectedModulation, selectedRange, selectedBand)[selectedChannel];
                    let bandwidth = bandData.bandwidth || 20;
            
                    let selectedMin = channelFrequency - bandwidth / 2;
                    let selectedMax = channelFrequency + bandwidth / 2;
            
                    let overlaps = [];
            
                    for (let modulation in fpvDataManager.data) {
                        for (let range in fpvDataManager.data[modulation]) {
                            for (let band in fpvDataManager.data[modulation][range]) {
                                let bandMeta = fpvDataManager.getBandMetadata(modulation, range, band);
                                let bandChannels = fpvDataManager.getChannelList(modulation, range, band);
            
                                for (let channel in bandChannels) {
                                    let freq = bandChannels[channel];
                                    let bandWidth = bandMeta.bandwidth || 20;
                                    let minFreq = freq - bandWidth / 2;
                                    let maxFreq = freq + bandWidth / 2;
            
                                    if (modulation === selectedModulation && range === selectedRange && band === selectedBand && channel === selectedChannel) {
                                        continue;
                                    }
            
                                    let overlapAmount = Math.min(selectedMax, maxFreq) - Math.max(selectedMin, minFreq);
                                    let overlapPercentage = (overlapAmount / bandwidth) * 100;
            
                                    let level = "🟢";
                                    if (overlapPercentage >= 10) level = "🔴";
                                    else if (overlapPercentage > 0 || Math.abs(channelFrequency - freq) <= bandwidth / 2) level = "🟠";
                                    else if (Math.abs(channelFrequency - freq) <= 1.5 * bandwidth) level = "🟡";
            
                                    overlaps.push({ modulation, range, band, channel, frequency: freq, bandwidth: bandWidth, level });
                                }
                            }
                        }
                    }

                        // Тестовая функция для вывода текста в блок channelVisualization
    function testVisualization() {
        visualizationContainer.textContent = "Test Output: Visualization Updated";
    }
            
                    visualizeBands(overlaps);
                }
            });
            
            
    
            // 📌 Формируем вывод
            let resultText = `🎯 Selected Channel:\n📡 ${selectedModulation} - ${selectedRange} - ${selectedBand} - CH${selectedChannel}: ${channelFrequency} MHz (BW: ${bandwidth} MHz)\n\n`;
    
            if (criticalOverlap.length > 0) {
                resultText += `🔴 **Critical Interference (10%+ overlap):**\n`;
                resultText += criticalOverlap.map(o => `📡 ${o.modulation} - ${o.range} - ${o.band} - ${o.channel}: ${o.frequency} MHz (Width: ${o.bandwidth} MHz)`).join("\n") + "\n\n";
            }
    
            if (mediumOverlap.length > 0) {
                resultText += `🟠 **Medium Interference (<10% overlap or <50% distance):**\n`;
                resultText += mediumOverlap.map(o => `📡 ${o.modulation} - ${o.range} - ${o.band} - ${o.channel}: ${o.frequency} MHz (Width: ${o.bandwidth} MHz)`).join("\n") + "\n\n";
            }
    
            if (closeNeighbor.length > 0) {
                resultText += `🟡 **Close Neighboring Channels (50%-150% distance):**\n`;
                resultText += closeNeighbor.map(o => `📡 ${o.modulation} - ${o.range} - ${o.band} - ${o.channel}: ${o.frequency} MHz (Width: ${o.bandwidth} MHz)`).join("\n") + "\n\n";
            }
    
            if (safeChannels.length > 0) {
                resultText += `🟢 **Safe Channels (150%+ distance):**\n`;
                resultText += safeChannels.map(o => `📡 ${o.modulation} - ${o.range} - ${o.band} - ${o.channel}: ${o.frequency} MHz (Width: ${o.bandwidth} MHz)`).join("\n") + "\n\n";
            }
    
            output.innerHTML = resultText;
        }   
    });
    
    function createTooltip(element, text) {
        // Создаём div для подсказки
        let tooltip = document.createElement("div");
        tooltip.className = "tooltip";
        tooltip.textContent = text;
        document.body.appendChild(tooltip);
    
        // Обработчик события "наведение"
        element.addEventListener("mouseover", (event) => {
            tooltip.style.display = "block";
            tooltip.style.left = event.pageX + 10 + "px";
            tooltip.style.top = event.pageY + 10 + "px";
        });
    
        // Обработчик перемещения курсора
        element.addEventListener("mousemove", (event) => {
            tooltip.style.left = event.pageX + 10 + "px";
            tooltip.style.top = event.pageY + 10 + "px";
        });
    
        // Обработчик ухода курсора
        element.addEventListener("mouseout", () => {
            tooltip.style.display = "none";
        });
    }
    

    // Запускаем начальное заполнение модуляций
    populateModulations();
});
