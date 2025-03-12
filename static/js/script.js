import { DataLoader } from "./dataLoader.js";

document.addEventListener("DOMContentLoaded", async () => {
    const data = await DataLoader.loadData();
    if (data) {
        console.log("Данные готовы к использованию:", data);
    } else {
        console.error("Ошибка загрузки данных!");
    }
});
