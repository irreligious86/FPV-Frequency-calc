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

// 📌 ❗ Возможно, этот фрагмент кода не используется и его можно удалить:
// bandChannels не используется в коде. Если он не планируется использовать, можно удалить его.
const bandChannels = {
    "A": [1, 2, 3, 4, 5, 6, 7, 8],
    "B": [1, 2, 3, 4, 5, 6, 7, 8],
    "E": [1, 2, 3, 4, 5, 6, 7, 8],
    "F": [1, 2, 3, 4, 5, 6, 7, 8],
    "R": [1, 2, 3, 4, 5, 6, 7, 8],
    "L": [1, 2, 3, 4, 5, 6, 7, 8]
};

function updateChannels() {
    const bandSelect = document.getElementById("bandSelect");
    const channelSelect = document.getElementById("channelSelect");
    channelSelect.innerHTML = "";
    if (bandSelect.value === "") {
        channelSelect.disabled = true;
        channelSelect.innerHTML = "<option value=''>Выберите бенд</option>";
    } else {
        channelSelect.disabled = false;
        bandChannels[bandSelect.value].forEach(channel => {
            const option = document.createElement("option");
            option.value = channel;
            option.textContent = `Channel ${channel}`;
            channelSelect.appendChild(option);
        });
    }
}
