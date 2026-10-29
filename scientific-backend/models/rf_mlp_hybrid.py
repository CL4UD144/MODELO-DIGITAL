import numpy as np
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.base import BaseEstimator, ClassifierMixin

class RF_MLP_HybridModel(BaseEstimator, ClassifierMixin):
    """
    Modelo Híbrido 4: Random Forest + MLP (Perceptrón Multicapa - Clasificador & Regresor Real)
    Arquitectura Híbrida de Apilamiento (Stacking/Residual Fusion):
    1. Random Forest extrae predicciones/probabilidades base.
    2. Características iniciales + meta-características RF alimentan la red MLP.
    """
    def __init__(self, rf_n_estimators=100, mlp_hidden_layer_sizes=(32, 16), random_state=42):
        self.rf_n_estimators = rf_n_estimators
        self.mlp_hidden_layer_sizes = mlp_hidden_layer_sizes
        self.random_state = random_state
        
        self.rf = RandomForestClassifier(
            n_estimators=self.rf_n_estimators,
            max_depth=7,
            random_state=self.random_state
        )
        self.mlp = MLPClassifier(
            hidden_layer_sizes=self.mlp_hidden_layer_sizes,
            max_iter=300,
            early_stopping=True,
            n_iter_no_change=10,
            activation='relu',
            solver='adam',
            random_state=self.random_state
        )

        self.rf_reg = RandomForestRegressor(
            n_estimators=self.rf_n_estimators,
            max_depth=7,
            random_state=self.random_state
        )
        self.mlp_reg = MLPRegressor(
            hidden_layer_sizes=self.mlp_hidden_layer_sizes,
            max_iter=300,
            early_stopping=True,
            n_iter_no_change=10,
            activation='relu',
            solver='adam',
            random_state=self.random_state
        )

    def fit(self, X, y):
        self.rf.fit(X, y)
        rf_proba = self.rf.predict_proba(X)
        X_augmented = np.hstack((X, rf_proba))
        self.mlp.fit(X_augmented, y)
        self.classes_ = self.mlp.classes_
        return self

    def fit_regressor(self, X, y_reg):
        self.rf_reg.fit(X, y_reg)
        rf_preds = self.rf_reg.predict(X).reshape(-1, 1)
        X_augmented = np.hstack((X, rf_preds))
        self.mlp_reg.fit(X_augmented, y_reg)
        return self

    def predict(self, X):
        rf_proba = self.rf.predict_proba(X)
        X_augmented = np.hstack((X, rf_proba))
        return self.mlp.predict(X_augmented)

    def predict_regressor(self, X):
        rf_preds = self.rf_reg.predict(X).reshape(-1, 1)
        X_augmented = np.hstack((X, rf_preds))
        return self.mlp_reg.predict(X_augmented)

    def predict_proba(self, X):
        rf_proba = self.rf.predict_proba(X)
        X_augmented = np.hstack((X, rf_proba))
        return self.mlp.predict_proba(X_augmented)

