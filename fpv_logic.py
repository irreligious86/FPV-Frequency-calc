import json

class FPVFrequencyCalc:
    def __init__(self, json_path="data/channels.json"):
        self.json_path = json_path
        self.data = self._load_json()

    def _load_json(self):
        """ Загружает JSON с частотами. """
        try:
            with open(self.json_path, "r", encoding="utf-8") as file:
                return json.load(file)
        except (FileNotFoundError, json.JSONDecodeError):
            print("Ошибка: проблемы с файлом JSON.")
            return {}

    def get_frequency(self, band: str, channel: str, range_name: str = "5.8GHz") -> float:
        """ Получает частоту по диапазону, группе и номеру канала. """
        try:
            return self.data[range_name][band]["channels"].get(channel)
        except KeyError:
            return None

    def filter_by_region(self, region: str):
        """ Фильтрует частотные группы по региону (FCC, CE и т. д.). """
        result = {rng: {band: details for band, details in bands.items() if details.get("region") == region}
                  for rng, bands in self.data.items() if any(details.get("region") == region for details in bands.values())}
        return result

    def filter_by_modulation(self, modulation: str):
        """ Фильтрует частотные группы по модуляции (Analog/Digital). """
        result = {rng: {band: details for band, details in bands.items() if details.get("modulation") == modulation}
                  for rng, bands in self.data.items() if any(details.get("modulation") == modulation for details in bands.values())}
        return result

    def filter_by_bandwidth(self, bandwidth: int):
        """ Фильтрует частотные группы по ширине канала (например, 20 MHz). """
        result = {rng: {band: details for band, details in bands.items() if details.get("bandwidth") == bandwidth}
                  for rng, bands in self.data.items() if any(details.get("bandwidth") == bandwidth for details in bands.values())}
        return result
