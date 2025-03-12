import json
import os

class DataLoader:
    def __init__(self, json_path="backend/data/channels.json"):
        self.json_path = json_path
        self.data = self._load_json()

    def _load_json(self):
        """Загружает JSON с частотами."""
        try:
            with open(self.json_path, "r", encoding="utf-8") as file:
                return json.load(file)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Ошибка загрузки JSON: {e}")
            return {}

    def get_data(self):
        """Возвращает загруженные данные."""
        return self.data
