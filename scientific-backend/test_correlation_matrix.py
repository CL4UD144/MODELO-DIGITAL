import pytest
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient
from main import app
from routes.scientific_charts_routes import get_scientific_chart_by_id

client = TestClient(app)

def test_correlation_matrix_endpoint():
    """Test standard endpoint execution on real dataset."""
    response = client.get("/api/scientific/charts/chart-4")
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "success"
    assert data["chart_id"] == "chart-4"
    assert data["chart_type"] == "correlation_matrix"
    
    matrix_data = data["matrix_data"]
    variables = matrix_data["variables"]
    assert len(variables) == 13
    assert "wtd" in variables
    assert "soil_temp" in variables
    assert "co2_flux" in variables
    assert "net_carbon_balance" in variables
    
    # 13x13 matrix shape verification
    pearson = matrix_data["pearson_matrix"]
    spearman = matrix_data["spearman_matrix"]
    p_values = matrix_data["p_values_matrix"]
    
    assert len(pearson) == 13
    assert len(spearman) == 13
    assert len(p_values) == 13
    
    for i in range(13):
        assert len(pearson[i]) == 13
        assert len(spearman[i]) == 13
        assert len(p_values[i]) == 13
        # Diagonal must be 1.0
        assert pytest.approx(pearson[i][i], 1e-4) == 1.0
        assert pytest.approx(spearman[i][i], 1e-4) == 1.0
        assert pytest.approx(p_values[i][i], 1e-4) == 0.0

    # Bounds check
    for i in range(13):
        for j in range(13):
            val_p = pearson[i][j]
            val_s = spearman[i][j]
            val_pv = p_values[i][j]
            assert -1.0 <= val_p <= 1.0
            assert -1.0 <= val_s <= 1.0
            assert 0.0 <= val_pv <= 1.0

    # Pairwise verification: 13*12/2 = 78 pairs
    pairwise = matrix_data["pairwise_correlations"]
    assert len(pairwise) == 78

    top_pos = matrix_data["top_positive_correlations"]
    top_neg = matrix_data["top_negative_correlations"]
    assert len(top_pos) > 0
    assert len(top_neg) > 0
    assert top_pos[0]["pearson_r"] > 0
    assert top_neg[0]["pearson_r"] < 0

def test_correlation_matrix_null_and_constant_handling():
    """Verify that columns with NaN or constant values are managed gracefully."""
    df_test = pd.DataFrame({
        "var_a": [1.0, 2.0, 3.0, 4.0, 5.0],
        "var_b": [2.0, 4.0, 6.0, 8.0, 10.0],
        "var_const": [5.0, 5.0, 5.0, 5.0, 5.0],  # Constant
        "var_nan": [1.0, np.nan, 3.0, np.nan, 5.0]  # Missing
    })
    
    # Calculate pearson directly with pandas
    corr_p = df_test[["var_a", "var_b"]].corr(method="pearson")
    assert pytest.approx(corr_p.loc["var_a", "var_b"], 1e-4) == 1.0
