import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "default_secret_key")  # Получаем из переменных окружения

    # Можно добавить другие настройки, например:
    DEBUG = os.getenv("FLASK_ENV") == "development"

# Flask будет использовать эти настройки
