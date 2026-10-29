import sys
import os
import json
import pandas as pd

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from eda.eda_analyzer import EDAAnalyzer
from explainability.explainer import ModelExplainer
from langchain_module.chain_service import LangChainExplicatorService
from langgraph_module.graph_workflow import LangGraphWorkflow
from reports.report_generator import ReportGenerator

client = TestClient(app)

def run_system_audit_tests():
    print("=== 1. Probando Endpoint /api/system/status ===")
    res1 = client.get("/api/system/status")
    print(f"Status Code: {res1.status_code}")
    print(res1.json())
    assert res1.status_code == 200

    print("\n=== 2. Probando Endpoint /api/models/best ===")
    res2 = client.get("/api/models/best")
    print(f"Status Code: {res2.status_code}")
    data2 = res2.json()
    print(f"Modelo seleccionado: {data2.get('model_name')}")
    print(f"Método de optimización: {data2.get('hyperparameter_tuning_method')}")
    print(f"Métricas reales (R2): {data2.get('metrics', {}).get('r2')}")
    print(f"Métricas reales (F1): {data2.get('metrics', {}).get('f1')}")
    assert res2.status_code == 200

    print("\n=== 3. Probando Endpoint /api/langflow/status ===")
    res3 = client.get("/api/langflow/status")
    print(f"Status Code: {res3.status_code}")
    assert res3.status_code == 200

    print("\n=== 4. Probando Endpoint /api/langflow/chat ===")
    res4 = client.post("/api/langflow/chat", json={
        "message": "¿Cuál es la tasa de secuestro de carbono proyectada para la turbera?",
        "language": "es",
        "context": {"module": "restoration", "userRole": "investigador"}
    })
    print(f"Status Code: {res4.status_code}")
    assert res4.status_code == 200

    print("\n=== 5. Probando Endpoint /api/predict ===")
    res5 = client.post("/api/predict", json={
        "wtd": -8.5,
        "soil_temp": 7.2,
        "precip_mm": 120.0,
        "ditch_blocking_ratio": 90.0,
        "grazing_reduction": 90.0,
        "revegetation_ha": 65.0,
        "ndvi": 0.72,
        "bulk_density": 0.095,
        "organic_matter": 84.5,
        "ph": 4.6
    })
    print(f"Status Code: {res5.status_code}")
    assert res5.status_code == 200

    print("\n=== 6. Probando Módulo EDA (EDAAnalyzer) ===")
    dummy_df = pd.DataFrame({
        "wtd": [-10.0, -5.0, -2.0, -12.0, -8.0],
        "soil_temp": [6.5, 7.2, 8.0, 6.8, 7.5],
        "co2_flux": [3.5, 4.2, 5.0, 3.8, 4.5]
    })
    eda = EDAAnalyzer(dummy_df)
    stats = eda.get_descriptive_stats()
    quality = eda.get_data_quality()
    interp = eda.generate_chart_interpretation("histogram", "wtd", {"mean": -7.4, "std": 3.8, "min": -12.0, "max": -2.0, "skewness": 0.1})
    print("EDA Stats rows:", len(stats))
    print("EDA Interpretation:", interp["que_se_observa"])
    assert len(stats) == 3

    print("\n=== 7. Probando Módulo Explicabilidad (ModelExplainer) ===")
    from models.random_forest import RandomForestModelWrapper
    rf = RandomForestModelWrapper()
    expl = ModelExplainer(rf.model, ["wtd", "soil_temp", "precip_mm"])
    df_imp = expl.get_feature_importance()
    summary_exp = expl.generate_explanation_summary(["wtd", "soil_temp"])
    print("Feature Importance Rows:", len(df_imp))
    assert len(df_imp) == 3

    print("\n=== 8. Probando Módulo LangChain (LangChainExplicatorService) ===")
    lc = LangChainExplicatorService()
    lc_res = lc.generate_explanation("Modelo ML", {"r2": 0.9443, "winner_model": "XGBoost"}, "Rendimiento del modelo")
    print("LangChain Response Provider:", lc_res["provider"])
    assert lc_res["status"] == "success"

    print("\n=== 9. Probando Módulo LangGraph (LangGraphWorkflow) ===")
    lg = LangGraphWorkflow()
    lg_res = lg.run_workflow("Analizar balance de CO2", {"active_model": "XGBoost", "r2_score": 0.9443})
    print("LangGraph Intent:", lg_res["intent"])
    assert "validated_output" in lg_res

    print("\n=== 10. Probando Módulo Reportes (ReportGenerator) ===")
    rep = ReportGenerator()
    json_p = rep.generate_json_report({"status": "ok", "test": True})
    csv_p = rep.generate_csv_summary([{"model": "XGBoost", "score": 0.85}])
    excel_p = rep.generate_excel_report({"winner_model": "XGBoost", "best_r2": 0.9443})
    print("Report paths:", json_p, csv_p, excel_p)
    assert os.path.exists(json_p) and os.path.exists(csv_p) and os.path.exists(excel_p)

    print("\n[TODAS LAS PRUEBAS DE VERIFICACION DE LOS 10 MODULOS CIENTIFICOS PASARON CON EXITO!]")

if __name__ == "__main__":
    run_system_audit_tests()
