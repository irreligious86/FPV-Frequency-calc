export class DataLoader {
    constructor() {
        this.frequencies = [];
        this.channels = [];
        this.initialize();
    }

    initialize() {
        // Пробуем загрузить данные из sessionStorage
        const cachedData = sessionStorage.getItem('fpvData');
        if (cachedData) {
            try {
                const data = JSON.parse(cachedData);
                if (this.validateData(data)) {
                    console.log('Данные загружены из sessionStorage');
                    this.setData(data);
                    return;
                }
            } catch (error) {
                console.warn('Ошибка при чтении данных из sessionStorage:', error);
            }
        }
        
        // Если данных нет в sessionStorage или они некорректны, загружаем с сервера
        this.loadFrequencyData();
    }

    validateData(data) {
        console.log('Проверка данных:', data);
        // Проверяем новый формат данных
        const isValid = data && 
               typeof data.analog === 'object' &&
               typeof data.digital === 'object' &&
               Object.keys(data.analog).length >= 0 &&
               Object.keys(data.digital).length >= 0;
        console.log('Результат проверки:', isValid);
        return isValid;
    }

    transformData(data) {
        // Преобразуем данные из формата {analog: {}, digital: {}}
        // в формат {frequencies: [], channels: []}
        const frequencies = [];
        const channels = [];

        // Обрабатываем аналоговые частоты
        Object.entries(data.analog || {}).forEach(([channel, freq]) => {
            frequencies.push(freq);
            channels.push({ type: 'analog', name: channel, frequency: freq });
        });

        // Обрабатываем цифровые частоты
        Object.entries(data.digital || {}).forEach(([channel, freq]) => {
            frequencies.push(freq);
            channels.push({ type: 'digital', name: channel, frequency: freq });
        });

        return { frequencies, channels };
    }

    setData(rawData) {
        // Преобразуем данные в нужный формат
        const data = this.transformData(rawData);
        
        this.frequencies = data.frequencies;
        this.channels = data.channels;
        
        // Отправляем событие о загрузке данных
        document.dispatchEvent(new CustomEvent('frequencyDataLoaded', { 
            detail: { 
                frequencies: this.frequencies,
                channels: this.channels 
            }
        }));
    }

    loadFrequencyData() {
        console.log('Загрузка данных с сервера...');
        fetch('/api/data')
            .then(response => {
                console.log('Статус ответа:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Полученные данные:', data);
                if (!this.validateData(data)) {
                    throw new Error('Некорректный формат данных с сервера');
                }
                // Сохраняем в sessionStorage
                sessionStorage.setItem('fpvData', JSON.stringify(data));
                this.setData(data);
            })
            .catch(error => {
                console.error('Ошибка загрузки данных:', error);
                // Отправляем событие об ошибке
                document.dispatchEvent(new CustomEvent('frequencyDataError', { 
                    detail: { error: error.message }
                }));
            });
    }

    getFrequencies() {
        return this.frequencies;
    }

    getChannels() {
        return this.channels;
    }

    // Метод для принудительного обновления данных с сервера
    refreshData() {
        sessionStorage.removeItem('fpvData');
        this.loadFrequencyData();
    }
}
