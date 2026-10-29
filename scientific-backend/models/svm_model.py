from sklearn.svm import SVC, SVR
from sklearn.base import BaseEstimator, ClassifierMixin

class SVMModelWrapper(BaseEstimator, ClassifierMixin):
    """
    Modelo 2: Support Vector Machine (SVM & SVR Real)
    Clasificador con kernel RBF y Regresor SVR para flujo continuo de carbono.
    """
    def __init__(self, C=1.5, kernel='rbf', gamma='scale', random_state=42):
        self.C = C
        self.kernel = kernel
        self.gamma = gamma
        self.random_state = random_state
        self.model = SVC(
            C=self.C,
            kernel=self.kernel,
            gamma=self.gamma,
            probability=True,
            random_state=self.random_state
        )
        self.regressor = SVR(
            C=self.C,
            kernel=self.kernel,
            gamma=self.gamma
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

