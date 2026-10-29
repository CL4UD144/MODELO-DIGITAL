import { 
  SenamhiStation, 
  WeatherRecord, 
  PiezometerData, 
  BofedalPolygon, 
  InterventionProject, 
  BACIDataPoint, 
  SatelliteTimelapseEpoch, 
  GeospatialDatasetCatalogItem, 
  UserProfile 
} from '../types';

export const CURRENT_USER: UserProfile = {
  id: 'usr-001',
  name: 'Dr. Alejandro Vásquez Mantilla',
  email: 'a.vasquez@unc.edu.pe',
  role: 'scientist',
  organization: 'Universidad Nacional de Cajamarca & CIAT/INAIGEM',
  community: 'Comunidad Campesina Chirimayo-Combayo',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  permissions: ['view_all', 'run_simulations', 'edit_interventions', 'export_reports', 'manage_etl']
};

export const SENAMHI_STATIONS: SenamhiStation[] = [
  {
    id: 'sta-01',
    code: '110408',
    name: 'Estación Meteorológica Cajamarca - Aeropuerto',
    lat: -7.1416,
    lng: -78.4892,
    altitude: 2620,
    type: 'Climatológica Ordinaria',
    zonalDirectorate: 'DZ3 Cajamarca',
    precipAnnualAvg: 720.5,
    tempAvg: 14.2,
    recordsCount: 18260
  },
  {
    id: 'sta-02',
    code: '110411',
    name: 'Estación Hidrológica Granja Porcón (Jalca Alta)',
    lat: -7.0315,
    lng: -78.6184,
    altitude: 3510,
    type: 'Agrometeorológica',
    zonalDirectorate: 'DZ3 Cajamarca',
    precipAnnualAvg: 1140.8,
    tempAvg: 8.6,
    recordsCount: 16425
  },
  {
    id: 'sta-03',
    code: '110405',
    name: 'Estación Encañada - Microcuenca Chirimayo',
    lat: -7.0850,
    lng: -78.3320,
    altitude: 3120,
    type: 'Pluviométrica',
    zonalDirectorate: 'DZ3 Cajamarca',
    precipAnnualAvg: 965.2,
    tempAvg: 11.4,
    recordsCount: 14610
  },
  {
    id: 'sta-04',
    code: '110419',
    name: 'Estación Jalca Chirimayo - Cumbre Alta',
    lat: -7.0422,
    lng: -78.3845,
    altitude: 3840,
    type: 'Climatológica Ordinaria',
    zonalDirectorate: 'DZ3 Cajamarca',
    precipAnnualAvg: 1280.4,
    tempAvg: 6.8,
    recordsCount: 7300
  }
];

export const PIEZOMETERS: PiezometerData[] = [
  {
    id: 'pz-01',
    code: 'PZ-CHIR-01',
    name: 'Piezómetro Núcleo Turbera Central (Bofedal Chirimayo Alto)',
    lat: -7.0452,
    lng: -78.3882,
    elevation: 3820,
    depthMax: 7.2,
    currentWaterTableDepth: -8.5, // cm (restaurado)
    peatDepth: 6.8,
    organicMatter: 84.5,
    bulkDensity: 0.095,
    ph: 4.6,
    history: [
      { date: '2024-01-15', waterTableDepth: -12.0, soilTemp: 7.2, co2Flux: 1.15, ch4Flux: 14.8 },
      { date: '2024-02-15', waterTableDepth: -6.5, soilTemp: 7.5, co2Flux: 0.85, ch4Flux: 22.4 },
      { date: '2024-03-15', waterTableDepth: -4.0, soilTemp: 7.8, co2Flux: 0.62, ch4Flux: 28.1 },
      { date: '2024-04-15', waterTableDepth: -5.2, soilTemp: 7.4, co2Flux: 0.74, ch4Flux: 25.0 },
      { date: '2024-05-15', waterTableDepth: -9.8, soilTemp: 6.9, co2Flux: 1.02, ch4Flux: 18.2 },
      { date: '2024-06-15', waterTableDepth: -15.4, soilTemp: 6.2, co2Flux: 1.45, ch4Flux: 11.5 },
      { date: '2024-07-15', waterTableDepth: -18.2, soilTemp: 5.8, co2Flux: 1.68, ch4Flux: 8.4 },
      { date: '2024-08-15', waterTableDepth: -14.1, soilTemp: 6.5, co2Flux: 1.32, ch4Flux: 12.0 }
    ]
  },
  {
    id: 'pz-02',
    code: 'PZ-CHIR-02',
    name: 'Piezómetro Sector Drenado Zanja Artificial 3',
    lat: -7.0489,
    lng: -78.3812,
    elevation: 3790,
    depthMax: 5.5,
    currentWaterTableDepth: -42.0, // cm (degradado por drenaje)
    peatDepth: 4.2,
    organicMatter: 72.3,
    bulkDensity: 0.165,
    ph: 5.1,
    history: [
      { date: '2024-01-15', waterTableDepth: -38.0, soilTemp: 8.5, co2Flux: 3.45, ch4Flux: 1.2 },
      { date: '2024-02-15', waterTableDepth: -34.5, soilTemp: 8.8, co2Flux: 3.10, ch4Flux: 2.1 },
      { date: '2024-03-15', waterTableDepth: -28.0, soilTemp: 8.9, co2Flux: 2.65, ch4Flux: 3.8 },
      { date: '2024-04-15', waterTableDepth: -32.2, soilTemp: 8.6, co2Flux: 2.95, ch4Flux: 2.5 },
      { date: '2024-05-15', waterTableDepth: -41.0, soilTemp: 7.9, co2Flux: 3.65, ch4Flux: 1.0 },
      { date: '2024-06-15', waterTableDepth: -48.5, soilTemp: 7.2, co2Flux: 4.20, ch4Flux: 0.4 },
      { date: '2024-07-15', waterTableDepth: -54.0, soilTemp: 6.9, co2Flux: 4.60, ch4Flux: 0.2 },
      { date: '2024-08-15', waterTableDepth: -46.2, soilTemp: 7.4, co2Flux: 3.90, ch4Flux: 0.7 }
    ]
  },
  {
    id: 'pz-03',
    code: 'PZ-CHIR-03',
    name: 'Piezómetro Rumichaca (Zona en Rehumidificación)',
    lat: -7.0395,
    lng: -78.3920,
    elevation: 3865,
    depthMax: 6.0,
    currentWaterTableDepth: -11.0,
    peatDepth: 5.4,
    organicMatter: 81.0,
    bulkDensity: 0.108,
    ph: 4.7,
    history: [
      { date: '2024-01-15', waterTableDepth: -14.0, soilTemp: 7.0, co2Flux: 1.35, ch4Flux: 12.0 },
      { date: '2024-02-15', waterTableDepth: -8.0, soilTemp: 7.2, co2Flux: 0.95, ch4Flux: 19.5 },
      { date: '2024-03-15', waterTableDepth: -6.0, soilTemp: 7.6, co2Flux: 0.78, ch4Flux: 24.2 },
      { date: '2024-04-15', waterTableDepth: -7.5, soilTemp: 7.3, co2Flux: 0.88, ch4Flux: 21.0 },
      { date: '2024-05-15', waterTableDepth: -12.5, soilTemp: 6.8, co2Flux: 1.20, ch4Flux: 15.0 },
      { date: '2024-06-15', waterTableDepth: -18.0, soilTemp: 6.1, co2Flux: 1.62, ch4Flux: 9.0 },
      { date: '2024-07-15', waterTableDepth: -21.0, soilTemp: 5.7, co2Flux: 1.85, ch4Flux: 6.5 },
      { date: '2024-08-15', waterTableDepth: -16.0, soilTemp: 6.4, co2Flux: 1.48, ch4Flux: 10.2 }
    ]
  },
  {
    id: 'pz-04',
    code: 'PZ-CHIR-04',
    name: 'Piezómetro Cabecera de Cuenca - Laguna Jalca',
    lat: -7.0310,
    lng: -78.3995,
    elevation: 3990,
    depthMax: 4.8,
    currentWaterTableDepth: -3.5, // Casi saturado
    peatDepth: 3.9,
    organicMatter: 86.2,
    bulkDensity: 0.088,
    ph: 4.4,
    history: [
      { date: '2024-01-15', waterTableDepth: -4.5, soilTemp: 6.5, co2Flux: 0.65, ch4Flux: 26.0 },
      { date: '2024-02-15', waterTableDepth: -2.0, soilTemp: 6.8, co2Flux: 0.45, ch4Flux: 34.0 },
      { date: '2024-03-15', waterTableDepth: -1.0, soilTemp: 7.1, co2Flux: 0.38, ch4Flux: 39.5 },
      { date: '2024-04-15', waterTableDepth: -2.5, soilTemp: 6.7, co2Flux: 0.48, ch4Flux: 31.0 },
      { date: '2024-05-15', waterTableDepth: -5.0, soilTemp: 6.2, co2Flux: 0.72, ch4Flux: 24.0 },
      { date: '2024-06-15', waterTableDepth: -8.0, soilTemp: 5.5, co2Flux: 0.95, ch4Flux: 17.5 },
      { date: '2024-07-15', waterTableDepth: -9.5, soilTemp: 5.1, co2Flux: 1.08, ch4Flux: 14.0 },
      { date: '2024-08-15', waterTableDepth: -6.0, soilTemp: 5.8, co2Flux: 0.82, ch4Flux: 21.0 }
    ]
  }
];

export const BOFEDALES: BofedalPolygon[] = [
  {
    id: 'bof-01',
    codeInaigem: 'PE-CAJ-BOF-00412',
    name: 'Turbera Bofedal Chirimayo Central',
    basin: 'Cuenca del Río Crisnejas (ANA Cód. 0134)',
    subbasin: 'Microcuenca Quebrada Chirimayo',
    areaHa: 142.5,
    perimeterKm: 6.8,
    avgElevation: 3825,
    dominantSpecies: ['Distichia muscoides', 'Plantago rigida', 'Sphagnum magellanicum', 'Carex ecuadorica', 'Werneria nubigena'],
    conservationState: 'En Restauración',
    peatDepthAvg: 5.8,
    drainageDensity: 1.4,
    grazingPressure: 'Excluido',
    carbonStockTotalTons: 712500, // ~5000 t C/ha
    annualCO2eqNetTons: -485.0, // Sumidero neto de carbono
    coordinates3D: [
      [-12, -2, -15],
      [-5, -1, -22],
      [10, 0, -18],
      [18, 1, -5],
      [12, 0, 10],
      [-2, -1, 14],
      [-15, -2, 2]
    ]
  },
  {
    id: 'bof-02',
    codeInaigem: 'PE-CAJ-BOF-00413',
    name: 'Turbera Bofedal Rumichaca Alto',
    basin: 'Cuenca del Río Crisnejas',
    subbasin: 'Microcuenca Quebrada Chirimayo',
    areaHa: 88.3,
    perimeterKm: 4.6,
    avgElevation: 3870,
    dominantSpecies: ['Distichia muscoides', 'Alchemilla pinnata', 'Oreobolus obtusangulus', 'Gentiana sedifolia'],
    conservationState: 'Excelente',
    peatDepthAvg: 4.9,
    drainageDensity: 0.2,
    grazingPressure: 'Baja',
    carbonStockTotalTons: 406180,
    annualCO2eqNetTons: -320.0,
    coordinates3D: [
      [-25, 2, -30],
      [-12, 1, -38],
      [-4, 2, -32],
      [-8, 1, -20],
      [-22, 1, -18]
    ]
  },
  {
    id: 'bof-03',
    codeInaigem: 'PE-CAJ-BOF-00414',
    name: 'Bofedal Sector Drenajes Artificiales El Pajonal',
    basin: 'Cuenca del Río Crisnejas',
    subbasin: 'Microcuenca Quebrada Chirimayo',
    areaHa: 104.2,
    perimeterKm: 5.2,
    avgElevation: 3760,
    dominantSpecies: ['Calamagrostis vicunarum', 'Festuca dolichophylla', 'Stipa ichu (invasión por desecación)'],
    conservationState: 'Severamente Drenado',
    peatDepthAvg: 3.8,
    drainageDensity: 4.8, // Gran densidad de zanjas artificiales
    grazingPressure: 'Alta',
    carbonStockTotalTons: 385540,
    annualCO2eqNetTons: 1250.0, // Fuerte fuente neta de CO2
    coordinates3D: [
      [5, -2, 8],
      [22, -1, 12],
      [30, 0, 25],
      [15, -1, 32],
      [2, -2, 22]
    ]
  },
  {
    id: 'bof-04',
    codeInaigem: 'PE-CAJ-BOF-00415',
    name: 'Turbera Bofedal Calicanto - Cabecera Glaciar',
    basin: 'Cuenca del Río Crisnejas',
    subbasin: 'Microcuenca Quebrada Chirimayo',
    areaHa: 50.0,
    perimeterKm: 3.1,
    avgElevation: 3980,
    dominantSpecies: ['Sphagnum spp.', 'Distichia muscoides', 'Isoetes andina', 'Valeriana microphylla'],
    conservationState: 'Excelente',
    peatDepthAvg: 6.4,
    drainageDensity: 0.0,
    grazingPressure: 'Excluido',
    carbonStockTotalTons: 310000,
    annualCO2eqNetTons: -210.0,
    coordinates3D: [
      [-32, 5, -45],
      [-18, 4, -48],
      [-14, 4, -40],
      [-28, 5, -35]
    ]
  }
];

export const INTERVENTION_PROJECTS: InterventionProject[] = [
  {
    id: 'proj-01',
    code: 'INT-CHIR-2023-01',
    title: 'Bloqueo Hidráulico de Zanjas de Drenaje Sector El Pajonal',
    type: 'Ditch_Blocking',
    status: 'Monitoreo_Activo',
    targetBofedalId: 'bof-03',
    startDate: '2023-05-10',
    completionDate: '2023-11-20',
    budgetUSD: 38500,
    damsCount: 42,
    responsibleCommunity: 'Comunidad Campesina Chirimayo-Combayo',
    initialWaterTable: -46.0,
    currentWaterTable: -18.5,
    targetWaterTable: -10.0,
    avoidedEmissionsTonsCO2eqYear: 680.0,
    lat: -7.0489,
    lng: -78.3812,
    localCoords: [14, -1, 18]
  },
  {
    id: 'proj-02',
    code: 'INT-CHIR-2023-02',
    title: 'Diques de Retención de Piedra y Champa (Stone & Peat Bunds)',
    type: 'Stone_Check_Dam',
    status: 'Completado',
    targetBofedalId: 'bof-01',
    startDate: '2023-08-01',
    completionDate: '2024-01-15',
    budgetUSD: 24000,
    damsCount: 28,
    responsibleCommunity: 'Asociación de Regantes Jalca Alta',
    initialWaterTable: -22.0,
    currentWaterTable: -8.5,
    targetWaterTable: -5.0,
    avoidedEmissionsTonsCO2eqYear: 320.0,
    lat: -7.0452,
    lng: -78.3882,
    localCoords: [-2, 0, -5]
  },
  {
    id: 'proj-03',
    code: 'INT-CHIR-2024-01',
    title: 'Clausura de Pastoreo y Cerco Perimétrico con Malla Ganadera',
    type: 'Cattle_Exclusion',
    status: 'En_Ejecución',
    targetBofedalId: 'bof-03',
    startDate: '2024-02-01',
    budgetUSD: 19500,
    fencedLengthMeters: 3400,
    responsibleCommunity: 'Comunidad Campesina Chirimayo-Combayo',
    initialWaterTable: -42.0,
    currentWaterTable: -35.0,
    targetWaterTable: -12.0,
    avoidedEmissionsTonsCO2eqYear: 410.0,
    lat: -7.0505,
    lng: -78.3790,
    localCoords: [20, -1, 24]
  },
  {
    id: 'proj-04',
    code: 'INT-CHIR-2024-02',
    title: 'Revegetación Asistida con Almohadillas Nativas (Distichia & Sphagnum)',
    type: 'Revegetation',
    status: 'Planificado',
    targetBofedalId: 'bof-03',
    startDate: '2024-10-01',
    budgetUSD: 14200,
    plantedSeedlings: 25000,
    responsibleCommunity: 'Comité de Mujeres Conservadoras del Bofedal',
    initialWaterTable: -35.0,
    currentWaterTable: -35.0,
    targetWaterTable: -8.0,
    avoidedEmissionsTonsCO2eqYear: 290.0,
    lat: -7.0475,
    lng: -78.3830,
    localCoords: [10, -1, 12]
  }
];

export const BACI_SERIES: BACIDataPoint[] = [
  { period: 'Pre-Intervención (2018-2020)', month: 'Ene', controlWTD: -8.5, impactWTD: -42.0, controlCO2Flux: 1.1, impactCO2Flux: 3.8, controlCH4Flux: 18.5, impactCH4Flux: 0.8, controlNDVI: 0.72, impactNDVI: 0.44 },
  { period: 'Pre-Intervención (2018-2020)', month: 'Feb', controlWTD: -5.0, impactWTD: -38.5, controlCO2Flux: 0.9, impactCO2Flux: 3.5, controlCH4Flux: 24.0, impactCH4Flux: 1.2, controlNDVI: 0.74, impactNDVI: 0.46 },
  { period: 'Pre-Intervención (2018-2020)', month: 'Mar', controlWTD: -3.0, impactWTD: -32.0, controlCO2Flux: 0.7, impactCO2Flux: 2.9, controlCH4Flux: 29.5, impactCH4Flux: 2.1, controlNDVI: 0.76, impactNDVI: 0.48 },
  { period: 'Pre-Intervención (2018-2020)', month: 'Abr', controlWTD: -4.5, impactWTD: -35.0, controlCO2Flux: 0.8, impactCO2Flux: 3.2, controlCH4Flux: 26.0, impactCH4Flux: 1.5, controlNDVI: 0.75, impactNDVI: 0.47 },
  { period: 'Pre-Intervención (2018-2020)', month: 'May', controlWTD: -9.0, impactWTD: -45.0, controlCO2Flux: 1.2, impactCO2Flux: 4.1, controlCH4Flux: 16.5, impactCH4Flux: 0.6, controlNDVI: 0.71, impactNDVI: 0.42 },
  { period: 'Pre-Intervención (2018-2020)', month: 'Jun', controlWTD: -14.0, impactWTD: -52.0, controlCO2Flux: 1.6, impactCO2Flux: 4.8, controlCH4Flux: 10.0, impactCH4Flux: 0.3, controlNDVI: 0.68, impactNDVI: 0.38 },
  { period: 'Pre-Intervención (2018-2020)', month: 'Jul', controlWTD: -16.5, impactWTD: -58.0, controlCO2Flux: 1.8, impactCO2Flux: 5.2, controlCH4Flux: 7.5, impactCH4Flux: 0.1, controlNDVI: 0.66, impactNDVI: 0.35 },
  { period: 'Pre-Intervención (2018-2020)', month: 'Ago', controlWTD: -13.0, impactWTD: -50.0, controlCO2Flux: 1.5, impactCO2Flux: 4.5, controlCH4Flux: 11.0, impactCH4Flux: 0.4, controlNDVI: 0.69, impactNDVI: 0.39 },
  { period: 'Pre-Intervención (2018-2020)', month: 'Set', controlWTD: -11.5, impactWTD: -46.0, controlCO2Flux: 1.3, impactCO2Flux: 4.2, controlCH4Flux: 13.5, impactCH4Flux: 0.6, controlNDVI: 0.70, impactNDVI: 0.41 },
  { period: 'Pre-Intervención (2018-2020)', month: 'Oct', controlWTD: -9.0, impactWTD: -43.0, controlCO2Flux: 1.1, impactCO2Flux: 3.9, controlCH4Flux: 17.0, impactCH4Flux: 0.9, controlNDVI: 0.72, impactNDVI: 0.43 },
  { period: 'Pre-Intervención (2018-2020)', month: 'Nov', controlWTD: -7.0, impactWTD: -40.0, controlCO2Flux: 0.95, impactCO2Flux: 3.6, controlCH4Flux: 21.0, impactCH4Flux: 1.1, controlNDVI: 0.73, impactNDVI: 0.45 },
  { period: 'Pre-Intervención (2018-2020)', month: 'Dic', controlWTD: -6.0, impactWTD: -37.0, controlCO2Flux: 0.85, impactCO2Flux: 3.4, controlCH4Flux: 23.5, impactCH4Flux: 1.4, controlNDVI: 0.74, impactNDVI: 0.46 },
  
  // Post-Intervención
  { period: 'Post-Intervención (2021-2024)', month: 'Ene', controlWTD: -8.0, impactWTD: -12.5, controlCO2Flux: 1.05, impactCO2Flux: 1.35, controlCH4Flux: 19.0, impactCH4Flux: 14.5, controlNDVI: 0.73, impactNDVI: 0.68 },
  { period: 'Post-Intervención (2021-2024)', month: 'Feb', controlWTD: -4.5, impactWTD: -7.0, controlCO2Flux: 0.85, impactCO2Flux: 0.98, controlCH4Flux: 25.0, impactCH4Flux: 21.5, controlNDVI: 0.75, impactNDVI: 0.71 },
  { period: 'Post-Intervención (2021-2024)', month: 'Mar', controlWTD: -2.5, impactWTD: -4.2, controlCO2Flux: 0.68, impactCO2Flux: 0.75, controlCH4Flux: 30.5, impactCH4Flux: 27.0, controlNDVI: 0.77, impactNDVI: 0.74 },
  { period: 'Post-Intervención (2021-2024)', month: 'Abr', controlWTD: -4.0, impactWTD: -5.8, controlCO2Flux: 0.78, impactCO2Flux: 0.86, controlCH4Flux: 27.0, impactCH4Flux: 23.8, controlNDVI: 0.76, impactNDVI: 0.72 },
  { period: 'Post-Intervención (2021-2024)', month: 'May', controlWTD: -8.5, impactWTD: -10.5, controlCO2Flux: 1.15, impactCO2Flux: 1.25, controlCH4Flux: 17.5, impactCH4Flux: 16.0, controlNDVI: 0.72, impactNDVI: 0.67 },
  { period: 'Post-Intervención (2021-2024)', month: 'Jun', controlWTD: -13.5, impactWTD: -16.2, controlCO2Flux: 1.55, impactCO2Flux: 1.70, controlCH4Flux: 10.8, impactCH4Flux: 9.8, controlNDVI: 0.69, impactNDVI: 0.64 },
  { period: 'Post-Intervención (2021-2024)', month: 'Jul', controlWTD: -15.8, impactWTD: -19.0, controlCO2Flux: 1.75, impactCO2Flux: 1.92, controlCH4Flux: 8.2, impactCH4Flux: 7.4, controlNDVI: 0.67, impactNDVI: 0.62 },
  { period: 'Post-Intervención (2021-2024)', month: 'Ago', controlWTD: -12.5, impactWTD: -15.0, controlCO2Flux: 1.45, impactCO2Flux: 1.58, controlCH4Flux: 11.8, impactCH4Flux: 10.5, controlNDVI: 0.70, impactNDVI: 0.65 },
  { period: 'Post-Intervención (2021-2024)', month: 'Set', controlWTD: -11.0, impactWTD: -13.5, controlCO2Flux: 1.25, impactCO2Flux: 1.40, controlCH4Flux: 14.2, impactCH4Flux: 13.0, controlNDVI: 0.71, impactNDVI: 0.66 },
  { period: 'Post-Intervención (2021-2024)', month: 'Oct', controlWTD: -8.5, impactWTD: -11.0, controlCO2Flux: 1.05, impactCO2Flux: 1.18, controlCH4Flux: 17.8, impactCH4Flux: 15.6, controlNDVI: 0.73, impactNDVI: 0.69 },
  { period: 'Post-Intervención (2021-2024)', month: 'Nov', controlWTD: -6.5, impactWTD: -8.5, controlCO2Flux: 0.90, impactCO2Flux: 1.02, controlCH4Flux: 21.8, impactCH4Flux: 19.4, controlNDVI: 0.74, impactNDVI: 0.71 },
  { period: 'Post-Intervención (2021-2024)', month: 'Dic', controlWTD: -5.5, impactWTD: -7.2, controlCO2Flux: 0.80, impactCO2Flux: 0.90, controlCH4Flux: 24.5, impactCH4Flux: 22.0, controlNDVI: 0.75, impactNDVI: 0.72 }
];

export const SATELLITE_TIMELAPSE: SatelliteTimelapseEpoch[] = [
  {
    year: 1984,
    label: '1984 - Condición Prístina Pre-Drenaje',
    sensor: 'Landsat 5 TM',
    bofedalCoverageHa: 412.0,
    degradedAreaHa: 18.0,
    meanNDVI: 0.74,
    meanNDWI: 0.58,
    textureId: 'pristine_1984',
    notes: 'Bofedales continuos sin zanjas de drenaje mecanizadas ni sobrepastoreo intensivo ovino.'
  },
  {
    year: 1995,
    label: '1995 - Apertura de Zanjas de Desecación',
    sensor: 'Landsat 5 TM',
    bofedalCoverageHa: 360.5,
    degradedAreaHa: 69.5,
    meanNDVI: 0.66,
    meanNDWI: 0.45,
    textureId: 'ditching_1995',
    notes: 'Construcción comunal de zanjas lineales para expandir pastos exóticos y áreas de pastoreo.'
  },
  {
    year: 2005,
    label: '2005 - Desecación Crítica y Retracción',
    sensor: 'Landsat 7 ETM+',
    bofedalCoverageHa: 295.0,
    degradedAreaHa: 135.0,
    meanNDVI: 0.52,
    meanNDWI: 0.28,
    textureId: 'degraded_2005',
    notes: 'Descenso severo del nivel freático (-60 cm), formación de grietas por desecación de turba.'
  },
  {
    year: 2015,
    label: '2015 - Máxima Degradación y Erosión',
    sensor: 'Landsat 8 OLI',
    bofedalCoverageHa: 260.0,
    degradedAreaHa: 170.0,
    meanNDVI: 0.46,
    meanNDWI: 0.19,
    textureId: 'max_degraded_2015',
    notes: 'Invasión masiva de gramíneas duras (Stipa ichu) y pérdida de colchón hidrológico de Distichia.'
  },
  {
    year: 2021,
    label: '2021 - Inicio Programa Restauración MERESE',
    sensor: 'Sentinel-2 MSI',
    bofedalCoverageHa: 310.0,
    degradedAreaHa: 120.0,
    meanNDVI: 0.62,
    meanNDWI: 0.42,
    textureId: 'restoration_2021',
    notes: 'Instalación de 70 diques de retención, clausura de 120 ha y elevación del nivel freático.'
  },
  {
    year: 2024,
    label: '2024 - Estado Actual en Recuperación Activa',
    sensor: 'Sentinel-2 MSI',
    bofedalCoverageHa: 385.0,
    degradedAreaHa: 45.0,
    meanNDVI: 0.72,
    meanNDWI: 0.55,
    textureId: 'current_2024',
    notes: 'Revegetación natural de colchones de turba y recuperación de 420,000 m3 de regulación hídrica anual.'
  }
];

export const GEOSPATIAL_CATALOG: GeospatialDatasetCatalogItem[] = [
  {
    id: 'cat-01',
    title: 'SENAMHI - Red Meteorológica Histórica DZ3 Cajamarca (1964-2024)',
    source: 'SENAMHI',
    format: 'TimescaleDB',
    spatialResolution: 'Estaciones Puntuales (370 estaciones)',
    temporalCoverage: '1964 - 2024 (Diario / Horario)',
    epsg: 'EPSG:4326 (WGS84)',
    iso19115Category: 'Climatology / Meteorology / Atmosphere',
    status: 'Sincronizado',
    lastUpdated: '2024-08-20',
    recordsCount: '2.4M registros climáticos',
    endpointUrl: 'https://api.senamhi.gob.pe/v2/clima/cajamarca'
  },
  {
    id: 'cat-02',
    title: 'ANA - Red Hidrográfica y Límites de Cuencas y Microcuencas del Perú',
    source: 'ANA',
    format: 'Shapefile',
    spatialResolution: 'Escala 1:25,000 / 1:50,000',
    temporalCoverage: 'Actualizado 2023',
    epsg: 'EPSG:32717 (UTM Zona 17 Sur)',
    iso19115Category: 'Inland Waters / Hydrology',
    status: 'Sincronizado',
    lastUpdated: '2023-11-15',
    recordsCount: 'Capa vectorial cuencas/subcuencas',
    endpointUrl: 'https://snirh.ana.gob.pe/geoserver/wfs'
  },
  {
    id: 'cat-03',
    title: 'INAIGEM - Inventario Nacional de Bofedales del Perú 2023',
    source: 'INAIGEM',
    format: 'Shapefile',
    spatialResolution: '10 m (Validación Sentinel-2 + Campo)',
    temporalCoverage: '2023 (1,051,134 ha mapeadas nacional)',
    epsg: 'EPSG:4326 (WGS84)',
    iso19115Category: 'Biota / Environment / Wetlands',
    status: 'Sincronizado',
    lastUpdated: '2023-12-10',
    recordsCount: '1,051,134 ha nacionales',
    endpointUrl: 'https://simbofedales.inaigem.gob.pe/geoserver/wfs'
  },
  {
    id: 'cat-04',
    title: 'MINAM Geoservidor - Cobertura Vegetal, Carbono y Ecosistemas',
    source: 'MINAM Geoservidor',
    format: 'WMS/WFS',
    spatialResolution: 'Escala 1:100,000 & Raster 30m',
    temporalCoverage: '2019 - 2023',
    epsg: 'EPSG:4326',
    iso19115Category: 'Environment / Ecology / Carbon Stock',
    status: 'Online',
    lastUpdated: '2024-04-12',
    recordsCount: 'Capas WMS Nacionales',
    endpointUrl: 'https://geoservidor.minam.gob.pe/geoserver/wms'
  },
  {
    id: 'cat-05',
    title: 'MapBiomas Perú - Colección 2.0 Cobertura y Uso del Suelo (1985-2023)',
    source: 'MapBiomas',
    format: 'GeoTIFF',
    spatialResolution: '30 m (Landsat Archive)',
    temporalCoverage: '1985 - 2023 Anual',
    epsg: 'EPSG:4326',
    iso19115Category: 'Land Cover / Land Use Change',
    status: 'En Cache',
    lastUpdated: '2024-02-05',
    recordsCount: '38 colecciones anuales',
    endpointUrl: 'https://peru.mapbiomas.org/api/wms'
  },
  {
    id: 'cat-06',
    title: 'Google Earth Engine - ALOS PALSAR DEM (30m) & Sentinel-2 MSI',
    source: 'Google Earth Engine',
    format: 'REST API / JSON',
    spatialResolution: '10 m - 30 m',
    temporalCoverage: 'Series temporales 2016-2024',
    epsg: 'EPSG:4326',
    iso19115Category: 'Elevation / Remote Sensing Indices',
    status: 'Online',
    lastUpdated: '2024-08-25',
    recordsCount: 'Series continuas NDVI/EVI/NDWI',
    endpointUrl: 'ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")'
  },
  {
    id: 'cat-07',
    title: 'SoilGrids 2.0 (ISRIC) - Carbono Orgánico del Suelo, Densidad y pH',
    source: 'SoilGrids 2.0',
    format: 'GeoTIFF',
    spatialResolution: '250 m (Downscaled 30 m)',
    temporalCoverage: 'Global Baseline 2020',
    epsg: 'EPSG:4326',
    iso19115Category: 'Geoscientific Information / Soils',
    status: 'Sincronizado',
    lastUpdated: '2023-09-18',
    recordsCount: '6 estratos de profundidad (0-200cm)',
    endpointUrl: 'https://files.isric.org/soilgrids/latest/data/'
  }
];

// 3D terrain elevation height grid generator for Microcuenca Chirimayo
// Generates realistic glacial-fluvial Andean valley topography with central depression where peat bofedales develop
export function generateTerrainGrid(gridSize = 32): { elevations: number[][]; minAlt: number; maxAlt: number } {
  const elevations: number[][] = [];
  const minAlt = 3680;
  const maxAlt = 4060;

  for (let i = 0; i < gridSize; i++) {
    const row: number[] = [];
    const u = (i / (gridSize - 1)) * 2 - 1; // -1 to 1

    for (let j = 0; j < gridSize; j++) {
      const v = (j / (gridSize - 1)) * 2 - 1; // -1 to 1

      // Valley profile math: U-shaped valley with higher ridge on western and eastern borders
      const ridgeElevation = Math.pow(Math.abs(u), 1.6) * 220 + Math.pow(v, 2) * 140;
      // Meandering stream incision & hollow basin
      const meander = Math.sin(v * 4 + u * 2) * 15;
      const glacialCirque = Math.exp(-Math.pow(u + 0.6, 2) - Math.pow(v + 0.7, 2)) * 60;
      // Central bofedal flat depression where peat accumulated
      const bofedalDepression = Math.exp(-Math.pow(u * 1.5, 2) - Math.pow(v * 1.2, 2)) * -45;

      const totalH = minAlt + 120 + ridgeElevation + meander + glacialCirque + bofedalDepression;
      row.push(Math.round(totalH));
    }
    elevations.push(row);
  }

  return { elevations, minAlt, maxAlt };
}
