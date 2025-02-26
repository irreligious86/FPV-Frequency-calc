const canvas = document.getElementById("matrixCanvas"); // Получаем ссылку на HTML-элемент canvas
const ctx = canvas.getContext("2d"); // Получаем 2D-контекст для рисования

// Устанавливаем размер canvas по ширине и высоте окна
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const columns = canvas.width / 20; // Количество колонок символов в анимации "Матрицы"
const drops = Array(Math.floor(columns)).fill(1); // Массив для отслеживания положения символов
const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // Набор символов для анимации "Матрицы"

function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)"; // Легкий черный фон с прозрачностью для плавного эффекта
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "cyan"; // Цвет символов
    ctx.font = "16px 'Share Tech Mono'"; // Шрифт символов

    for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)]; // Выбираем случайный символ
        ctx.fillText(text, i * 20, drops[i] * 20); // Рисуем символ в соответствующей колонке

        // Если достигли конца экрана, сбрасываем высоту случайным образом
        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 50); // Запускаем анимацию с интервалом 50 мс

// Обрабатываем изменение размеров окна, чтобы обновить размеры canvas
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});