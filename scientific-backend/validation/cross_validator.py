import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, mean_absolute_error, mean_squared_error, r2_score
from preprocessing.pipeline import PreprocessingPipeline, FEATURE_COLS, TARGET_CLASSIFICATION, TARGET_REGRESSION_NET

class CrossValidator10Fold:
    """
    Motor de Validación Cruzada de 10 Folds con Aislamiento Estricto.
    Evita Data Leakage ejecutando el ajuste de preprocesamiento dentro de cada fold individual.
    """
    def __init__(self, n_splits=10, random_state=42):
        self.n_splits = n_splits
        self.random_state = random_state
        self.skf = StratifiedKFold(n_splits=self.n_splits, shuffle=True, random_state=self.random_state)

    def run_10fold_validation(self, model_class, model_params, df: pd.DataFrame):
        X = df[FEATURE_COLS].values
        y = df[TARGET_CLASSIFICATION].values
        y_net = df[TARGET_REGRESSION_NET].values

        fold_results = []
        
        for fold_idx, (train_idx, val_idx) in enumerate(self.skf.split(X, y)):
            X_train, X_val = X[train_idx], X[val_idx]
            y_train, y_val = y[train_idx], y[val_idx]
            y_net_train, y_net_val = y_net[train_idx], y_net[val_idx]

            # Pipeline independiente por fold (Zero Data Leakage)
            pipe = PreprocessingPipeline()
            X_train_scaled = pipe.fit_transform(X_train)
            X_val_scaled = pipe.transform(X_val)

            # Instanciar y entrenar modelo de clasificación
            model = model_class(**model_params)
            model.fit(X_train_scaled, y_train)

            # Instanciar y entrenar modelo de regresión continua real (sin proxy sintético)
            if hasattr(model, 'fit_regressor'):
                model.fit_regressor(X_train_scaled, y_net_train)

            # Inferencia de Clasificación
            preds = model.predict(X_val_scaled)
            if hasattr(model, 'predict_proba'):
                prob_mat = model.predict_proba(X_val_scaled)
                probs = prob_mat[:, 1] if prob_mat.shape[1] > 1 else prob_mat[:, 0]
            else:
                probs = preds

            # Inferencia de Regresión Continua Real sobre el Fold de Validación
            if hasattr(model, 'predict_regressor'):
                net_preds = model.predict_regressor(X_val_scaled)
            else:
                net_preds = preds

            # Métricas Reales del fold (Clasificación & Regresión)
            acc = accuracy_score(y_val, preds)
            prec = precision_score(y_val, preds, zero_division=0)
            rec = recall_score(y_val, preds, zero_division=0)
            f1 = f1_score(y_val, preds, zero_division=0)
            auc = roc_auc_score(y_val, probs) if len(np.unique(y_val)) > 1 else 0.5
            
            # Métricas Reales de Regresión Continua (CO2eq t/ha/yr)
            mae = mean_absolute_error(y_net_val, net_preds)
            rmse = np.sqrt(mean_squared_error(y_net_val, net_preds))
            r2 = r2_score(y_net_val, net_preds)

            fold_results.append({
                'fold': fold_idx + 1,
                'accuracy': round(float(acc), 4),
                'precision': round(float(prec), 4),
                'recall': round(float(rec), 4),
                'f1': round(float(f1), 4),
                'roc_auc': round(float(auc), 4),
                'mae': round(float(mae), 4),
                'rmse': round(float(rmse), 4),
                'r2': round(float(r2), 4),
                'predictions': preds.tolist(),
                'probabilities': probs.tolist(),
                'true_labels': y_val.tolist()
            })

        return fold_results
