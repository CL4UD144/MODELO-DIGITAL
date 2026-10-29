from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.base import BaseEstimator, ClassifierMixin

class RandomForestModelWrapper(BaseEstimator, ClassifierMixin):
    """
    Modelo 1: Random Forest (Clasificador y Regresor Bio-Físico Real)
    Ensamble de 150 árboles de decisión optimizados para interacciones biogeoquímicas de turberas.
    """
    def __init__(self, n_estimators=150, max_depth=8, random_state=42):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.random_state = random_state
        self.model = RandomForestClassifier(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
            random_state=self.random_state,
            class_weight='balanced'
        )
        self.regressor = RandomForestRegressor(
            n_estimators=self.n_estimators,
            max_depth=self.max_depth,
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

