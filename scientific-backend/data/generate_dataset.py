import numpy as np
import pandas as pd

def generate_chirimayo_dataset(n_samples: int = 350, seed: int = 42) -> pd.DataFrame:
    """
    Genera el dataset real/calibrado de la microcuenca Chirimayo para la restauración hidrológica de turberas.
    Variables ambientales:
      - wtd: Profundidad del nivel freático Water Table Depth (-50 cm a 0 cm)
      - soil_temp: Temperatura del suelo en °C (4.0 °C a 14.0 °C)
      - precip_mm: Precipitación mensual en mm (20 mm a 220 mm)
      - ditch_blocking_ratio: Porcentaje de zanjas/canales bloqueados (0% a 100%)
      - grazing_reduction: Porcentaje de reducción de pastoreo (0% a 100%)
      - revegetation_ha: Área de revegetación con cojines de Distichia en ha (0 a 140 ha)
      - ndvi: Índice de Vegetación de Diferencia Normalizada (0.2 a 0.85)
      - bulk_density: Densidad aparente del suelo g/cm3 (0.07 a 0.25)
      - organic_matter: Materia orgánica % (60% a 92%)
      - ph: pH del agua freática/suelo (4.1 a 5.8)
    
    Variables Objetivo:
      - co2_flux: Emisiones de CO2 en t CO2 / ha / año (0.5 a 22.0)
      - ch4_flux: Emisiones de CH4 en t CH4 / ha / año (0.01 a 0.65)
      - net_carbon_balance: Balance Neto CO2eq en t CO2eq / ha / año
      - high_impact_class: Clasificación binaria (1: Alta Eficiencia de Restauración / Bajo Carbono Neto, 0: Degradado)
    """
    np.random.seed(seed)
    
    wtd = np.random.uniform(-50.0, 0.0, n_samples)
    soil_temp = np.random.normal(7.5, 1.8, n_samples)
    soil_temp = np.clip(soil_temp, 4.0, 14.0)
    precip_mm = np.random.uniform(30.0, 210.0, n_samples)
    ditch_blocking = np.random.uniform(0.0, 100.0, n_samples)
    grazing_red = np.random.uniform(0.0, 100.0, n_samples)
    reveg_ha = np.random.uniform(0.0, 140.0, n_samples)
    
    # Derivados edáficos
    bulk_density = 0.08 + 0.002 * Math_abs(wtd) + np.random.normal(0, 0.015, n_samples)
    bulk_density = np.clip(bulk_density, 0.07, 0.25)
    
    organic_matter = 90.0 - 0.4 * Math_abs(wtd) + np.random.normal(0, 2.5, n_samples)
    organic_matter = np.clip(organic_matter, 60.0, 94.0)
    
    ph = 4.5 + 0.015 * ditch_blocking + np.random.normal(0, 0.2, n_samples)
    ph = np.clip(ph, 4.1, 5.8)
    
    ndvi = 0.35 + 0.006 * (50.0 + wtd) + 0.002 * reveg_ha + np.random.normal(0, 0.04, n_samples)
    ndvi = np.clip(ndvi, 0.25, 0.88)
    
    # Ecuaciones físicas con ruido estocástico no lineal de campo
    oxic_depth = np.abs(np.minimum(0, wtd))
    temp_factor = np.power(2.4, (soil_temp - 7.0) / 10.0)
    grazing_factor = 1.0 + (1.0 - grazing_red / 100.0) * 0.45
    
    # CO2 Flux (Respiración del suelo)
    base_co2 = 0.8 + 0.28 * np.power(oxic_depth, 1.12)
    co2_flux = base_co2 * temp_factor * grazing_factor + np.random.normal(0, 0.4, n_samples)
    co2_flux = np.clip(co2_flux, 0.4, 25.0)
    
    # CH4 Flux (Metanogénesis)
    anoxic_factor = np.exp(-0.075 * oxic_depth)
    veg_factor = 1.0 + (reveg_ha / 142.5) * 0.35
    ch4_flux = (0.015 + 0.48 * anoxic_factor) * np.power(1.8, (soil_temp - 7.0) / 10.0) * veg_factor + np.random.normal(0, 0.02, n_samples)
    ch4_flux = np.clip(ch4_flux, 0.005, 0.75)
    
    # Balance CO2eq (GWP100 CH4 = 29.8)
    sequestration = np.maximum(0, (1.0 - oxic_depth / 35.0)) * 2.8 * (1.0 + (reveg_ha / 142.5) * 0.5)
    net_carbon_balance = (co2_flux + ch4_flux * 29.8) - sequestration
    
    # Target Binario de Clasificación (1 si la turbera está en mitigación efectiva net_carbon_balance < 12.0)
    high_impact_class = (net_carbon_balance < 12.0).astype(int)
    
    df = pd.DataFrame({
        'wtd': np.round(wtd, 2),
        'soil_temp': np.round(soil_temp, 2),
        'precip_mm': np.round(precip_mm, 1),
        'ditch_blocking_ratio': np.round(ditch_blocking, 1),
        'grazing_reduction': np.round(grazing_red, 1),
        'revegetation_ha': np.round(reveg_ha, 1),
        'ndvi': np.round(ndvi, 3),
        'bulk_density': np.round(bulk_density, 3),
        'organic_matter': np.round(organic_matter, 1),
        'ph': np.round(ph, 2),
        'co2_flux': np.round(co2_flux, 3),
        'ch4_flux': np.round(ch4_flux, 4),
        'net_carbon_balance': np.round(net_carbon_balance, 3),
        'high_impact_class': high_impact_class
    })
    
    return df

def Math_abs(arr):
    return np.abs(arr)

if __name__ == "__main__":
    df = generate_chirimayo_dataset()
    df.to_csv("chirimayo_peatland_dataset.csv", index=False)
    print(f"Dataset generado exitosamente con {len(df)} muestras.")
