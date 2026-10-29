import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { DigitalTwin3D } from './components/DigitalTwin3D';
import { Map2DView } from './components/Map2DView';
import { CarbonSimulator } from './components/CarbonSimulator';
import { RestorationBACI } from './components/RestorationBACI';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { DataIngestionETL } from './components/DataIngestionETL';
import { ReportsModule } from './components/ReportsModule';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { Chatbot } from './components/Chatbot';
import { CURRENT_USER } from './data/mockDatasets';
import { UserProfile } from './types';
import { runCarbonSimulation } from './models/carbonModel';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('3d_twin');
  const [currentUser, setCurrentUser] = useState<UserProfile>(CURRENT_USER);

  // Active simulation state context for AI Chatbot Assistant
  const activeSimResult = runCarbonSimulation({
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

  const activeSimulationState = {
    scenarioName: 'Restauración Integral (Recomendado)',
    targetWTD: -8,
    soilTempAnomaly: 0,
    grazingReductionPercent: 90,
    ditchBlockingRatio: 90,
    annualCO2Respiration: activeSimResult.annualCO2Respiration,
    annualCH4Emission: activeSimResult.annualCH4Emission,
    netCarbonBalanceCO2eq: activeSimResult.netCarbonBalanceCO2eq,
    totalMitigationTonsCO2eq: activeSimResult.totalMitigationTonsCO2eq,
    mereseEconomicBenefitUSD: activeSimResult.mereseEconomicBenefitUSD
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans select-none antialiased transition-colors duration-300">
          {/* Top Main Navigation */}
          <Navbar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            currentUser={currentUser} 
            setCurrentUser={setCurrentUser} 
          />

          {/* Main Interactive Stage with Immersive HUD layout */}
          <main className="flex-1 flex overflow-hidden relative bg-slate-100 dark:bg-[#020617] transition-colors duration-300">
            {activeTab === '3d_twin' && <DigitalTwin3D />}
            {activeTab === 'map_2d' && <Map2DView />}
            {activeTab === 'simulator' && <CarbonSimulator />}
            {activeTab === 'baci_restoration' && <RestorationBACI />}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
            {activeTab === 'etl_catalog' && <DataIngestionETL />}
            {activeTab === 'reports' && <ReportsModule />}
            {activeTab === 'architecture' && <ArchitectureDocs />}
          </main>

          {/* Floating Bilingual Intelligent AI Chatbot Assistant */}
          <Chatbot 
            activeTab={activeTab} 
            currentUser={currentUser} 
            activeSimulationState={activeSimulationState} 
          />
        </div>
      </LanguageProvider>
    </ThemeProvider>
  );
}


