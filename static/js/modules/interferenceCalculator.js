// Модуль для расчета интерференции
class InterferenceCalculator {
    constructor() {
        console.log('=== Инициализация калькулятора интерференции ===');
        // Базовые настройки
        this.CHANNEL_WIDTH = 20;  // MHz
        this.MIN_SAFE_DISTANCE = 38;  // MHz
        
        // Храним выбранные каналы и режим работы
        this.selectedChannels = new Set();
        this.isSimpleMode = true;  // true = простой расчет, false = серверный расчет
        
        // Храним результаты расчетов
        this.interferenceResults = {
            simple: new Map(),  // результаты простого расчета
            server: new Map()   // результаты с сервера
        };

        // Константы для расчетов
        this.ANALOG_THRESHOLDS = {
            none: 100,  // > 100 MHz
            low: 40,    // > 40 MHz
            medium: 20  // > 20 MHz
            // <= 20 MHz = high
        };

        this.DIGITAL_THRESHOLDS = {
            none: 80,   // > 80 MHz
            low: 30,    // > 30 MHz
            medium: 15  // > 15 MHz
            // <= 15 MHz = high
        };

        // Кэш для хранения результатов расчетов
        this.calculationCache = new Map();
        console.log('Калькулятор интерференции инициализирован');
    }

    // Простой расчет на основе расстояния
    calculateSimpleInterference(freq1, freq2) {
        const distance = Math.abs(freq1 - freq2);
        
        if (distance < this.CHANNEL_WIDTH) return {
            level: "critical",
            distance: distance,
            description: "Критическая интерференция"
        };
        
        if (distance < this.MIN_SAFE_DISTANCE) return {
            level: "high",
            distance: distance,
            description: "Сильная интерференция"
        };
        
        if (distance < 50) return {
            level: "medium",
            distance: distance,
            description: "Средняя интерференция"
        };
        
        if (distance < 70) return {
            level: "low",
            distance: distance,
            description: "Слабая интерференция"
        };
        
        return {
            level: "none",
            distance: distance,
            description: "Нет интерференции"
        };
    }

    // Серверный расчет интерференции
    async calculateServerInterference(channels) {
        try {
            console.log('🌐 Отправка запроса на сервер:', {
                channels: channels.map(ch => ({
                    band: ch.band,
                    channel: ch.channel,
                    range: ch.range || '5.8GHz'
                }))
            });

            const response = await fetch('/api/interference/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    channels: channels.map(ch => ({
                        band: ch.band,
                        channel: ch.channel,
                        range: ch.range || '5.8GHz'
                    }))
                })
            });
            
            if (!response.ok) {
                console.error('❌ Ошибка сервера:', response.status, response.statusText);
                throw new Error('Network response was not ok');
            }
            
            const data = await response.json();
            console.log('✅ Получен ответ от сервера:', data);
            
            // Преобразуем серверный ответ в формат, совместимый с простым расчетом
            return {
                matrix: data.interference_matrix,
                analysis: data.analysis,
                criticalPairs: data.critical_pairs
            };
        } catch (error) {
            console.error('❌ Ошибка при запросе к серверу:', error);
            // В случае ошибки возвращаемся к простому расчету
            this.isSimpleMode = true;
            return this.updateInterference();
        }
    }

    // Добавить канал в выбранные
    addChannel(channel) {
        this.selectedChannels.add(channel);
        return this.updateInterference();
    }

    // Удалить канал из выбранных
    removeChannel(channel) {
        this.selectedChannels.delete(channel);
        return this.updateInterference();
    }

    // Переключить режим расчета
    async toggleMode() {
        this.isSimpleMode = !this.isSimpleMode;
        return this.updateInterference();
    }

    // Обновить расчеты интерференции
    async updateInterference() {
        const channels = Array.from(this.selectedChannels);
        
        // Если каналов меньше 2, нет смысла считать интерференцию
        if (channels.length < 2) {
            this.interferenceResults.simple.clear();
            this.interferenceResults.server.clear();
            return null;
        }

        if (this.isSimpleMode) {
            // Простой расчет
            const results = new Map();
            
            for (let i = 0; i < channels.length; i++) {
                for (let j = i + 1; j < channels.length; j++) {
                    const result = this.calculateSimpleInterference(
                        channels[i].frequency, 
                        channels[j].frequency
                    );
                    
                    const key = `${channels[i].id}-${channels[j].id}`;
                    results.set(key, result);
                }
            }
            
            this.interferenceResults.simple = results;
            return {
                mode: 'simple',
                results: results
            };
        } else {
            // Серверный расчет
            const serverResults = await this.calculateServerInterference(channels);
            this.interferenceResults.server = new Map(Object.entries(serverResults));
            return {
                mode: 'server',
                results: serverResults
            };
        }
    }

    // Получить текущие результаты
    getCurrentResults() {
        return {
            mode: this.getMode(),
            results: this.isSimpleMode ? 
                this.interferenceResults.simple : 
                this.interferenceResults.server
        };
    }

    // Получить режим работы
    getMode() {
        return this.isSimpleMode ? "simple" : "server";
    }

    // Основной метод расчета интерференции
    calculateInterference(selectedChannels, unselectedChannel) {
        console.log('=== Расчет интерференции ===');
        console.log('Выбранные каналы:', selectedChannels);
        console.log('Проверяемый канал:', unselectedChannel);

        // Проверяем кэш
        const cacheKey = this._generateCacheKey(selectedChannels, unselectedChannel);
        if (this.calculationCache.has(cacheKey)) {
            console.log('Найден результат в кэше');
            return this.calculationCache.get(cacheKey);
        }

        // Если нет выбранных каналов, интерференции нет
        if (selectedChannels.length === 0) {
            console.log('Нет выбранных каналов, интерференция отсутствует');
            return { level: 'none', details: { reason: 'no selected channels' } };
        }

        // Находим минимальную разницу частот
        let minFreqDiff = Infinity;
        let interferingChannel = null;

        selectedChannels.forEach(selected => {
            const freqDiff = Math.abs(selected.frequency - unselectedChannel.frequency);
            if (freqDiff < minFreqDiff) {
                minFreqDiff = freqDiff;
                interferingChannel = selected;
            }
        });

        console.log('Минимальная разница частот:', minFreqDiff);
        console.log('Интерферирующий канал:', interferingChannel);

        // Определяем уровень интерференции
        const thresholds = unselectedChannel.isAnalog ? this.ANALOG_THRESHOLDS : this.DIGITAL_THRESHOLDS;
        let level = 'high'; // По умолчанию высокая интерференция

        if (minFreqDiff > thresholds.none) {
            level = 'none';
        } else if (minFreqDiff > thresholds.low) {
            level = 'low';
        } else if (minFreqDiff > thresholds.medium) {
            level = 'medium';
        }

        // Формируем результат
        const result = {
            level,
            details: {
                frequencyDifference: minFreqDiff,
                interferingChannel: interferingChannel ? interferingChannel.name : null,
                isAnalog: unselectedChannel.isAnalog,
                thresholds: { ...thresholds }
            }
        };

        // Сохраняем в кэш
        this.calculationCache.set(cacheKey, result);
        console.log('Результат расчета:', result);

        return result;
    }

    // Метод для массового расчета интерференции
    calculateBulkInterference(selectedChannels, unselectedChannels) {
        console.log('=== Массовый расчет интерференции ===');
        console.log('Количество выбранных каналов:', selectedChannels.length);
        console.log('Количество проверяемых каналов:', unselectedChannels.length);

        return unselectedChannels.map(channel => {
            const result = this.calculateInterference(selectedChannels, channel);
            console.log(`Канал ${channel.name}: уровень ${result.level}`);
            return result;
        });
    }

    // Очистка кэша
    clearCache() {
        console.log('Очистка кэша расчетов');
        this.calculationCache.clear();
    }

    // Приватный метод для генерации ключа кэша
    _generateCacheKey(selectedChannels, unselectedChannel) {
        const selectedKey = selectedChannels
            .map(ch => `${ch.frequency}`)
            .sort()
            .join('|');
        return `${selectedKey}_${unselectedChannel.frequency}`;
    }
}

// Экспортируем класс по умолчанию
export default InterferenceCalculator;

// Ленивая загрузка калькулятора
let calculator = null;

export async function getInterferenceCalculator() {
    if (!calculator) {
        console.log('Создание нового экземпляра калькулятора');
        calculator = new InterferenceCalculator();
    }
    return calculator;
} 