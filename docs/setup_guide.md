# 🚀 Руководство по установке и запуску

## 📦 Установка проекта

### 1️⃣ Клонирование репозитория
```sh
git clone <repository_url>
cd fpv-freq-calc
```

### 2️⃣ Настройка виртуального окружения
```sh
python -m venv venv
source venv/Scripts/activate  # для Git Bash
# или
.\venv\Scripts\activate      # для Windows CMD
```

### 3️⃣ Установка зависимостей
```sh
pip install -r requirements.txt
```

## 🔥 Запуск проекта

### 1️⃣ Активация виртуального окружения
```sh
source venv/Scripts/activate  # для Git Bash
# или
.\venv\Scripts\activate      # для Windows CMD
```

### 2️⃣ Запуск Flask-сервера
Способ 1 (рекомендуемый):
```sh
python app.py
```

Способ 2 (альтернативный):
```sh
export FLASK_APP=app.py
export FLASK_ENV=development  # для режима отладки
flask run
```

Сервер будет доступен по адресу:
```
http://127.0.0.1:5000
```

## 🛠 Возможные проблемы и решения

### ❌ `flask: command not found`
```sh
pip install flask
```

### ❌ `ModuleNotFoundError: No module named 'flask'`
1. Проверьте активацию venv:
```sh
source venv/Scripts/activate
```
2. Переустановите зависимости:
```sh
pip install -r requirements.txt
```

### ❌ Проблемы с кодировкой в Windows
Добавьте в начало `app.py`:
```python
import sys
sys.stdout.reconfigure(encoding='utf-8')
```

### ❌ `flask run` зависает
Используйте прямой запуск:
```sh
python app.py
```

## 📝 Структура проекта
```
📂 fpv-freq-calc/
├── backend/
│   ├── app.py              # Flask-сервер
│   ├── fpv_logic/         # Логика анализа частот
│   │   ├── interference.py
│   │   ├── data_loader.py
│   │   └── ...
│   └── ...
├── static/                # Фронтенд файлы
│   ├── js/
│   └── css/
├── templates/            # HTML шаблоны
├── docs/                # Документация
└── requirements.txt     # Зависимости
```

## ✅ Проверка установки

1. Сервер запускается без ошибок
2. Открывается главная страница
3. В консоли браузера нет ошибок
4. Работает анализ частот

## 🔄 Обновление проекта

```sh
git pull                     # получить обновления
pip install -r requirements.txt  # обновить зависимости
``` 