import sys
import os
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from flask import Flask, jsonify, request, render_template
from fpv_logic.data_loader import DataLoader
from fpv_logic.frequency_filter import FrequencyFilter
from fpv_logic.interference import InterferenceAnalyzer

# Создание Flask-приложения
app = Flask(__name__, static_folder="../static", template_folder="../templates")

# Загружаем данные
loader = DataLoader()
data = loader.get_data()

# Создаем обработчики
filter_handler = FrequencyFilter(data)
interference_handler = InterferenceAnalyzer(data)

@app.route("/")
def index():
    """ Отдает HTML-страницу клиенту """
    return render_template("index.html")

@app.route("/api/data", methods=["GET"])
def get_full_data():
    """ Отдает весь JSON-файл клиенту """
    return jsonify(data)

@app.route("/api/filters/region", methods=["GET"])
def filter_by_region():
    """ Фильтрует данные по региону (FCC, CE и т. д.) """
    region = request.args.get("region")
    if not region:
        return jsonify({"error": "Укажите параметр region"}), 400
    return jsonify(filter_handler.filter_by_region(region))

@app.route("/api/filters/modulation", methods=["GET"])
def filter_by_modulation():
    """ Фильтрует данные по типу модуляции (Analog/Digital) """
    modulation = request.args.get("modulation")
    if not modulation:
        return jsonify({"error": "Укажите параметр modulation"}), 400
    return jsonify(filter_handler.filter_by_modulation(modulation))

@app.route("/api/filters/bandwidth", methods=["GET"])
def filter_by_bandwidth():
    """ Фильтрует данные по ширине полосы (например, 20 MHz) """
    try:
        bandwidth = int(request.args.get("bandwidth"))
    except (TypeError, ValueError):
        return jsonify({"error": "bandwidth должен быть числом"}), 400
    return jsonify(filter_handler.filter_by_bandwidth(bandwidth))

@app.route("/api/frequency", methods=["GET"])
def get_frequency():
    """ Получает частоту по диапазону, группе и номеру канала """
    band = request.args.get("band")
    channel = request.args.get("channel")
    range_name = request.args.get("range", "5.8GHz")

    if not band or not channel:
        return jsonify({"error": "Необходимо указать band и channel"}), 400

    frequency = interference_handler.get_frequency(band, channel, range_name)
    if frequency:
        return jsonify({"frequency": frequency, "unit": "MHz"})
    else:
        return jsonify({"error": "Частота не найдена"}), 404

@app.route("/api/interference", methods=["GET"])
def analyze_interference():
    """ Анализирует перекрытие частот между каналами """
    range_name = request.args.get("range", "5.8GHz")
    band = request.args.get("band")
    channel = request.args.get("channel")

    if not band or not channel:
        return jsonify({"error": "Необходимо указать band и channel"}), 400
    
    result = interference_handler.analyze_interference(range_name, band, channel)
    return jsonify(result)

@app.route("/favicon.ico")
def favicon():
    """ Заглушка для favicon.ico, чтобы избежать ошибки 404 """
    return "", 204  # Код 204 - "Нет содержимого"

if __name__ == "__main__":
    app.run(debug=True)
