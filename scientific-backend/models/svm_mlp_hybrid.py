import numpy as np
from sklearn.svm import SVC, SVR
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.base import BaseEstimator, ClassifierMixin

class SVM_MLP_HybridModel(BaseEstimator, ClassifierMixin):
    """
    Modelo Híbrido 5: SVM + MLP (Perceptrón Multicapa - Clasificador & Regresor Real)
    Arquitectura Híbrida de Fusión Geométrica-Deep Learning:
    1. SVM / SVR calcula hiperplanos óptimos de separación y valores de regresión base.
    2. Las características proyectadas se introducen a la red MLP.
    """
    def __init__(self, svm_C=1.2, mlp_hidden_layer_sizes=(32, 16), random_state=42):
        self.svm_C = svm_C
        self.mlp_hidden_layer_sizes = mlp_hidden_layer_sizes
        self.random_state = random_state
        
        self.svm = SVC(
            C=self.svm_C,
            kernel='rbf',
            probability=True,
            random_state=self.random_state
        )
        self.mlp = MLPClassifier(
            hidden_layer_sizes=self.mlp_hidden_layer_sizes,
            max_iter=500,
            activation='tanh',
            solver='adam',
            random_state=self.random_state
        )

        self.svr = SVR(
            C=self.svm_C,
            kernel='rbf'
        )
        self.mlp_reg = MLPRegressor(
            hidden_layer_sizes=self.mlp_hidden_layer_sizes,
            max_iter=500,
            activation='tanh',
            solver='adam',
            random_state=self.random_state
        )

    def fit(self, X, y):
        self.svm.fit(X, y)
        svm_proba = self.svm.predict_proba(X)
        X_augmented = np.hstack((X, svm_proba))
        self.mlp.fit(X_augmented, y)
        self.classes_ = self.mlp.classes_
        return self

    def fit_regressor(self, X, y_reg):
        self.svr.fit(X, y_reg)
        svr_preds = self.svr.predict(X).reshape(-1, 1)
        X_augmented = np.hstack((X, svr_preds))
        self.mlp_reg.fit(X_augmented, y_reg)
        return self

    def predict(self, X):
        svm_proba = self.svm.predict_proba(X)
        X_augmented = np.hstack((X, svm_proba))
        return self.mlp.predict(X_augmented)

    def predict_regressor(self, X):
        svr_preds = self.svr.predict(X).reshape(-1, 1)
        X_augmented = np.hstack((X, svr_preds))
        return self.mlp_reg.predict(X_augmented)

    def predict_proba(self, X):
        svm_proba = self.svm.predict_proba(X)
        X_augmented = np.hstack((X, svm_proba))
        return self.mlp.predict_proba(X_augmented)

