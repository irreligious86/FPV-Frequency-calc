import { FPVAnalyzer } from './fpvAnalyzer.js';

describe('FPVAnalyzer', () => {
    let analyzer;
    
    // Мок-данные для тестов
    const mockData = {
        "analog": {
            "5G8": {
                "R": {
                    "channels": {
                        "1": 5658
                    }
                }
            }
        }
    };

    beforeEach(() => {
        // Очищаем sessionStorage перед каждым тестом
        sessionStorage.clear();
        // Подготавливаем тестовые данные
        sessionStorage.setItem('fpvData', JSON.stringify(mockData));
        analyzer = new FPVAnalyzer();
    });

    describe('_convertRange', () => {
        test('должен конвертировать 5.8GHz в 5G8', () => {
            expect(analyzer._convertRange('5.8GHz')).toBe('5G8');
        });

        test('должен конвертировать 5.3GHz в 5G3', () => {
            expect(analyzer._convertRange('5.3GHz')).toBe('5G3');
        });

        test('должен вернуть исходное значение для неизвестного диапазона', () => {
            expect(analyzer._convertRange('unknown')).toBe('unknown');
        });
    });

    describe('getFrequency', () => {
        test('должен вернуть правильную частоту для существующего канала', () => {
            const result = analyzer.getFrequency('R', '1', '5.8GHz');
            expect(result).toEqual({
                frequency: 5658,
                unit: 'MHz'
            });
        });

        test('должен вернуть null для несуществующего канала', () => {
            const result = analyzer.getFrequency('R', '9', '5.8GHz');
            expect(result).toBeNull();
        });
    });
}); 