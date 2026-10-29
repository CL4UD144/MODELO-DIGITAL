import numpy as np
from statsmodels.stats.contingency_tables import mcnemar

def run_mcnemar_test(y_true: list, preds_model_a: list, preds_model_b: list, name_a: str, name_b: str) -> dict:
    """
    Prueba de McNemar para comparar dos clasificadores sobre las mismas observaciones.
    Construye la matriz de contingencia 2x2:
      [ [Ambos Correctos,   ModelA Ok / ModelB Err],
        [ModelA Err / ModelB Ok, Ambos Erróneos] ]
    """
    y_true = np.array(y_true)
    preds_a = np.array(preds_model_a)
    preds_b = np.array(preds_model_b)
    
    correct_a = (preds_a == y_true)
    correct_b = (preds_b == y_true)
    
    n11 = int(np.sum(correct_a & correct_b))
    n12 = int(np.sum(correct_a & ~correct_b))
    n21 = int(np.sum(~correct_a & correct_b))
    n22 = int(np.sum(~correct_a & ~correct_b))
    
    contingency_table = [[n11, n12], [n21, n22]]
    
    result = mcnemar(contingency_table, exact=False, correction=True)
    
    interpretation = (
        f"Existe una discrepancia estadísticamente significativa en los patrones de clasificación de {name_a} vs {name_b} (p = {result.pvalue:.4f})."
        if result.pvalue < 0.05 else
        f"No se detectó diferencia significativa en los aciertos/errores de {name_a} vs {name_b} (p = {result.pvalue:.4f})."
    )

    return {
        'test': 'McNemar Test',
        'model_a': name_a,
        'model_b': name_b,
        'contingency_table': contingency_table,
        'statistic': round(float(result.statistic), 4),
        'p_value': round(float(result.pvalue), 6),
        'interpretation': interpretation
    }
