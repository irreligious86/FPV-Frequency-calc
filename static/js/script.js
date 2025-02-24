const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const columns = canvas.width / 20;
const drops = Array(Math.floor(columns)).fill(1);
const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "cyan";
    ctx.font = "16px 'Share Tech Mono'";

    for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * 20, drops[i] * 20);

        if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 50);

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

/* Вращение пропеллеров вокруг центров моторов */
const propellers = [
    { element: document.getElementById("prop1"), cx: 70, cy: 70 },
    { element: document.getElementById("prop2"), cx: 230, cy: 70 },
    { element: document.getElementById("prop3"), cx: 70, cy: 230 },
    { element: document.getElementById("prop4"), cx: 230, cy: 230 }
];

let angle = 0;

function rotatePropellers() {
    angle += 10;
    propellers.forEach(prop => {
        prop.element.setAttribute("transform", `rotate(${angle} ${prop.cx} ${prop.cy})`);
    });
}

setInterval(rotatePropellers, 50);

// Доступные каналы для каждого бенда
const bandChannels = {
    "A": [1, 2, 3, 4, 5, 6, 7, 8],
    "B": [1, 2, 3, 4, 5, 6, 7, 8],
    "E": [1, 2, 3, 4, 5, 6, 7, 8],
    "F": [1, 2, 3, 4, 5, 6, 7, 8],
    "R": [1, 2, 3, 4, 5, 6, 7, 8],
    "L": [1, 2, 3, 4, 5, 6, 7, 8]
};

// Функция для обновления списка каналов
function updateChannels() {
    const bandSelect = document.getElementById("bandSelect");
    const channelSelect = document.getElementById("channelSelect");

    // Очищаем список каналов
    channelSelect.innerHTML = "";

    if (bandSelect.value === "") {
        // Если бенд не выбран, список отключен
        channelSelect.disabled = true;
        channelSelect.innerHTML = "<option value=''>Выберите бенд</option>";
    } else {
        // Включаем список и добавляем каналы для выбранного бенда
        channelSelect.disabled = false;
        bandChannels[bandSelect.value].forEach(channel => {
            const option = document.createElement("option");
            option.value = channel;
            option.textContent = `Channel ${channel}`;
            channelSelect.appendChild(option);
        });
    }
}
