from flask import Flask, render_template, jsonify
import json

app = Flask(__name__)

@app.route('/')
def home():
    return render_template('index.html')

# # Кешируем JSON при старте сервера
# with open("static/data/channels.json", "r", encoding="utf-8") as file:
#     CHANNELS_DATA = json.loads(file)

# @app.route('/get_channels')
# def get_channels():
#     """Отдаёт JSON-данные"""
#     return jsonify(CHANNELS_DATA)

if __name__ == '__main__':
    app.run(debug=True)
