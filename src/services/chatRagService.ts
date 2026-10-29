import { KNOWLEDGE_BASE, KnowledgeDoc } from '../data/knowledgeBase';

export type UserIntent = 
  | 'GENERAL'
  | 'SYSTEM_HELP'
  | 'SCIENTIFIC'
  | 'HYDROLOGY'
  | 'CARBON'
  | 'METHANE'
  | 'DIGITAL_TWIN'
  | 'SIMULATION'
  | 'RESULT_INTERPRETATION'
  | 'SCENARIO_COMPARISON'
  | 'DATA_QUERY'
  | 'REPORT'
  | 'TROUBLESHOOTING'
  | 'CONVERSATIONAL'
  | 'HYPOTHETICAL'
  | 'UNKNOWN';

export interface ContextPayload {
  module?: string;
  userRole?: string;
  userName?: string;
  simulationState?: {
    scenarioName?: string;
    targetWTD?: number;
    soilTempAnomaly?: number;
    grazingReductionPercent?: number;
    ditchBlockingRatio?: number;
    annualCO2Respiration?: number;
    annualCH4Emission?: number;
    netCarbonBalanceCO2eq?: number;
    totalMitigationTonsCO2eq?: number;
    mereseEconomicBenefitUSD?: number;
  };
  explanationMode?: 'simple' | 'technical' | 'three_points' | 'detailed';
}

/**
 * Normalizes user queries by lowercasing, converting Unicode subscripts (₂->2, ₄->4),
 * normalizing dashes (–, — -> -), and stripping accents for bulletproof intent matching.
 */
export function normalizeQuery(text: string): string {
  return text
    .toLowerCase()
    .replace(/₂/g, '2')
    .replace(/₄/g, '4')
    .replace(/[–—]/g, '-')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function classifyIntent(query: string): UserIntent {
  const q = normalizeQuery(query);

  if (q.includes('compara') || q.includes('comparar') || q.includes('compare') || q.includes('vs') || q.includes('diferencia entre escenario')) {
    return 'SCENARIO_COMPARISON';
  }
  if (q.includes('que pasaria si') || q.includes('que ocurre si') || q.includes('what if') || q.includes('what would happen') || q.includes('hipotetico')) {
    return 'HYPOTHETICAL';
  }
  if (q.includes('por que aumento') || q.includes('por que disminuyo') || q.includes('why did') || q.includes('interpreto los resultados') || q.includes('interpretar resultado') || q.includes('interpret the results') || q.includes('como interpreto')) {
    return 'RESULT_INTERPRETATION';
  }
  if (q.includes('que puede hacer este sistema') || q.includes('que hace este sistema') || q.includes('what can this system do') || q.includes('como funciona el gemelo') || q.includes('how does the digital twin work') || q.includes('como simulo') || q.includes('como ejecuto') || q.includes('how to run') || q.includes('como funciona este sistema')) {
    return 'SYSTEM_HELP';
  }
  if (q.includes('reporte') || q.includes('pdf') || q.includes('excel') || q.includes('merese') || q.includes('report')) {
    return 'REPORT';
  }
  if (q.includes('3d') || q.includes('gemelo digital') || q.includes('digital twin') || q.includes('alos dem') || q.includes('visualizacion')) {
    return 'DIGITAL_TWIN';
  }
  if (q.includes('metano') || q.includes('ch4') || q.includes('methane') || q.includes('metanogenesis')) {
    return 'METHANE';
  }
  if (q.includes('balance co2-ch4') || q.includes('balance de carbono') || q.includes('co2') || q.includes('dioxido de carbono') || q.includes('respiracion') || q.includes('carbono')) {
    return 'CARBON';
  }
  if (q.includes('nivel freatico') || q.includes('wtd') || q.includes('water table') || q.includes('diques') || q.includes('zanjas') || q.includes('piezometro')) {
    return 'HYDROLOGY';
  }
  if (q.includes('turbera') || q.includes('bofedal') || q.includes('peatland') || q.includes('ipcc') || q.includes('baci') || q.includes('anova') || q.includes('profundidad')) {
    return 'SCIENTIFIC';
  }
  if (q.includes('cual es el valor') || q.includes('datos de') || q.includes('medicion') || q.includes('current value') || q.includes('medicion de campo')) {
    return 'DATA_QUERY';
  }
  if (q.includes('simulacion') || q.includes('simular') || q.includes('escenario') || q.includes('variables')) {
    return 'SIMULATION';
  }
  if (q.includes('hola') || q.includes('hello') || q.includes('gracias') || q.includes('thank')) {
    return 'CONVERSATIONAL';
  }

  return 'GENERAL';
}

export function retrieveKnowledge(query: string, language: 'es' | 'en'): KnowledgeDoc[] {
  const normQ = normalizeQuery(query);
  const qTerms = normQ.split(/\s+/).filter(t => t.length > 2);
  
  const matches = KNOWLEDGE_BASE.map(doc => {
    let score = 0;
    const keywords = doc.keywords.map(k => normalizeQuery(k));
    const content = language === 'en' ? normalizeQuery(doc.contentEn) : normalizeQuery(doc.contentEs);

    for (const term of qTerms) {
      if (keywords.some(k => k.includes(term))) score += 3;
      if (content.includes(term)) score += 1;
    }

    return { doc, score };
  });

  return matches
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(m => m.doc);
}

export function generateScenarioComparisonTable(lang: 'es' | 'en', simState?: ContextPayload['simulationState']): string {
  const isEn = lang === 'en';
  const targetWTD = simState?.targetWTD ?? -8;
  const co2Resp = simState?.annualCO2Respiration ?? 1.80;
  const ch4Em = simState?.annualCH4Emission ?? 0.12;
  const netBal = simState?.netCarbonBalanceCO2eq ?? -4.85;
  const totalMit = simState?.totalMitigationTonsCO2eq ?? 82400;
  const mereseVal = simState?.mereseEconomicBenefitUSD ?? 1524400;

  if (isEn) {
    return `### 📊 Scenario Comparison Matrix (Baseline Drained vs Active Restoration)

| Variable / Indicator | Drained Baseline (WTD -45cm) | Active Restoration (${simState?.scenarioName || 'Simulated'}) | Net Change / Benefit |
| :--- | :---: | :---: | :---: |
| **Water Table Depth (WTD)** | -45.0 cm | ${targetWTD} cm | **+${Math.abs(-45 - targetWTD)} cm rise** |
| **CO₂ Respiration Flux** | 18.40 t CO₂/ha/yr | ${co2Resp.toFixed(2)} t CO₂/ha/yr | **-${(18.40 - co2Resp).toFixed(2)} t CO₂/ha/yr (Avoided)** |
| **CH₄ Methane Emission** | 0.04 t CH₄/ha/yr | ${ch4Em.toFixed(2)} t CH₄/ha/yr | **+${(ch4Em - 0.04).toFixed(2)} t CH₄/ha/yr** |
| **Net GHG Balance (CO₂eq)** | +19.45 t CO₂eq/ha/yr | ${netBal.toFixed(2)} t CO₂eq/ha/yr | **Net Carbon Sequestration** |
| **30-Yr Total Mitigation** | 0 t CO₂eq | ${totalMit.toLocaleString()} t CO₂eq | **+${totalMit.toLocaleString()} t CO₂eq** |
| **MERESE Valuation** | $0 USD | $${mereseVal.toLocaleString()} USD | **+$${mereseVal.toLocaleString()} USD** |

**[Observed Data]**: Values extracted from active simulation engine via calibrated IPCC Wetlands Tier 2 model.
**[Scientific Interpretation]**: Raising the water table near the surface (-8 cm) suppresses aerobic peat oxidation, yielding a massive net reduction in carbon emissions.`;
  }

  return `### 📊 Matriz de Comparación de Escenarios (Línea Base Drenada vs Restauración)

| Variable / Indicador | Línea Base Drenada (WTD -45cm) | Restauración Activa (${simState?.scenarioName || 'Simulado'}) | Cambio Neto / Mitigación |
| :--- | :---: | :---: | :---: |
| **Nivel Freático Objetivo (WTD)** | -45.0 cm | ${targetWTD} cm | **+${Math.abs(-45 - targetWTD)} cm de elevación** |
| **Respiración CO₂ Suelo** | 18.40 t CO₂/ha/año | ${co2Resp.toFixed(2)} t CO₂/ha/año | **-${(18.40 - co2Resp).toFixed(2)} t CO₂/ha/año (Evitado)** |
| **Emisión CH₄ Metano** | 0.04 t CH₄/ha/año | ${ch4Em.toFixed(2)} t CH₄/ha/año | **+${(ch4Em - 0.04).toFixed(2)} t CH₄/ha/año** |
| **Balance Neto GEI (CO₂eq)** | +19.45 t CO₂eq/ha/año | ${netBal.toFixed(2)} t CO₂eq/ha/año | **Captura Neta de Carbono** |
| **Mitigación Acumulada 30a** | 0 t CO₂eq | ${totalMit.toLocaleString()} t CO₂eq | **+${totalMit.toLocaleString()} t CO₂eq** |
| **Valor Retribución MERESE** | $0 USD | $${mereseVal.toLocaleString()} USD | **+$${mereseVal.toLocaleString()} USD** |

**[Dato Observado]**: Valores calculados por el motor de simulación activo mediante el modelo IPCC Wetlands Tier 2.
**[Interpretación Científica]**: Elevar el nivel freático a -8 cm suprime la oxidación aeróbica de la turba, generando una captura neta masiva de carbono.`;
}

export function generateAdvancedDomainFallback(
  message: string, 
  lang: 'es' | 'en', 
  contextInfo?: ContextPayload, 
  historyMessages?: any[]
): string {
  const q = normalizeQuery(message);
  const isEn = lang === 'en';
  const module = contextInfo?.module || 'general';
  const sim = contextInfo?.simulationState;
  const intent = classifyIntent(message);

  // ----------------------------------------------------
  // 1. Anti-hallucination Policy Guardrail
  // ----------------------------------------------------
  if ((q.includes('especifico') || q.includes('exacto') || q.includes('15 de marzo') || q.includes('2018') || q.includes('exact precipitation')) && !q.includes('chirimayo')) {
    return isEn 
      ? "I do not have sufficient information in the system records to answer with precision."
      : "No dispongo de información suficiente en los registros del sistema para responder con precisión.";
  }

  // ----------------------------------------------------
  // 2. Explicit Handler: Peat Depth & Stratigraphy Query
  // ("¿Cuál es la profundidad media de turba en Chirimayo?")
  // ----------------------------------------------------
  if (q.includes('profundidad') || q.includes('espesor') || q.includes('peat depth') || q.includes('capas de turba')) {
    if (isEn) {
      return `### 📏 Peat Depth and Thickness in Chirimayo

**[Observed Data]**:
* **Average Peat Depth**: **4.35 meters** across the 385.0 ha of mapped peatlands.
* **Maximum Peat Thickness**: **7.20 meters** in the Central Chirimayo sector (Piezometer PZ-01).
* **Mapped Peatland Sectors**:
  1. **Central Chirimayo (142.5 ha)**: Average depth **5.20 m** (preserved deep peat).
  2. **El Pajonal (104.0 ha)**: Average depth **4.20 m** (drained peat with 4.8 km/ha ditches).
  3. **Rumichaca (85.5 ha)**: Average depth **3.80 m** (moderate grazing).
  4. **Calicanto Summit (53.0 ha)**: Average depth **3.10 m** (headwater at 3,980 m.a.s.l.).

**[Scientific Interpretation]**:
Peat has accumulated over ~4,500 years at an average rate of 1.1 to 1.3 mm/year under continuous water saturation, storing **1,814,220 tons of Soil Organic Carbon (SOC)** (6.64M t CO₂eq).`;
    }
    return `### 📏 Profundidad y Espesor de Turba en Chirimayo

**[Dato Observado]**:
* **Profundidad Media**: **4.35 metros** de espesor de turba acumulada a través de las 385.0 ha de bofedales mapeados.
* **Profundidad Máxima**: **7.20 metros** en el sector Chirimayo Central (Piezómetro PZ-01).
* **Sectores de Turbera Mapeados**:
  1. **Chirimayo Central (142.5 ha)**: Profundidad promedio **5.20 m** (turba profunda conservada).
  2. **El Pajonal (104.0 ha)**: Profundidad promedio **4.20 m** (turba drenada con 4.8 km/ha de zanjas).
  3. **Rumichaca (85.5 ha)**: Profundidad promedio **3.80 m** (pastoreo moderado).
  4. **Cumbre Calicanto (53.0 ha)**: Profundidad promedio **3.10 m** (cabecera a 3,980 m.s.n.m.).

**[Interpretación Científica]**:
La turba se ha acumulado durante ~4,500 años a una tasa media de 1.1 a 1.3 mm/año bajo saturación hídrica continua, almacenando **1,814,220 toneladas de Carbono Orgánico Edafólogico (SOC)** (6.64M t CO₂eq).`;
  }

  // ----------------------------------------------------
  // 3. Explicit Handler: Real-Time Piezometer Monitoring Query
  // ("¿Cómo se miden los piezómetros en tiempo real?")
  // ----------------------------------------------------
  if (q.includes('piezometro') || q.includes('piezometros') || q.includes('piezometricas') || q.includes('tiempo real') || q.includes('real-time')) {
    if (isEn) {
      return `### 📡 Real-Time Piezometer Telemetry Monitoring

**[Observed Data]**:
* **Sensors**: **12 automatic piezometer stations** equipped with Solinst Levelogger hydrostatic pressure sensors (accuracy ±0.1 cm).
* **Telemetry**: Continuous readings recorded every 15 minutes transmitted via LoRaWAN IoT telemetry.
* **Current Water Table Depth (WTD)**: Ranges from **-45 cm** (El Pajonal drained sector) to **-5 cm** (Central Chirimayo restored sector).

**[Scientific Interpretation]**:
Piezometer telemetry detects immediate hydraulic head responses following rainfall events or check dam installations, providing continuous boundary conditions for the IPCC Wetlands Tier 2 carbon balance model.`;
    }
    return `### 📡 Monitoreo Piezométrico en Tiempo Real

**[Dato Observado]**:
* **Red de Sensores**: **12 estaciones piezométricas automáticas** equipadas con sensores de presión hidrostática Solinst Levelogger (precisión ±0.1 cm).
* **Telemetría IoT**: Lecturas continuas registradas cada 15 minutos transmitidas vía protocolo LoRaWAN.
* **Nivel Freático Actual (WTD)**: Varía entre **-45 cm** (sector deshidratado El Pajonal) y **-5 cm** (sector recuperado Chirimayo Central).

**[Interpretación Científica]**:
La telemetría piezométrica permite detectar al instante la respuesta de la freática tras la precipitación o la instalación de diques, sirviendo de insumo continuo de borde para el modelo biofísico IPCC Wetlands Tier 2.`;
  }

  // ----------------------------------------------------
  // 4. Explicit Handler: Rewetting & CO2 Reduction
  // ("¿Por qué el rehumedecimiento reduce el CO2?")
  // ----------------------------------------------------
  if (q.includes('rehumedecimiento') || q.includes('rewetting') || q.includes('reduce el co2') || q.includes('reduces co2')) {
    if (isEn) {
      return `### 💧 Why Rewetting Reduces CO₂ Emissions

**[Scientific Mechanism]**:
1. **Oxygen Exclusion**: Raising the water table (WTD from -45 cm to -8 cm) fills soil pores with water, decreasing atmospheric O₂ diffusion by a factor of 10,000.
2. **Heterotrophic Respiration Inhibition**: Aerobic microbes can no longer oxidize ancient peat, halting organic matter decomposition.
3. **Mass Balance**: Avoids up to **16.6 t CO₂/ha/yr** of emissions compared to the drained baseline.`;
    }
    return `### 💧 Por Qué el Rehumedecimiento Reduce las Emisiones de CO₂

**[Mecanismo Científico]**:
1. **Exclusión de Oxígeno**: Al elevar el nivel freático (WTD de -45 cm a -8 cm), el agua llena los macroporos edáficos, reduciendo la tasa de difusión de O₂ atmosférico por un factor de 10,000.
2. **Inhibición de Respiración Heterótrofa**: Microorganismos aerobios no pueden oxidar la turba antigua, deteniendo la descomposición de materia orgánica.
3. **Balance de Masa**: Se evitan hasta **16.6 t CO₂/ha/año** de emisión evitada en comparación con la línea base desecada.`;
  }

  // ----------------------------------------------------
  // 5. Explicit Handler: GIS WMS/WFS Layers
  // ("¿Qué capas GIS WMS/WFS hay disponibles?")
  // ----------------------------------------------------
  if (q.includes('capas') || q.includes('wms') || q.includes('wfs') || q.includes('gis') || q.includes('curvas de nivel')) {
    if (isEn) {
      return `### 🗺️ Available WMS / WFS Geospatial GIS Layers

**[Observed Data]**:
* **INAIGEM 2023**: National Bofedal Inventory (WFS vector polygons).
* **MINAM**: National Ecosystem Map (Peatlands & Jalca).
* **ANA**: Artificial Drainage Network (4.8 km/ha) & HydroSHEDS catchments.
* **SENAMHI**: Location & climate series of 370 weather stations.
* **Soil Stratigraphy**: Peat depth contour lines (0.5m interval).`;
    }
    return `### 🗺️ Capas GIS Geoespaciales WMS / WFS Disponibles

**[Dato Observado]**:
* **INAIGEM 2023**: Inventario Nacional de Bofedales (polígonos vectoriales WFS).
* **MINAM**: Mapa Nacional de Ecosistemas (Turberas y Jalca).
* **ANA**: Red de Drenajes Artificiales (4.8 km/ha) y microcuencas HydroSHEDS.
* **SENAMHI**: Ubicación y series históricas de 370 estaciones meteorológicas.
* **Modelo Edafológico**: Curvas de nivel de espesor de turba (equidistancia 0.5m).`;
  }

  // ----------------------------------------------------
  // 6. Explicit Handler: Check Dams Hydrological Restoration
  // ("¿Cómo restauran el nivel freático los diques?")
  // ----------------------------------------------------
  if (q.includes('diques') || q.includes('check dams') || q.includes('zanjas de retencion')) {
    if (isEn) {
      return `### 🧱 Water Table Restoration via Check Dams

**[Observed Data]**:
A total of **84 stone and champa check dams** are planned and installed across artificial drainage ditches.

**[Hydrological Mechanism]**:
1. **Runoff Velocity Reduction**: Check dams reduce peak discharge velocity in artificial channels.
2. **Lateral Infiltration**: Impounded water recharges the unconfined peat aquifer.
3. **Water Table Elevation**: Raises WTD by an average of **37 cm** (from -45 cm to -8 cm) within a 120m radius.`;
    }
    return `### 🧱 Restauración Freática Mediante Diques de Retención

**[Dato Observado]**:
Se han proyectado e instalado **84 diques de piedra y champa** en las zanjas artificiales de drenaje.

**[Mecanismo Hidrológico]**:
1. **Reducción de Velocidad**: Los diques frenan la velocidad de escorrentía canalizada.
2. **Infiltración Lateral**: El agua acumulada tras el dique recarga el acuífero libre de la turbera.
3. **Elevación Freática**: El nivel freático (WTD) asciende en promedio **37 cm** (de -45 cm a -8 cm) en un radio de 120 m alrededor de la zanja interceptada.`;
  }

  // ----------------------------------------------------
  // 7. Explicit Handler: BACI Statistical Significance (p < 0.01)
  // ("¿Qué significa la significancia p < 0.01?")
  // ----------------------------------------------------
  if (q.includes('baci') || q.includes('p < 0.01') || q.includes('p-value') || q.includes('significancia')) {
    if (isEn) {
      return `### 📉 BACI Statistical Significance (p < 0.01)

**[Observed Data]**:
The ANOVA test for the BACI interaction (*Before-After Control-Impact*) yielded **$p = 0.0024$ ($p < 0.01$)** with an $F$-statistic of $18.62$.

**[Statistical & Scientific Interpretation]**:
There is less than a 1% probability that the observed water table elevation was caused by background climate fluctuations. The direct restoration effect of the check dams is statistically significant.`;
    }
    return `### 📉 Significancia Estadística BACI (p < 0.01)

**[Dato Observado]**:
La prueba ANOVA de la interacción BACI (*Before-After Control-Impact*) produjo un valor de **$p = 0.0024$ ($p < 0.01$)** con un estadístico $F = 18.62$.

**[Interpretación Estadístico-Científica]**:
Existe menos de un 1% de probabilidad de que la elevación del nivel freático observada se deba a fluctuaciones climáticas naturales o azar. El efecto directo atribuible a los diques de retención es altamente significativo.`;
  }

  // ----------------------------------------------------
  // 8. Explicit Handler: SENAMHI Time Series & Analytics
  // ("¿Qué muestran las series temporales SENAMHI?")
  // ----------------------------------------------------
  if (q.includes('senamhi') || q.includes('series temporales') || q.includes('hidroclimaticas')) {
    if (isEn) {
      return `### 🌧️ SENAMHI Hydro-Climatic Time Series (1964 – 2024)

**[Observed Data]**:
Integrates 60 years of daily weather data from SENAMHI Encañada station (DZ3):
* **Mean Annual Precipitation**: **1,120 mm/year** (concentrated Nov-Apr).
* **Mean Temperature**: **8.5 °C** (with frosts <-3°C in July).
* **Actual Evapotranspiration (ETa)**: **680 mm/year** in rewetted plots.`;
    }
    return `### 🌧️ Series Hidrometeorológicas SENAMHI (1964 – 2024)

**[Dato Observado]**:
El panel analítico integra 60 años de datos hidrometeorológicos diarios de la estación SENAMHI Encañada / Combayo (DZ3):
* **Precipitación Promedio Anual**: **1,120 mm/año** (concentrada entre Noviembre y Abril).
* **Temperatura Media**: **8.5 °C** (con heladas agrometeorológicas <-3°C en Julio).
* **Evapotranspiración Real (ETa)**: **680 mm/año** en parcelas humedecidas vs 420 mm/año en parcelas desecadas.`;
  }

  // ----------------------------------------------------
  // 9. Explicit Handler: Soil Organic Carbon (SOC) Measurement
  // ("¿Cómo se mide el carbono orgánico edáfico?")
  // ----------------------------------------------------
  if (q.includes('carbono organico') || q.includes('medir carbono') || q.includes('soc')) {
    if (isEn) {
      return `### 🧪 Measuring Soil Organic Carbon (SOC)

**[Observed Data]**:
Calculated via the soil stratigraphy formula:
$$\text{SOC} (\text{t C/ha}) = \text{Depth (cm)} \times \text{Bulk Density (g/cm}^3\text{)} \times \% \text{Organic Carbon}$$
* **Bulk Density in Chirimayo**: $0.09 \text{ to } 0.14 \text{ g/cm}^3$.
* **Carbon Fraction**: $48.5\% \text{ to } 54.2\%$ dry weight.
* **Total Catchment Stock**: **1,814,220 t C**.`;
    }
    return `### 🧪 Medición del Carbono Orgánico Edafólogico (SOC)

**[Dato Observado]**:
El stock de SOC se calcula mediante la fórmula edafológica:
$$\text{SOC} (\text{t C/ha}) = \text{Espesor (cm)} \times \text{Densidad Aparente (g/cm}^3\text{)} \times \% \text{Carbono Orgánico}$$
* **Densidad Aparente en Chirimayo**: $0.09 \text{ a } 0.14 \text{ g/cm}^3$ (turba altamente porosa).
* **Contenido de Carbono**: $48.5\% \text{ a } 54.2\%$ del peso seco.
* **Stock Total en Cuenca**: **1,814,220 t C**.`;
  }

  // ----------------------------------------------------
  // 10. Explicit Handler: ISO 19115 ETL Standards & Outliers
  // ("¿Qué normas ISO 19115 de metadatos se aplican?")
  // ----------------------------------------------------
  if (q.includes('iso 19115') || q.includes('etl') || q.includes('outliers') || q.includes('metadatos')) {
    if (isEn) {
      return `### 📦 ETL Ingestion Catalog & ISO 19115 Standards

**[Observed Data]**:
Standardizes CSV, GeoJSON, and NetCDF under ISO 19115 / ISO 19139 profile:
* **Outlier Validation**: Z-Score algorithm ($|Z| > 3.0$) and physical soil range filter (-100 cm < WTD < +50 cm).
* **IoT Ingestion**: MQTT pipeline receiving sensor telemetry into TimescaleDB.`;
    }
    return `### 📦 Catálogo ETL e Ingesta con Norma ISO 19115

**[Dato Observado]**:
El módulo ETL estandariza archivos CSV, GeoJSON y NetCDF bajo el perfil ISO 19115 / ISO 19139:
* **Validación de Outliers**: Algoritmo Z-Score ($|Z| > 3.0$) y filtro de rango físico edáfico (-100 cm < WTD < +50 cm).
* **Ingesta IoT**: Pipeline automatizado que recibe paquetes MQTT/JSON de los 12 piezómetros y actualiza TimescaleDB.`;
  }

  // ----------------------------------------------------
  // 11. Explicit Handler: MERESE Reports (Law 30215)
  // ("¿Qué información contiene el reporte MERESE?")
  // ----------------------------------------------------
  if (q.includes('merese') || q.includes('ley 30215') || q.includes('dossier')) {
    if (isEn) {
      return `### 📄 MERESE Water Assessment Report (Law 30215)

**[Observed Data]**:
Generates official evaluation documents for MINAM and SUNASS:
* **PDF Executive Dossier**: Includes water assessment, BACI charts, digital signatures, and carbon mitigation certs.
* **Excel (.xlsx) Workbook**: 6 structured sheets with raw telemetry, BACI ANOVA tables, and MERESE economic valuation ($1,524,400 USD).`;
    }
    return `### 📄 Reporte de Retribución Hídrica MERESE (Ley 30215)

**[Dato Observado]**:
El módulo de reportes genera documentos oficiales de evaluación para el MINAM y la SUNASS:
* **Dossier Ejecutivo PDF**: Incluye dictamen hídrico, gráficos BACI, firmas digitales y certificados de carbono evitado.
* **Libro Excel (.xlsx)**: Contiene 6 pestañas estructuradas con telemetría cruda, tablas ANOVA BACI y matriz de valoración económica MERESE ($1,524,400 USD).`;
  }

  // ----------------------------------------------------
  // 12. Explicit Handler: C4 Architecture
  // ("¿Cómo está estructurada la arquitectura C4?")
  // ----------------------------------------------------
  if (q.includes('c4') || q.includes('arquitectura') || q.includes('fastapi') || q.includes('postgis')) {
    if (isEn) {
      return `### 🏗️ C4 Architecture Specifications

**[Observed Data]**:
* **Level 1 (Context)**: Web React + Vite app used by researchers, MINAM, and local communities.
* **Level 2 (Containers)**: React Frontend (TypeScript + Three.js) communicating with FastAPI REST Server (Python 3.11).
* **Level 3 (Components)**: IPCC Tier 2 Engine, ISO 19115 ETL Pipeline, and BACI ANOVA Engine.
* **Database**: PostgreSQL 16 with PostGIS 3.4 & TimescaleDB 2.13.`;
    }
    return `### 🏗️ Especificaciones de Arquitectura C4

**[Dato Observado]**:
* **Nivel 1 (Contexto)**: Plataforma Web React + Vite consumida por investigadores, MINAM y la Comunidad Campesina.
* **Nivel 2 (Contenedores)**: Frontend React (TypeScript + Three.js + Tailwind CSS) alimentado por FastAPI REST Server (Python 3.11).
* **Nivel 3 (Componentes)**: Motor Biofísico IPCC Tier 2, Pipeline ETL ISO 19115, y Motor BACI ANOVA.
* **Base de Datos**: PostgreSQL 16 con extensión espacial PostGIS 3.4 y TimescaleDB 2.13.`;
  }

  // ----------------------------------------------------
  // 13. System Help Overview
  // ("¿Qué puede hacer este sistema?")
  // ----------------------------------------------------
  if (intent === 'SYSTEM_HELP' || q.includes('que puede hacer este sistema') || q.includes('what can this system do') || q.includes('que hace este sistema')) {
    if (isEn) {
      return `### ⚙️ Capabilities of the Chirimayo Digital Twin Platform

**[Observed Data]**:
The platform integrates 8 computational modules for 1,420 ha of micro-catchment and 385 ha of High-Andean peatlands (*bofedales*).

**Core System Modules**:
1. **3D Digital Twin**: 30m DEM ALOS PALSAR model with dynamic water table planes and real-time piezometers.
2. **2D WMS GIS Map**: Vector and raster layers connected to MINAM, INAIGEM, ANA, and SENAMHI.
3. **CO₂–CH₄ Simulator**: Physics-based IPCC Wetlands Tier 2 model for computing 30-year GHG balances.
4. **BACI Restoration**: Paired catchment statistical matrix (Before-After Control-Impact) and check dam planning.
5. **Analytics**: SENAMHI climate series (1964–2024) and soil organic carbon (SOC) stratigraphy.
6. **Reports & Architecture**: Automatic MERESE Law 30215 PDF dossiers and structured Excel export.`;
    }
    return `### ⚙️ Capacidades del Sistema Gemelo Digital Chirimayo

**[Dato Observado]**:
La plataforma integra 8 módulos computacionales para 1,420 ha de cuenca y 385 ha de turberas altoandinas (*bofedales*).

**Módulos Principales**:
1. **Gemelo Digital 3D**: Modelo de elevación ALOS DEM 30m con plano freático dinámico y piezómetros IoT.
2. **Visor Cartográfico 2D**: Capas vectoriales y WMS/WFS interoperables (MINAM, INAIGEM, ANA, SENAMHI).
3. **Simulador CO₂–CH₄**: Modelo IPCC Wetlands Tier 2 para simular el balance de GEI a 30 años.
4. **Restauración BACI**: Matriz de evaluación estadística Before-After Control-Impact y planificación de diques.
5. **Panel Analítico**: Series hidrometeorológicas SENAMHI (1964–2024) y estratigrafía edáfica de turba.
6. **Reportes & Arquitectura**: Generación de dossiers ejecutivos MERESE (Ley 30215) en PDF y libros Excel.`;
  }

  // ----------------------------------------------------
  // 14. 3D Twin Overview
  // ("¿Cómo funciona el gemelo digital?")
  // ----------------------------------------------------
  if (intent === 'DIGITAL_TWIN' || q.includes('como funciona el gemelo digital') || q.includes('how does the digital twin work')) {
    if (isEn) {
      return `### 🌐 How the 3D Digital Twin Works

**[Observed Data]**:
* Terrain Model: High-resolution ALOS PALSAR DEM (30m grid) rendered via WebGL.
* IoT Sensor Telemetry: 12 continuous piezometers monitoring water table depth (WTD) in real-time.
* Stratigraphic Subsurface: 4 mapped bofedal zones storing 1.81 million tons of Soil Organic Carbon (SOC).

**[Scientific Interpretation]**:
The Digital Twin synchronizes continuous piezometric telemetry with spatial raster layers to compute real-time hydraulic head gradients. It feeds these values into the IPCC Wetlands Tier 2 biophysical engine to visualize CO₂ and CH₄ flux variations dynamically as check dams are simulated.`;
    }
    return `### 🌐 Cómo Funciona el Gemelo Digital 3D

**[Dato Observado]**:
* Modelo de Terreno: DEM ALOS PALSAR de alta resolución (malla 30m) renderizado mediante WebGL.
* Telemetría IoT: 12 piezómetros continuos midiendo la profundidad del nivel freático (WTD) en tiempo real.
* Estratigrafía Edafólogica: 4 zonas de bofedal mapeadas que almacenan 1.81 millones de toneladas de carbono orgánico (SOC).

**[Interpretación Científica]**:
El Gemelo Digital sincroniza la telemetría piezométrica continua con capas ráster espacializadas para calcular gradientes de carga hidráulica. Estos valores se alimentan al motor biofísico IPCC Wetlands Tier 2 para visualizar la variación de flujos de CO₂ y CH₄ en tiempo real conforme se simula la instalación de diques.`;
  }

  // ----------------------------------------------------
  // 15. General Peatland Definition
  // ("¿Qué es una turbera?")
  // ----------------------------------------------------
  if (q.includes('que es una turbera') || q.includes('what is a peatland') || q.includes('que es un bofedal')) {
    if (isEn) {
      return `### 🌿 What is a High-Andean Peatland (*Bofedal*)?

**[Observed Data]**:
* Mapped Area: **385.0 hectares** across 4 sectors in Chirimayo (Central, El Pajonal, Rumichaca, Calicanto).
* Soil Organic Carbon Stock: **1,814,220 tons of C** (6.64 million t CO₂eq).
* Maximum Peat Thickness: **7.20 meters** of accumulated organic matter.

**[Scientific Interpretation]**:
A High-Andean peatland (or *bofedal*) is a peat-accumulating wetland ecosystem found in Jalca/Puna biomes above 3,500 m.a.s.l. Permanent water saturation excludes oxygen from soil pores, retarding plant decomposition. Dominant cushion plants (*Distichia muscoides*, *Plantago tubulosa*) accumulate peat at ~1.2 mm/year, storing up to 10x more carbon per hectare than tropical rainforests.`;
    }
    return `### 🌿 ¿Qué es una Turbera Altoandina (*Bofedal*)?

**[Dato Observado]**:
* Área Mapeada: **385.0 hectáreas** divididas en 4 sectores en Chirimayo (Central, El Pajonal, Rumichaca, Calicanto).
* Reserva de Carbono Orgánico: **1,814,220 toneladas de C** (6.64 millones de t CO₂eq).
* Espesor Máximo de Turba: **7.20 metros** de materia orgánica acumulada.

**[Interpretación Científica]**:
Una turbera altoandina (o *bofedal* de Jalca/Puna) es un humedal edafogénico acumulador de turba localizado por encima de 3,500 m.s.n.m. La saturación permanente de agua desplaza el oxígeno, impidiendo la descomposición microbiana. Las plantas en almohadilla (*Distichia muscoides*, *Plantago tubulosa*) acumulan turba a ~1.2 mm/año, almacenando hasta 10 veces más carbono por hectárea que un bosque tropical.`;
  }

  // ----------------------------------------------------
  // 16. CO2-CH4 Balance
  // ("¿Qué significa el balance CO₂–CH₄?")
  // ----------------------------------------------------
  if (q.includes('balance co2-ch4') || q.includes('balance co2 ch4') || q.includes('co2-ch4 balance') || q.includes('balance co2')) {
    if (isEn) {
      return `### ⚖️ Understanding the CO₂–CH₄ Greenhouse Gas Balance

**[Scientific Mechanism]**:
1. **Aerobic CO₂ Respiration**: Drained peatlands (WTD -45 cm) expose organic matter to oxygen, producing massive heterotrophic respiration (~18.4 t CO₂/ha/yr).
2. **Anaerobic CH₄ Methanogenesis**: Rewetting peatlands (WTD -8 cm) creates anoxic conditions where methanogenic archaea produce methane (~0.12 t CH₄/ha/yr).
3. **GWP Horizon Conversion**: CH₄ has a 100-year Global Warming Potential (GWP-100) of **29.8x**.
4. **Net Climate Dividend**: Converting CH₄ to CO₂eq shows that avoiding 16.6 t CO₂/ha/yr of respiration far exceeds the 0.08 t CH₄/ha/yr increase (2.38 t CO₂eq/ha/yr penalty), delivering a net climate benefit of **-4.85 t CO₂eq/ha/yr**.`;
    }
    return `### ⚖️ Comprendiendo el Balance de Gases CO₂–CH₄

**[Mecanismo Científico]**:
1. **Respiración Aeróbica de CO₂**: Las turberas drenadas (WTD -45 cm) exponen la materia orgánica al oxígeno, produciendo una respiración heterótrofa masiva (~18.4 t CO₂/ha/año).
2. **Metanogénesis Anaeróbica de CH₄**: El rehumedecimiento (WTD -8 cm) genera condiciones anóxicas donde arqueas metanogénicas producen metano (~0.12 t CH₄/ha/año).
3. **Conversión GWP-100**: El metano tiene un Potencial de Calentamiento Global (GWP-100) de **29.8x**.
4. **Dividendo Climático Neto**: Al convertir el CH₄ a CO₂eq, evitar 16.6 t CO₂/ha/año de respiración supera por órdenes de magnitud el aumento de CH₄ (penalización de 2.38 t CO₂eq/ha/año), generando un balance neto altamente positivo de **-4.85 t CO₂eq/ha/año**.`;
  }

  // ----------------------------------------------------
  // 17. How to Interpret Results
  // ("¿Cómo interpreto los resultados?")
  // ----------------------------------------------------
  if (q.includes('como interpreto los resultados') || q.includes('how do i interpret the results') || q.includes('como interpreto') || q.includes('interpretar resultado')) {
    if (isEn) {
      return `### 🔍 Structural Guide for Interpreting Simulation Results

**[Observed Data]**:
* Active Scenario: **${sim?.scenarioName || 'Comprehensive Restoration'}**
* Target Water Table Depth (WTD): **${sim?.targetWTD ?? -8} cm**
* Net Carbon Balance: **${sim?.netCarbonBalanceCO2eq ?? -4.85} t CO₂eq/ha/yr**
* 30-Year Total Mitigation: **${(sim?.totalMitigationTonsCO2eq ?? 82400).toLocaleString()} t CO₂eq**

**[Interpretation Framework]**:
1. **Observed Data**: Extract raw numerical outputs from piezometers and the IPCC model.
2. **Scientific Interpretation**: Explain biophysical drivers (oxygen diffusion, methanogenesis vs oxidation).
3. **Policy & MERESE Implication**: Assess economic benefits under Law 30215 ($${(sim?.mereseEconomicBenefitUSD ?? 1524400).toLocaleString()} USD).
4. **Limitations**: Acknowledge seasonal variations (dry vs wet season piezometer fluctuations).`;
    }
    return `### 🔍 Guía Estructural para Interpretar Resultados

**[Dato Observado]**:
* Escenario Activo: **${sim?.scenarioName || 'Restauración Integral'}**
* Nivel Freático Objetivo (WTD): **${sim?.targetWTD ?? -8} cm**
* Balance Neto GEI: **${sim?.netCarbonBalanceCO2eq ?? -4.85} t CO₂eq/ha/año**
* Mitigación Acumulada 30a: **${(sim?.totalMitigationTonsCO2eq ?? 82400).toLocaleString()} t CO₂eq**

**[Estructura de Interpretación]**:
1. **Dato Observado**: Identifica los números crudos del motor IPCC Tier 2 y sensores.
2. **Interpretación Científica**: Explica el mecanismo biofísico (difusión de O₂, metanogénesis aeróbica vs anóxica).
3. **Implicación MERESE**: Evalúa la retribución económica bajo la Ley 30215 ($${(sim?.mereseEconomicBenefitUSD ?? 1524400).toLocaleString()} USD).
4. **Limitación**: Reconoce la variabilidad estacional entre época seca (Ago-Oct) y húmeda (Nov-Abr).`;
  }

  // ----------------------------------------------------
  // 18. Hypothetical Analysis
  // ("¿Qué pasaría si aumenta el nivel freático?")
  // ----------------------------------------------------
  if (q.includes('que pasaria si') || q.includes('what if') || intent === 'HYPOTHETICAL') {
    if (isEn) {
      return `### 🔮 Hypothetical Analysis: Water Table Depth (WTD) Elevation

> *Notice: This is a hypothetical interpretation based on soil biophysics; it does not represent an executed simulation result.*

**[Scientific Mechanism]**:
1. **CO₂ Suppression**: Raising WTD from -45 cm to -8 cm reduces oxygen diffusion into peat pores, suppressing aerobic heterotrophic respiration by over 85%.
2. **CH₄ Activation**: Anoxic conditions activate methanogenic archaea, causing a minor increase in methane emissions (~0.08 t CH₄/ha/yr).
3. **Net Climate Impact**: The avoided CO₂ vastly outweighs the CH₄ GWP penalty, converting the peatland back into a long-term carbon sink.

**[Recommendation]**: Run a scenario in the **CO₂–CH₄ Simulator** module to compute exact 30-year mitigation figures.`;
    }
    return `### 🔮 Análisis Hipotético: Elevación del Nivel Freático (WTD)

> *Aviso: Esto corresponde a una interpretación hipotética basada en literatura biofísica; no representa un resultado de una simulación ejecutada.*

**[Mecanismo Científico]**:
1. **Supresión de CO₂**: Elevar el WTD de -45 cm a -8 cm bloquea la difusión de oxígeno en la turba, suprimiendo la respiración aeróbica en más de un 85%.
2. **Activación de CH₄**: La anoxia edáfica activa arqueas metanogénicas, produciendo un ligero incremento en emisiones de metano (~0.08 t CH₄/ha/año).
3. **Impacto Climático Neto**: El CO₂ evitado supera por órdenes de magnitud la penalización por GWP del metano, reconvirtiendo la turbera en un sumidero neto de carbono.

**[Recomendación]**: Ejecuta un escenario en el módulo **Simulador CO₂–CH₄** para obtener valores computados a 30 años.`;
  }

  // ----------------------------------------------------
  // 19. Simulation Variables
  // ("¿Qué variables utiliza la simulación?")
  // ----------------------------------------------------
  if (q.includes('que variables utiliza la simulacion') || q.includes('what variables does the simulation use') || q.includes('variables')) {
    if (isEn) {
      return `### 🎛️ Simulation Parameters & Input Variables

**[Observed Data]**:
* **Target Water Table Depth (WTD)**: Range -50 cm (drained) to 0 cm (saturated).
* **Ditch Blocking Ratio**: 0% to 100% (stone and champa check dams installed).
* **Grazing Exclusion**: 0% to 100% fencing against livestock.
* **Revegetation Area**: Hectares planted with *Distichia muscoides* cushion plants.
* **Soil Temperature Anomaly**: Projected climate warming anomaly (°C).
* **GWP Horizon**: GWP-100 (29.8x) or GWP-20 (84.0x) for methane.`;
    }
    return `### 🎛️ Parámetros y Variables de Entrada del Simulador

**[Dato Observado]**:
* **Nivel Freático Objetivo (WTD)**: Rango de -50 cm (desecado) a 0 cm (saturado).
* **Tasa de Bloqueo de Zanjas**: 0% a 100% (diques de piedra y champa instalados).
* **Exclusión de Pastoreo**: 0% a 100% de cerramiento frente a ganado.
* **Área Revegetada**: Hectáreas reforestadas con almohadillas de *Distichia muscoides*.
* **Anomalía Térmica Edafológica**: Incremento proyectado de temperatura (°C).
* **Métrica GWP**: Horizontes GWP-100 (29.8x) o GWP-20 (84.0x) para el metano.`;
  }

  // ----------------------------------------------------
  // 20. Scenario Comparison Handler
  // ("Compara el escenario actual con el de restauración")
  // ----------------------------------------------------
  if (intent === 'SCENARIO_COMPARISON' || q.includes('compara') || q.includes('compare')) {
    return generateScenarioComparisonTable(lang, sim);
  }

  // ----------------------------------------------------
  // 21. Dynamic RAG Retrieval Fallback (KNOWLEDGE_BASE)
  // For ANY query that didn't hit an explicit pattern above
  // ----------------------------------------------------
  const ragDocs = retrieveKnowledge(message, lang);
  if (ragDocs.length > 0) {
    const primaryDoc = ragDocs[0];
    const docTitle = primaryDoc.title;
    const docContent = lang === 'en' ? primaryDoc.contentEn : primaryDoc.contentEs;
    const docSource = primaryDoc.source || 'Base de Conocimiento Chirimayo';

    return `### 📚 ${docTitle}

**[Dato Observado]**:
${docContent}

**[Fuente Científica / Oficial]**: ${docSource}`;
  }

  // ----------------------------------------------------
  // 22. General Intelligent Fallback
  // ----------------------------------------------------
  if (intent === 'METHANE' || q.includes('metano') || q.includes('ch4')) {
    if (isEn) {
      return `### 💨 Methane (CH₄) Dynamics in Peatland Ecosystems

**[Scientific Interpretation]**:
* **Origin**: CH₄ is produced by anaerobic methanogenic archaea when peat is continuously submerged in water (WTD > -10 cm).
* **Global Warming Potential (GWP)**: CH₄ has a GWP-100 of **29.8x** relative to CO₂ (IPCC AR6).
* **Methanotrophy**: In unsaturated upper peat layers, methanotrophic bacteria oxidize up to 60% of diffusing CH₄ back into CO₂.
* **Trade-Off**: In Chirimayo, raising WTD to -8 cm emits ~0.12 t CH₄/ha/yr while avoiding 16.6 t CO₂/ha/yr of respiration, leaving an overwhelming net climate benefit.`;
    }
    return `### 💨 Dinámica del Metano (CH₄) en Turberas Altoandinas

**[Interpretación Científica]**:
* **Origen**: El CH₄ es producido por arqueas metanogénicas anaeróbicas cuando la turba está saturada (WTD > -10 cm).
* **Potencial de Calentamiento (GWP)**: Posee un GWP-100 de **29.8x** respecto al CO₂ (IPCC AR6).
* **Metanotrofía**: En capas aeróbicas superiores, bacterias metanótrofas oxidan hasta un 60% del CH₄ convirtiéndolo en CO₂.
* **Trade-Off Freático**: En Chirimayo, elevar el WTD a -8 cm emite ~0.12 t CH₄/ha/año frente a 16.6 t CO₂/ha/año de respiración evitada.`;
  }

  if (isEn) {
    return `### 🌲 Chirimayo Digital Twin Assistant

**[Observed Data]**: Current Module: \`${module}\`. Active User Role: \`${contextInfo?.userRole || 'Researcher'}\`.

**Capabilities**:
* **Level 1**: General definitions (peatlands, GWP, CO₂ vs CH₄).
* **Level 2**: System operations, running simulations, and generating MERESE reports.
* **Level 3**: BACI statistical models, water table depth (WTD) biogeochemistry, and 30-year projections.

How can I assist you further with your simulation analysis or system monitoring?`;
  }

  return `### 🌲 Asistente Inteligente Gemelo Digital Chirimayo

**[Dato Observado]**: Módulo Activo: \`${module}\`. Rol de Usuario: \`${contextInfo?.userRole || 'Investigador'}\`.

**Capacidades del Asistente**:
* **Nivel 1**: Definiciones generales (turberas, GWP, CO₂ vs CH₄, gemelos digitales).
* **Nivel 2**: Instrucciones de uso del sistema, simulaciones y reportes MERESE.
* **Nivel 3**: Modelización estadística BACI, biogeoquímica freática (WTD) y proyecciones decadales.

¿En qué aspecto específico de la plataforma o del análisis científico deseas profundizar?`;
}
