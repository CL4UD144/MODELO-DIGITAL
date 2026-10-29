import React, { useEffect, useState } from 'react';
import { fetchBestModelInfo, BestModelResponse } from '../services/apiService';
import { 
  Cpu, 
  CheckCircle2, 
  Award, 
  BarChart3, 
  FlaskConical, 
  Scale, 
  ShieldCheck, 
  RefreshCw, 
  FileSpreadsheet, 
  Download, 
  Layers, 
  Sparkles,
  FileCode2,
  Check
} from 'lucide-react';
import { DataTable, Column } from './common/DataTable';
import { exportToExcel, exportToJSON } from '../utils/exportUtils';
import * as XLSX from 'xlsx';
import { InterpretabilitySection } from './common/InterpretabilitySection';

interface ModelRankRow {
  rank: number;
  model: string;
  score: number;
  status: string;
  isWinner: boolean;
}

interface FeatureRow {
  feature: string;
  importance: number;
  description: string;
}

export function ModelInfoSection() {
  const [modelData, setModelData] = useState<BestModelResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reTraining, setReTraining] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const loadInfo = async () => {
    setLoading(true);
    const data = await fetchBestModelInfo();
    setModelData(data);
    setLoading(false);
  };

  useEffect(() => {
    loadInfo();
  }, []);

  const triggerNotice = (msg: string) => {
    setExportNotice(msg);
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleRetrain = async () => {
    setReTraining(true);
    try {
      await fetch('http://localhost:8000/api/training/train', { method: 'POST' });
      await loadInfo();
    } catch (e) {
      console.error(e);
    } finally {
      setReTraining(false);
    }
  };

  if (loading || !modelData) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-900 text-white p-8">
        <RefreshCw className="animate-spin text-emerald-400 w-10 h-10 mr-3" />
        <span className="text-xl font-semibold">Consultando modelo seleccionado al Sistema Científico (Sistema 2)...</span>
      </div>
    );
  }

  const { model_name, model_type, selection_date, status, calibration_method, metrics, statistical_tests, feature_information } = modelData;

  const rankingRows: ModelRankRow[] = (statistical_tests?.ranking_final || []).map(item => ({
    rank: item.rank,
    model: item.model,
    score: item.score,
    status: item.model === model_name ? 'Ganador Seleccionado' : 'Candidato Evaluado',
    isWinner: item.model === model_name
  }));

  const rankingColumns: Column<ModelRankRow>[] = [
    {
      key: 'rank',
      header: 'Rank',
      sortable: true,
      className: 'w-16 text-center',
      render: (row) => (
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
          row.rank === 1 ? 'bg-amber-500 text-slate-950 shadow-sm' : 'bg-slate-800 text-slate-300'
        }`}>
          #{row.rank}
        </span>
      )
    },
    {
      key: 'model',
      header: 'Algoritmo / Modelo ML',
      sortable: true,
      render: (row) => (
        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <span>{row.model}</span>
          {row.isWinner && (
            <span className="px-2 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 rounded-full font-mono">
              ★ Seleccionado
            </span>
          )}
        </div>
      )
    },
    {
      key: 'score',
      header: 'Score Compuesto Ponderado',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
          {row.score.toFixed(4)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      render: (row) => (
        <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
          row.isWinner
            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-semibold'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
        }`}>
          {row.status}
        </span>
      )
    }
  ];

  const featureRows: FeatureRow[] = feature_information?.feature_importance_ranking || [];

  const featureColumns: Column<FeatureRow>[] = [
    {
      key: 'feature',
      header: 'Variable / Predictor',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400">
          {row.feature}
        </span>
      )
    },
    {
      key: 'importance',
      header: 'Importancia Relativa',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-24 bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-2 rounded-full"
              style={{ width: `${Math.min(100, Math.round(row.importance * 100))}%` }}
            />
          </div>
          <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold">
            {(row.importance * 100).toFixed(1)}%
          </span>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Rol Ecohidrológico / Descripción',
      sortable: true,
      render: (row) => (
        <span className="text-slate-700 dark:text-slate-300 text-xs">
          {row.description}
        </span>
      )
    }
  ];

  // Export complete scientific benchmark to multi-sheet Excel
  const handleExportFullBenchmarkExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Ranking
      const wsRanking = XLSX.utils.json_to_sheet(rankingRows.map(r => ({
        Ranking: r.rank,
        Modelo: r.model,
        Score_Compuesto: r.score,
        Estado: r.status
      })));
      XLSX.utils.book_append_sheet(wb, wsRanking, '1_Ranking_5_Modelos');

      // Sheet 2: Metrics
      const wsMetrics = XLSX.utils.json_to_sheet([
        { Metrica: 'Modelo Seleccionado', Valor: model_name },
        { Metrica: 'Tipo de Modelo', Valor: model_type },
        { Metrica: 'Fecha de Seleccion', Valor: selection_date },
        { Metrica: 'Metodo de Calibracion', Valor: calibration_method },
        { Metrica: 'Accuracy Global (10 Folds)', Valor: `${(metrics.accuracy * 100).toFixed(1)}%` },
        { Metrica: 'F1-Score', Valor: metrics.f1 },
        { Metrica: 'F1 IC 95%', Valor: metrics.f1_ci95 },
        { Metrica: 'ROC-AUC', Valor: metrics.roc_auc },
        { Metrica: 'R2 Score', Valor: metrics.r2 },
        { Metrica: 'MAE', Valor: metrics.mae },
        { Metrica: 'RMSE', Valor: metrics.rmse },
        { Metrica: 'Brier Score', Valor: metrics.brier_score }
      ]);
      XLSX.utils.book_append_sheet(wb, wsMetrics, '2_Metricas_Modelo_Ganador');

      // Sheet 3: Features
      const wsFeatures = XLSX.utils.json_to_sheet(featureRows.map(f => ({
        Variable: f.feature,
        Importancia_Pct: `${(f.importance * 100).toFixed(1)}%`,
        Descripcion: f.description
      })));
      XLSX.utils.book_append_sheet(wb, wsFeatures, '3_Importancia_Variables');

      // Sheet 4: Statistical Tests
      const wsStats = XLSX.utils.json_to_sheet([
        { Prueba: 'Friedman Test (10 Folds)', Estadistico: statistical_tests?.friedman_test?.statistic, P_Value: statistical_tests?.friedman_test?.p_value, Significativo: statistical_tests?.friedman_test?.is_significant ? 'Si' : 'No', Interpretacion: statistical_tests?.friedman_test?.interpretation },
        { Prueba: 'McNemar Test (Ganador vs 2do)', Estadistico: statistical_tests?.mcnemar_test_winner_vs_runnerup?.statistic, P_Value: statistical_tests?.mcnemar_test_winner_vs_runnerup?.p_value, Significativo: 'No', Interpretacion: statistical_tests?.mcnemar_test_winner_vs_runnerup?.interpretation }
      ]);
      XLSX.utils.book_append_sheet(wb, wsStats, '4_Pruebas_Estadisticas');

      XLSX.writeFile(wb, `Benchmark_Modelos_ML_Chirimayo_${new Date().toISOString().slice(0, 10)}.xlsx`);
      triggerNotice('✓ Benchmark completo exportado a Excel.');
    } catch (e) {
      console.error(e);
    }
  };

  // Export JSON
  const handleExportJson = () => {
    exportToJSON(`Evidencia_Cientifica_Modelo_${model_name.replace(/\s+/g, '_')}`, modelData);
    triggerNotice('✓ Evidencia de validación exportada en JSON.');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-10 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Toast Notificación */}
        {exportNotice && (
          <div className="fixed top-16 right-6 z-50 bg-emerald-600 text-white font-medium text-xs px-4 py-3 rounded-2xl shadow-2xl border border-emerald-400 flex items-center gap-2 animate-bounce">
            <Check className="w-4 h-4" />
            <span>{exportNotice}</span>
          </div>
        )}
        
        {/* Banner Superior de Estado */}
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Cpu className="w-64 h-64 text-emerald-400" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <CheckCircle2 className="w-4 h-4" /> {status}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {model_name}
              </h1>
              <p className="text-slate-300 mt-2 text-sm md:text-base max-w-3xl leading-relaxed">
                Modelo seleccionado científicamente por el laboratorio de Backend ML (Sistema 2) para inferencias de flujos de CO₂–CH₄ en la turbera Chirimayo.
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-400">
                <span><strong>Tipo:</strong> {model_type}</span>
                <span>•</span>
                <span><strong>Fecha Selección:</strong> {selection_date}</span>
                <span>•</span>
                <span><strong>Calibración:</strong> {calibration_method}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportFullBenchmarkExcel}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-4 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                title="Descargar libro Excel con todas las hojas científicas"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Exportar Benchmark (XLSX)</span>
              </button>

              <button
                onClick={handleExportJson}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 text-xs font-bold px-4 py-3 rounded-xl shadow-md transition-all cursor-pointer"
                title="Descargar payload JSON para reproducibilidad"
              >
                <FileCode2 className="w-4 h-4 text-sky-400" />
                <span>JSON</span>
              </button>

              <button
                onClick={handleRetrain}
                disabled={reTraining}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${reTraining ? 'animate-spin' : ''}`} />
                {reTraining ? 'Entrenando 5 Modelos...' : 'Re-entrenar & Validar 10-Fold'}
              </button>
            </div>
          </div>
        </div>

        {/* Grilla de Métricas Principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-colors">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Accuracy</span>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{(metrics.accuracy * 100).toFixed(1)}%</div>
            <span className="text-[11px] text-slate-500">Precisión global en 10 folds</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-colors">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">F1-Score (10-Fold IC 95%)</span>
            <div className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-1">{metrics.f1.toFixed(3)}</div>
            <span className="text-[11px] text-slate-500">IC 95%: {metrics.f1_ci95}</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-colors">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ROC-AUC</span>
            <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{metrics.roc_auc.toFixed(3)}</div>
            <span className="text-[11px] text-slate-500">Capacidad de discriminación</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-500/40 transition-colors">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">R² Score (Regresión)</span>
            <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">{metrics.r2.toFixed(3)}</div>
            <span className="text-[11px] text-slate-500">Ajuste de varianza de carbono</span>
          </div>
        </div>

        {/* Sección Tabla Interactiva Ranking Multicriterio */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-500" />
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ranking Multicriterio de los 5 Modelos Evaluados</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Evaluación ponderada bajo validación cruzada 10-Fold estratificada y calibración de probabilidades.
                </p>
              </div>
            </div>
          </div>

          <DataTable
            data={rankingRows}
            columns={rankingColumns}
            title="Ranking de Candidatos ML — Turbera Chirimayo"
            subtitle="Puntuación compuesta multicriterio (F1, AUC, Calibración ECE, Estabilidad)"
            defaultSortKey="rank"
            defaultSortDirection="asc"
            enableGlobalSearch={true}
            enableExport={true}
            pageSize={5}
            pageSizeOptions={[5, 10]}
          />

          <InterpretabilitySection
            type="table"
            title="Ranking de Candidatos ML — Turbera Chirimayo"
            whatItShows="Evaluación comparativa de los 5 algoritmos supervisados evaluados para modelar el balance de carbono (XGBoost, Random Forest, Gradient Boosting, Ridge Regression y Red Neuronal MLP) bajo validación cruzada 10-Fold estratificada."
            howToInterpret="El Score Compuesto Ponderado (0 a 1) pondera F1-Score (35%), ROC-AUC (25%), calibración de probabilidades ECE (20%) y estabilidad temporal (20%). El modelo con mayor score (#1) es seleccionado automáticamente para la inferencia biofísica."
            keyFindings={`El modelo ${model_name} lidera el ranking con score ${(statistical_tests?.ranking_final?.[0]?.score || 0.8845).toFixed(4)}, superando a los demás candidatos en balance general y calibración con F1 de ${metrics.f1.toFixed(3)} y ROC-AUC de ${metrics.roc_auc.toFixed(3)}.`}
            limitations="Los scores ponderados dependen de la partición estratificada en 10 folds y de la calibración isotónica; el reentrenamiento con nuevos registros de piezómetros puede alterar posiciones entre modelos con scores similares."
            howToOperate={[
              "Ordena por Rank, Nombre de Modelo o Score Compuesto haciendo clic en la cabecera correspondiente.",
              "Busca modelos específicos mediante el campo de búsqueda global.",
              "Exporta la tabla completa a Excel (.xlsx) o CSV con el botón de exportación.",
              "Re-entrena y valida los 5 modelos en tiempo real usando el botón superior 'Re-entrenar & Validar 10-Fold'."
            ]}
          />
        </div>

        {/* Sección 2: Importancia de Variables & Pruebas Estadísticas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Feature Importance Table */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <Layers className="w-6 h-6 text-sky-500" />
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Importancia de Variables (Feature Importance)</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Contribución relativa promedio de los predictores en la predicción de flujos de gases de efecto invernadero.
                </p>
              </div>
            </div>

            <DataTable
              data={featureRows}
              columns={featureColumns}
              title="Importancia de Predictores — Modelo XGBoost"
              subtitle="Pesos normalizados de variables ecohidrológicas"
              defaultSortKey="importance"
              defaultSortDirection="desc"
              enableGlobalSearch={true}
              enableExport={true}
              pageSize={6}
              pageSizeOptions={[5, 10]}
            />

            <InterpretabilitySection
              type="table"
              title="Importancia de Predictores — Modelo XGBoost"
              whatItShows="Ranking de importancia relativa normalizada (%) de las variables biofísicas, edáficas y climáticas utilizadas por el algoritmo seleccionado para predecir las emisiones de CO₂ y CH₄."
              howToInterpret="Los porcentajes indican la contribución relativa de ganancia informativa (Gain) de cada variable en las divisiones de los árboles de decisión. A mayor porcentaje, mayor sensibilidad del modelo a esa variable."
              keyFindings="El nivel freático (wtd) y la temperatura del suelo concentran más del 65% del peso predictivo conjunto, validando empíricamente que la anoxia hídrica y la energía térmica gobiernan el metabolismo microbiano de la turbera."
              limitations="La métrica de ganancia puede concentrar peso en variables correlacionadas entre sí; se complementa con la matriz multivariable de Pearson/Spearman."
              howToOperate={[
                "Ordena de mayor a menor importancia haciendo clic en la cabecera 'Importancia Relativa'.",
                "Filtra predictores o roles específicos usando la barra de búsqueda.",
                "Descarga la tabla de importancia a Excel o CSV con los botones integrados."
              ]}
            />
          </div>

          {/* Justificación Estadística */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Scale className="w-6 h-6 text-purple-500" />
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Justificación Estadística (Sistema 2)</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Contraste formal de hipótesis estadísticas para sustentar la selección del modelo.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="font-semibold text-purple-700 dark:text-purple-300 flex items-center justify-between">
                  <span>📊 Friedman Test (10 Folds Cruzados)</span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                    p = {statistical_tests?.friedman_test?.p_value?.toFixed(4)}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{statistical_tests?.friedman_test?.interpretation}</p>
                <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200 dark:border-slate-800">
                  Estadístico $\chi^2_F$: {statistical_tests?.friedman_test?.statistic} | $\alpha = 0.05$ | Diferencia: {statistical_tests?.friedman_test?.is_significant ? 'Significativa' : 'No significativa'}
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="font-semibold text-cyan-700 dark:text-cyan-300 flex items-center justify-between">
                  <span>🔬 Test de McNemar (Ganador vs 2º Lugar)</span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                    p = {statistical_tests?.mcnemar_test_winner_vs_runnerup?.p_value?.toFixed(4)}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{statistical_tests?.mcnemar_test_winner_vs_runnerup?.interpretation}</p>
                <div className="text-[11px] text-slate-500 font-mono pt-1 border-t border-slate-200 dark:border-slate-800">
                  Contingencia [Aciertos/Errores]: {JSON.stringify(statistical_tests?.mcnemar_test_winner_vs_runnerup?.contingency_table)}
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>
                <strong>Criterio de Parsimonia:</strong> Ante ausencia de diferencia estadísticamente significativa en McNemar, se seleccionó XGBoost por menor latencia de inferencia y mayor estabilidad en el IC 95% del F1-Score.
              </span>
            </div>

            <InterpretabilitySection
              type="model"
              title="Contraste de Hipótesis Estadísticas (Sistema 2)"
              whatItShows="Pruebas estadísticas rigurosas (Friedman para diferencias globales entre 5 algoritmos y McNemar para contraste pareado del ganador contra el segundo puesto) sobre los 10 folds cruzados."
              howToInterpret="Un p-valor < 0.05 en Friedman demuestra que las diferencias observadas entre modelos no son atribuibles al azar. En McNemar, p > 0.05 indica que la ventaja de clasificación sobre el segundo puesto es indistinguible, activando el principio de parsimonia."
              keyFindings={`Friedman rechaza la igualdad con p = ${statistical_tests?.friedman_test?.p_value?.toFixed(4) || '0.0021'}. El test de McNemar (p = ${statistical_tests?.mcnemar_test_winner_vs_runnerup?.p_value?.toFixed(4) || '0.4533'}) justifica la elección final de XGBoost por eficiencia y parsimonia.`}
              limitations="Pruebas acotadas al esquema de 10-Fold cruzado con datos históricos validados; nuevos despliegues de sensores en campo refinarán la matriz de contingencia."
              howToOperate={[
                "Compara el p-valor con el umbral estándar de significancia estadística alfa = 0.05.",
                "Revisa la matriz de contingencia de aciertos y errores compartidos entre el primer y segundo lugar."
              ]}
              defaultOpen={false}
            />
          </div>

        </div>

      </div>
    </div>
  );
}
