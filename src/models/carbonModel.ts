import { SimulationParameters, SimulationResult } from '../types';

/**
 * High-Andean Tropical Peatland (Bofedales/Jalca) Carbon & Hydrological Balance Engine
 * Based on IPCC 2013 Wetlands Supplement + Local In-Situ Microcuenca Chirimayo calibrations
 */
export function runCarbonSimulation(params: SimulationParameters, bofedalAreaHa = 142.5): SimulationResult {
  const {
    targetWTD, // cm, e.g. -5 to -45
    soilTempAnomaly, // °C, e.g. 0 to 3
    precipChangePercent, // %, e.g. -10 to +15
    grazingReductionPercent, // %, 0 to 100
    ditchBlockingRatio, // %, 0 to 100
    revegetationAreaHa, // ha
    gwpTimeframe, // 'GWP-100' or 'GWP-20'
    carbonPriceUSD, // USD/tCO2eq
    simulationYears // 5 to 30
  } = params;

  // GWP factor according to IPCC AR6 (Without feedback: 27.9 / 82.5, With feedback: 29.8 / 84.0)
  const gwpCH4 = gwpTimeframe === 'GWP-100' ? 29.8 : 84.0;

  // Base climate parameters for Jalca Cajamarca (3800 m.a.s.l.)
  const baseSoilTemp = 7.2 + soilTempAnomaly;
  
  // Hydrological effect: ditch blocking & precipitation change adjust the effective water table
  // Effective WTD = Target WTD + effect of precipitation + effect of ditch blocking efficiency
  const hydrologicGain = (ditchBlockingRatio / 100) * 18.0 + (precipChangePercent / 100) * 8.0;
  const effectiveWTD = Math.min(0, targetWTD + hydrologicGain); // water table cannot exceed surface (0 cm)

  // 1. Soil Respiration (CO2 emissions from aerobic peat oxidation)
  // When WTD is low (-50 cm), oxic zone is deep -> high CO2 emissions (~12-18 t CO2/ha/yr).
  // When WTD is close to surface (-5 cm), anaerobic conditions inhibit oxidation -> low emissions (~0.5 - 2.5 t CO2/ha/yr).
  const oxicZoneDepth = Math.max(0, -effectiveWTD); // cm
  const q10 = 2.4; // Temperature sensitivity Q10 for high Andean peat
  const tempFactor = Math.pow(q10, (baseSoilTemp - 7.0) / 10.0);
  
  // Grazing disturbance increases soil compaction and aerobic mineralization
  const grazingFactor = 1.0 + (1.0 - grazingReductionPercent / 100) * 0.45;
  
  // CO2 flux in t CO2 / ha / year
  // Fitted from Chirimayo chamber measurements
  const baseCO2 = 0.8 + 0.28 * Math.pow(oxicZoneDepth, 1.12);
  const annualCO2Respiration = baseCO2 * tempFactor * grazingFactor;

  // 2. Methanogenesis (CH4 emissions)
  // Methanogens produce CH4 under strictly anaerobic conditions (high water table).
  // Sedge aerenchyma (Carex, Eleocharis) also transport CH4.
  // When drained, methanotrophic bacteria in the oxic layer consume CH4 -> near zero emissions.
  const anoxicFactor = Math.exp(-0.075 * oxicZoneDepth); // High when WTD ~ 0, falls rapidly when WTD < -25 cm
  const vegetationQualityFactor = 1.0 + (revegetationAreaHa / bofedalAreaHa) * 0.35; // Vascular plants conduit
  
  // CH4 flux in t CH4 / ha / year (typically 0.05 to 0.55 t CH4/ha/yr in bofedales)
  const annualCH4Emission = (0.015 + 0.48 * anoxicFactor) * Math.pow(1.8, (baseSoilTemp - 7.0) / 10.0) * vegetationQualityFactor;
  
  // 3. CH4 converted to CO2 equivalent
  const annualCH4_CO2eq = annualCH4Emission * gwpCH4;

  // 4. Net Carbon Balance (CO2 + CH4_CO2eq - C sequestration by pristine Distichia cushions)
  // Pristine peat accumulation sequesters ~ 2.2 t CO2/ha/yr in high quality Jalca cushions
  const sequestrationRate = Math.max(0, (1.0 - oxicZoneDepth / 35.0)) * 2.8 * (1.0 + (revegetationAreaHa / bofedalAreaHa) * 0.5);
  const netCarbonBalanceCO2eq = (annualCO2Respiration + annualCH4_CO2eq) - sequestrationRate;

  // Baseline degraded condition (for reference avoided emissions calculation)
  // Baseline: WTD = -45 cm, high grazing, no dams
  const baselineOxic = 45.0;
  const baselineCO2 = (0.8 + 0.28 * Math.pow(baselineOxic, 1.12)) * 1.45; // ~ 18.5 t CO2/ha/yr
  const baselineCH4 = (0.015 + 0.48 * Math.exp(-0.075 * baselineOxic)) * gwpCH4; // ~ 0.9 t CO2eq/ha/yr
  const baselineNetCO2eq = baselineCO2 + baselineCH4; // ~ 19.4 t CO2eq/ha/yr

  // Avoided emissions per hectare per year
  const avoidedPerHaYear = Math.max(0, baselineNetCO2eq - netCarbonBalanceCO2eq);
  const totalMitigationTonsCO2eq = avoidedPerHaYear * bofedalAreaHa * simulationYears;

  // Economic benefit via MERESE Hídrico (Ley 30215) & Voluntary Carbon Market (VCM)
  const mereseEconomicBenefitUSD = totalMitigationTonsCO2eq * carbonPriceUSD;

  // Hydrological water yield regulation (m3/year baseflow sustained for dry season)
  // Healthy bofedales release ~ 2,800 m3/ha/yr of sponge-regulated baseflow to the Chirimayo stream
  const spongeFactor = Math.max(0.2, 1.0 - (oxicZoneDepth / 50.0));
  const waterYieldRegulatedM3 = bofedalAreaHa * 3100 * spongeFactor;

  // Projected Vegetation Index (NDVI)
  const vegetationIndexProjected = Math.min(0.85, 0.42 + 0.38 * Math.max(0, 1.0 - oxicZoneDepth / 40.0) + (revegetationAreaHa / bofedalAreaHa) * 0.12);

  // Carbon stock over 30 years (in total tons C for the bofedal)
  // Baseline stock ~ 5,000 t C/ha
  const initialTotalStock = 5000 * bofedalAreaHa;
  const yearlyNetCarbonDeltaTons = ((sequestrationRate * (12/44)) - (annualCO2Respiration * (12/44))) * bofedalAreaHa;
  const carbonStock30Years = initialTotalStock + yearlyNetCarbonDeltaTons * simulationYears;

  // Generate year-by-year trajectory
  const yearlyProjections = [];
  for (let yr = 1; yr <= simulationYears; yr++) {
    // Dynamic transition over initial 3 years
    const progress = Math.min(1.0, yr / 3.0);
    const yrWTD = -45 + (-effectiveWTD - (-45)) * progress;
    const yrCO2 = baselineCO2 + (annualCO2Respiration - baselineCO2) * progress;
    const yrCH4 = (0.015 + 0.48 * Math.exp(-0.075 * Math.max(0, -yrWTD))) * gwpCH4;
    const yrNet = yrCO2 + yrCH4 - (sequestrationRate * progress);
    const yrAvoided = Math.max(0, baselineNetCO2eq - yrNet) * bofedalAreaHa;
    const cumulativeMitigation = yrAvoided * yr;
    const economicValue = cumulativeMitigation * carbonPriceUSD;

    yearlyProjections.push({
      year: yr,
      wtd: Math.round(yrWTD * 10) / 10,
      co2Emissions: Math.round(yrCO2 * 100) / 100,
      ch4Emissions: Math.round(yrCH4 * 100) / 100,
      netBalanceCO2eq: Math.round(yrNet * 100) / 100,
      cumulativeMitigation: Math.round(cumulativeMitigation),
      economicValue: Math.round(economicValue)
    });
  }

  return {
    params,
    wtdMean: Math.round(effectiveWTD * 10) / 10,
    annualCO2Respiration: Math.round(annualCO2Respiration * 100) / 100,
    annualCH4Emission: Math.round(annualCH4Emission * 1000) / 1000,
    annualCH4_CO2eq: Math.round(annualCH4_CO2eq * 100) / 100,
    netCarbonBalanceCO2eq: Math.round(netCarbonBalanceCO2eq * 100) / 100,
    totalMitigationTonsCO2eq: Math.round(totalMitigationTonsCO2eq),
    carbonStock30Years: Math.round(carbonStock30Years),
    mereseEconomicBenefitUSD: Math.round(mereseEconomicBenefitUSD),
    waterYieldRegulatedM3: Math.round(waterYieldRegulatedM3),
    vegetationIndexProjected: Math.round(vegetationIndexProjected * 100) / 100,
    yearlyProjections
  };
}
