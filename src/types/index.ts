export type UserRole = 
  | 'admin' 
  | 'scientist' 
  | 'field_technician' 
  | 'decision_maker' 
  | 'public_viewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organization: string;
  community?: string;
  avatar: string;
  permissions: string[];
}

export interface SenamhiStation {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  altitude: number; // m.s.n.m.
  type: 'Pluviométrica' | 'Climatológica Ordinaria' | 'Agrometeorológica' | string;
  zonalDirectorate: string; // 'DZ3 Cajamarca'
  precipAnnualAvg: number; // mm
  tempAvg: number; // °C
  recordsCount: number;
}

export interface WeatherRecord {
  date: string;
  precip: number; // mm
  tmax: number; // °C
  tmin: number; // °C
  tavg: number; // °C
  rh: number; // %
  solarRad: number; // MJ/m2/day
}

export interface PiezometerData {
  id: string;
  code: string;
  name: string;
  lat: number;
  lng: number;
  elevation: number;
  depthMax: number; // meters, e.g. 5.5m
  currentWaterTableDepth: number; // cm below surface (negative value, e.g. -25 cm)
  peatDepth: number; // meters (e.g. 4.8m)
  organicMatter: number; // % (e.g. 78%)
  bulkDensity: number; // g/cm3 (e.g. 0.12)
  ph: number; // e.g. 4.8
  history: {
    date: string;
    waterTableDepth: number; // cm
    soilTemp: number; // °C
    co2Flux: number; // g CO2-C / m2 / day
    ch4Flux: number; // mg CH4-C / m2 / day
  }[];
}

export interface BofedalPolygon {
  id: string;
  codeInaigem: string;
  name: string;
  basin: string;
  subbasin: string;
  areaHa: number;
  perimeterKm: number;
  avgElevation: number;
  dominantSpecies: string[];
  conservationState: 'Excelente' | 'Moderadamente Degradado' | 'Severamente Drenado' | 'En Restauración';
  peatDepthAvg: number;
  drainageDensity: number; // km/ha artificial ditches
  grazingPressure: 'Baja' | 'Media' | 'Alta' | 'Excluido';
  carbonStockTotalTons: number; // tons C
  annualCO2eqNetTons: number; // tons CO2eq/year
  coordinates3D: [number, number, number][]; // local x, z, y
}

export interface InterventionProject {
  id: string;
  code: string;
  title: string;
  type: 'Ditch_Blocking' | 'Stone_Check_Dam' | 'Cattle_Exclusion' | 'Revegetation' | 'Hydrological_Monitoring';
  status: 'Planificado' | 'En_Ejecución' | 'Completado' | 'Monitoreo_Activo';
  targetBofedalId: string;
  startDate: string;
  completionDate?: string;
  budgetUSD: number;
  damsCount?: number;
  fencedLengthMeters?: number;
  plantedSeedlings?: number;
  responsibleCommunity: string;
  initialWaterTable: number; // cm
  currentWaterTable: number; // cm
  targetWaterTable: number; // cm
  avoidedEmissionsTonsCO2eqYear: number;
  lat: number;
  lng: number;
  localCoords: [number, number, number];
}

export interface BACIDataPoint {
  period: string; // 'Pre-Intervención (2018-2020)' | 'Post-Intervención (2021-2024)'
  month: string;
  controlWTD: number; // cm
  impactWTD: number; // cm
  controlCO2Flux: number; // g C/m2/day
  impactCO2Flux: number; // g C/m2/day
  controlCH4Flux: number; // mg C/m2/day
  impactCH4Flux: number; // mg C/m2/day
  controlNDVI: number;
  impactNDVI: number;
}

export interface SimulationParameters {
  scenarioName: string;
  targetWTD: number; // cm below surface (-50 to 0)
  soilTempAnomaly: number; // °C (-1 to +4)
  precipChangePercent: number; // % (-30 to +30)
  grazingReductionPercent: number; // % (0 to 100)
  ditchBlockingRatio: number; // % (0 to 100)
  revegetationAreaHa: number; // ha
  gwpTimeframe: 'GWP-100' | 'GWP-20'; // 28 vs 84
  carbonPriceUSD: number; // USD / tCO2eq
  simulationYears: number; // 5, 10, 20, 30
}

export interface SimulationResult {
  params: SimulationParameters;
  wtdMean: number; // cm
  annualCO2Respiration: number; // t CO2/ha/yr
  annualCH4Emission: number; // t CH4/ha/yr
  annualCH4_CO2eq: number; // t CO2eq/ha/yr
  netCarbonBalanceCO2eq: number; // t CO2eq/ha/yr
  totalMitigationTonsCO2eq: number; // total cumulative
  carbonStock30Years: number; // tons C
  mereseEconomicBenefitUSD: number; // USD over period
  waterYieldRegulatedM3: number; // m3/yr baseflow contribution
  vegetationIndexProjected: number; // NDVI
  yearlyProjections: {
    year: number;
    wtd: number;
    co2Emissions: number;
    ch4Emissions: number;
    netBalanceCO2eq: number;
    cumulativeMitigation: number;
    economicValue: number;
  }[];
}

export interface SatelliteTimelapseEpoch {
  year: number;
  label: string;
  sensor: 'Landsat 5 TM' | 'Landsat 7 ETM+' | 'Landsat 8 OLI' | 'Sentinel-2 MSI';
  bofedalCoverageHa: number;
  degradedAreaHa: number;
  meanNDVI: number;
  meanNDWI: number;
  textureId: string;
  notes: string;
}

export interface GeospatialDatasetCatalogItem {
  id: string;
  title: string;
  source: 'SENAMHI' | 'ANA' | 'INAIGEM' | 'MINAM Geoservidor' | 'MapBiomas' | 'Google Earth Engine' | 'SoilGrids 2.0' | string;
  format: 'Shapefile' | 'GeoTIFF' | 'WMS/WFS' | 'REST API / JSON' | 'TimescaleDB' | 'CSV' | string;
  spatialResolution: string;
  temporalCoverage: string;
  epsg: string;
  iso19115Category: string;
  status: 'Online' | 'Sincronizado' | 'En Cache';
  lastUpdated: string;
  recordsCount?: string;
  endpointUrl: string;
}
