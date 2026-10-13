/**
 * Thermodynamic Physics Engine & Multi-Model Inference for Web Dashboard.
 * Reference: Engine_Performance_Formulae_Manual.pdf (Kirloskar 14 HP Twin-Cylinder 4-Stroke CI Rig)
 */

const RIG_CONSTANTS = {
  D: 0.0875,            // Cylinder Bore (m)
  L: 0.110,             // Stroke Length (m)
  nCyl: 2,              // Twin Cylinder 4-stroke
  do: 0.020,            // Orifice Diameter (m)
  Ao: (Math.PI / 4.0) * (0.020 ** 2), // Orifice area (m^2)
  Cd: 0.62,             // Discharge Coeff
  g: 9.81,              // Gravity (m/s^2)
  pw: 1000.0,           // Water Density (kg/m^3)
  pair: 1.176,          // Air Density (kg/m^3)
  CV: 45300.0,          // Diesel Calorific Value (kJ/kg)
  FP: 4.44,             // Friction Power (kW)
  cosPhi: 1.0,          // Power factor for resistive bank
  kFuel: 59.04          // Fuel constant (20cc * 0.82 * 3600 / 1000)
};

/**
 * Predicts empirical engine parameters (TFC, Texg, etc.) from dataset grid using
 * shape-preserving cubic hermite / linear interpolation based on Load_W.
 */
function interpolateDataset(records, loadW) {
  if (!records || records.length === 0) return null;
  
  const clampLoad = Math.max(0, Math.min(6000, loadW));
  
  // Find surrounding points
  let idx = 0;
  while (idx < records.length - 1 && records[idx + 1].Load_W <= clampLoad) {
    idx++;
  }
  
  if (idx >= records.length - 1) {
    return records[records.length - 1];
  }
  
  const p0 = records[idx];
  const p1 = records[idx + 1];
  const t = (clampLoad - p0.Load_W) / (p1.Load_W - p0.Load_W);
  
  // Smooth hermite blend
  const h01 = 3 * t * t - 2 * t * t * t;
  
  const interp = (v0, v1) => {
    if (v0 === null || v0 === undefined) return v1;
    if (v1 === null || v1 === undefined) return v0;
    return v0 + (v1 - v0) * h01;
  };
  
  return {
    TFC_kg_per_hr: interp(p0.TFC_kg_per_hr, p1.TFC_kg_per_hr),
    Exhaust_Temp_C: interp(p0.Exhaust_Temp_C, p1.Exhaust_Temp_C),
    Time_s: interp(p0.Time_s, p1.Time_s),
    Brake_Power_kW: interp(p0.Brake_Power_kW, p1.Brake_Power_kW),
    Brake_Thermal_Eff_pct: interp(p0.Brake_Thermal_Eff_pct, p1.Brake_Thermal_Eff_pct),
    BSFC_g_per_kWh: clampLoad > 0 ? interp(p0.BSFC_g_per_kWh, p1.BSFC_g_per_kWh) : null,
    Mechanical_Eff_pct: interp(p0.Mechanical_Eff_pct, p1.Mechanical_Eff_pct),
    Volumetric_Eff_pct: interp(p0.Volumetric_Eff_pct, p1.Volumetric_Eff_pct),
    Indicated_Thermal_Eff_pct: interp(p0.Indicated_Thermal_Eff_pct, p1.Indicated_Thermal_Eff_pct),
    Air_Fuel_Ratio: interp(p0.Air_Fuel_Ratio, p1.Air_Fuel_Ratio),
    Indicated_Power_kW: interp(p0.Indicated_Power_kW, p1.Indicated_Power_kW)
  };
}

/**
 * Computes all 16 engine performance parameters from 5 manual inputs
 * plus predicted empirical variables (TFC and Exhaust Temp).
 */
function computeEngineThermodynamics(loadW, voltageV, currentA, speedRpm, manometerDhwMm, tfcKgHr, texgC) {
  const L = parseFloat(loadW);
  const V = parseFloat(voltageV);
  const I = parseFloat(currentA);
  const N = parseFloat(speedRpm);
  const dhw = Math.max(0, parseFloat(manometerDhwMm));
  const tfc = parseFloat(tfcKgHr);
  const texg = parseFloat(texgC);
  
  // 1. Brake Power (kW): BP = sqrt(3) * V * I * cosPhi / 1000
  let bp = 0.0;
  if (L > 0 && I > 0) {
    bp = (Math.sqrt(3.0) * V * I * RIG_CONSTANTS.cosPhi) / 1000.0;
  }
  
  // 2. Friction & Indicated Power
  const fp = RIG_CONSTANTS.FP; // 4.44 kW
  const ip = bp + fp;
  
  // 3. Mechanical Efficiency (%)
  let etam = 0.0;
  if (ip > 0 && bp > 0) {
    etam = (bp / ip) * 100.0;
  }
  
  // 4. Fuel Consumption Time t (s)
  const timeS = tfc > 0 ? (RIG_CONSTANTS.kFuel / tfc) : 0.0;
  
  // 5. BSFC (g/kWh) & Brake Thermal Efficiency (%)
  let bsfc = null;
  let etabth = 0.0;
  if (bp > 0 && tfc > 0) {
    bsfc = (tfc * 1000.0) / bp;
    etabth = (bp * 3600.0) / (tfc * RIG_CONSTANTS.CV) * 100.0;
  }
  
  // 6. Indicated Thermal Efficiency (%)
  let etai = 0.0;
  if (tfc > 0) {
    etai = (ip * 3600.0) / (tfc * RIG_CONSTANTS.CV) * 100.0;
  }
  
  // 7. Air Consumption & Volumetric Efficiency
  // Equivalent air head: ha = (pw / pair) * (dhw / 1000)
  const ha = (RIG_CONSTANTS.pw / RIG_CONSTANTS.pair) * (dhw / 1000.0);
  // Actual air volume: Va = Cd * Ao * sqrt(2 * g * ha) * 3600
  const va = RIG_CONSTANTS.Cd * RIG_CONSTANTS.Ao * Math.sqrt(2.0 * RIG_CONSTANTS.g * ha) * 3600.0;
  // Swept volume: Vs = 2 * [(pi/4) * D^2 * L * (N / 2) * 60]
  const vs = RIG_CONSTANTS.nCyl * ((Math.PI / 4.0) * (RIG_CONSTANTS.D ** 2) * RIG_CONSTANTS.L * (N / 2.0) * 60.0);
  // Volumetric efficiency: etav = (Va / Vs) * 100
  const etav = vs > 0 ? (va / vs) * 100.0 : 0.0;
  
  // Air mass flow rates
  const maAct = va * RIG_CONSTANTS.pair;
  const maTheo = vs * RIG_CONSTANTS.pair;
  
  // Air Fuel Ratio: AFR = maAct / tfc
  const afr = tfc > 0 ? (maAct / tfc) : 0.0;
  
  return {
    Load_W: L,
    Voltage_V: V,
    Current_A: I,
    Speed_RPM: N,
    Manometer_dhw_mm: dhw,
    Brake_Power_kW: Number(bp.toFixed(3)),
    Friction_Power_kW: fp,
    Indicated_Power_kW: Number(ip.toFixed(3)),
    Mechanical_Eff_pct: Number(etam.toFixed(2)),
    TFC_kg_per_hr: Number(tfc.toFixed(3)),
    Time_s: Number(timeS.toFixed(2)),
    Exhaust_Temp_C: Number(texg.toFixed(1)),
    BSFC_g_per_kWh: bsfc !== null ? Number(bsfc.toFixed(1)) : null,
    Brake_Thermal_Eff_pct: Number(etabth.toFixed(2)),
    Indicated_Thermal_Eff_pct: Number(etai.toFixed(2)),
    Actual_Air_Vol_m3_per_hr: Number(va.toFixed(2)),
    Swept_Vol_m3_per_hr: Number(vs.toFixed(2)),
    Volumetric_Eff_pct: Number(etav.toFixed(2)),
    Actual_Air_Mass_kg_per_hr: Number(maAct.toFixed(2)),
    Theoretical_Air_Mass_kg_per_hr: Number(maTheo.toFixed(2)),
    Air_Fuel_Ratio: Number(afr.toFixed(2))
  };
}

window.RIG_CONSTANTS = RIG_CONSTANTS;
window.interpolateDataset = interpolateDataset;
window.computeEngineThermodynamics = computeEngineThermodynamics;
