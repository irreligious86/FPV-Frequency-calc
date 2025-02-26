class FPVChannelData {
    constructor() {
        this.data = null; // Данные загружаются динамически
    }

    // ✅ Загрузка JSON-данных
    async loadData() {
        try {
            const response = await fetch('/static/data/fpv_channels.json');
            this.data = await response.json();
            console.log("FPV Data Loaded:", this.data);
        } catch (error) {
            console.error("Error loading JSON:", error);
        }
    }

    // ✅ Получение списка типов модуляции (Analog / Digital)
    getModulationTypes() {
        return this.data ? Object.keys(this.data) : "Data not loaded";
    }

    // ✅ Получение списка диапазонов частот в зависимости от типа модуляции
    getBandRanges(modulationType) {
        if (!this.data || !this.data[modulationType]) return "Modulation type not found";
        return Object.keys(this.data[modulationType]);
    }

    // ✅ Получение списка бендов для конкретного диапазона частот
    getBandList(modulationType, frequencyBand) {
        if (!this.data || !this.data[modulationType] || !this.data[modulationType][frequencyBand]) {
            return "Band range not found";
        }
        return Object.keys(this.data[modulationType][frequencyBand]);
    }

    // ✅ Получение метаданных выбранного бенда (регион, ширина канала) и списка каналов с частотами
    getBandMetadata(modulationType, frequencyBand, bandName) {
        let bandData = this.data?.[modulationType]?.[frequencyBand]?.[bandName];
        return bandData ? {
            region: bandData.region || "Unknown",
            bandwidth: bandData.bandwidth || "Unknown",
            channels: bandData.channels || {}
        } : "Band not found";
    }

    // ✅ Получение списка каналов и их частот
    getChannelList(modulationType, frequencyBand, bandName) {
        let bandData = this.data?.[modulationType]?.[frequencyBand]?.[bandName]?.channels;
        return bandData ? bandData : "Band not found";
        }
}

// ✅ Создаем объект для работы с данными
const fpvDataManager = new FPVChannelData();


fpvDataManager.loadData().then(() => {
    console.log(fpvDataManager.getModulationTypes());
    console.log(fpvDataManager.getBandRanges("Analog"));
    console.log(fpvDataManager.getBandList("Analog", "5.8GHz"));
    console.log(fpvDataManager.getBandMetadata("Analog", "5.8GHz", "Band A (Boscam)"));
    console.log(fpvDataManager.getChannelList("Analog", "5.8GHz", "Band A (Boscam)"));
})


// FPV_Data
// │
// ├── Analog
// │   │
// │   ├── 5.8GHz
// │   │   │
// │   │   ├── Band A (Boscam)
// │   │   │   ├── region: "FCC/CE"
// │   │   │   ├── bandwidth: 20
// │   │   │   ├── channels
// │   │   │   │   ├── 1: 5865
// │   │   │   │   ├── 2: 5845
// │   │   │   │   ├── 3: 5825
// │   │   │   │   ├── 4: 5805
// │   │   │   │   ├── 5: 5785
// │   │   │   │   ├── 6: 5765
// │   │   │   │   ├── 7: 5745
// │   │   │   │   ├── 8: 5725
// │   │   │
// │   │   ├── Band B (Boscam)
// │   │   │   ├── region: "FCC"
// │   │   │   ├── bandwidth: 20
// │   │   │   ├── channels
// │   │   │       ├── 1: 5733
// │   │   │       ├── 2: 5752
// │   │   │       ├── 3: 5771
// │   │   │       ├── 4: 5790
// │   │   │       ├── 5: 5809
// │   │   │       ├── 6: 5828
// │   │   │       ├── 7: 5847
// │   │   │       ├── 8: 5866
// │   │   
// │   ├── 2.4GHz
// │   │   ├── Band X
// │   │   │   ├── region: "FCC"
// │   │   │   ├── bandwidth: 17
// │   │   │   ├── channels
// │   │   │       ├── 1: 2370
// │   │   │       ├── 2: 2390
// │   │   │       ├── 3: 2410
// │   │   │       ├── 4: 2430
// │   │   │       ├── 5: 2450
// │   │   │       ├── 6: 2470
// │   │   │       ├── 7: 2490
// │   │   │       ├── 8: 2510
// │   │
// │   ├── 1.3GHz
// │   │   ├── Band Y
// │   │       ├── region: "FCC"
// │   │       ├── bandwidth: 20
// │   │       ├── channels
// │   │           ├── 1: 1080
// │   │           ├── 2: 1120
// │   │           ├── 3: 1160
// │   │           ├── 4: 1200
// │   │           ├── 5: 1258
// │   │           ├── 6: 1280
// │   │           ├── 7: 1320
// │   │           ├── 8: 1360
// │   │
// │   ├── 900MHz
// │       ├── Band Z
// │           ├── region: "LBT"
// │           ├── bandwidth: 20
// │           ├── channels
// │               ├── 1: 900
// │               ├── 2: 910
// │               ├── 3: 920
// │               ├── 4: 930
// │               ├── 5: 940
// │
// └── Digital
//     │
//     ├── 5.8GHz
//     │   ├── DJI FCC Mode
//     │   │   ├── region: "FCC"
//     │   │   ├── bandwidth: 20
//     │   │   ├── channels
//     │   │       ├── 1: 5660
//     │   │       ├── 2: 5700
//     │   │       ├── 3: 5745
//     │   │       ├── 4: 5785
//     │   │       ├── 5: 5825
//     │   │       ├── 6: 5865
//     │   │       ├── 7: 5905
//     │   │       ├── 8: 5945
//     │   │
//     │   ├── DJI CE Mode
//     │       ├── region: "CE"
//     │       ├── bandwidth: 20
//     │       ├── channels
//     │           ├── 1: 5735
//     │           ├── 2: 5770
//     │           ├── 3: 5805
//     │           ├── 4: 5878
