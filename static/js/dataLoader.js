export const DataLoader = {
    data: {},

    async loadData() {
        try {
            // Проверяем, есть ли данные в sessionStorage
            const cachedData = sessionStorage.getItem("fpvData");
            if (cachedData) {
                console.log("Данные загружены из sessionStorage");
                this.data = JSON.parse(cachedData);
                return this.data;
            }

            // Если данных нет, делаем запрос на сервер
            console.log("Запрос данных с сервера...");
            const response = await fetch("/api/data");
            this.data = await response.json();

            // Сохраняем в sessionStorage
            sessionStorage.setItem("fpvData", JSON.stringify(this.data));

            console.log("Данные загружены:", this.data);
            return this.data;
        } catch (error) {
            console.error("Ошибка загрузки данных:", error);
            return null;
        }
    }
};
