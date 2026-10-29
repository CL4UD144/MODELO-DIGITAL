# Gemelo Digital de Turberas Altoandinas - Microcuenca Chirimayo

Plataforma computacional para el monitoreo hidrológico, la simulación del balance de carbono ($\text{CO}_2 - \text{CH}_4$) y la evaluación del impacto de obras de restauración mediante la metodología BACI.

View your app in AI Studio: https://ai.studio/apps/ab2aa337-7e50-46ad-9253-c0cf0e8a1dfb

---

## 📊 Metodología de Ciencia de Datos & Machine Learning (CRISP-DM)

El desarrollo del pipeline de datos y modelos del Gemelo Digital adopta el estándar de la metodología **CRISP-DM** (*Cross-Industry Standard Process for Data Mining*), estructurado en **6 fases principales**:

```
 ┌───────────────────────────┐     ┌───────────────────────────┐
 │ 1. Comprensión Negocio    │ ◄──►│ 2. Comprensión Datos      │
 └─────────────┬─────────────┘     └─────────────┬─────────────┘
               │                                 │
               ▼                                 ▼
 ┌───────────────────────────┐     ┌───────────────────────────┐
 │ 6. Despliegue (System API)│ ◄───│ 3. Preparación Datos      │
 └─────────────▲─────────────┘     └─────────────┬─────────────┘
               │                                 │
               │                   ┌─────────────┴─────────────┐
               │                   ▼                           ▼
 ┌─────────────┴─────────────┐     ┌───────────────────────────┐
 │ 5. Evaluación Estadís.    │ ◄──►│ 4. Modelado ML & Biofísico│
 └───────────────────────────┘     └───────────────────────────┘
```

### 1. Comprensión del Negocio (*Business Understanding*)
- **Objetivo:** Monitorear y predecir el estado de salud ecológica, nivel freático (WTD) y balance de gases de efecto invernadero ($\text{CO}_2$ y $\text{CH}_4$) en 385 ha de turberas de la microcuenca Chirimayo (Cajamarca).
- **Impacto:** Valoración de créditos de carbono y servicios ecosistémicos hídricos bajo el mecanismo MERESE (Ley 30215).

### 2. Comprensión de los Datos (*Data Understanding*)
- **Fuentes de datos:**
  - 370 estaciones meteorológicas históricas de SENAMHI DZ3 (1964-2024).
  - Red IoT de piezómetros continuos para medición de profundidad freática.
  - Capas OGC WMS/WFS del INAIGEM (Inventario 2023), ANA y MINAM Geoservidor.
  - Mosaicos multispectrales Sentinel-2 y ALOS DEM (30m).

### 3. Preparación de los Datos (*Data Preparation*)
- **Pipeline ETL (`scientific-backend/preprocessing/pipeline.py`):**
  - Filtrado de valores atípicos (*Outliers QA/QC*).
  - Imputación mediante Kriging ordinario espacial y series temporales.
  - Extracción de características edáficas (densidad aparente, materia orgánica, pH) e índices espectrales (NDVI, NDWI).
  - Escalamiento de variables (`StandardScaler` / `MinMaxScaler`).

### 4. Modelado (*Modeling*)
- **Modelos implementados (`scientific-backend/models/`):**
  - *Support Vector Machines (SVM)* con kernel RBF.
  - *Random Forest* e *XGBoost* para clasificación del grado de degradación.
  - Modelos híbridos ensemble (*RF-MLP* y *SVM-MLP*).
  - Motor biofísico IPCC Wetlands Tier 2 para la dinámica $\text{CO}_2 - \text{CH}_4$.

### 5. Evaluación (*Evaluation*)
- **Validación rigurosa (`scientific-backend/validation/` & `stat_tests/`):**
  - Validación cruzada *10-Fold Stratified Cross-Validation*.
  - Pruebas no paramétricas de hipótesis (Friedman test, McNemar, Post-hoc Wilcoxon).
  - Métricas de desempeño: R², RMSE, F1-Score y matriz de confusión.
  - Selección automatizada del modelo con mayor rendimiento (`best_model/`).

### 6. Despliegue (*Deployment*)
- **Producción & Visualización:**
  - API RESTful en FastAPI (`scientific-backend/main.py`) con soporte OpenAPI 3.0.
  - Gemelo Digital 3D interactivo en React Three Fiber / WebGL.
  - Visor GIS 2D interoperable y simulador de escenarios *What-If*.

---

## 🚀 Instalación y Ejecución Local

**Requisitos previos:** Node.js v18+ y Python 3.10+

### 1. Frontend (React + Vite)
```bash
npm install
npm run dev
```

### 2. Backend Científico (Python FastAPI)
```bash
cd scientific-backend
pip install -r requirements.txt
python main.py
```

