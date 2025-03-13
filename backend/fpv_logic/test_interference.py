import pytest
from .interference import InterferenceAnalyzer

# Тестовые данные - частоты для разных каналов
TEST_DATA = {
    "analog": {
        "5.8GHz": {
            "R": {
                "channels": {
                    "1": 5658,
                    "2": 5695,
                    "3": 5732,
                    "4": 5769,
                    "5": 5806,
                    "6": 5843,
                    "7": 5880,
                    "8": 5917
                }
            },
            "F": {
                "channels": {
                    "1": 5740,
                    "2": 5760,
                    "3": 5780,
                    "4": 5800,
                    "5": 5820,
                    "6": 5840,
                    "7": 5860,
                    "8": 5880
                }
            }
        }
    }
}

@pytest.fixture
def analyzer():
    return InterferenceAnalyzer(TEST_DATA)

def test_catastrophic_channel_selection(analyzer):
    """
    Тест на полный провал - когда пилоты выбирают соседние каналы 
    как будто это места в маршрутке 🚌
    """
    channels = [
        {"band": "R", "channel": "1"},  # 5658
        {"band": "R", "channel": "2"},  # 5695
        {"band": "R", "channel": "3"},  # 5732
    ]
    
    result = analyzer.analyze_group_interference(channels)
    
    # Выводим отладочную информацию
    print("\nDEBUG INFO:")
    print(f"Min safe distance: {result['analysis']['debug']['min_safe_distance']} MHz")
    print(f"High threshold: {result['analysis']['debug']['high_threshold']}%")
    print(f"Max interference: {result['analysis']['max_interference']}%")
    print("\nChannel pairs:")
    for pair in result["analysis"]["debug"]["all_pairs"]:
        print(f"{pair['ch1']} -> {pair['ch2']}: {pair['separation']} MHz, {pair['interference']}% interference")
    
    # Проверяем, что это действительно катастрофа 🔥
    assert result["analysis"]["safe_separation"] == False
    assert result["analysis"]["max_interference"] > 40
    assert len(result["critical_pairs"]) > 0

def test_smart_channel_selection(analyzer):
    """
    Тест на умное распределение каналов - 
    когда пилоты не спят на лекциях по радиотехнике 📚
    """
    channels = [
        {"band": "R", "channel": "1"},  # 5658
        {"band": "R", "channel": "4"},  # 5769
        {"band": "R", "channel": "7"},  # 5880
    ]
    
    result = analyzer.analyze_group_interference(channels)
    
    # Проверяем, что всё красиво 🌈
    assert result["analysis"]["safe_separation"] == True
    assert result["analysis"]["max_interference"] < 25
    assert len(result["critical_pairs"]) == 0

def test_imd_nightmare(analyzer):
    """
    Тест на коварные интермодуляционные искажения -
    когда частоты кажутся нормальными, но IMD устраивает вечеринку 🎉
    """
    channels = [
        {"band": "F", "channel": "2"},  # 5760
        {"band": "F", "channel": "4"},  # 5800
        {"band": "F", "channel": "6"},  # 5840
    ]
    
    result = analyzer.analyze_group_interference(channels)
    
    # Проверяем, что IMD продукты обнаружены
    for channel in result["channels"]:
        assert len(channel["imd_products"]) > 0
        
    # И они создают проблемы
    assert result["analysis"]["max_interference"] > 15

def test_mixed_bands_wisdom(analyzer):
    """
    Тест на смешивание бандов - 
    когда пилоты знают, что R не только для гонок 🏁
    """
    channels = [
        {"band": "R", "channel": "2"},  # 5695
        {"band": "F", "channel": "4"},  # 5800
        {"band": "R", "channel": "6"},  # 5843
    ]
    
    result = analyzer.analyze_group_interference(channels)
    
    # Выводим отладочную информацию
    print("\nDEBUG INFO:")
    print(f"Min safe distance: {result['analysis']['debug']['min_safe_distance']} MHz")
    print(f"High threshold: {result['analysis']['debug']['high_threshold']}%")
    print(f"Max interference: {result['analysis']['max_interference']}%")
    print("\nChannel pairs:")
    for pair in result["analysis"]["debug"]["all_pairs"]:
        print(f"{pair['ch1']} -> {pair['ch2']}: {pair['separation']} MHz, {pair['interference']}% interference")
    
    # Проверяем, что смешивание бандов работает
    assert result["analysis"]["safe_separation"] == True
    assert result["analysis"]["max_interference"] < 30

def test_power_ratio_physics(analyzer):
    """
    Тест на физику затухания сигнала -
    потому что законы физики еще никто не отменял 🔬
    """
    # Проверяем затухание на разных расстояниях
    ratio_close = analyzer.calculate_power_ratio(5800, 5820)
    ratio_medium = analyzer.calculate_power_ratio(5800, 5860)
    ratio_far = analyzer.calculate_power_ratio(5800, 5945)
    
    # Чем дальше, тем слабее помехи
    assert ratio_close > ratio_medium > ratio_far
    assert ratio_far < 0.1  # На большом расстоянии помехи минимальны 