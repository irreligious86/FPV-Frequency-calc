class FrequencyFilter:
    def __init__(self, data):
        self.data = data
        
          # 🔍 Отладочный вывод
        print("DEBUG: Тип данных в self.data:", type(self.data))  # Покажет, список или словарь
        if isinstance(self.data, list):
            print("Данные загружены как список! Первые элементы:", self.data[:2])  # Покажет первые 2 элемента
        elif isinstance(self.data, dict):
            print("Данные загружены как словарь. Ключи:", list(self.data.keys()))  # Покажет доступные ключи

    def filter_by_region(self, region: str):
        """ Фильтрует частотные группы по региону (FCC, CE и т. д.). """
        return {
            rng: {
                band: details for band, details in bands.items() if details.get("region") == region
            }
            for rng, bands in self.data.items()
            if any(details.get("region") == region for details in bands.values())
        }

    def filter_by_modulation(self, modulation: str):
        """ Фильтрует частотные группы по модуляции (Analog/Digital). """
        return {
            rng: {
                band: details for band, details in bands.items() if details.get("modulation") == modulation
            }
            
            for rng, bands in self.data.items()
            if any(details.get("modulation") == modulation for details in bands.values())
        }

    def filter_by_bandwidth(self, bandwidth: int):
        """ Фильтрует частотные группы по ширине канала (например, 20 MHz). """
        return {
            rng: {
                band: details for band, details in bands.items() if details.get("bandwidth") == bandwidth
            }
            for rng, bands in self.data.items()
            if any(details.get("bandwidth") == bandwidth for details in bands.values())
        }
