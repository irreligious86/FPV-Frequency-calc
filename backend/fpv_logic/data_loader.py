import json
import os

class DataLoader:
    _cached_data = None  # Статическая переменная для хранения загруженных данных

    def __init__(self, json_path="backend/data/channels.json"):
        self.json_path = json_path

        # Если данные еще не загружены - загружаем
        if DataLoader._cached_data is None:
            DataLoader._cached_data = self._load_json()
            print("✅ Данные загружены и сохранены в памяти сервера.")

    def _load_json(self):
        """Загружает JSON с частотами (только один раз за запуск сервера)."""
        try:
            with open(self.json_path, "r", encoding="utf-8") as file:
                return json.load(file)  # Читает и конвертирует JSON в словарь
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"❌ Ошибка загрузки JSON: {e}")
            return {}

    def get_data(self):
        """Возвращает данные из кэша (не загружает файл повторно)."""
        return DataLoader._cached_data
