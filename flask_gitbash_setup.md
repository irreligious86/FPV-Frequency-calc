# 🔥 Инструкция по запуску Flask в Git Bash

## 1️⃣ Активируем виртуальное окружение
В Git Bash используется `source`, поэтому выполняем:
```sh
source venv/Scripts/activate
```
Теперь твой терминал должен отображать `(venv)` перед строкой команд.

---

## 2️⃣ Устанавливаем зависимости (если нужно)
Если зависимости ещё не установлены, выполняем:
```sh
pip install -r requirements.txt
```

---

## 3️⃣ Запускаем Flask-сервер
В Git Bash нужно явно указать переменную окружения `FLASK_APP`:
```sh
export FLASK_APP=app.py
export FLASK_ENV=development  # Для режима отладки (не обязательно)
flask run
```
Теперь сервер работает по адресу:
```
http://127.0.0.1:5000
```

---

## 4️⃣ Альтернативный запуск (если `flask run` не работает)
Если возникают ошибки, попробуй запустить сервер напрямую:
```sh
python app.py
```

---

## 🛠 Возможные ошибки и их решения
### ❌ `flask: command not found`
🔹 Установи Flask:
```sh
pip install flask
```

### ❌ `ModuleNotFoundError: No module named 'flask'`
🔹 Убедись, что активировано виртуальное окружение (`venv`):
```sh
source venv/Scripts/activate
```
🔹 Если ошибка остаётся, установи зависимости:
```sh
pip install -r requirements.txt
```

### ❌ `flask run` зависает без вывода
🔹 Запусти сервер напрямую:
```sh
python app.py
```

---

✅ Теперь у тебя есть удобная шпаргалка по запуску Flask-приложения в Git Bash! 🚀
