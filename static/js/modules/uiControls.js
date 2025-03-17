// Модуль для управления UI элементами
export class UIControls {
    constructor(analyzer) {
        this.analyzer = analyzer;
        this.selectedChannels = new Set();
        
        // UI элементы
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.checkboxes = document.querySelectorAll('.filter-checkbox');
        this.frequencyTable = document.getElementById('frequencyTable');
        this.data = null;
        this.ranges = ['5G8', '5G3', '4G9', '3G3', '2G4', '1G3', '900']; // Все поддерживаемые диапазоны
        this.selectedChannels = new Map(); // Изменяем на Map для хранения дополнительной информации
        this.maxSelectedChannels = 4; // Максимальное количество выбранных каналов
        this.modeToggle = document.getElementById('calculation-mode-toggle');
        this.modeLabel = document.querySelector('.mode-label');

        // Создаем кнопку прокрутки наверх
        this.createScrollToTopButton();

        // Создаем только модальное окно
        this.createModal();

        if (!this.analyzeBtn) {
            console.error('Кнопка анализа не найдена');
            return;
        }

        this.initData();
        this.initBandTypeFilter();
        this.initAnalyzeButton();
        
        // Добавляем обработчик прокрутки для показа/скрытия кнопки
        window.addEventListener('scroll', () => this.toggleScrollButton());

        // Прокручиваем страницу наверх при загрузке
        document.addEventListener('DOMContentLoaded', () => {
            window.scrollTo(0, 0);
        });

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Обработчик переключения режима
        this.modeToggle.addEventListener('change', async () => {
            await this.analyzer.toggleMode();
            this.updateModeLabel();
            // Если есть выбранные каналы, обновляем их отображение
            if (this.selectedChannels.size > 0) {
                await this.updateChannelDisplay();
            }
        });

        // Обработчик изменения режима расчета
        const modeToggle = document.getElementById('calculation-mode-toggle');
        const modeSwitch = modeToggle.closest('.mode-switch');
        
        modeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                modeSwitch.classList.add('checked');
            } else {
                modeSwitch.classList.remove('checked');
            }
            // ... rest of the existing handler code ...
        });
    }

    // Создание модального окна
    createModal() {
        // Создаем оверлей
        this.modalOverlay = document.createElement('div');
        this.modalOverlay.className = 'modal-overlay';
        document.body.appendChild(this.modalOverlay);

        // Создаем модальное окно
        this.modal = document.createElement('div');
        this.modal.className = 'modal';
        this.modal.innerHTML = `
            <button class="modal-close">&times;</button>
            <div class="modal-frequency"></div>
            <div class="modal-unit">Megahertz</div>
            <div class="modal-info"></div>
        `;
        document.body.appendChild(this.modal);

        // Добавляем обработчики
        this.modalOverlay.addEventListener('click', () => this.hideModal());
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    }

    // Создание счетчика активных каналов
    createActiveChannelsCounter() {
        this.channelsCounter = document.createElement('div');
        this.channelsCounter.className = 'active-channels-counter';
        
        // Создаем список выбранных каналов
        this.selectedChannelsList = document.createElement('div');
        this.selectedChannelsList.className = 'selected-channels-list';
        
        // Создаем кнопку управления
        this.controlButton = document.createElement('button');
        this.controlButton.className = 'control-button';
        this.controlButton.textContent = 'Optimize Channels';
        this.controlButton.addEventListener('click', () => this.handleControlButtonClick());
        
        this.updateChannelsCounter();
        this.channelsCounter.appendChild(this.selectedChannelsList);
        this.channelsCounter.appendChild(this.controlButton);
        document.body.appendChild(this.channelsCounter);
    }

    // Обновление счетчика и списка активных каналов
    updateChannelsCounter() {
        const counterHtml = `Active Channels: <span>${this.selectedChannels.size}/${this.maxSelectedChannels}</span>`;
        
        // Обновляем список выбранных каналов
        let channelsListHtml = '';
        this.selectedChannels.forEach((info) => {
            channelsListHtml += `
                <div class="selected-channel-item">
                    <span>${info.name}</span>
                    <span class="channel-freq">${info.frequency} MHz</span>
                </div>
            `;
        });
        
        // Обновляем содержимое
        this.channelsCounter.innerHTML = counterHtml;
        this.selectedChannelsList.innerHTML = channelsListHtml;
        
        // Добавляем кнопку обратно
        this.channelsCounter.appendChild(this.selectedChannelsList);
        this.channelsCounter.appendChild(this.controlButton);
        
        // Обновляем текст кнопки в зависимости от количества выбранных каналов
        this.updateControlButton();
    }

    // Обновление текста кнопки управления
    updateControlButton() {
        if (this.selectedChannels.size === 0) {
            this.controlButton.textContent = 'Select Channels';
            this.controlButton.disabled = true;
        } else if (this.selectedChannels.size === 1) {
            this.controlButton.textContent = 'Optimize Channels';
            this.controlButton.disabled = false;
        } else {
            this.controlButton.textContent = 'Clear Selection';
            this.controlButton.disabled = false;
        }
    }

    // Обработчик клика по кнопке управления
    handleControlButtonClick() {
        if (this.selectedChannels.size === 0) {
            return; // Кнопка должна быть отключена
        } else if (this.selectedChannels.size === 1) {
            // Режим оптимизации: находим лучшие каналы для добавления
            this.optimizeChannelSelection();
        } else {
            // Очищаем выбор
            this.clearChannelSelection();
        }
    }

    // Оптимизация выбора каналов
    async optimizeChannelSelection() {
        try {
            // Получаем данные о текущем выбранном канале
            const [selectedChannel] = this.selectedChannels.entries().next().value;
            const frequency = parseFloat(selectedChannel.textContent);
            const [band, channel] = selectedChannel.dataset.channel.match(/([A-Za-z]+)(\d+)/).slice(1);

            // Запрашиваем оптимальные каналы с сервера
            const response = await fetch('/api/optimize-channels', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentChannel: { band, channel, frequency }
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const optimalChannels = await response.json();
            
            // Подсвечиваем рекомендуемые каналы
            optimalChannels.forEach(channel => {
                const element = document.querySelector(`[data-channel="${channel.band}${channel.channel}"]`);
                if (element) {
                    element.classList.add('recommended');
                }
            });
        } catch (error) {
            console.error('Error optimizing channels:', error);
        }
    }

    // Очистка выбора каналов
    clearChannelSelection() {
        this.selectedChannels.forEach((info, element) => {
            element.classList.remove('selected');
        });
        this.selectedChannels.clear();
        this.updateChannelsCounter();
        this.updateInterference();
    }

    // Показ модального окна с информацией о канале
    showModal(channelElement, bandData, channelNum, bandKey) {
        console.log('=== Открытие модального окна ===');
        console.log('Элемент канала:', channelElement);
        console.log('Данные диапазона:', bandData);
        console.log('Номер канала:', channelNum);
        console.log('Ключ диапазона:', bandKey);

        // Проверяем, можно ли выбрать этот канал
        if (this.selectedChannels.size >= this.maxSelectedChannels && !this.selectedChannels.has(channelElement)) {
            console.log('Достигнут максимум выбранных каналов');
            alert(`Maximum ${this.maxSelectedChannels} channels can be selected`);
            return;
        }

        // Если канал уже имеет высокую интерференцию, запрещаем его выбор
        if (channelElement.classList.contains('interference-high')) {
            console.log('Попытка выбрать канал с высокой интерференцией');
            alert('This channel has high interference with already selected channels');
            return;
        }

        const frequency = bandData.channels[channelNum];
        console.log('Частота канала:', frequency);
        const channelWidth = bandData.channelWidth || 'N/A';
        const region = bandData.region || 'N/A';
        
        // Определяем тип модуляции
        const isAnalog = this.isAnalogChannel(bandData);
        const modulationType = isAnalog ? 'Analog' : 'Digital';
        
        // Формируем упрощенное имя канала
        const simplifiedName = this.getSimplifiedChannelName(bandData, bandKey, channelNum);
        
        // Вычисляем диапазон частот канала
        const { freqStart, freqEnd } = this.calculateFrequencyRange(frequency, channelWidth);
        
        // Обновляем содержимое модального окна
        this.updateModalContent(simplifiedName, frequency, bandData, channelNum, freqStart, freqEnd, channelWidth, modulationType, region);

        // Обновляем выбранные каналы
        if (this.selectedChannels.has(channelElement)) {
            console.log('Отмена выбора канала');
            channelElement.classList.remove('selected');
            this.selectedChannels.delete(channelElement);
        } else {
            console.log('Выбор нового канала');
            channelElement.classList.add('selected');
            this.selectedChannels.set(channelElement, {
                name: simplifiedName,
                frequency: frequency,
                bandKey: bandKey,
                channelNum: channelNum,
                isAnalog: isAnalog
            });
        }

        console.log('Текущее количество выбранных каналов:', this.selectedChannels.size);

        // Обновляем счетчик и интерференцию
        this.updateChannelsCounter();
        this.updateInterference();

        // Показываем модальное окно
        this.modalOverlay.classList.add('active');
        this.modal.classList.add('active');
        console.log('=== Модальное окно открыто ===');
    }

    // Вспомогательные методы
    isAnalogChannel(bandData) {
        return this.data.analog['5G8'] && Object.values(this.data.analog['5G8']).some(band => 
            band === bandData || Object.values(band).includes(bandData)
        );
    }

    getSimplifiedChannelName(bandData, bandKey, channelNum) {
        if (this.isAnalogChannel(bandData)) {
            return `${bandData.bandTitle || bandKey}${channelNum}`;
        }
        return bandData.bandTitle && bandData.bandTitle.length === 1 
            ? `${bandData.bandTitle}${channelNum}`
            : `Channel ${channelNum}`;
    }

    calculateFrequencyRange(frequency, channelWidth) {
        const halfWidth = channelWidth ? Number(channelWidth) / 2 : 0;
        return {
            freqStart: halfWidth ? (Number(frequency) - halfWidth).toFixed(1) : 'N/A',
            freqEnd: halfWidth ? (Number(frequency) + halfWidth).toFixed(1) : 'N/A'
        };
    }

    calculateInterferenceLevel(frequency, isAnalog, selectedFrequencies) {
        // Вычисляем минимальную разницу частот со всеми выбранными каналами
        let minFreqDiff = Infinity;
        selectedFrequencies.forEach(selected => {
            const freqDiff = Math.abs(frequency - selected.frequency);
            minFreqDiff = Math.min(minFreqDiff, freqDiff);
        });

        // Определяем уровень интерференции на основе разницы частот
        if (isAnalog) {
            // Для аналоговых каналов
            if (minFreqDiff > 100) return 'none';
            if (minFreqDiff > 40) return 'low';
            if (minFreqDiff > 20) return 'medium';
            return 'high';
        } else {
            // Для цифровых каналов
            if (minFreqDiff > 80) return 'none';
            if (minFreqDiff > 30) return 'low';
            if (minFreqDiff > 15) return 'medium';
            return 'high';
        }
    }

    // Обновление интерференции для всех каналов
    async updateInterference() {
        console.log('=== Начало updateInterference ===');
        
        // Сбрасываем все цвета
        document.querySelectorAll('.channel').forEach(channel => {
            channel.classList.remove('interference-none', 'interference-low', 'interference-medium', 'interference-high');
            channel.style.cursor = 'pointer';
        });

        // Если нет выбранных каналов, устанавливаем всем зеленый цвет
        if (this.selectedChannels.size === 0) {
            console.log('Нет выбранных каналов, все зеленые');
            document.querySelectorAll('.channel').forEach(channel => {
                channel.classList.add('interference-none');
            });
            return;
        }

        try {
            // Ленивая загрузка калькулятора
            const { getInterferenceCalculator } = await import('./interferenceCalculator.js');
            const calculator = await getInterferenceCalculator();
            
            // Подготавливаем данные о выбранных каналах
            const selectedChannelsData = Array.from(this.selectedChannels.values()).map(info => ({
                name: info.name,
                frequency: parseFloat(info.frequency),
                isAnalog: info.isAnalog
            }));
            console.log('Данные выбранных каналов:', selectedChannelsData);

            // Получаем все невыбранные каналы
            const unselectedChannels = document.querySelectorAll('.channel:not(.selected)');
            console.log('Количество невыбранных каналов:', unselectedChannels.length);

            // Подготавливаем данные о невыбранных каналах
            const unselectedChannelsData = Array.from(unselectedChannels).map(channel => {
                const [band] = channel.dataset.channel.match(/([A-Za-z]+)(\d+)/).slice(1);
                return {
                    element: channel,
                    data: {
                        name: channel.dataset.channel,
                        frequency: parseFloat(channel.textContent),
                        isAnalog: this.isAnalogChannel(this.data[band])
                    }
                };
            });

            // Получаем результаты расчета интерференции
            const interferenceResults = calculator.calculateBulkInterference(
                selectedChannelsData,
                unselectedChannelsData.map(ch => ch.data)
            );

            // Применяем результаты к каналам
            interferenceResults.forEach((result, index) => {
                const channel = unselectedChannels[index];
                if (channel) {
                    channel.classList.add(`interference-${result.level}`);
                    channel.style.cursor = result.level === 'high' ? 'not-allowed' : 'pointer';
                    
                    // Сохраняем детали интерференции
                    if (result.details) {
                        channel.dataset.interferenceDetails = JSON.stringify(result.details);
                    }
                }
            });

        } catch (error) {
            console.error('Ошибка при расчете интерференции:', error);
            // В случае ошибки устанавливаем всем неактивным каналам зеленый цвет
            document.querySelectorAll('.channel:not(.selected)').forEach(channel => {
                channel.classList.add('interference-none');
            });
        }

        console.log('=== Конец updateInterference ===');
    }

    // Скрытие модального окна
    hideModal() {
        this.modalOverlay.classList.remove('active');
        this.modal.classList.remove('active');
    }

    async initData() {
        try {
            // Проверяем, есть ли данные в sessionStorage
            const cachedData = sessionStorage.getItem('fpvData');
            if (cachedData) {
                console.log('Данные загружены из sessionStorage');
                this.data = JSON.parse(cachedData);
                return;
            }

            // Если данных нет, делаем запрос на сервер
            console.log('Запрос данных с сервера...');
            const response = await fetch('/api/data');
            this.data = await response.json();

            // Сохраняем в sessionStorage
            sessionStorage.setItem('fpvData', JSON.stringify(this.data));
            console.log('Данные загружены:', this.data);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
    }

    // Инициализация фильтра типов бендов
    initBandTypeFilter() {
        // Добавляем обработчики для фильтрации
        this.checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateButtonState();
                this.filterBands();
            });

            // Добавляем обработчик для клавиши пробел при фокусе на чекбоксе
            checkbox.addEventListener('keydown', (e) => {
                if (e.code === 'Space') {
                    e.preventDefault();
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change'));
                }
            });
        });

        // Начальное состояние
        this.updateButtonState();
        this.filterBands();
    }

    // Инициализация кнопки анализа
    initAnalyzeButton() {
        this.analyzeBtn.addEventListener('click', () => {
            this.showFrequencyTable();
        });
    }

    // Обновление состояния кнопки на основе чекбоксов
    updateButtonState() {
        const isAnyChecked = Array.from(this.checkboxes).some(checkbox => checkbox.checked);
        
        if (isAnyChecked) {
            this.analyzeBtn.disabled = false;
            console.log('Кнопка активирована');
        } else {
            this.analyzeBtn.disabled = true;
            console.log('Кнопка деактивирована');
            this.frequencyTable.classList.add('hidden');
        }
    }

    // Фильтрация бендов по типу
    filterBands() {
        const analogChecked = document.getElementById('analogCheck').checked;
        const digitalChecked = document.getElementById('digitalCheck').checked;
        
        // Получаем все селекты с бендами
        const bandSelects = document.querySelectorAll('select[data-type]');
        
        bandSelects.forEach(select => {
            const type = select.dataset.type;
            if (type === 'analog') {
                select.style.display = analogChecked ? 'inline-block' : 'none';
            } else if (type === 'digital') {
                select.style.display = digitalChecked ? 'inline-block' : 'none';
            }
        });

        // Вызываем событие изменения фильтров
        const event = new CustomEvent('bandFilterChange', {
            detail: { analog: analogChecked, digital: digitalChecked }
        });
        document.dispatchEvent(event);
    }

    // Отображение таблицы частот
    showFrequencyTable() {
        if (!this.data) {
            console.error('Данные о частотах не загружены');
            return;
        }

        const analogChecked = document.getElementById('analogCheck').checked;
        const digitalChecked = document.getElementById('digitalCheck').checked;
        
        // Очищаем текущую таблицу
        this.frequencyTable.innerHTML = '';
        
        // Создаем счетчик активных каналов, если его еще нет
        if (!this.channelsCounter) {
            this.createActiveChannelsCounter();
        }
        
        // Для каждого диапазона частот
        this.ranges.forEach(range => {
            // Добавляем заголовок диапазона, если есть данные для него
            let hasData = false;
            const rangeData = document.createElement('div');
            rangeData.className = 'range-block';
            
            // Добавляем аналоговые бенды для текущего диапазона
            if (analogChecked && this.data.analog[range]) {
                Object.entries(this.data.analog[range]).forEach(([bandKey, bandData]) => {
                    if (bandData.channels && Object.keys(bandData.channels).length > 0) {
                        if (!hasData) {
                            const rangeTitle = document.createElement('h3');
                            rangeTitle.className = 'range-title';
                            // Преобразуем название диапазона для отображения
                            const rangeName = this.formatRangeName(range);
                            rangeTitle.textContent = rangeName;
                            rangeData.appendChild(rangeTitle);
                            hasData = true;
                        }
                        this.addBandRow(bandKey, bandData, rangeData);
                    }
                });
            }
            
            // Добавляем цифровые бенды для текущего диапазона
            if (digitalChecked && this.data.digital[range]) {
                Object.entries(this.data.digital[range]).forEach(([bandKey, bandData]) => {
                    if (bandData.channels && Object.keys(bandData.channels).length > 0) {
                        if (!hasData) {
                            const rangeTitle = document.createElement('h3');
                            rangeTitle.className = 'range-title';
                            // Преобразуем название диапазона для отображения
                            const rangeName = this.formatRangeName(range);
                            rangeTitle.textContent = rangeName;
                            rangeData.appendChild(rangeTitle);
                            hasData = true;
                        }
                        this.addBandRow(bandKey, bandData, rangeData);
                    }
                });
            }

            // Добавляем блок диапазона только если есть данные
            if (hasData) {
                this.frequencyTable.appendChild(rangeData);
            }
        });

        // Показываем таблицу
        this.frequencyTable.classList.remove('hidden');
        
        // Ждем следующего кадра для корректного получения позиции
        requestAnimationFrame(() => {
            const tableRect = this.frequencyTable.getBoundingClientRect();
            const scrollTop = window.pageYOffset + tableRect.top - 20;
            this.smoothScrollTo(scrollTop);
        });
        
        // Инициализируем начальное состояние интерференции
        this.updateInterference();
    }

    // Форматирование названия диапазона для отображения
    formatRangeName(range) {
        const rangeMap = {
            '5G8': '5.8 GHz',
            '5G3': '5.3 GHz',
            '4G9': '4.9 GHz',
            '3G3': '3.3 GHz',
            '2G4': '2.4 GHz',
            '1G3': '1.3 GHz',
            '900': '900 MHz'
        };
        return rangeMap[range] || range;
    }

    // Добавление строки с бендом
    addBandRow(bandKey, bandData, container) {
        const row = document.createElement('div');
        row.className = 'band-row';
        
        const nameElement = document.createElement('div');
        nameElement.className = 'band-name';
        nameElement.textContent = bandData.bandTitle || bandKey;
        
        const channelsContainer = document.createElement('div');
        channelsContainer.className = 'channels-container';
        
        Object.entries(bandData.channels).forEach(([channelNum, frequency]) => {
            if (frequency !== '' && frequency !== 0) {
                const channelWrapper = document.createElement('div');
                channelWrapper.className = 'channel-wrapper';

                const channel = document.createElement('div');
                channel.className = 'channel';
                channel.textContent = frequency;

                // Добавляем номер канала над блоком
                const channelNumber = document.createElement('div');
                channelNumber.className = 'channel-number';
                // Определяем формат номера канала
                const isAnalog = this.data.analog['5G8'] && Object.values(this.data.analog['5G8']).some(band => 
                    band === bandData || Object.values(band).includes(bandData)
                );
                
                if (isAnalog) {
                    channelNumber.textContent = `${bandData.bandTitle || bandKey}${channelNum}`;
                } else {
                    if (bandData.bandTitle && bandData.bandTitle.length === 1) {
                        channelNumber.textContent = `${bandData.bandTitle}${channelNum}`;
                    } else {
                        channelNumber.textContent = channelNum;
                    }
                }

                // Добавляем полное название бенда и номер канала в data-атрибуты
                channel.dataset.bandName = bandData.bandName;
                channel.dataset.channel = `${bandKey}${channelNum}`;

                // Добавляем обработчик клика
                channel.addEventListener('click', () => {
                    this.showModal(channel, bandData, channelNum, bandKey);
                });

                channelWrapper.appendChild(channelNumber);
                channelWrapper.appendChild(channel);
                channelsContainer.appendChild(channelWrapper);
            }
        });
        
        row.appendChild(nameElement);
        row.appendChild(channelsContainer);
        container.appendChild(row);
    }

    // Обновление содержимого модального окна
    updateModalContent(simplifiedName, frequency, bandData, channelNum, freqStart, freqEnd, channelWidth, modulationType, region) {
        const modalContent = `
            <button class="modal-close">&times;</button>
            <div class="modal-channel-name">${simplifiedName}</div>
            <div class="modal-frequency">${frequency}</div>
            <div class="modal-unit">MHz</div>
            <div class="modal-info"></div>
        `;
        this.modal.innerHTML = modalContent;
        
        const infoHtml = `
            <div class="info-row">
                <span class="info-label">Band Name:</span>
                <span class="info-value">${bandData.bandName || 'N/A'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Channel:</span>
                <span class="info-value">${channelNum}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Frequency Range:</span>
                <span class="info-value">${freqStart} - ${freqEnd} MHz</span>
            </div>
            <div class="info-row">
                <span class="info-label">Channel Width:</span>
                <span class="info-value">${channelWidth} MHz</span>
            </div>
            <div class="info-row">
                <span class="info-label">Modulation Type:</span>
                <span class="info-value">${modulationType}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Region:</span>
                <span class="info-value">${region}</span>
            </div>
        `;
        this.modal.querySelector('.modal-info').innerHTML = infoHtml;

        // Добавляем обработчик для кнопки закрытия
        this.modal.querySelector('.modal-close').addEventListener('click', () => this.hideModal());
    }

    // Создание кнопки прокрутки наверх
    createScrollToTopButton() {
        this.scrollButton = document.createElement('div');
        this.scrollButton.className = 'scroll-to-top';
        this.scrollButton.innerHTML = '↑';
        this.scrollButton.title = 'Scroll to top';
        this.scrollButton.addEventListener('click', () => this.smoothScrollTo(0));
        document.body.appendChild(this.scrollButton);
    }

    // Показ/скрытие кнопки прокрутки
    toggleScrollButton() {
        if (window.scrollY > 300) {
            this.scrollButton.classList.add('visible');
        } else {
            this.scrollButton.classList.remove('visible');
        }
    }

    // Плавная прокрутка к указанной позиции
    smoothScrollTo(targetY) {
        const startY = window.scrollY;
        const diff = targetY - startY;
        const duration = 1000; // Длительность анимации в мс
        let start;

        function step(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const percent = Math.min(progress / duration, 1);
            
            // Функция плавности
            const easing = t => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
            
            window.scrollTo(0, startY + diff * easing(percent));

            if (progress < duration) {
                window.requestAnimationFrame(step);
            }
        }

        window.requestAnimationFrame(step);
    }

    // Обновление текста режима
    updateModeLabel() {
        const description = document.querySelector('.mode-description');
        if (description) {
            description.textContent = this.analyzer.getMode() === 'simple' ? 
                'Quick (Simple)' : 'Smart (Server)';
        }
    }

    // Обновление отображения каналов
    async updateChannelDisplay() {
        const results = await this.analyzer.updateInterference();
        if (!results) return;

        // Обновляем классы для выбранных каналов на основе результатов
        this.selectedChannels.forEach(channelId => {
            const element = document.getElementById(channelId);
            if (element) {
                // Очищаем предыдущие классы интерференции
                element.classList.remove('interference-critical', 'interference-high', 
                                      'interference-medium', 'interference-low', 'interference-none');
                
                // Добавляем новый класс на основе результатов
                const interference = this.getInterferenceForChannel(channelId, results);
                if (interference) {
                    element.classList.add(`interference-${interference.level}`);
                }
            }
        });
    }

    // Получение уровня интерференции для канала
    getInterferenceForChannel(channelId, results) {
        if (results.mode === 'simple') {
            // Для простого режима
            for (const [key, value] of results.results) {
                if (key.includes(channelId)) {
                    return value;
                }
            }
        } else {
            // Для серверного режима
            const serverResults = results.results;
            // Используем данные из матрицы интерференции
            return serverResults.matrix.find(row => row.some(cell => 
                cell.channel && cell.channel.id === channelId
            ));
        }
        return null;
    }
} 