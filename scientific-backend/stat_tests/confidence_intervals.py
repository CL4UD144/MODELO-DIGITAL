import numpy as np
from scipy import stats

def calculate_confidence_intervals(scores: list, confidence: float = 0.95) -> dict:
    """
    Calcula Intervalo de Confianza del 95% para métricas evaluadas sobre los 10 folds.
    """
    arr = np.array(scores)
    mean = float(np.mean(arr))
    std_dev = float(np.std(arr, ddof=1))
    n = len(arr)
    
    stderr = std_dev / np.sqrt(n)
    margin = stderr * stats.t.ppf((1 + confidence) / 2.0, df=n-1)
    
    ci_lower = max(0.0, mean - margin)
    ci_upper = min(1.0, mean + margin) if mean <= 1.0 else mean + margin
    
    return {
        'mean': round(mean, 4),
        'std_dev': round(std_dev, 4),
        'ci_95_lower': round(ci_lower, 4),
        'ci_95_upper': round(ci_upper, 4),
        'margin_error': round(margin, 4)
    }
