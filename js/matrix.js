/** "Matrix rain" background. Decorative only. */

const COLUMN_WIDTH = 14;
const FRAME_INTERVAL_MS = 50;

function randomGlyph() {
    const pick = Math.random();
    if (pick < 0.34) return String.fromCharCode(0x30a0 + Math.random() * 96); // katakana
    if (pick < 0.67) return String.fromCharCode(33 + Math.random() * 94); // ASCII
    return String.fromCharCode(0x25a0 + Math.random() * 8); // geometric shapes
}

export class MatrixAnimation {
    constructor(canvas) {
        if (!canvas) return;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.columns = [];
        this.lastFrame = 0;
        this.frame = this.frame.bind(this);

        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Respect users who asked the OS for less motion: leave a black background.
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) requestAnimationFrame(this.frame);
        });
        requestAnimationFrame(this.frame);
    }

    newColumn() {
        return {
            y: 1,
            speed: 0.5 + Math.random() * 0.5,
            fontSize: 12 + Math.floor(Math.random() * 5),
            green: 150 + Math.floor(Math.random() * 106),
        };
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        const count = Math.floor(this.canvas.width / COLUMN_WIDTH);
        this.columns = Array.from({ length: count }, (_, i) => this.columns[i] ?? this.newColumn());
    }

    frame(timestamp) {
        if (document.hidden) return; // restarted by the visibilitychange listener
        requestAnimationFrame(this.frame);
        if (timestamp - this.lastFrame < FRAME_INTERVAL_MS) return;
        this.lastFrame = timestamp;

        const { ctx, canvas } = this;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        this.columns.forEach((column, i) => {
            ctx.font = `${column.fontSize}px monospace`;
            ctx.fillStyle = `rgba(0, ${column.green}, 0, 0.9)`;
            const y = column.y * COLUMN_WIDTH;
            ctx.fillText(randomGlyph(), i * COLUMN_WIDTH, y);

            if (y > canvas.height && Math.random() > 0.975) {
                this.columns[i] = this.newColumn();
                this.columns[i].y = 0;
            } else {
                column.y += column.speed * 2;
            }
        });
    }
}
