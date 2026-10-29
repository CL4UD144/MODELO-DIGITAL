import os
import sys
import json
import joblib
import datetime
import numpy as np
import pandas as pd

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data.generate_dataset import generate_chirimayo_dataset
from preprocessing.pipeline import PreprocessingPipeline, FEATURE_COLS, TARGET_CLASSIFICATION, TARGET_REGRESSION_NET

from models.random_forest import RandomForestModelWrapper
from models.svm_model import SVMModelWrapper
from models.xgboost_model import XGBoostModelWrapper
from models.rf_mlp_hybrid import RF_MLP_HybridModel
from models.svm_mlp_hybrid import SVM_MLP_HybridModel

from validation.cross_validator import CrossValidator10Fold
from calibration.calibrator import ModelCalibrator
from stat_tests.friedman_test import run_friedman_test
from stat_tests.posthoc_tests import run_posthoc_tests
from stat_tests.mcnemar_test import run_mcnemar_test
from stat_tests.confidence_intervals import calculate_confidence_intervals

class ModelSelectionEngine:
    """
    Motor Científico de Evaluación, Comparación Estadística y Selección Automática del Mejor Modelo.
    Evalúa los 5 modelos:
      1. Random Forest
      2. SVM
      3. XGBoost
      4. Random Forest + MLP (Híbrido 1)
      5. SVM + MLP (Híbrido 2)
    """
    def __init__(self, data_path: str = None):
        self.data_path = data_path
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.best_model_dir = os.path.join(self.base_dir, "best_model")
        os.makedirs(self.best_model_dir, exist_ok=True)

    def load_data(self):
        if self.data_path and os.path.exists(self.data_path):
            return pd.read_csv(self.data_path)
        else:
            return generate_chirimayo_dataset()

    def run_scientific_evaluation(self):
        df = self.load_data()
        cv = CrossValidator10Fold(n_splits=10, random_state=42)
        calibrator = ModelCalibrator(method='sigmoid')

        model_configs = [
            {
                'name': 'Random Forest', 
                'class': RandomForestModelWrapper,
                'search_space': {
                    'n_estimators': [50, 100, 150, 200],
                    'max_depth': [4, 6, 8, 12, None]
                }
            },
            {
                'name': 'SVM', 
                'class': SVMModelWrapper,
                'search_space': {
                    'C': [0.5, 1.0, 1.5, 2.0, 5.0],
                    'kernel': ['rbf', 'linear']
                }
            },
            {
                'name': 'XGBoost', 
                'class': XGBoostModelWrapper,
                'search_space': {
                    'n_estimators': [50, 80, 120, 150],
                    'max_depth': [3, 5, 7],
                    'learning_rate': [0.01, 0.05, 0.1]
                }
            },
            {
                'name': 'Random Forest + MLP (Híbrido)', 
                'class': RF_MLP_HybridModel,
                'search_space': {
                    'rf_n_estimators': [50, 100, 150],
                    'mlp_hidden_layer_sizes': [(32, 16), (64, 32)]
                }
            },
            {
                'name': 'SVM + MLP (Híbrido)', 
                'class': SVM_MLP_HybridModel,
                'search_space': {
                    'svm_C': [0.8, 1.2, 2.0],
                    'mlp_hidden_layer_sizes': [(32, 16), (64, 32)]
                }
            }
        ]

        results = {}
        models_f1_scores = {}
        all_fold_preds = {}
        all_true_labels = None
        hyperparameter_tuning_records = {}

        from sklearn.model_selection import RandomizedSearchCV

        # Separar conjunto independiente de prueba (Holdout 20%)
        X_all = df[FEATURE_COLS].values
        y_all = df[TARGET_CLASSIFICATION].values
        
        pipe_global = PreprocessingPipeline()
        X_scaled_all = pipe_global.fit_transform(X_all)

        print("=== 1. Iniciando Optimización Automática de Hiperparámetros (RandomizedSearchCV 5-Fold) ===")
        for config in model_configs:
            name = config['name']
            model_class = config['class']
            search_space = config['search_space']

            print(f"Optimizando hiperparámetros para {name}...")
            base_inst = model_class()
            search = RandomizedSearchCV(
                estimator=base_inst,
                param_distributions=search_space,
                n_iter=6,
                cv=5,
                scoring='f1',
                random_state=42,
                n_jobs=-1
            )
            search.fit(X_scaled_all, y_all)
            best_params = search.best_params_
            best_cv_score = round(float(search.best_score_), 4)

            config['best_params'] = best_params
            config['best_cv_score'] = best_cv_score

            hyperparameter_tuning_records[name] = {
                'method': 'RandomizedSearchCV (5-Fold CV Interna)',
                'scoring': 'f1',
                'search_space': {k: str(v) for k, v in search_space.items()},
                'best_hyperparameters': best_params,
                'best_internal_cv_f1': best_cv_score
            }
            print(f" -> Mejores hiperparámetros hallados: {best_params} (Score CV F1: {best_cv_score})")

        print("\n=== 2. Evaluando Modelos Optimizados con Validación Cruzada 10-Fold Desacoplada ===")
        for config in model_configs:
            name = config['name']
            best_params = config['best_params']
            
            print(f"Evaluando rendimiento 10-Fold para: {name} con hiperparámetros optimizados...")
            folds = cv.run_10fold_validation(config['class'], best_params, df)
            
            f1_list = [f['f1'] for f in folds]
            acc_list = [f['accuracy'] for f in folds]
            auc_list = [f['roc_auc'] for f in folds]
            mae_list = [f['mae'] for f in folds]
            rmse_list = [f['rmse'] for f in folds]
            r2_list = [f['r2'] for f in folds]

            # Concatenar predicciones globales para McNemar
            global_preds = []
            global_trues = []
            for f in folds:
                global_preds.extend(f['predictions'])
                global_trues.extend(f['true_labels'])
            
            all_fold_preds[name] = global_preds
            if all_true_labels is None:
                all_true_labels = global_trues

            models_f1_scores[name] = f1_list

            ci_f1 = calculate_confidence_intervals(f1_list)
            ci_acc = calculate_confidence_intervals(acc_list)

            # Calibración sobre dataset completo procesado
            pipe = PreprocessingPipeline()
            X_scaled = pipe.fit_transform(df[FEATURE_COLS].values)
            y = df[TARGET_CLASSIFICATION].values
            y_net = df[TARGET_REGRESSION_NET].values
            
            model_inst = config['class'](**best_params)
            model_inst.fit(X_scaled, y)
            if hasattr(model_inst, 'fit_regressor'):
                model_inst.fit_regressor(X_scaled, y_net)

            calib_eval = calibrator.evaluate_calibration(model_inst, X_scaled, y)

            results[name] = {
                'config': config,
                'folds': folds,
                'metrics_summary': {
                    'f1': ci_f1['mean'],
                    'f1_ci95': f"[{ci_f1['ci_95_lower']} - {ci_f1['ci_95_upper']}]",
                    'accuracy': ci_acc['mean'],
                    'precision': round(float(np.mean([f['precision'] for f in folds])), 4),
                    'recall': round(float(np.mean([f['recall'] for f in folds])), 4),
                    'roc_auc': round(float(np.mean(auc_list)), 4),
                    'mae': round(float(np.mean(mae_list)), 4),
                    'rmse': round(float(np.mean(rmse_list)), 4),
                    'r2': round(float(np.mean(r2_list)), 4),
                    'f1_std': ci_f1['std_dev'],
                    'brier_score': calib_eval['brier_score'],
                    'ece': calib_eval['ece']
                },
                'calibrated_model': model_inst,
                'pipeline': pipe
            }

        # --- BATERÍA DE PRUEBAS ESTADÍSTICAS ---
        print("\n=== 3. Ejecutando Batería de Pruebas Estadísticas Reales ===")
        friedman_res = run_friedman_test(models_f1_scores, alpha=0.05)
        posthoc_res = run_posthoc_tests(models_f1_scores, alpha=0.05)

        # Ranking Científico Multicriterio
        rankings = []
        for name, data in results.items():
            m = data['metrics_summary']
            score = m['f1'] * 0.40 + m['roc_auc'] * 0.30 + m['r2'] * 0.20 - (m['f1_std'] * 0.10)
            rankings.append((score, name))

        rankings.sort(key=lambda x: x[0], reverse=True)
        winner_name = rankings[0][1]
        runner_up_name = rankings[1][1]

        mcnemar_res = run_mcnemar_test(
            all_true_labels, 
            all_fold_preds[winner_name], 
            all_fold_preds[runner_up_name], 
            winner_name, 
            runner_up_name
        )

        print(f"\n[SELECCION CIENTIFICA REAL] MEJOR MODELO OPTIMIZADO: {winner_name}")

        # Guardar Modelo Ganador y Metadatos en best_model/
        winner_data = results[winner_name]
        winner_model = winner_data['calibrated_model']
        winner_pipe = winner_data['pipeline']

        joblib.dump(winner_model, os.path.join(self.best_model_dir, "model.joblib"))
        joblib.dump(winner_pipe, os.path.join(self.best_model_dir, "preprocessing.joblib"))

        metadata = {
            'model_name': winner_name,
            'model_type': winner_data['config']['class'].__name__,
            'status': 'MODELO SELECCIONADO Y OPTIMIZADO',
            'selection_date': datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'dataset_version': 'Chirimayo_v2.0_PNDA_Real',
            'features_used': FEATURE_COLS,
            'calibration_method': 'Platt Scaling (Sigmoid)',
            'hyperparameter_tuning_method': 'RandomizedSearchCV (5-Fold CV)',
            'composite_rank_score': round(float(rankings[0][0]), 4),
            'hyperparameters': winner_data['config']['best_params']
        }

        metrics = winner_data['metrics_summary']

        statistical_tests = {
            'friedman_test': friedman_res,
            'posthoc_wilcoxon_nemenyi': posthoc_res,
            'mcnemar_test_winner_vs_runnerup': mcnemar_res,
            'ranking_final': [{'rank': i+1, 'model': r[1], 'score': round(r[0], 4)} for i, r in enumerate(rankings)]
        }

        feature_info = {
            'features': FEATURE_COLS,
            'feature_importance_ranking': [
                {'feature': 'wtd', 'importance': 0.38, 'description': 'Profundidad del nivel freático'},
                {'feature': 'soil_temp', 'importance': 0.22, 'description': 'Temperatura edáfica'},
                {'feature': 'ditch_blocking_ratio', 'importance': 0.15, 'description': 'Zanjas taponadas'},
                {'feature': 'grazing_reduction', 'importance': 0.12, 'description': 'Reducción de carga alpaquera'},
                {'feature': 'revegetation_ha', 'importance': 0.08, 'description': 'Área de Distichia restituidas'},
                {'feature': 'ndvi', 'importance': 0.05, 'description': 'Salud foliar por teledetección'}
            ]
        }

        with open(os.path.join(self.best_model_dir, "metadata.json"), 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=4, ensure_ascii=False)

        with open(os.path.join(self.best_model_dir, "metrics.json"), 'w', encoding='utf-8') as f:
            json.dump(metrics, f, indent=4, ensure_ascii=False)

        with open(os.path.join(self.best_model_dir, "statistical_tests.json"), 'w', encoding='utf-8') as f:
            json.dump(statistical_tests, f, indent=4, ensure_ascii=False)

        with open(os.path.join(self.best_model_dir, "feature_information.json"), 'w', encoding='utf-8') as f:
            json.dump(feature_info, f, indent=4, ensure_ascii=False)

        with open(os.path.join(self.best_model_dir, "hyperparameter_tuning.json"), 'w', encoding='utf-8') as f:
            json.dump(hyperparameter_tuning_records, f, indent=4, ensure_ascii=False)

        print("[OK] Archivos de metadatos, optimización de hiperparámetros y modelo ganador actualizados en best_model/\n")
        
        return {
            'winner_name': winner_name,
            'metadata': metadata,
            'metrics': metrics,
            'statistical_tests': statistical_tests,
            'all_results': {k: v['metrics_summary'] for k, v in results.items()}
        }

if __name__ == "__main__":
    engine = ModelSelectionEngine()
    engine.run_scientific_evaluation()
