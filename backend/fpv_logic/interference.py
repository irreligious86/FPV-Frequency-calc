class InterferenceAnalyzer:
    def __init__(self, data):
        self.data = data

    def get_frequency(self, band: str, channel: str, range_name: str = "5.8GHz") -> float:
        """ Получает частоту по диапазону, группе и номеру канала. """
        return (
            self.data.get(range_name, {})
            .get(band, {})
            .get("channels", {})
            .get(channel)
        )

    def analyze_interference(self, range_name: str, band: str, selected_channel: str):
        """ Анализирует возможное пересечение каналов """
        if range_name not in self.data or band not in self.data[range_name]:
            return {"error": "Диапазон или группа не найдены"}
        
        channels = self.data[range_name][band]["channels"]
        bandwidth = self.data[range_name][band].get("bandwidth", 20)
        selected_freq = channels.get(selected_channel)

        if not selected_freq:
            return {"error": "Выбранный канал отсутствует"}

        selected_min = selected_freq - bandwidth / 2
        selected_max = selected_freq + bandwidth / 2

        results = []
        for ch, freq in channels.items():
            if ch == selected_channel:
                category = "Исходный канал"
            else:
                ch_min = freq - bandwidth / 2
                ch_max = freq + bandwidth / 2
                overlap = max(0, min(selected_max, ch_max) - max(selected_min, ch_min))
                overlap_percent = (overlap / bandwidth) * 100

                if overlap_percent >= 10:
                    category = "🔴 Полное перекрытие"
                elif overlap_percent > 0:
                    category = "🟠 Частичное перекрытие"
                elif abs(freq - selected_freq) <= 0.5 * bandwidth:
                    category = "🟡 Близкое расположение"
                else:
                    category = "⚪ Безопасный канал"

            results.append({"channel": ch, "frequency": freq, "category": category})

        return sorted(results, key=lambda x: x["frequency"])
 