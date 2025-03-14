export class FPVAnalyzer {
    constructor() {
        // Получаем данные из sessionStorage при создании
        const cachedData = sessionStorage.getItem("fpvData");
        this.data = cachedData ? JSON.parse(cachedData) : null;
        
        // Маппинг названий диапазонов
        this.rangeMapping = {
            "5.8GHz": "5G8",
            "5.3GHz": "5G3",
            "4.9GHz": "4G9"
        };
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
}