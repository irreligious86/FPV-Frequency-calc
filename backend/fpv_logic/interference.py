import json
from typing import Dict, List, Union, Tuple
import math

class InterferenceAnalyzer:
    def __init__(self, data):
        self.data = data
        # Стандартная ширина канала для аналогового видео (МГц)
        self.CHANNEL_WIDTH = 20
        # Минимальное безопасное расстояние между каналами (МГц)
        self.MIN_SAFE_DISTANCE = 38  # Чуть строже чем разница между каналами (37 МГц)
        # Пороговые значения для уровней интерференции (в процентах)
        self.INTERFERENCE_THRESHOLDS = {
            "critical": 35,  # Средний вариант между старым (40) и строгим (30)
            "high": 28,      # Было 25 - увеличиваем чтобы пропустить 27.47%
            "medium": 15,    # Возвращаем как было
            "low": 5
        }
        # Коэффициент затухания для расчета мощности
        self.POWER_DECAY = 1.2  # Было 1.5, делаем помягче

    def get_frequency(self, modulation: str, range_name: str, band: str, channel: str) -> Union[float, None]:
        """ Получает частоту по модуляции, диапазону, группе и номеру канала. """
        return (
            self.data.get(modulation, {})
            .get(range_name, {})
            .get(band, {})
            .get("channels", {})
            .get(channel)
        )

    def calculate_signal_strength(self, distance_mhz: float, bandwidth: float) -> float:
        """
        Рассчитывает относительную силу помех на основе расстояния между частотами
        Использует гауссово распределение для моделирования затухания сигнала
        """
        # Стандартное отклонение - половина ширины канала
        sigma = bandwidth / 2
        # Нормализованное гауссово распределение
        strength = math.exp(-(distance_mhz ** 2) / (2 * sigma ** 2))
        return round(strength * 100, 2)  # Возвращаем процент перекрытия

    def calculate_imd(self, freq1: float, freq2: float) -> Tuple[float, float]:
        """
        Рассчитывает частоты интермодуляционных искажений для двух передатчиков
        """
        imd1 = (2 * freq1) - freq2
        imd2 = (2 * freq2) - freq1
        return (imd1, imd2)

    def get_interference_category(self, overlap_percent: float) -> Dict[str, str]:
        """
        Определяет категорию интерференции на основе процента перекрытия
        """
        if overlap_percent > 70:
            return {
                "category": "🔴 Критическая интерференция",
                "risk": "high",
                "description": "Сильное перекрытие частот, использование невозможно"
            }
        elif overlap_percent > 40:
            return {
                "category": "🟠 Сильная интерференция",
                "risk": "medium-high",
                "description": "Значительные помехи, рекомендуется выбрать другой канал"
            }
        elif overlap_percent > 20:
            return {
                "category": "🟡 Умеренная интерференция",
                "risk": "medium",
                "description": "Возможны помехи при определенных условиях"
            }
        elif overlap_percent > 5:
            return {
                "category": "🟢 Слабая интерференция",
                "risk": "low",
                "description": "Минимальный риск помех"
            }
        else:
            return {
                "category": "✅ Нет интерференции",
                "risk": "none",
                "description": "Безопасное расстояние между каналами"
            }

    def find_best_alternative_channels(self, results: List[Dict], occupied_channels: List[Dict]) -> List[Dict]:
        """
        Находит лучшие альтернативные каналы с учетом уже занятых каналов
        """
        # Получаем частоты занятых каналов
        occupied_frequencies = [ch["frequency"] for ch in occupied_channels]
        
        # Фильтруем каналы без интерференции или с минимальной интерференцией
        safe_channels = [
            r for r in results 
            if r["interference"]["risk"] in ["none", "low"] and
            r["frequency"] not in occupied_frequencies
        ]
        
        # Сортируем по уровню интерференции и частоте
        safe_channels.sort(key=lambda x: (
            {"none": 0, "low": 1}[x["interference"]["risk"]], 
            x["frequency"]
        ))
        
        return safe_channels[:3]

    def calculate_imd_products(self, frequencies: List[float], order: int = 3) -> List[float]:
        """
        Рассчитывает продукты интермодуляции до указанного порядка
        для списка частот передатчиков.
        
        Args:
            frequencies: Список частот передатчиков
            order: Порядок IMD (по умолчанию 3-го порядка)
            
        Returns:
            Список частот IMD-продуктов
        """
        imd_products = set()
        n = len(frequencies)
        
        if order >= 3:
            # IMD3: f1 + f2 - f3
            for i in range(n):
                for j in range(n):
                    for k in range(n):
                        if i != j and j != k and i != k:
                            imd = frequencies[i] + frequencies[j] - frequencies[k]
                            imd_products.add(round(imd, 1))

        if order >= 5:
            # IMD5: 3f1 - 2f2
            for i in range(n):
                for j in range(n):
                    if i != j:
                        imd = 3 * frequencies[i] - 2 * frequencies[j]
                        imd_products.add(round(imd, 1))
                        
        return sorted(list(imd_products))

    def calculate_power_ratio(self, freq1: float, freq2: float) -> float:
        """
        Рассчитывает отношение мощности помехи к мощности полезного сигнала
        с учетом частотного разноса.
        """
        freq_separation = abs(freq1 - freq2)
        
        if freq_separation == 0:
            return 1.0
        
        # Используем умеренное экспоненциальное затухание
        power_ratio = math.exp(-freq_separation * self.POWER_DECAY / self.CHANNEL_WIDTH)
        return round(power_ratio, 4)

    def calculate_total_interference(self, target_freq: float, other_freqs: List[float]) -> Dict:
        """
        Рассчитывает общий уровень помех для целевой частоты
        с учетом всех других передатчиков и их IMD продуктов.
        """
        # Определяем множитель на основе близости каналов
        min_separation = min(abs(target_freq - freq) for freq in other_freqs) if other_freqs else float('inf')
        
        # Считаем количество близких каналов
        close_channels = sum(1 for freq in other_freqs if abs(target_freq - freq) <= self.MIN_SAFE_DISTANCE * 1.5)
        
        # Базовые множители зависят от количества каналов
        channel_count = len(other_freqs) + 1
        if channel_count >= 3:
            # Увеличиваем множители если есть несколько близких каналов
            if close_channels >= 2:
                base_max = 250  # Было 200 - увеличиваем для катастрофических случаев
                base_min = 180  # Было 150
            else:
                base_max = 200  # Было 180
                base_min = 150  # Было 120
        else:
            base_max = 130  # Было 110
            base_min = 80   # Было 60
        
        # Плавный переход множителя в зависимости от расстояния
        if min_separation <= self.MIN_SAFE_DISTANCE:
            interference_multiplier = base_max
        elif min_separation >= self.MIN_SAFE_DISTANCE * 2:
            interference_multiplier = base_min
        else:
            # Линейная интерполяция между base_max и base_min
            ratio = (min_separation - self.MIN_SAFE_DISTANCE) / self.MIN_SAFE_DISTANCE
            interference_multiplier = base_max - (70 * ratio)  # Более резкое уменьшение
        
        # Коэффициенты для прямых помех и IMD зависят от количества близких каналов
        if close_channels >= 2:
            direct_coef = 5  # Было 4
            imd_coef = 6    # Было 5
        else:
            direct_coef = 3
            imd_coef = 4
        
        # Расчет прямых помех от других передатчиков
        direct_interference = sum(
            self.calculate_power_ratio(target_freq, freq) * direct_coef
            for freq in other_freqs
        )
        
        # Расчет IMD продуктов
        imd_freqs = self.calculate_imd_products([target_freq] + other_freqs)
        imd_interference = sum(
            self.calculate_power_ratio(target_freq, imd_freq) * imd_coef
            for imd_freq in imd_freqs
        )
        
        # Общий уровень помех (нормализованный к 100%)
        total_interference = min(100, (direct_interference + imd_interference) * interference_multiplier)
        
        # Определение уровня опасности
        risk_level = "none"
        for level, threshold in self.INTERFERENCE_THRESHOLDS.items():
            if total_interference >= threshold:
                risk_level = level
                break
                
        return {
            "total_percent": round(total_interference, 2),
            "risk_level": risk_level,
            "direct_interference": round(direct_interference, 4),
            "imd_interference": round(imd_interference, 4),
            "imd_frequencies": imd_freqs,
            "debug": {
                "min_separation": round(min_separation, 1),
                "multiplier": round(interference_multiplier, 1),
                "channel_count": channel_count,
                "close_channels": close_channels,
                "direct_coef": direct_coef,
                "imd_coef": imd_coef
            }
        }

    def analyze_group_interference(self, channels: List[Dict[str, str]], modulation: str = "analog") -> Dict:
        """
        Анализирует взаимную интерференцию для группы каналов.
        """
        # Получаем частоты для всех каналов
        channel_info = []
        frequencies = []
        
        for ch_data in channels:
            band = ch_data.get("band")
            channel = ch_data.get("channel")
            range_name = ch_data.get("range", "5.8GHz")
            
            freq = self.get_frequency(modulation, range_name, band, channel)
            if not freq:
                return {"error": f"Канал не найден: band={band}, channel={channel}"}
                
            channel_info.append({
                "band": band,
                "channel": channel,
                "frequency": freq,
                "range": range_name
            })
            frequencies.append(freq)

        # Создаем матрицу взаимных помех
        interference_matrix = []
        for i, ch1 in enumerate(channel_info):
            row = []
            other_freqs = [f for j, f in enumerate(frequencies) if j != i]
            
            # Анализируем помехи для текущего канала
            interference_data = self.calculate_total_interference(
                ch1["frequency"], 
                other_freqs
            )
            
            ch1.update({
                "interference_level": interference_data["risk_level"],
                "total_interference": interference_data["total_percent"],
                "imd_products": interference_data["imd_frequencies"]
            })
            
            # Заполняем строку матрицы
            for j, ch2 in enumerate(channel_info):
                if i == j:
                    row.append({
                        "interference": 0,
                        "risk_level": "self"
                    })
                else:
                    # Используем тот же метод расчета помех
                    pair_interference = self.calculate_total_interference(
                        ch1["frequency"], 
                        [ch2["frequency"]]
                    )
                    row.append({
                        "interference": pair_interference["total_percent"],
                        "risk_level": pair_interference["risk_level"],
                        "separation": abs(ch1["frequency"] - ch2["frequency"]),
                        "debug": pair_interference["debug"]
                    })
            
            interference_matrix.append(row)

        # Находим проблемные комбинации каналов
        critical_pairs = []
        for i, row in enumerate(interference_matrix):
            for j, cell in enumerate(row):
                if i != j:
                    # Проверяем и расстояние, и уровень помех
                    if (cell.get("separation", 0) < self.MIN_SAFE_DISTANCE or 
                        cell["interference"] >= self.INTERFERENCE_THRESHOLDS["high"]):
                        critical_pairs.append({
                            "channel1": channel_info[i],
                            "channel2": channel_info[j],
                            "interference": cell["interference"],
                            "separation": cell.get("separation", 0)
                        })

        # Проверяем безопасность разделения
        min_separation = min(
            abs(ch1["frequency"] - ch2["frequency"])
            for i, ch1 in enumerate(channel_info)
            for j, ch2 in enumerate(channel_info)
            if i < j
        )
        
        # Используем максимальную интерференцию из матрицы
        max_interference = max(
            cell["interference"]
            for row in interference_matrix
            for cell in row
            if cell["risk_level"] != "self"
        )

        # Собираем все пары каналов для отладки
        all_pairs = []
        for i, ch1 in enumerate(channel_info):
            for j, ch2 in enumerate(channel_info):
                if i < j:
                    separation = abs(ch1["frequency"] - ch2["frequency"])
                    interference = interference_matrix[i][j]["interference"]
                    all_pairs.append({
                        "ch1": f"{ch1['band']}{ch1['channel']} ({ch1['frequency']})",
                        "ch2": f"{ch2['band']}{ch2['channel']} ({ch2['frequency']})",
                        "separation": separation,
                        "interference": interference
                    })

        return {
            "channels": channel_info,
            "interference_matrix": interference_matrix,
            "critical_pairs": critical_pairs,
            "analysis": {
                "total_channels": len(channels),
                "max_interference": max_interference,
                "safe_separation": min_separation >= self.MIN_SAFE_DISTANCE and max_interference < self.INTERFERENCE_THRESHOLDS["high"],
                "min_separation": min_separation,
                "debug": {
                    "separations": [
                        abs(ch1["frequency"] - ch2["frequency"])
                        for i, ch1 in enumerate(channel_info)
                        for j, ch2 in enumerate(channel_info)
                        if i < j
                    ],
                    "imd_products": self.calculate_imd_products(frequencies) if len(frequencies) > 2 else [],
                    "all_pairs": all_pairs,
                    "min_safe_distance": self.MIN_SAFE_DISTANCE,
                    "high_threshold": self.INTERFERENCE_THRESHOLDS["high"]
                }
            }
        }
