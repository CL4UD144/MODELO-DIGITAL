export interface KnowledgeDoc {
  id: string;
  category: 'system' | 'science' | 'case_study' | 'methodology';
  title: string;
  keywords: string[];
  contentEs: string;
  contentEn: string;
  source?: string;
}

export const KNOWLEDGE_BASE: KnowledgeDoc[] = [
  // --- SYSTEM ARCHITECTURE & MODULE GUIDES ---
  {
    id: 'sys-01',
    category: 'system',
    title: 'Visión General del Gemelo Digital Chirimayo',
    keywords: ['sistema', 'gemelo digital', 'qué hace', 'overview', 'digital twin', 'chirimayo', 'modulos', 'funcionalidad'],
    contentEs: `El Gemelo Digital de Turberas Chirimayo es una plataforma computacional integral diseñada para el monitoreo hidrológico, la simulación del balance de carbono (CO₂–CH₄) y la evaluación de impacto de obras de restauración mediante la metodología BACI. Cuenta con 8 módulos interconectados:
1. Gemelo 3D: Modelo topográfico 3D (ALOS DEM 30m) con nivel freático dinámico y sensores en tiempo real.
2. Cartografía GIS 2D: Capas vectoriales/raster interoperables WMS/WFS (MINAM, INAIGEM, ANA, SENAMHI).
3. Simulador CO₂–CH₄: Modelo IPCC Wetlands Tier 2 para simular el balance de GEI y retribución MERESE.
4. Restauración BACI: Matriz de evaluación estadística Before-After-Control-Impact y diques de retención.
5. Panel Analítico: Series temporales hidrometeorológicas SENAMHI (1964-2024) y estratigrafía edáfica.
6. Catálogo ETL: Ingesta de datos de campo, sensores IoT y metadatos ISO 19115.
7. Reportes: Generación de dossiers ejecutivos PDF y libros de cálculo Excel (.xlsx) estructurados.
8. Arquitectura: Especificaciones técnicas C4, esquemas DDL PostGIS/TimescaleDB y FastAPI REST.`,
    contentEn: `The Chirimayo Peatland Digital Twin is an integrated computational platform designed for hydrological monitoring, carbon balance simulation (CO₂–CH₄), and restoration impact assessment via BACI methodology. It features 8 interconnected modules:
1. 3D Twin: 3D topographic model (ALOS DEM 30m) with dynamic water table and real-time sensors.
2. 2D GIS Map: Interoperable vector/raster WMS/WFS layers (MINAM, INAIGEM, ANA, SENAMHI).
3. CO₂–CH₄ Simulator: IPCC Wetlands Tier 2 model for simulating GHG balances and MERESE valuation.
4. BACI Restoration: Statistical Before-After-Control-Impact evaluation matrix and check dams.
5. Analytics Dashboard: SENAMHI hydro-climatic time series (1964-2024) and soil stratigraphy.
6. ETL Catalog: Ingestion of field datasets, IoT telemetry, and ISO 19115 metadata.
7. Reports: PDF executive dossiers and structured Excel (.xlsx) calculation workbooks.
8. Architecture: C4 technical specs, PostGIS/TimescaleDB DDL schemas, and FastAPI REST endpoints.`,
    source: 'Manual de Sistema v2.4 - Gemelo Digital Chirimayo'
  },
  {
    id: 'sys-02',
    category: 'system',
    title: 'Guía de Ejecución de Simulaciones de Carbono',
    keywords: ['simulación', 'ejecutar simulación', 'parámetros', 'escenario', 'wtd', 'pastoreo', 'diques', 'how to simulate'],
    contentEs: `Para ejecutar una simulación en el módulo "Simulador de Restauración & Balance CO₂–CH₄":
1. Selecciona un escenario preestablecido (Línea Base Drenada, Restauración Integral, Solo Revegetación o Cambio Climático SSP) o ajusta los parámetros manualmente.
2. Parámetros clave:
   - Nivel Freático Objetivo (WTD): Profundidad en cm (-50 cm desecado, -15 a -8 cm óptimo, 0 cm saturado).
   - Tasa de Bloqueo de Zanjas: % de diques de piedra y champa instalados (máx. 100%).
   - Exclusión de Pastoreo: % de cerramiento frente a ganado ovino/vacuno.
   - Área Revegetada: Hectáreas sembradas con almohadillas nativas (Distichia muscoides / Sphagnum).
   - Anomalía Térmica: Incremento proyectado de temperatura del suelo (°C).
   - Métrica GWP: GWP-100 (29.8x) o GWP-20 (84.0x) para el metano.
3. El motor calculará automáticamente la reducción de respiración de CO₂, la emisión de metano (CH₄), la mitigación acumulada a 30 años y la valoración económica MERESE ($/t CO₂eq).`,
    contentEn: `To run a simulation in the "CO₂–CH₄ Restoration & Balance Simulator" module:
1. Select a preset scenario (Drained Baseline, Comprehensive Restoration, Revegetation Only, or Climate SSP) or adjust parameters manually.
2. Key parameters:
   - Target Water Table Depth (WTD): Depth in cm (-50 cm drained, -15 to -8 cm optimal, 0 cm saturated).
   - Ditch Blocking Ratio: % of stone/champa dams installed (up to 100%).
   - Grazing Exclusion: % fencing exclusion against livestock.
   - Revegetation Area: Hectares planted with native cushion plants (Distichia muscoides / Sphagnum).
   - Soil Temp Anomaly: Projected soil temperature increase (°C).
   - GWP Horizon: GWP-100 (29.8x) or GWP-20 (84.0x) for methane.
3. The engine automatically calculates CO₂ respiration reduction, methane (CH₄) emissions, 30-year cumulative mitigation, and MERESE valuation ($/t CO₂eq).`,
    source: 'Guía de Usuario - Simulador IPCC Tier 2'
  },

  // --- SCIENTIFIC & ECOLOGICAL DOMAIN ---
  {
    id: 'sci-01',
    category: 'science',
    title: 'Turberas Altoandinas (Bofedales) y Nivel Freático (WTD)',
    keywords: ['turbera', 'bofedal', 'nivel freático', 'wtd', 'saturación', 'descomposición', 'jalca', 'peatland', 'water table'],
    contentEs: `Una turbera altoandina (o bofedal de la Jalca/Puna) es un humedal edafogénico acumular de turba formado por la descomposición incompleta de materia orgánica bajo saturación hídrica continua.
- Nivel Freático (WTD - Water Table Depth): Es la distancia desde la superficie del suelo hasta el nivel de saturación de agua.
- WTD Desecado (ej. -45 cm): Expone la turba a la oxidación aeróbica por oxígeno atmosférico, convirtiendo la turbera de un sumidero a una fuente masiva de CO₂.
- WTD Óptimo (-15 cm a -5 cm): Suprime casi al 100% la respiración aeróbica de CO₂ sin activar metanogénesis masiva.
- WTD Inundado (> 0 cm): Crea condiciones strictly anóxicas que estimulan la metanogénesis por arqueas anaeróbicas (aumento de CH₄).`,
    contentEn: `High-Andean peatlands (bofedales) are peat-accumulating wetlands formed by the incomplete decomposition of organic matter under continuous water saturation.
- Water Table Depth (WTD): The distance from soil surface to the water saturation level.
- Drained WTD (e.g. -45 cm): Exposes peat to aerobic oxidation by atmospheric oxygen, turning the peatland from a carbon sink into a massive CO₂ source.
- Optimal WTD (-15 cm to -5 cm): Suppresses nearly 100% of aerobic CO₂ respiration without triggering massive methanogenesis.
- Flooded WTD (> 0 cm): Creates strictly anoxic conditions that stimulate methanogenesis by anaerobic archaea (increased CH₄).`,
    source: 'IPCC Wetlands Supplement (2013) & INAIGEM 2023'
  },
  {
    id: 'sci-02',
    category: 'science',
    title: 'Diferencia entre CO₂ y CH₄ en Balance de Carbono',
    keywords: ['co2', 'ch4', 'metano', 'dióxido de carbono', 'gwp', 'gwp-100', 'gwp-20', 'diferencia co2 ch4'],
    contentEs: `Diferencias fundamentales entre CO₂ (Dióxido de Carbono) y CH₄ (Metano):
1. Origen Bioquímico:
   - CO₂: Producido por la respiración heterótrofa aeróbica del suelo cuando el nivel freático cae y entra O₂.
   - CH₄: Producido por arqueas metanogénicas en condiciones puramente anaeróbicas (suelo saturado de agua).
2. Potencial de Calentamiento Global (GWP):
   - CO₂: GWP = 1.0 (Gas de referencia).
   - CH₄ GWP-100: 29.8x más potente que el CO₂ en un horizonte de 100 años (IPCC AR6).
   - CH₄ GWP-20: 84.0x más potente que el CO₂ en un horizonte de 20 años.
3. Trade-Off Freático: Elevar el nivel freático reduce drásticamente las emisiones de CO₂ (toneladas por hectárea), mientras que genera pequeñas emisiones de CH₄ (kilos por hectárea). Al convertir el CH₄ a CO₂ equivalente (CO₂eq), el balance neto resulta abrumadoramente positivo a favor de la captura neta de carbono.`,
    contentEn: `Fundamental differences between CO₂ (Carbon Dioxide) and CH₄ (Methane):
1. Biochemical Origin:
   - CO₂: Produced by aerobic heterotrophic soil respiration when the water table falls and O₂ enters.
   - CH₄: Produced by methanogenic archaea under strictly anaerobic conditions (waterlogged soil).
2. Global Warming Potential (GWP):
   - CO₂: GWP = 1.0 (Reference gas).
   - CH₄ GWP-100: 29.8x more potent than CO₂ over a 100-year horizon (IPCC AR6).
   - CH₄ GWP-20: 84.0x more potent than CO₂ over a 20-year horizon.
3. Water Table Trade-Off: Raising the water table drastically reduces CO₂ emissions (tons per hectare) while producing minor CH₄ emissions (kilograms per hectare). Converting CH₄ to CO₂ equivalent (CO₂eq) leaves a net carbon sequestration balance.`,
    source: 'IPCC AR6 Working Group I & Wetlands Supplement'
  },
  {
    id: 'sci-03',
    category: 'methodology',
    title: 'Metodología BACI (Before-After Control-Impact)',
    keywords: ['baci', 'before-after control-impact', 'metodología baci', 'evaluación baci', 'control vs impacto'],
    contentEs: `La metodología BACI (Before-After Control-Impact) es el estándar estadístico más riguroso para evaluar proyectos de restauración ecosistémica:
- Control: Parcela en microcuenca par sin diques que refleja las variaciones climáticas naturales (lluvia, temperatura).
- Impacto: Parcela en la microcuenca Chirimayo donde se instalan los diques de retención y cerramientos de pastoreo.
- Before (Antes): Mediciones históricas pre-intervención (2018-2020).
- After (Después): Mediciones post-intervención (2021-2024).
La interacción ANOVA del efecto BACI permite aislar con precisión el impacto directo del proyecto de restauración frente a las fluctuaciones del clima regional.`,
    contentEn: `The BACI (Before-After Control-Impact) methodology is the gold standard for statistically evaluating ecosystem restoration:
- Control: Plot in a paired catchment without dams reflecting natural climate variability (rain, temp).
- Impact: Plot in Chirimayo catchment where retention check dams and grazing fences were built.
- Before: Historical pre-intervention measurements (2018-2020).
- After: Post-intervention measurements (2021-2024).
The ANOVA BACI interaction term isolates the direct restoration impact from background regional climate fluctuations.`,
    source: 'Stewart-Oaten et al. (1986) & CIAT Restoration Framework'
  },

  // --- CASE STUDY: MICROCUENCA CHIRIMAYO ---
  {
    id: 'cs-01',
    category: 'case_study',
    title: 'Caso de Estudio: Microcuenca Chirimayo, Jalca de Cajamarca',
    keywords: ['chirimayo', 'cajamarca', 'jalca', 'caso de estudio', 'ubicación', 'superficie', 'diques', 'bofedales chirimayo'],
    contentEs: `Información del Caso de Estudio Chirimayo:
- Ubicación: Jalca de Cajamarca, Perú (Distrito de Encañada / Combayo).
- Altitud: 3,680 a 4,060 m.s.n.m.
- Superficie Total Cuenca: 1,420 hectáreas.
- Área de Turberas Mapeadas: 385.0 hectáreas divididas en 4 sectores principales:
  1. Turbera Chirimayo Central (142.5 ha - espesor turba 5.2m - Conservación/Restauración).
  2. Sector Drenado El Pajonal (104.0 ha - espesor turba 4.2m - Drenaje severo con zanjas de 4.8 km/ha).
  3. Bofedal Rumichaca (85.5 ha - espesor turba 3.8m - Pastoreo moderado).
  4. Bofedal Cumbre Calicanto (53.0 ha - 3,980m - Cabecera conservada).
- Obras Hidrológicas Instaladas: 84 diques de piedra y champa escalonados en zanjas artificiales.
- Red de Monitoreo: 12 piezómetros continuos y datos de 370 estaciones SENAMHI DZ3.
- Stock Total de Carbono Orgánico (SOC): 1.81 millones de toneladas de C (equivalente a 6.64 millones de t CO₂eq).`,
    contentEn: `Chirimayo Case Study Dataset:
- Location: Cajamarca Jalca, Peru (Encañada / Combayo district).
- Elevation: 3,680 to 4,060 m.a.s.l.
- Total Catchment Area: 1,420 hectares.
- Mapped Peatland Area: 385.0 hectares across 4 main sectors:
  1. Central Chirimayo Peatland (142.5 ha - 5.2m peat depth - Conservation/Restoration).
  2. El Pajonal Drained Sector (104.0 ha - 4.2m peat depth - Severe drainage with 4.8 km/ha ditches).
  3. Rumichaca Peatland (85.5 ha - 3.8m peat depth - Moderate grazing).
  4. Calicanto Summit Peatland (53.0 ha - 3,980m - Preserved headwater).
- Installed Hydrological Works: 84 stone and champa check dams along artificial ditches.
- Monitoring Network: 12 continuous piezometers and data from 370 SENAMHI DZ3 stations.
- Total Soil Organic Carbon (SOC) Stock: 1.81 million tons of C (6.64 million t CO₂eq equivalent).`,
    source: 'Inventario INAIGEM 2023 & Proyecto MERESE Chirimayo'
  }
];
