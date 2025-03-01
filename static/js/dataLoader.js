let cachedData = null;

export async function getChannelsData() {
    if (!cachedData) {
        console.log("Загружаем данные с сервера...");
        const response = await fetch('/get_channels');
        cachedData = await response.json();
        console.log("Данные загружены:", cachedData);
    }
    return cachedData;
}
