from flask import Flask, jsonify
import json

app = Flask(__name__)

# Открываем JSON и загружаем его в переменную
with open("static/data/channels.json", "r", encoding="utf-8") as file:
    CHANNELS_DATA = json.load(file)  # Было json.loads(file) — ошибка!

@app.route('/get_channels')
def get_channels():
    """Отдаёт JSON-данные"""
    return jsonify(CHANNELS_DATA)

if __name__ == '__main__':
    app.run(debug=True)
