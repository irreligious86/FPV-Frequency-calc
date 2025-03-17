import sys
import os

import os

print("FLASK_ENV:", os.getenv("FLASK_ENV"))
print("SECRET_KEY:", os.getenv("SECRET_KEY"))


# Чиним кодировку вывода, чтобы сервер не плевался от кириллических символов
sys.stdout.reconfigure(encoding='utf-8')  

from flask import Flask, jsonify, request, render_template, send_from_directory
from fpv_logic.data_loader import DataLoader
from fpv_logic.interference import InterferenceAnalyzer
from backend.config import Config  # Импортируем настройки


# 🏗️ Создаем Flask-приложение
# static_folder и template_folder вынесены на уровень выше, чтобы не путаться
app = Flask(__name__, static_folder="../static", template_folder="../templates")
app.config.from_object(Config)  # Применяем настройки


# 📥 Загружаем данные ОДИН раз за запуск сервера (иначе будет боль)
loader = DataLoader()
data = loader.get_data()
print("🔄 Данные загружены один раз и готовы к использованию.")

# ⚡ Создаем обработчик интерференции (проверяет, не будет ли помех на частотах)
interference_handler = InterferenceAnalyzer(data)

@app.route("/")
def index():
    """ Отдает клиенту главную HTML-страницу """
    return render_template("index.html")

@app.route("/api/data", methods=["GET"])
def get_full_data():
    """ ⚡ Отдает клиенту ВСЕ данные о частотах """
    return jsonify(data)

@app.route("/api/frequency", methods=["GET"])
def get_frequency():
    """ 🔍 Получает частоту по диапазону, группе и номеру канала """

    band = request.args.get("band")  # Группа (например, A, B, R)
    channel = request.args.get("channel")  # Номер канала (например, 1, 2, 3)
    range_name = request.args.get("range", "5.8GHz")  # Частотный диапазон, по умолчанию 5.8GHz

    # 🤦‍♂️ Если что-то не указали — выбрасываем ошибку
    if not band or not channel:
        return jsonify({"error": "Необходимо указать band и channel"}), 400

    try:
        # 📡 Достаём частоту из данных
        frequency = data["analog"][range_name][band]["channels"].get(channel)
    except KeyError:
        # ❌ Если частота не найдена — 404 и страдание
        return jsonify({"error": "Частота не найдена"}), 404

    # 🔥 Если всё ок — отправляем клиенту частоту и единицы измерения
    return jsonify({"frequency": frequency, "unit": "MHz"})

@app.route("/api/interference", methods=["GET"])
def analyze_interference():
    """ 📡 Анализирует перекрытие частот между каналами """

    modulation = request.args.get("modulation")  # Аналог или цифра
    range_name = request.args.get("range")  # Частотный диапазон
    band = request.args.get("band")  # Группа каналов
    selected_channel = request.args.get("channel")  # Выбранный канал

    # 🛑 Проверяем, что клиент не забыл передать параметры, иначе зачем сюда вообще лезть?
    if not modulation or not range_name or not band or not selected_channel:
        return jsonify({"error": "Необходимо указать modulation, range, band и channel"}), 400

    # 🔥 Отдаём клиенту результат анализа помех
    result = interference_handler.analyze_interference(modulation, range_name, band, selected_channel)
    return jsonify(result)

@app.route("/favicon.ico")
def favicon():
    """ 🖼️ Заглушка для favicon.ico, чтобы браузер не бесил 404-ошибками """
    return send_from_directory("../static/img", "favicon.ico", mimetype="image/x-icon")

# 🚀 Запуск сервера в режиме отладки
if __name__ == "__main__":
    app.run(debug=True)
