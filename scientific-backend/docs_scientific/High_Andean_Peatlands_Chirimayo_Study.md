# ESTUDIO DE LA MICROCUENCA CHIRIMAYO Y ESTACIONES PNDA DE REFERENCIA

## 1. UBICACIÓN Y CARACTERÍSTICAS GEOGRÁFICAS
- **Área de Estudio**: Microcuenca Chirimayo, Distrito de La Encañada, Provincia y Departamento de Cajamarca, Perú.
- **Altitud**: 3,800 a 3,950 m s.n.m. (Turberas y bofedales altoandinos).
- **Coordenadas de Referencia**:
  - Estación Quinuacocha (QUI-TAY-MEHM-02): Latitud -9.5120°, Longitud -77.5340°, Elevación 3950 m s.n.m. (Estación PNDA Referencia de Humedad Multinivel).
  - Estación Cátac (CIC-MEHM-04): Latitud -9.7540°, Longitud -77.3820°, Elevación 3820 m s.n.m. (Estación PNDA Referencia de Humedad Multinivel).
  - Estación WatchDog (CIC-MEHM-01): Latitud -9.7510°, Longitud -77.3800°, Elevación 3810 m s.n.m. (Serie Climatológica: Precipitación y Temperatura).

## 2. VARIABLES AMBIENTALES Y EDÁFICAS REGISTRADAS
- **Water Table Depth (WTD)**: Profundidad de la napa freática en centímetros (rango habitual: -50 cm en estación seca a 0 cm en saturación).
- **Humedad del Suelo Multinivel**: Mediciones continuas en sensores a 20 cm, 60 cm y 100 cm de profundidad.
- **Temperatura Edáfica (Soil Temp)**: Medida en °C a 10 cm de profundidad (rango: 3.5°C a 12.0°C).
- **Precipitación Acumulada**: Precipitación mensual en milímetros (rango: 15 mm en estío a 280 mm en época de lluvias).
- **pH y Densidad Aparente**: pH freático de 4.2 a 5.2 (suelos ácidos de turba) y densidad aparente de 0.08 a 0.15 g/cm³.
- **Materia Orgánica**: Porcentaje de materia orgánica del suelo entre 70% y 92%.

## 3. MODELADO DE MODELOS ML DE APRENDIZAJE AUTOMÁTICO (CRISP-DM)
El sistema evalúa 5 algoritmos calibrados mediante Platt Scaling y validación cruzada 10-Fold:
1. **XGBoost (Modelo Galardonado)**: $R^2 = 0.9804$, $RMSE = 0.7739$, $ROC-AUC = 0.9612$, $F1\text{-score} = 0.7879$.
2. **Random Forest**: $R^2 = 0.9781$, $RMSE = 0.8102$.
3. **Híbrido Random Forest + MLP**: $R^2 = 0.9654$.
4. **Híbrido SVM + MLP**: $R^2 = 0.9580$.
5. **SVM**: $R^2 = 0.9520$.

Las pruebas estadísticas no paramétricas (Friedman, Wilcoxon-Nemenyi post-hoc y McNemar) confirman la solidez del modelo XGBoost como seleccionador principal para las estimaciones de balance de carbono.
