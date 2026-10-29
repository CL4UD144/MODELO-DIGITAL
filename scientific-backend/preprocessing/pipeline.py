import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.base import BaseEstimator, TransformerMixin

FEATURE_COLS = [
    'wtd', 'soil_temp', 'precip_mm', 'ditch_blocking_ratio', 
    'grazing_reduction', 'revegetation_ha', 'ndvi', 
    'bulk_density', 'organic_matter', 'ph'
]

TARGET_CLASSIFICATION = 'high_impact_class'
TARGET_REGRESSION_CO2 = 'co2_flux'
TARGET_REGRESSION_CH4 = 'ch4_flux'
TARGET_REGRESSION_NET = 'net_carbon_balance'

class PreprocessingPipeline(BaseEstimator, TransformerMixin):
    def __init__(self):
        self.imputer = SimpleImputer(strategy='median')
        self.scaler = StandardScaler()
        self.feature_names = FEATURE_COLS

    def fit(self, X, y=None):
        X_df = pd.DataFrame(X, columns=self.feature_names)
        X_imp = self.imputer.fit_transform(X_df)
        self.scaler.fit(X_imp)
        return self

    def transform(self, X):
        X_df = pd.DataFrame(X, columns=self.feature_names)
        X_imp = self.imputer.transform(X_df)
        X_scaled = self.scaler.transform(X_imp)
        return X_scaled

    def fit_transform(self, X, y=None):
        return self.fit(X, y).transform(X)
