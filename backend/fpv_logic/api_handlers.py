from typing import Dict, List
from .interference import InterferenceAnalyzer

def calculate_interference(selected_channels: List[Dict], unselected_channel: Dict) -> Dict:
    """
    Рассчитывает интерференцию для одного канала относительно выбранных каналов.
    
    Args:
        selected_channels: Список выбранных каналов с их частотами и параметрами
        unselected_channel: Канал для проверки интерференции
    
    Returns:
        Dict с уровнем интерференции и деталями
    """
    # Получаем частоты выбранных каналов
    selected_frequencies = [float(ch['frequency']) for ch in selected_channels]
    target_frequency = float(unselected_channel['frequency'])
    
    # Создаем экземпляр анализатора
    analyzer = InterferenceAnalyzer({})  # Пустой словарь, так как нам не нужны данные о каналах
    
    # Рассчитываем интерференцию
    interference_result = analyzer.calculate_total_interference(target_frequency, selected_frequencies)
    
    # Определяем уровень на основе risk_level
    level_map = {
        'none': 'none',
        'low': 'low',
        'medium': 'medium',
        'medium-high': 'medium',
        'critical': 'high'
    }
    
    return {
        'level': level_map[interference_result['risk_level']],
        'details': {
            'totalInterference': interference_result['total_percent'],
            'directInterference': interference_result['direct_interference'],
            'imdInterference': interference_result['imd_interference'],
            'imdFrequencies': interference_result['imd_frequencies'],
            'debug': interference_result['debug']
        }
    }

def calculate_bulk_interference(selected_channels: List[Dict], unselected_channels: List[Dict]) -> List[Dict]:
    """
    Рассчитывает интерференцию для множества каналов.
    
    Args:
        selected_channels: Список выбранных каналов
        unselected_channels: Список каналов для проверки
    
    Returns:
        Список результатов для каждого канала
    """
    return [
        calculate_interference(selected_channels, channel)
        for channel in unselected_channels
    ] 