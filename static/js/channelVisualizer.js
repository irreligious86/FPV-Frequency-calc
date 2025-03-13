export class ChannelVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.channels = [];
        this.interferenceData = null;
        this.selectedChannel = null;
        
        // Константы для отрисовки
        this.FREQ_MIN = 5600; // МГц
        this.FREQ_MAX = 6000; // МГц
        this.CHANNEL_HEIGHT = 40;
        this.MARGIN = 20;
        
        // Привязываем обработчики событий
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('click', this.handleClick.bind(this));
        
        // Устанавливаем размеры canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.canvas.height = 300;
        this.draw();
    }

    setChannels(channels) {
        this.channels = channels;
        this.draw();
    }

    setInterferenceData(data) {
        this.interferenceData = data;
        this.draw();
    }

    // Преобразование частоты в координату X
    freqToX(freq) {
        return this.MARGIN + (freq - this.FREQ_MIN) / (this.FREQ_MAX - this.FREQ_MIN) * (this.canvas.width - 2 * this.MARGIN);
    }

    // Преобразование координаты X в частоту
    xToFreq(x) {
        return this.FREQ_MIN + (x - this.MARGIN) / (this.canvas.width - 2 * this.MARGIN) * (this.FREQ_MAX - this.FREQ_MIN);
    }

    handleMouseMove(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const freq = this.xToFreq(x);
        
        // Находим ближайший канал
        let closest = null;
        let minDist = Infinity;
        
        for (const channel of this.channels) {
            const dist = Math.abs(channel.frequency - freq);
            if (dist < minDist) {
                minDist = dist;
                closest = channel;
            }
        }

        if (closest && minDist < 20) { // 20 МГц threshold
            this.selectedChannel = closest;
        } else {
            this.selectedChannel = null;
        }
        
        this.draw();
    }

    handleClick(event) {
        if (this.selectedChannel && this.onChannelSelect) {
            this.onChannelSelect(this.selectedChannel);
        }
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Рисуем оси
        this.drawAxes();

        // Рисуем каналы
        for (const channel of this.channels) {
            this.drawChannel(channel);
        }

        // Рисуем интерференцию если есть данные
        if (this.interferenceData) {
            this.drawInterference();
        }

        // Рисуем выбранный канал
        if (this.selectedChannel) {
            this.drawSelectedChannel();
        }
    }

    drawAxes() {
        const ctx = this.ctx;
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        
        // Горизонтальная ось
        ctx.beginPath();
        ctx.moveTo(this.MARGIN, this.canvas.height - this.MARGIN);
        ctx.lineTo(this.canvas.width - this.MARGIN, this.canvas.height - this.MARGIN);
        ctx.stroke();

        // Метки частот
        ctx.fillStyle = '#666';
        ctx.font = '12px Share Tech Mono';
        ctx.textAlign = 'center';
        
        for (let freq = 5600; freq <= 6000; freq += 100) {
            const x = this.freqToX(freq);
            ctx.fillText(freq.toString(), x, this.canvas.height - 5);
            
            // Вертикальные линии сетки
            ctx.beginPath();
            ctx.moveTo(x, this.MARGIN);
            ctx.lineTo(x, this.canvas.height - this.MARGIN);
            ctx.stroke();
        }
    }

    drawChannel(channel) {
        const ctx = this.ctx;
        const x = this.freqToX(channel.frequency);
        const y = this.canvas.height - this.MARGIN - this.CHANNEL_HEIGHT;
        
        // Определяем цвет на основе типа системы
        const color = channel.type === 'analog' ? '#ff6b6b' : '#4ecdc4';
        
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.6;
        
        // Рисуем канал как прямоугольник
        ctx.fillRect(
            x - 15,
            y,
            30,
            this.CHANNEL_HEIGHT
        );
        
        ctx.globalAlpha = 1.0;
        
        // Подписываем канал
        ctx.fillStyle = '#fff';
        ctx.font = '12px Share Tech Mono';
        ctx.textAlign = 'center';
        ctx.fillText(channel.name, x, y - 5);
    }

    drawSelectedChannel() {
        const ctx = this.ctx;
        const x = this.freqToX(this.selectedChannel.frequency);
        const y = this.canvas.height - this.MARGIN - this.CHANNEL_HEIGHT;
        
        // Подсветка выбранного канала
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            x - 15,
            y,
            30,
            this.CHANNEL_HEIGHT
        );
        
        // Показываем детальную информацию
        ctx.fillStyle = '#fff';
        ctx.font = '14px Share Tech Mono';
        ctx.textAlign = 'left';
        ctx.fillText(
            `Channel: ${this.selectedChannel.name}`,
            10,
            20
        );
        ctx.fillText(
            `Frequency: ${this.selectedChannel.frequency} MHz`,
            10,
            40
        );
        ctx.fillText(
            `Type: ${this.selectedChannel.type}`,
            10,
            60
        );
    }

    drawInterference() {
        if (!this.interferenceData) return;
        
        const ctx = this.ctx;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        
        for (const interference of this.interferenceData) {
            const x1 = this.freqToX(interference.source.frequency);
            const x2 = this.freqToX(interference.target.frequency);
            const y = this.canvas.height - this.MARGIN - this.CHANNEL_HEIGHT / 2;
            
            // Рисуем линию интерференции
            ctx.beginPath();
            ctx.moveTo(x1, y);
            ctx.lineTo(x2, y);
            
            // Градиент прозрачности на основе уровня интерференции
            const gradient = ctx.createLinearGradient(x1, y, x2, y);
            gradient.addColorStop(0, `rgba(255, 0, 0, ${interference.level})`);
            gradient.addColorStop(1, `rgba(255, 0, 0, ${interference.level})`);
            
            ctx.strokeStyle = gradient;
            ctx.stroke();
        }
    }
} 