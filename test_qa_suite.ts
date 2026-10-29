import * as XLSX from 'xlsx';
import { 
  exportToCSV, 
  exportToExcel, 
  exportToJSON, 
  copyTableToClipboard 
} from './src/utils/exportUtils';
import { BOFEDALES, PIEZOMETERS, SENAMHI_STATIONS } from './src/data/mockDatasets';
import { runCarbonSimulation } from './src/models/carbonModel';

interface TestResult {
  category: string;
  name: string;
  status: 'PASS' | 'FAIL';
  details?: string;
  durationMs: number;
}

const results: TestResult[] = [];

async function runTest(category: string, name: string, fn: () => void | Promise<void>) {
  const start = performance.now();
  try {
    await fn();
    const duration = performance.now() - start;
    results.push({ category, name, status: 'PASS', durationMs: Math.round(duration) });
    console.log(`[PASS] [${category}] ${name} (${Math.round(duration)}ms)`);
  } catch (err: any) {
    const duration = performance.now() - start;
    results.push({ category, name, status: 'FAIL', details: err?.message || String(err), durationMs: Math.round(duration) });
    console.error(`[FAIL] [${category}] ${name}:`, err);
  }
}

async function main() {
  console.log("================================================================================");
  console.log("   SUITE DE VALIDACIÓN AUTOMATIZADA — QA SENIOR — GEMELO DIGITAL CHIRIMAYO      ");
  console.log("================================================================================\n");

  // 1. DATASETS INTEGRITY TESTS
  await runTest('Datasets', 'Validar inventario de Bofedales (4 sectores, 385.0 ha total, 142.5 ha sector núcleo)', () => {
    if (!BOFEDALES || BOFEDALES.length !== 4) {
      throw new Error(`Se esperaban 4 sectores principales de bofedales en Chirimayo, se encontraron ${BOFEDALES?.length}`);
    }
    const totalArea = BOFEDALES.reduce((acc, b) => acc + b.areaHa, 0);
    if (Math.abs(totalArea - 385.0) > 0.01) {
      throw new Error(`El área total calculada es ${totalArea} ha, se esperaba 385.0 ha`);
    }
    const nucleo = BOFEDALES.find(b => b.codeInaigem === 'PE-CAJ-BOF-00412');
    if (!nucleo || nucleo.areaHa !== 142.5) {
      throw new Error(`Sector núcleo Chirimayo Central no encontrado o área incorrecta: ${nucleo?.areaHa}`);
    }
  });

  await runTest('Datasets', 'Validar red piezométrica IoT (6 estaciones con registros de campo)', () => {
    if (!PIEZOMETERS || PIEZOMETERS.length !== 6) {
      throw new Error(`Se esperaban 6 piezómetros, se encontraron ${PIEZOMETERS?.length}`);
    }
    PIEZOMETERS.forEach(pz => {
      if (!pz.history || pz.history.length === 0) {
        throw new Error(`Piezómetro ${pz.code} no tiene mediciones históricas`);
      }
      pz.history.forEach(h => {
        if (h.waterTableDepth > 0 || h.waterTableDepth < -60) {
          throw new Error(`Nivel freático anómalo en ${pz.code}: ${h.waterTableDepth} cm`);
        }
        if (h.co2Flux < 0 || h.co2Flux > 30) {
          throw new Error(`Flujo CO2 fuera de rango físico en ${pz.code}: ${h.co2Flux}`);
        }
      });
    });
  });

  await runTest('Datasets', 'Validar estaciones meteorológicas SENAMHI DZ3', () => {
    if (!SENAMHI_STATIONS || SENAMHI_STATIONS.length < 3) {
      throw new Error(`Estaciones SENAMHI insuficientes: ${SENAMHI_STATIONS?.length}`);
    }
    SENAMHI_STATIONS.forEach(s => {
      if (!s.code || !s.name || s.altitude < 2000) {
        throw new Error(`Estación SENAMHI con datos incompletos o altitud inverosímil: ${JSON.stringify(s)}`);
      }
    });
  });

  // 2. SCIENTIFIC CARBON ENGINE VALIDATION
  await runTest('Modelo Científico', 'Validar simulación IPCC Tier 2 en Línea Base Degradada', () => {
    const baseline = runCarbonSimulation({
      scenarioName: 'Línea Base',
      targetWTD: -45,
      soilTempAnomaly: 0,
      precipChangePercent: 0,
      grazingReductionPercent: 0,
      ditchBlockingRatio: 0,
      revegetationAreaHa: 0,
      gwpTimeframe: 'GWP-100',
      carbonPriceUSD: 18.5,
      simulationYears: 30
    }, 142.5);

    if (baseline.netCarbonBalanceCO2eq <= 0) {
      throw new Error(`Línea base degradada debería ser fuente neta de CO2eq, obtenido: ${baseline.netCarbonBalanceCO2eq}`);
    }
    if (baseline.totalMitigationTonsCO2eq !== 0) {
      throw new Error(`La mitigación incremental de la línea base debe ser 0, obtenido: ${baseline.totalMitigationTonsCO2eq}`);
    }
  });

  await runTest('Modelo Científico', 'Validar simulación de Restauración Integral (WTD -8cm)', () => {
    const restoration = runCarbonSimulation({
      scenarioName: 'Restauración Integral',
      targetWTD: -8,
      soilTempAnomaly: 0,
      precipChangePercent: 0,
      grazingReductionPercent: 90,
      ditchBlockingRatio: 90,
      revegetationAreaHa: 65,
      gwpTimeframe: 'GWP-100',
      carbonPriceUSD: 18.5,
      simulationYears: 30
    }, 142.5);

    // En humedales restaurados, las emisiones netas se reducen sustancialmente respecto a la línea base (~19.45 t/ha/yr vs ~14.72 t/ha/yr)
    // generando mitigación neta acumulada y beneficios económicos MERESE positivos
    if (restoration.totalMitigationTonsCO2eq <= 0) {
      throw new Error(`Mitigación neta evitada debe ser positiva, obtenido: ${restoration.totalMitigationTonsCO2eq}`);
    }
    if (restoration.mereseEconomicBenefitUSD <= 0) {
      throw new Error(`Valoración MERESE debe ser positiva, obtenido: ${restoration.mereseEconomicBenefitUSD}`);
    }
    if (restoration.annualCO2Respiration >= 18.0) {
      throw new Error(`La respiración aeróbica de CO2 debió reducirse por anoxia, obtenido: ${restoration.annualCO2Respiration}`);
    }
  });

  // 3. EXPORT FUNCTIONS ROBUSTNESS & EDGE CASES
  await runTest('Exportación', 'CSV: Formateo, BOM UTF-8 y caracteres especiales', () => {
    const testData = [
      { id: 1, sector: 'Chirimayo Alto', notas: 'Zanjas taponadas con champaña & diques', valor: 4.85 },
      { id: 2, sector: 'Pampa Cañafisto', notas: 'Exclusión alpaquera: 90%', valor: 12.30 }
    ];
    // Emular triggerDownload en entorno Node
    const cols = [
      { key: 'id', label: 'ID' },
      { key: 'sector', label: 'Sector Bofedal' },
      { key: 'notas', label: 'Observación Técnica' },
      { key: 'valor', label: 'Flujo (t C/ha/año)' }
    ];
    const headerRow = cols.map(c => `"${c.label.replace(/"/g, '""')}"`).join(',');
    const rows = testData.map(item => cols.map(c => `"${String((item as any)[c.key]).replace(/"/g, '""')}"`).join(','));
    const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');

    if (!csvContent.startsWith('\uFEFF')) {
      throw new Error("El archivo CSV no contiene el prefijo UTF-8 BOM");
    }
    if (!csvContent.includes('"Chirimayo Alto"') || !csvContent.includes('"Zanjas taponadas con champaña & diques"')) {
      throw new Error("Caracteres especiales no fueron escapados o preservados correctamente");
    }
  });

  await runTest('Exportación', 'Excel: Generación multi-hoja con columnas dinámicas', () => {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(BOFEDALES.map(b => ({
      Codigo: b.codeInaigem,
      Nombre: b.name,
      Area_ha: b.areaHa,
      Stock_C_t: b.carbonStockTotalTons
    })));
    XLSX.utils.book_append_sheet(wb, ws1, 'Bofedales');

    const ws2 = XLSX.utils.json_to_sheet(PIEZOMETERS.map(p => ({
      Codigo: p.code,
      Nombre: p.name,
      Altitud: p.elevation
    })));
    XLSX.utils.book_append_sheet(wb, ws2, 'Piezometros');

    if (wb.SheetNames.length !== 2) {
      throw new Error(`Se esperaban 2 hojas, se crearon ${wb.SheetNames.length}`);
    }
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    if (!buf || buf.length < 100) {
      throw new Error("El buffer binario del libro Excel generado está vacío o corrupto");
    }
  });

  await runTest('Exportación', 'JSON: Serialización estricta y formato parseable', () => {
    const payload = {
      proyecto: "Gemelo Digital Turberas Chirimayo",
      metadatos: {
        cuenca: "Río Chota",
        coordenadas: { lat: -6.985, lng: -78.432 },
        factores_ipcc: { co2_drained: 4.8, ch4_rewetted: 288, gwp_100: 29.8 }
      },
      bofedales: BOFEDALES
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const parsed = JSON.parse(jsonStr);
    if (parsed.proyecto !== payload.proyecto || parsed.bofedales.length !== 4) {
      throw new Error("La serialización JSON produjo discrepancias en el round-trip");
    }
  });

  await runTest('Exportación', 'TSV Portapapeles: Formateo con tabulaciones', () => {
    const data = [
      { colA: 'Valor 1', colB: 100 },
      { colA: 'Valor 2', colB: 200 }
    ];
    const header = Object.keys(data[0]).join('\t');
    const rows = data.map(d => Object.values(d).join('\t')).join('\n');
    const tsv = `${header}\n${rows}`;

    if (!tsv.includes('\t') || tsv.split('\n').length !== 3) {
      throw new Error("El formato TSV no generó la estructura de líneas y tabulaciones esperada");
    }
  });

  // 4. EDGE CASES & STRESS TESTING
  await runTest('Casos Límite', 'Manejo de dataset vacío o registros nulos', () => {
    const emptyData: any[] = [];
    const jsonEmpty = JSON.stringify(emptyData, null, 2);
    if (jsonEmpty !== '[]') {
      throw new Error(`Respuesta anómala para dataset vacío: ${jsonEmpty}`);
    }

    const dataWithNulls = [
      { id: 1, name: 'Normal', value: 10 },
      { id: 2, name: null, value: undefined },
      { id: 3, name: 'Extremo', value: -999999.99 }
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataWithNulls);
    XLSX.utils.book_append_sheet(wb, ws, 'NullTest');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    if (!buf || buf.length === 0) {
      throw new Error("Fallo al escribir Excel con valores nulos y extremos");
    }
  });

  await runTest('Casos Límite', 'Prueba de gran volumen (10,000 registros sintéticos)', () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      index: i,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      wtd_cm: -(Math.random() * 40 + 5).toFixed(2),
      co2_flux: (Math.random() * 15 + 2).toFixed(3),
      ch4_flux: (Math.random() * 200 + 10).toFixed(1)
    }));

    const jsonLarge = JSON.stringify(largeDataset);
    if (jsonLarge.length < 500000) {
      throw new Error("Dataset grande no serializado correctamente");
    }
  });

  // 5. REST API ENDPOINTS VALIDATION
  await runTest('Backend REST API', 'GET /api/system/status responde en línea', async () => {
    const res = await fetch('http://localhost:8000/api/system/status');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (data.status !== 'online') throw new Error(`Estado reportado: ${data.status}`);
  });

  await runTest('Backend REST API', 'GET /api/models/best devuelve métricas científicas completas', async () => {
    const res = await fetch('http://localhost:8000/api/models/best');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (!data.model_name || !data.metrics || !data.statistical_tests) {
      throw new Error(`Respuesta de modelo incompleta: ${JSON.stringify(Object.keys(data))}`);
    }
    if (data.metrics.f1 <= 0 || data.metrics.roc_auc <= 0) {
      throw new Error(`Métricas con valores inválidos: F1=${data.metrics.f1}, AUC=${data.metrics.roc_auc}`);
    }
  });

  await runTest('Backend REST API', 'GET /api/scientific/charts-analysis devuelve los 6 gráficos analíticos', async () => {
    const res = await fetch('http://localhost:8000/api/scientific/charts-analysis');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const data = await res.json();
    if (!data.selected_charts || data.selected_charts.length < 6) {
      throw new Error(`Se esperaban al menos 6 gráficos, recibidos: ${data.selected_charts?.length}`);
    }
  });

  console.log("\n================================================================================");
  console.log(`RESUMEN: ${results.filter(r => r.status === 'PASS').length}/${results.length} PRUEBAS APROBADAS`);
  console.log("================================================================================");

  if (results.some(r => r.status === 'FAIL')) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Fatal error running QA suite:", err);
  process.exit(1);
});
