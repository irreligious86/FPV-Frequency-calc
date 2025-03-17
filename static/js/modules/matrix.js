// Модуль для анимации матрицы
export class MatrixAnimation {
    constructor() {
        this.canvas = document.getElementById('matrixCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.fontSize = 14;
        this.columns = 0;
        this.drops = [];
        this.speeds = []; // Разные скорости для колонок
        this.fontSizes = []; // Разные размеры шрифта
        this.greens = []; // Разные оттенки зеленого

        // Привязываем метод к контексту
        this.resize = this.resize.bind(this);

        // Добавляем обработчик изменения размера окна
        window.addEventListener('resize', this.resize);

        // Инициализация
        this.initialize();
    }

    initialize() {
        // Устанавливаем размеры canvas
        this.resize();

        // Инициализируем массив капель
        this.drops = Array(this.columns).fill(1);
        
        // Инициализируем скорости для каждой колонки (от 0.5 до 1)
        this.speeds = Array(this.columns).fill(0).map(() => 
            0.5 + Math.random() * 0.5
        );
        
        // Инициализируем размеры шрифта (от 12 до 16)
        this.fontSizes = Array(this.columns).fill(0).map(() => 
            12 + Math.floor(Math.random() * 5)
        );
        
        // Инициализируем оттенки зеленого
        this.greens = Array(this.columns).fill(0).map(() => 
            150 + Math.floor(Math.random() * 106)
        );

        // Запускаем анимацию
        this.animate();
    }

    resize() {
        // Устанавливаем размеры canvas равными размерам окна
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Вычисляем количество колонок
        this.columns = Math.floor(this.canvas.width / this.fontSize);

        // Обновляем массивы при изменении размера
        if (this.drops.length !== this.columns) {
            this.drops = Array(this.columns).fill(1);
            this.speeds = Array(this.columns).fill(0).map(() => 
                0.5 + Math.random() * 0.5
            );
            this.fontSizes = Array(this.columns).fill(0).map(() => 
                12 + Math.floor(Math.random() * 5)
            );
            this.greens = Array(this.columns).fill(0).map(() => 
                150 + Math.floor(Math.random() * 106)
            );
        }
    }

    animate() {
        // Полупрозрачный черный фон для эффекта затухания
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.drops.length; i++) {
            // Случайный символ (включая катакану и некоторые специальные символы)
            const charTypes = [
                () => String.fromCharCode(0x30A0 + Math.random() * 96), // катакана
                () => String.fromCharCode(33 + Math.random() * 94),     // ASCII символы
                () => String.fromCharCode(0x25A0 + Math.random() * 8)   // геометрические символы
            ];
            const text = charTypes[Math.floor(Math.random() * charTypes.length)]();

            // Устанавливаем размер шрифта для колонки
            this.ctx.font = `${this.fontSizes[i]}px monospace`;
            
            // Устанавливаем цвет для колонки
            this.ctx.fillStyle = `rgba(0, ${this.greens[i]}, 0, 0.9)`;

            const x = i * this.fontSize;
            const y = this.drops[i] * this.fontSize;

            this.ctx.fillText(text, x, y);

            // Сброс капли в начало при достижении низа экрана
            if (y > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
                // Обновляем параметры при сбросе
                this.speeds[i] = 0.5 + Math.random() * 0.5;
                this.fontSizes[i] = 12 + Math.floor(Math.random() * 5);
                this.greens[i] = 150 + Math.floor(Math.random() * 106);
            }

            // Перемещаем каплю вниз с учетом скорости
            this.drops[i] += this.speeds[i];
        }

        // Продолжаем анимацию
        requestAnimationFrame(() => this.animate());
    }

    // Метод для очистки при уничтожении
    destroy() {
        window.removeEventListener('resize', this.resize);
    }
} 