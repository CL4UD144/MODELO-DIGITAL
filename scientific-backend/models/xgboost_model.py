import numpy as np
from xgboost import XGBClassifier, XGBRegressor
from sklearn.base import BaseEstimator, ClassifierMixin

class XGBoostModelWrapper(BaseEstimator, ClassifierMixin):
    """
    Modelo 3: XGBoost (Classifier & Regressor Real)
    Extreme Gradient Boosting optimizado para alta precisión no lineal de carbono.
    """
    def __init__(self, n_estimators=120, max_depth=5, learning_rate=0.05, random_state=42):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.learning_rate = learning_rate
        self.random_state = random_state
        self.model = XGBClassifier(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            learning_rate=self.learning_rate,
            random_state=self.random_state,
            eval_metric='logloss'
        )
        self.regressor = XGBRegressor(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            learning_rate=self.learning_rate,
            random_state=self.random_state
        )

    def fit(self, X, y):
        self.model.fit(X, y)
        self.classes_ = self.model.classes_
        return self

    def fit_regressor(self, X, y_reg):
        self.regressor.fit(X, y_reg)
        return self

    def predict(self, X):
        return self.model.predict(X)

    def predict_regressor(self, X):
        return self.regressor.predict(X)

    def predict_proba(self, X):
        return self.model.predict_proba(X)

