import { UIControls } from './modules/uiControls.js';
import { MatrixAnimation } from './modules/matrix.js';
import { DataLoader } from './modules/data/dataLoader.js';
import { FPVAnalyzer } from './modules/analysis/fpvAnalyzer.js';
import { scrollToTop } from './utils/scroll.js';
import InterferenceCalculator from './modules/interferenceCalculator.js';

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Создаем экземпляр анимации матрицы
        new MatrixAnimation();
        
        // Создаем экземпляр калькулятора интерференции
        const interferenceCalculator = new InterferenceCalculator();
        
        // Создаем экземпляры для работы с данными и анализа
        const dataLoader = new DataLoader();
        const analyzer = new FPVAnalyzer(dataLoader);
        
        // Слушаем событие загрузки данных
        document.addEventListener('frequencyDataLoaded', (event) => {
            // Анализируем загруженные данные
            analyzer.analyzeFrequencies(event.detail.frequencies);
        });

        // Слушаем событие ошибки загрузки данных
        document.addEventListener('frequencyDataError', (event) => {
            console.error('Не удалось загрузить данные:', event.detail.error);
            // Здесь можно добавить отображение ошибки в UI
        });
        
        // Создаем экземпляр UI контролов и передаем ему калькулятор
        const uiControls = new UIControls(interferenceCalculator);
        
        // Прокручиваем страницу вверх
        scrollToTop();
    } catch (error) {
        console.error('Error initializing application:', error);
    }
});
