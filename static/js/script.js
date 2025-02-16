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
