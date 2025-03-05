from flask import Flask, render_template, jsonify
import json

app = Flask(__name__)

# Функция безопасной загрузки JSON
def load_json():
    try:
        with open("static/data/channels.json", "r", encoding="utf-8") as file:
            return json.load(file)  # Читаем JSON
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Ошибка загрузки JSON: {e}")
        return {"error": "Ошибка загрузки JSON"}  # Возвращаем безопасный ответ

@app.route('/')
def home():
    """Главная страница (рендерит HTML)"""
    return render_template('index.html')

@app.route('/get_channels')
def get_channels():
    """API для получения каналов"""
    return jsonify(load_json())

if __name__ == '__main__':
    app.run(debug=True)
