import numpy as np
from scipy import stats

def run_friedman_test(models_fold_scores: dict, alpha: float = 0.05) -> dict:
    """
    Prueba de Friedman para comparar el desempeño de los 5 modelos sobre los mismos 10 folds.
    models_fold_scores: {'Random Forest': [f1_fold1, f1_fold2, ...], 'SVM': [...], ...}
    """
    model_names = list(models_fold_scores.keys())
    data_matrix = np.array([models_fold_scores[name] for name in model_names]) # shape (n_models, n_folds)
    
    # scipy.stats.friedmanchisquare toma cada modelo como una muestra (o transponemos según scipy)
    stat, p_value = stats.friedmanchisquare(*data_matrix)
    
    is_significant = p_value < alpha
    interpretation = (
        f"Existe una diferencia estadísticamente significativa en el rendimiento de los modelos (p = {p_value:.4e} < {alpha}). "
        "Se justifica la aplicación de pruebas post-hoc (Nemenyi / Wilcoxon)."
        if is_significant else
        f"No se observaron diferencias estadísticamente significativas entre los modelos (p = {p_value:.4f} >= {alpha})."
    )
    
    return {
        'test': 'Friedman Test',
        'statistic': round(float(stat), 4),
        'p_value': float(p_value),
        'alpha': alpha,
        'is_significant': bool(is_significant),
        'interpretation': interpretation
    }
