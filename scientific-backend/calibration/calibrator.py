import numpy as np
from sklearn.calibration import calibration_curve, CalibratedClassifierCV
from sklearn.metrics import brier_score_loss

class ModelCalibrator:
    """
    Módulo de Calibración de Probabilidades para Modelos Biogeoquímicos.
    Calcula:
      - Reliability Diagram (Curva de Calibración)
      - Brier Score
      - Calibration Error
      - Escalado Isotónico / Platt Scaling para optimización
    """
    def __init__(self, method='sigmoid'):
        self.method = method # 'sigmoid' (Platt) o 'isotonic'

    def evaluate_calibration(self, model, X_test, y_test, n_bins=10):
        if hasattr(model, "predict_proba"):
            probs_mat = model.predict_proba(X_test)
            prob_pos = probs_mat[:, 1] if probs_mat.shape[1] > 1 else probs_mat[:, 0]
        else:
            prob_pos = model.decision_function(X_test)
            prob_pos = (prob_pos - prob_pos.min()) / (prob_pos.max() - prob_pos.min())

        fraction_of_positives, mean_predicted_value = calibration_curve(y_test, prob_pos, n_bins=n_bins)
        brier = brier_score_loss(y_test, prob_pos)
        
        # Expected Calibration Error (ECE)
        ece = np.mean(np.abs(fraction_of_positives - mean_predicted_value))
        
        return {
            'brier_score': round(float(brier), 4),
            'ece': round(float(ece), 4),
            'fraction_of_positives': fraction_of_positives.tolist(),
            'mean_predicted_value': mean_predicted_value.tolist()
        }

    def calibrate_model(self, base_model, X_train, y_train):
        calibrated = CalibratedClassifierCV(estimator=base_model, method=self.method, cv=3)
        calibrated.fit(X_train, y_train)
        return calibrated
