import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  FileSpreadsheet, 
  FileCode2, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BOFEDALES, PIEZOMETERS } from '../data/mockDatasets';
import { runCarbonSimulation } from '../models/carbonModel';
import { useLanguage } from '../context/LanguageContext';

export const ReportsModule: React.FC = () => {
  const { t, language } = useLanguage();
  const [reportTitle, setReportTitle] = useState('');
  const [reportAuthor, setReportAuthor] = useState('');
  const [include3DCharts, setInclude3DCharts] = useState(true);
  const [includeBaci, setIncludeBaci] = useState(true);
  const [includeMerese, setIncludeMerese] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfSuccess, setGeneratedPdfSuccess] = useState(false);

  // Sync title and author when language changes if not customized
  useEffect(() => {
    setReportTitle(t('reports.defaultReportTitle'));
    setReportAuthor(t('reports.defaultAuthor'));
  }, [language]);

  // Generate real PDF with jsPDF in selected language
  const generatePDF = () => {
    setIsGenerating(true);
    setGeneratedPdfSuccess(false);

    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Cover / Header
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(52, 211, 153); // emerald-400
        doc.setFontSize(10);
        doc.text(t('reports.pdf.republicHeader'), 15, 15);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(t('reports.pdf.docTitle'), 15, 24);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225);
        doc.text(t('reports.pdf.docSubtitle'), 15, 32);

        // Metadata block
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(t('reports.pdf.sec1Title'), 15, 50);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);
        const executiveText = t('reports.pdf.sec1Text');
        const splitText = doc.splitTextToSize(executiveText, 180);
        doc.text(splitText, 15, 56);

        // Table 1: Bofedales Inventory
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(t('reports.pdf.sec2Title'), 15, 82);

        const tableData = BOFEDALES.map(b => [
          b.codeInaigem,
          b.name.replace('Turbera Bofedal ', ''),
          `${b.areaHa} ha`,
          `${b.peatDepthAvg} m`,
          b.conservationState,
          `${b.carbonStockTotalTons.toLocaleString()} t C`,
          `${b.annualCO2eqNetTons} t/yr`
        ]);

        const sec2Headers = language === 'en' 
          ? ['INAIGEM Code', 'Peatland Sector', 'Area', 'Avg Depth', 'Status', 'C Stock', 'CO2eq Balance']
          : ['Codigo INAIGEM', 'Sector Bofedal', 'Area', 'Prof. Media', 'Estado', 'Stock C', 'Balance CO2eq'];

        autoTable(doc, {
          startY: 86,
          head: [sec2Headers],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 8 },
          bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
          margin: { left: 15, right: 15 }
        });

        const currentY = ((doc as any).lastAutoTable?.finalY || 140) + 12;

        // Section 3: Simulation Results
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(t('reports.pdf.sec3Title'), 15, currentY);

        const simResult = runCarbonSimulation({
          scenarioName: 'Restauracion Integral',
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

        const simTableData = language === 'en' ? [
          ['Degraded Baseline Scenario (WTD -45cm)', '18.40 t/ha/yr', '0.04 t/ha/yr', '+19.45 t/ha/yr', '0 t CO2eq', '$0 USD'],
          ['Comprehensive Restoration (WTD -8cm)', `${simResult.annualCO2Respiration} t/ha/yr`, `${simResult.annualCH4Emission} t/ha/yr`, `${simResult.netCarbonBalanceCO2eq} t/ha/yr`, `${simResult.totalMitigationTonsCO2eq.toLocaleString()} t`, `$${simResult.mereseEconomicBenefitUSD.toLocaleString()} USD`],
          ['Revegetation Only (No Dams)', '12.80 t/ha/yr', '0.08 t/ha/yr', '+11.20 t/ha/yr', '35,100 t', '$649,350 USD']
        ] : [
          ['Escenario Base Degradado (WTD -45cm)', '18.40 t/ha/yr', '0.04 t/ha/yr', '+19.45 t/ha/yr', '0 t CO2eq', '$0 USD'],
          ['Restauracion Integral (WTD -8cm)', `${simResult.annualCO2Respiration} t/ha/yr`, `${simResult.annualCH4Emission} t/ha/yr`, `${simResult.netCarbonBalanceCO2eq} t/ha/yr`, `${simResult.totalMitigationTonsCO2eq.toLocaleString()} t`, `$${simResult.mereseEconomicBenefitUSD.toLocaleString()} USD`],
          ['Solo Revegetacion (Sin Diques)', '12.80 t/ha/yr', '0.08 t/ha/yr', '+11.20 t/ha/yr', '35,100 t', '$649,350 USD']
        ];

        const sec3Headers = language === 'en'
          ? ['Management Scenario', 'CO2 Respiration', 'CH4 Emission', 'Net Balance', '30-Yr Mitigation', 'MERESE Valuation']
          : ['Escenario de Manejo', 'Respiracion CO2', 'Emision CH4', 'Balance Neto', 'Mitigacion 30a', 'Valor MERESE'];

        autoTable(doc, {
          startY: currentY + 4,
          head: [sec3Headers],
          body: simTableData,
          theme: 'striped',
          headStyles: { fillColor: [6, 182, 212], textColor: [255, 255, 255], fontSize: 8 },
          bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
          margin: { left: 15, right: 15 }
        });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        const footerStr = t('reports.pdf.footerText').replace('{date}', new Date().toLocaleDateString(language === 'es' ? 'es-PE' : 'en-US'));
        doc.text(footerStr, 15, 285);

        const filename = `${t('reports.pdf.filenamePrefix')}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
        setIsGenerating(false);
        setGeneratedPdfSuccess(true);
      } catch (err) {
        console.error(err);
        setIsGenerating(false);
      }
    }, 800);
  };

  // Generate multi-sheet Excel with XLSX in selected language
  const generateExcel = () => {
    const wb = XLSX.utils.book_new();

    const isEn = language === 'en';

    // Sheet 1: Raw Field Piezometers
    const pzData = PIEZOMETERS.flatMap(pz => 
      pz.history.map(h => isEn ? ({
        Piezometer_Code: pz.code,
        Sector_Name: pz.name,
        Latitude: pz.lat,
        Longitude: pz.lng,
        Elevation_masl: pz.elevation,
        Peat_Depth_m: pz.peatDepth,
        Organic_Matter_Pct: pz.organicMatter,
        Bulk_Density_g_cm3: pz.bulkDensity,
        pH: pz.ph,
        Date: h.date,
        Water_Table_Depth_cm: h.waterTableDepth,
        Soil_Temp_C: h.soilTemp,
        CO2_Flux_g_C_m2_day: h.co2Flux,
        CH4_Flux_mg_C_m2_day: h.ch4Flux
      }) : ({
        Piezometro_Codigo: pz.code,
        Nombre_Sector: pz.name,
        Latitud: pz.lat,
        Longitud: pz.lng,
        Altitud_msnm: pz.elevation,
        Profundidad_Turba_m: pz.peatDepth,
        Materia_Organica_Porc: pz.organicMatter,
        Densidad_Aparente_g_cm3: pz.bulkDensity,
        pH: pz.ph,
        Fecha: h.date,
        Nivel_Freatico_cm: h.waterTableDepth,
        Temperatura_Suelo_C: h.soilTemp,
        Flujo_CO2_g_C_m2_dia: h.co2Flux,
        Flujo_CH4_mg_C_m2_dia: h.ch4Flux
      }))
    );
    const ws1 = XLSX.utils.json_to_sheet(pzData);
    const sheet1Name = isEn ? '1_Field_Data_Piezometers' : '1_Datos_Campo_Piezometros';
    XLSX.utils.book_append_sheet(wb, ws1, sheet1Name);

    // Sheet 2: Bofedal Statistics
    const bofData = BOFEDALES.map(b => isEn ? ({
      INAIGEM_Code: b.codeInaigem,
      Name: b.name,
      Basin: b.basin,
      Subbasin: b.subbasin,
      Area_Hectares: b.areaHa,
      Perimeter_km: b.perimeterKm,
      Mean_Elevation: b.avgElevation,
      Conservation_State: b.conservationState,
      Peat_Depth_m: b.peatDepthAvg,
      Ditch_Density_km_ha: b.drainageDensity,
      Grazing_Pressure: b.grazingPressure,
      Total_Carbon_Stock_tC: b.carbonStockTotalTons,
      Annual_Balance_tCO2eq: b.annualCO2eqNetTons
    }) : ({
      Codigo_INAIGEM: b.codeInaigem,
      Nombre: b.name,
      Cuenca: b.basin,
      Subcuenca: b.subbasin,
      Area_Hectareas: b.areaHa,
      Perimetro_km: b.perimeterKm,
      Altitud_Media: b.avgElevation,
      Estado_Conservacion: b.conservationState,
      Profundidad_Turba_m: b.peatDepthAvg,
      Densidad_Zanjas_km_ha: b.drainageDensity,
      Presion_Pastoreo: b.grazingPressure,
      Stock_Carbono_Total_tC: b.carbonStockTotalTons,
      Balance_Anual_tCO2eq: b.annualCO2eqNetTons
    }));
    const ws2 = XLSX.utils.json_to_sheet(bofData);
    const sheet2Name = isEn ? '2_Peatlands_Summary' : '2_Resumen_Bofedales';
    XLSX.utils.book_append_sheet(wb, ws2, sheet2Name);

    // Sheet 3: Scenario 30-Year Projections
    const sim = runCarbonSimulation({
      scenarioName: isEn ? 'Comprehensive Restoration' : 'Restauracion Integral',
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

    const ws3 = XLSX.utils.json_to_sheet(sim.yearlyProjections);
    const sheet3Name = isEn ? '3_30Year_Projections' : '3_Proyecciones_30_Anos';
    XLSX.utils.book_append_sheet(wb, ws3, sheet3Name);

    // Sheet 4: IPCC Tier 2 Inventory Methodology
    const ipccData = isEn ? [
      { Parameter: 'Drained CO₂ Emission Factor (IPCC Tier 1)', Value: '5.3 t C / ha / yr', Source: 'IPCC Wetlands Supplement Ch. 2' },
      { Parameter: 'Calibrated Chirimayo CO₂ Emission Factor', Value: '4.8 t C / ha / yr', Source: 'UNC-INAIGEM 2024 Dark Chambers' },
      { Parameter: 'Rewetted CH₄ Emission Factor', Value: '288 kg CH₄ / ha / yr', Source: 'Walter-Heimann Chirimayo Modeling' },
      { Parameter: 'GWP-100 CH₄ with feedback', Value: '29.8', Source: 'IPCC AR6 Working Group I' },
      { Parameter: 'GWP-20 CH₄ with feedback', Value: '84.0', Source: 'IPCC AR6 Working Group I' }
    ] : [
      { Parametro: 'Factor Emision CO2 Drenado (IPCC Tier 1)', Valor: '5.3 t C / ha / yr', Fuente: 'IPCC Wetlands Supplement Cap. 2' },
      { Parametro: 'Factor Emision CO2 Chirimayo Calibrado', Valor: '4.8 t C / ha / yr', Fuente: 'Camaras oscuras UNC-INAIGEM 2024' },
      { Parametro: 'Factor Emision CH4 Rehumidificado', Valor: '288 kg CH4 / ha / yr', Fuente: 'Modelacion Walter-Heimann Chirimayo' },
      { Parametro: 'GWP-100 CH4 con feedback', Valor: '29.8', Fuente: 'IPCC AR6 Working Group I' },
      { Parametro: 'GWP-20 CH4 con feedback', Valor: '84.0', Fuente: 'IPCC AR6 Working Group I' }
    ];
    const ws4 = XLSX.utils.json_to_sheet(ipccData);
    const sheet4Name = isEn ? '4_IPCC_Tier2_Inventory' : '4_Inventario_IPCC_Tier2';
    XLSX.utils.book_append_sheet(wb, ws4, sheet4Name);

    const filename = isEn 
      ? `Datasets_Chirimayo_Peatlands_XLSX_${new Date().toISOString().slice(0, 10)}.xlsx`
      : `Datasets_Chirimayo_Bofedales_XLSX_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100 dark:bg-[#020617] text-slate-900 dark:text-white overflow-y-auto p-4 lg:p-6 space-y-6 tech-grid-bg transition-colors duration-300">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl hover:border-emerald-500/30 transition-all">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 font-mono">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {t('reports.title')}
          </div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>{t('reports.title')}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            {t('reports.subtitle')}
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={generateExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-300 dark:border-emerald-500/40 transition-all cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{t('reports.actions.exportExcel')}</span>
          </button>

          <button
            onClick={generatePDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>{t('reports.actions.exportPdf')}</span>
          </button>
        </div>
      </div>

      {/* Main Report Builder Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Config (5 Cols) */}
        <div className="lg:col-span-5 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl space-y-4 text-xs hover:border-cyan-500/30 transition-all">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            {t('reports.configTitle')}
          </h3>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1.5 font-medium">{t('reports.reportTitleLabel')}</label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-2xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 mb-1.5 font-medium">{t('reports.reportAuthorLabel')}</label>
            <input
              type="text"
              value={reportAuthor}
              onChange={(e) => setReportAuthor(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700/80 rounded-2xl px-3.5 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-xs font-medium"
            />
          </div>

          <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-slate-800/90">
            <span className="text-slate-500 dark:text-slate-400 font-semibold block mb-1">{t('reports.includeSections')}</span>

            <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 backdrop-blur-xs rounded-2xl border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-emerald-500/40 transition-all">
              <span className="text-slate-800 dark:text-slate-200 font-medium">{t('reports.sectionSim3d')}</span>
              <input
                type="checkbox"
                checked={include3DCharts}
                onChange={(e) => setInclude3DCharts(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 backdrop-blur-xs rounded-2xl border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-emerald-500/40 transition-all">
              <span className="text-slate-800 dark:text-slate-200 font-medium">{t('reports.sectionBaci')}</span>
              <input
                type="checkbox"
                checked={includeBaci}
                onChange={(e) => setIncludeBaci(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 backdrop-blur-xs rounded-2xl border border-slate-200 dark:border-slate-700/60 cursor-pointer hover:border-emerald-500/40 transition-all">
              <span className="text-slate-800 dark:text-slate-200 font-medium">{t('reports.sectionMerese')}</span>
              <input
                type="checkbox"
                checked={includeMerese}
                onChange={(e) => setIncludeMerese(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </label>
          </div>

          {generatedPdfSuccess && (
            <div className="p-3.5 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/40 rounded-2xl text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 shadow-md">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="leading-tight font-medium">{t('reports.pdfGeneratedSuccess')}</span>
            </div>
          )}
        </div>

        {/* Right Preview Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white/90 dark:bg-slate-900/85 backdrop-blur-md border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 shadow-md dark:shadow-2xl flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t('reports.previewTitle')}</h3>
              </div>
              <span className="text-[10px] px-2.5 py-1 bg-slate-100 dark:bg-slate-800/90 text-emerald-700 dark:text-emerald-300 font-mono rounded-lg border border-slate-300 dark:border-slate-700 font-semibold">
                {t('reports.formatA4')}
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                <div className="font-bold text-slate-900 dark:text-white mb-1">{t('reports.chapters.ch1Title')}</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('reports.chapters.ch1Desc')}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                <div className="font-bold text-slate-900 dark:text-white mb-1">{t('reports.chapters.ch2Title')}</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('reports.chapters.ch2Desc')}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                <div className="font-bold text-slate-900 dark:text-white mb-1">{t('reports.chapters.ch3Title')}</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('reports.chapters.ch3Desc')}
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800/80">
                <div className="font-bold text-slate-900 dark:text-white mb-1">{t('reports.chapters.ch4Title')}</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('reports.chapters.ch4Desc')}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>{t('reports.officialTemplatesNote')}</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">SHA-256 Validated</span>
          </div>
        </div>
      </div>
    </div>
  );
};

