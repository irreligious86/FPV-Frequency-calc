export class FPVAnalyzer {
    constructor() {
        // Маппинг названий диапазонов
        this.rangeMapping = {
            "5.8GHz": "5G8",
            "5.3GHz": "5G3",
            "4.9GHz": "4G9",
            "3.3GHz": "3G3"
        };

        // Загружаем данные и инициализируем UI
        this.loadData().then(() => {
            this.initializeUI();
        });
    }

    /**
     * Загружает данные из sessionStorage или с сервера
     */
    async loadData() {
        // Сначала пробуем взять из sessionStorage
        const cachedData = sessionStorage.getItem("fpvData");
        if (cachedData) {
            this.data = JSON.parse(cachedData);
            return;
        }

        // Если в sessionStorage нет - загружаем с сервера
        try {
            const response = await fetch('/api/data');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            
            // Сохраняем в sessionStorage для следующих загрузок
            sessionStorage.setItem("fpvData", JSON.stringify(this.data));
        } catch (error) {
            console.error("Ошибка при загрузке данных:", error);
            // В случае ошибки используем дефолтные данные
            this.data = {
                "analog": {
                    "5G8": {
                        "A": {
                            "bandName": "Band A",
                            "channels": {
                                "1": 5865,
                                "2": 5845,
                                "3": 5825,
                                "4": 5805,
                                "5": 5785,
                                "6": 5765,
                                "7": 5745,
                                "8": 5725
                            }
                        },
                        "B": {
                            "bandName": "Band B",
                            "channels": {
                                "1": 5733,
                                "2": 5752,
                                "3": 5771,
                                "4": 5790,
                                "5": 5809,
                                "6": 5828,
                                "7": 5847,
                                "8": 5866
                            }
                        },
                        "E": {
                            "bandName": "Band E",
                            "channels": {
                                "1": 5705,
                                "2": 5685,
                                "3": 5665,
                                "4": 5645,
                                "5": 5885,
                                "6": 5905,
                                "7": 5925,
                                "8": 5945
                            }
                        },
                        "F": {
                            "bandName": "Band F",
                            "channels": {
                                "1": 5740,
                                "2": 5760,
                                "3": 5780,
                                "4": 5800,
                                "5": 5820,
                                "6": 5840,
                                "7": 5860,
                                "8": 5880
                            }
                        },
                        "R": {
                            "bandName": "Race Band",
                            "channels": {
                                "1": 5658,
                                "2": 5695,
                                "3": 5732,
                                "4": 5769,
                                "5": 5806,
                                "6": 5843,
                                "7": 5880,
                                "8": 5917
                            }
                        }
                    },
                    "3G3": {
                        "A": {
                            "bandName": "Band A",
                            "channels": {
                                "1": 3365,
                                "2": 3345,
                                "3": 3325,
                                "4": 3305,
                                "5": 3285,
                                "6": 3265,
                                "7": 3245,
                                "8": 3225
                            }
                        }
                    }
                },
                "digital": {
                    "5G8": {
                        "D": {
                            "bandName": "DJI Band",
                            "channels": {
                                "1": 5660,
                                "2": 5695,
                                "3": 5735,
                                "4": 5770,
                                "5": 5805,
                                "6": 5839,
                                "7": 5878,
                                "8": 5914
                            }
                        },
                        "H": {
                            "bandName": "HDZero Band",
                            "channels": {
                                "1": 5653,
                                "2": 5693,
                                "3": 5733,
                                "4": 5773,
                                "5": 5813,
                                "6": 5853,
                                "7": 5893,
                                "8": 5933
                            }
                        }
                    }
                }
            };
        }
    }

    /**
     * Инициализация пользовательского интерфейса
     */
    initializeUI() {
        // Получаем элементы интерфейса
        this.analogCheckbox = document.getElementById('analogChannels');
        this.digitalCheckbox = document.getElementById('digitalChannels');
        this.bandSelection = document.getElementById('bandSelection');
        this.bandSelect = document.getElementById('bandSelect');
        this.channelSelection = document.getElementById('channelSelection');
        this.channelsGrid = document.getElementById('channelsGrid');

        // Добавляем слушатели событий
        this.analogCheckbox.addEventListener('change', () => this.updateBandList());
        this.digitalCheckbox.addEventListener('change', () => this.updateBandList());
        this.bandSelect.addEventListener('change', (e) => this.handleBandSelect(e));
    }

    /**
     * Обновляет список бендов на основе выбранных чекбоксов
     */
    updateBandList() {
        const isAnalog = this.analogCheckbox.checked;
        const isDigital = this.digitalCheckbox.checked;

        // Очищаем текущий список бендов
        while (this.bandSelect.options.length > 1) {
            this.bandSelect.remove(1);
        }

        if (!isAnalog && !isDigital) {
            this.bandSelection.classList.remove('visible');
            this.channelSelection.classList.remove('visible');
            setTimeout(() => {
                this.bandSelection.classList.add('hidden');
                this.channelSelection.classList.add('hidden');
                // Очищаем радиокнопки
                this.channelsGrid.innerHTML = '';
            }, 300);
            return;
        }

        // Получаем все доступные бенды
        const bands = [];

        if (isAnalog) {
            bands.push(...this.getAllBandsForType('analog'));
        }
        if (isDigital) {
            bands.push(...this.getAllBandsForType('digital'));
        }

        // Сортируем бенды
        bands.sort((a, b) => {
            if (a.range === b.range) {
                return a.name.localeCompare(b.name);
            }
            return a.range.localeCompare(b.range);
        });

        // Добавляем бенды в выпадающий список
        for (const band of bands) {
            const option = document.createElement('option');
            option.value = `${band.type}:${band.range}:${band.id}`;
            option.textContent = `${band.range} ${band.name} (${band.type})`;
            this.bandSelect.appendChild(option);
        }

        // Показываем выпадающий список
        this.bandSelection.classList.remove('hidden');
        setTimeout(() => {
            this.bandSelection.classList.add('visible');
        }, 50);
    }

    /**
     * Получает все бенды для указанного типа модуляции
     */
    getAllBandsForType(type) {
        const bands = [];
        const systemData = this.data[type];

        // Проходим по всем диапазонам частот
        for (const [range, rangeData] of Object.entries(systemData)) {
            // Проходим по всем бендам в диапазоне
            for (const [bandId, bandData] of Object.entries(rangeData)) {
                if (bandData.channels) {
                    bands.push({
                        id: bandId,
                        name: bandData.bandName || `Band ${bandId}`,
                        range: this.getRangeDisplayName(range),
                        type: type
                    });
                }
            }
        }

        return bands;
    }

    /**
     * Преобразует технический идентификатор диапазона в читаемое название
     */
    getRangeDisplayName(range) {
        const displayNames = {
            '5G8': '5.8GHz',
            '5G3': '5.3GHz',
            '4G9': '4.9GHz',
            '3G3': '3.3GHz'
        };
        return displayNames[range] || range;
    }

    /**
     * Конвертирует пользовательское название диапазона в формат JSON
     */
    _convertRange(userRange) {
        return this.rangeMapping[userRange] || userRange;
    }

    /**
     * Получает все аналоговые каналы
     * @param {string} range - Диапазон частот (по умолчанию 5.8GHz)
     * @returns {Object} Объект с каналами и их частотами
     */
    getAnalogChannels(range = "5.8GHz") {
        try {
            if (!this.data?.analog) {
                throw new Error("Данные об аналоговых каналах не найдены");
            }

            const jsonRange = this._convertRange(range);
            const rangeData = this.data.analog[jsonRange];

            if (!rangeData) {
                throw new Error(`Диапазон ${range} не найден`);
            }

            // Собираем все каналы из всех групп (A, B, E, F, R и т.д.)
            const result = {};
            for (const [band, bandData] of Object.entries(rangeData)) {
                if (bandData.channels) {
                    result[band] = {
                        name: bandData.bandName || `Band ${band}`,
                        channels: bandData.channels
                    };
                }
            }

            return result;
        } catch (error) {
            console.error("Ошибка при получении аналоговых каналов:", error);
            return null;
        }
    }

    /**
     * Получает все цифровые каналы
     * @param {string} range - Диапазон частот (по умолчанию 5.8GHz)
     * @returns {Object} Объект с каналами и их частотами
     */
    getDigitalChannels(range = "5.8GHz") {
        try {
            if (!this.data?.digital) {
                throw new Error("Данные о цифровых каналах не найдены");
            }

            const jsonRange = this._convertRange(range);
            const rangeData = this.data.digital[jsonRange];

            if (!rangeData) {
                throw new Error(`Диапазон ${range} не найден`);
            }

            // Структура аналогична аналоговым каналам
            const result = {};
            for (const [band, bandData] of Object.entries(rangeData)) {
                if (bandData.channels) {
                    result[band] = {
                        name: bandData.bandName || `Band ${band}`,
                        channels: bandData.channels
                    };
                }
            }

            return result;
        } catch (error) {
            console.error("Ошибка при получении цифровых каналов:", error);
            return null;
        }
    }

    /**
     * Получает частоту для заданной группы и канала
     * Работает с локальными данными
     */
    getFrequency(band, channel, range = "5.8GHz", modulation = "analog") {
        try {
            if (!this.data) {
                throw new Error("Данные не загружены");
            }

            const jsonRange = this._convertRange(range);
            const frequency = this.data[modulation]?.[jsonRange]?.[band]?.channels?.[channel];
            
            if (!frequency) {
                throw new Error(`Частота не найдена для band=${band}, channel=${channel}`);
            }

            return {
                frequency,
                unit: "MHz"
            };
        } catch (error) {
            console.error("Ошибка при получении частоты:", error);
            return null;
        }
    }

    /**
     * Анализирует интерференцию для выбранного канала
     * Делает запрос к серверу для сложных вычислений
     */
    async analyzeInterference(band, channel, range = "5.8GHz", modulation = "analog") {
        try {
            // Конвертируем диапазон в формат JSON
            const jsonRange = this._convertRange(range);
            
            // Формируем URL с параметрами
            const url = new URL("/api/interference", window.location.origin);
            url.searchParams.append("band", band);
            url.searchParams.append("channel", channel);
            url.searchParams.append("range", jsonRange);  // Используем сконвертированное значение
            url.searchParams.append("modulation", modulation);

            // Делаем запрос к серверу
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error("Ошибка при анализе интерференции:", error);
            return null;
        }
    }

    /**
     * Проверяет, загружены ли данные
     */
    isDataLoaded() {
        return !!this.data;
    }

    handleBandSelect(event) {
        if (!this.data) {
            console.error('Data not loaded yet');
            return;
        }

        const selectedValue = event.target.value;
        if (!selectedValue || selectedValue === 'default') {
            return;
        }

        const [type, userRange, bandId] = selectedValue.split(':');
        const range = this._convertRange(userRange);
        
        if (!this.data[type] || !this.data[type][range] || !this.data[type][range][bandId]) {
            console.error('Invalid band selection:', type, userRange, bandId);
            return;
        }

        const channels = this.data[type][range][bandId].channels;
        const channelCount = Object.keys(channels).length;
        
        // Очищаем текущие каналы и информационный блок
        this.channelsGrid.innerHTML = '';
        const infoBlock = document.createElement('div');
        infoBlock.id = 'channelInfo';
        infoBlock.className = 'channel-info hidden';
        this.channelsGrid.parentNode.insertBefore(infoBlock, this.channelsGrid.nextSibling);

        // Создаем визуализацию спектра
        const spectrumVis = document.createElement('div');
        spectrumVis.id = 'spectrumVisualization';
        spectrumVis.className = 'spectrum-visualization';
        this.channelsGrid.parentNode.insertBefore(spectrumVis, infoBlock.nextSibling);

        // Создаем фон для всего диапазона
        const bandBackground = document.createElement('div');
        bandBackground.className = 'spectrum-band';
        spectrumVis.appendChild(bandBackground);

        // Находим минимальную и максимальную частоты в диапазоне
        const frequencies = Object.values(channels);
        const minFreq = Math.min(...frequencies);
        const maxFreq = Math.max(...frequencies);
        const freqRange = maxFreq - minFreq;

        // Добавляем метки крайних частот
        const minLabel = document.createElement('div');
        minLabel.className = 'frequency-label';
        minLabel.textContent = `${minFreq} MHz`;
        minLabel.style.left = '0%';
        spectrumVis.appendChild(minLabel);

        const maxLabel = document.createElement('div');
        maxLabel.className = 'frequency-label';
        maxLabel.textContent = `${maxFreq} MHz`;
        maxLabel.style.left = '100%';
        spectrumVis.appendChild(maxLabel);

        // Создаем визуализацию каналов
        Object.entries(channels).forEach(([channel, frequency]) => {
            const channelEl = document.createElement('div');
            channelEl.className = 'spectrum-channel';
            channelEl.dataset.channel = channel;
            
            // Вычисляем позицию канала в процентах
            const position = ((frequency - minFreq) / freqRange) * 100;
            channelEl.style.left = `${position}%`;
            channelEl.style.width = '20px';
            channelEl.style.marginLeft = '-10px'; // Центрируем канал

            // Добавляем метку канала
            const channelLabel = document.createElement('div');
            channelLabel.className = 'channel-label-mini';
            channelLabel.textContent = `CH${channel}`;
            channelEl.appendChild(channelLabel);

            spectrumVis.appendChild(channelEl);
        });

        // Функция для скрытия информационного блока
        const hideChannelInfo = (e) => {
            const channelInfo = document.getElementById('channelInfo');
            const spectrumVis = document.getElementById('spectrumVisualization');
            // Проверяем, был ли клик на радиокнопке или её метке
            const isRadioClick = e.target.closest('.channel-container');
            
            if (channelInfo && !channelInfo.classList.contains('hidden') && !isRadioClick) {
                channelInfo.classList.remove('visible');
                spectrumVis.classList.remove('visible');
                setTimeout(() => {
                    channelInfo.classList.add('hidden');
                    channelInfo.innerHTML = '';
                }, 300);
            }
        };

        // Функция для обновления информации о канале
        const updateChannelInfo = (frequency, channel) => {
            const channelInfo = document.getElementById('channelInfo');
            const spectrumVis = document.getElementById('spectrumVisualization');
            
            // Обновляем информационный блок
            channelInfo.innerHTML = `
                <div class="frequency-block">
                    <span class="frequency-value">${frequency}</span>
                    <span class="frequency-unit">MHz</span>
                </div>
                <div class="channel-details">
                    <span class="channel-name">${this.data[type][range][bandId].bandName} CH${channel}</span>
                    <span class="channel-bandwidth">Bandwidth: 20MHz</span>
                </div>
            `;
            
            // Обновляем активный канал в визуализации
            const spectrumChannels = spectrumVis.querySelectorAll('.spectrum-channel');
            spectrumChannels.forEach(ch => {
                ch.classList.remove('active');
                if (ch.dataset.channel === channel) {
                    ch.classList.add('active');
                }
            });

            channelInfo.classList.remove('hidden');
            spectrumVis.classList.add('visible');
            setTimeout(() => channelInfo.classList.add('visible'), 50);
        };

        // Добавляем обработчик только для клика
        document.addEventListener('click', hideChannelInfo);
        
        // Устанавливаем стиль сетки в зависимости от количества каналов
        this.channelsGrid.style.display = 'grid';
        this.channelsGrid.style.gap = '10px';
        this.channelsGrid.style.justifyContent = 'center';
        this.channelsGrid.style.justifyItems = 'center';
        this.channelsGrid.style.alignItems = 'center';
        
        // Всегда используем количество каналов как количество колонок
        const columns = channelCount;
        
        // Задаем фиксированную ширину колонок и автоматические отступы по бокам
        this.channelsGrid.style.gridTemplateColumns = `repeat(${columns}, minmax(80px, auto))`;
        this.channelsGrid.style.margin = '0 auto';
        this.channelsGrid.style.maxWidth = '100%';
        this.channelsGrid.style.overflowX = 'auto';
        this.channelsGrid.style.padding = '0 10px';
        
        // Создаем радиокнопки для каждого канала
        Object.entries(channels).forEach(([channel, frequency]) => {
            const radioId = `channel_${channel}`;
            
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.id = radioId;
            radio.name = 'channel';
            radio.value = channel;
            radio.className = 'channel-radio';
            radio.dataset.frequency = frequency;
            radio.dataset.type = type;
            radio.dataset.range = userRange;
            radio.dataset.band = bandId;
            
            // Добавляем обработчик для отображения информации о канале
            radio.addEventListener('change', (e) => {
                if (e.target.checked) {
                    updateChannelInfo(frequency, channel);
                }
            });
            
            const label = document.createElement('label');
            label.htmlFor = radioId;
            label.className = 'channel-label';
            label.textContent = `CH ${channel}`;
            
            const container = document.createElement('div');
            container.className = 'channel-container';
            container.appendChild(radio);
            container.appendChild(label);
            
            this.channelsGrid.appendChild(container);
        });

        // Показываем контейнер с каналами
        this.channelSelection.classList.remove('hidden');
        setTimeout(() => {
            this.channelSelection.classList.add('visible');
        }, 50);
    }
}

// Создаем экземпляр анализатора при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.fpvAnalyzer = new FPVAnalyzer();
});