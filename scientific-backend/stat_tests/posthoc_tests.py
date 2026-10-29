import numpy as np
from scipy import stats

def run_posthoc_tests(models_fold_scores: dict, alpha: float = 0.05) -> list:
    """
    Pruebas Post-Hoc: Wilcoxon signed-rank test pareado con corrección Holm-Bonferroni para comparaciones múltiples.
    """
    model_names = list(models_fold_scores.keys())
    n_models = len(model_names)
    comparisons = []
    
    raw_p_values = []
    pair_details = []

    for i in range(n_models):
        for j in range(i + 1, n_models):
            name_a = model_names[i]
            name_b = model_names[j]
            scores_a = np.array(models_fold_scores[name_a])
            scores_b = np.array(models_fold_scores[name_b])
            
            diff = scores_a - scores_b
            mean_diff = float(np.mean(diff))
            
            if np.all(diff == 0):
                stat, p_val = 0.0, 1.0
            else:
                stat, p_val = stats.wilcoxon(scores_a, scores_b)
                
            raw_p_values.append(p_val)
            
            # Cohen's d como tamaño del efecto
            sd_pooled = np.sqrt((np.std(scores_a, ddof=1)**2 + np.std(scores_b, ddof=1)**2) / 2.0)
            cohen_d = mean_diff / sd_pooled if sd_pooled > 0 else 0.0

            pair_details.append({
                'model_a': name_a,
                'model_b': name_b,
                'statistic': round(float(stat), 4),
                'p_value_raw': float(p_val),
                'mean_difference': round(mean_diff, 4),
                'effect_size_cohen_d': round(float(cohen_d), 4)
            })

    # Corrección Holm-Bonferroni
    sorted_indices = np.argsort(raw_p_values)
    m = len(raw_p_values)
    adjusted_p_values = [0.0] * m

    for k, idx in enumerate(sorted_indices):
        adj_p = min(1.0, raw_p_values[idx] * (m - k))
        adjusted_p_values[idx] = float(adj_p)

    for idx, item in enumerate(pair_details):
        item['p_value_adjusted'] = round(adjusted_p_values[idx], 6)
        item['significant'] = item['p_value_adjusted'] < alpha
        comparisons.append(item)

    return comparisons
