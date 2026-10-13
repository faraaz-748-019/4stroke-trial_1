/**
 * Application Controller for 4-Stroke Diesel Engine ML Intelligence Dashboard
 * Coordinates UI inputs, physics computations, dual visual panels, and Plotly visualizations.
 */

document.addEventListener('DOMContentLoaded', () => {
  const data = window.ENGINE_DATA;
  if (!data) {
    console.error('ENGINE_DATA not loaded!');
    return;
  }

  // --- Element Selectors ---
  const sliderLoad = document.getElementById('slider-load');
  const numLoad = document.getElementById('num-load');
  const dispLoad = document.getElementById('disp-load');

  const sliderV = document.getElementById('slider-v');
  const numV = document.getElementById('num-v');
  const dispV = document.getElementById('disp-v');

  const sliderI = document.getElementById('slider-i');
  const numI = document.getElementById('num-i');
  const dispI = document.getElementById('disp-i');

  const sliderN = document.getElementById('slider-n');
  const numN = document.getElementById('num-n');
  const dispN = document.getElementById('disp-n');

  const sliderDhw = document.getElementById('slider-dhw');
  const numDhw = document.getElementById('num-dhw');
  const dispDhw = document.getElementById('disp-dhw');

  const presetBtns = document.querySelectorAll('.preset-btn');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const selectDiagTarget = document.getElementById('select-diag-target');

  // --- Two-Way Binding Helper ---
  function bindInputPair(slider, num, disp, unit, decimals = 0) {
    const update = (val) => {
      val = parseFloat(val) || 0;
      slider.value = val;
      num.value = decimals > 0 ? val.toFixed(decimals) : val;
      disp.textContent = `${decimals > 0 ? val.toFixed(decimals) : val} ${unit}`;
      recalculateAll();
    };

    slider.addEventListener('input', (e) => update(e.target.value));
    num.addEventListener('input', (e) => update(e.target.value));
  }

  bindInputPair(sliderLoad, numLoad, dispLoad, 'W', 0);
  bindInputPair(sliderV, numV, dispV, 'V', 1);
  bindInputPair(sliderI, numI, dispI, 'A', 2);
  bindInputPair(sliderN, numN, dispN, 'RPM', 0);
  bindInputPair(sliderDhw, numDhw, dispDhw, 'mm', 1);

  // --- Preset Selector ---
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      presetBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const l = parseFloat(btn.dataset.load);
      const v = parseFloat(btn.dataset.v);
      const i = parseFloat(btn.dataset.i);
      const n = parseFloat(btn.dataset.n);
      const dhw = parseFloat(btn.dataset.dhw);

      sliderLoad.value = l; numLoad.value = l; dispLoad.textContent = `${l} W`;
      sliderV.value = v; numV.value = v.toFixed(1); dispV.textContent = `${v.toFixed(1)} V`;
      sliderI.value = i; numI.value = i.toFixed(2); dispI.textContent = `${i.toFixed(2)} A`;
      sliderN.value = n; numN.value = n; dispN.textContent = `${n} RPM`;
      sliderDhw.value = dhw; numDhw.value = dhw.toFixed(1); dispDhw.textContent = `${dhw.toFixed(1)} mm`;

      recalculateAll();
    });
  });

  // --- Recalculate Dual Models & Physics ---
  function recalculateAll() {
    const loadW = parseFloat(numLoad.value);
    const voltageV = parseFloat(numV.value);
    const currentA = parseFloat(numI.value);
    const speedRpm = parseFloat(numN.value);
    const dhwMm = parseFloat(numDhw.value);

    // 1. Interpolate / predict empirical targets from 50W and 150W datasets
    const p50 = window.interpolateDataset(data.dataset_50w.all_records, loadW);
    const p150 = window.interpolateDataset(data.dataset_150w.all_records, loadW);

    // 2. Compute full thermodynamics using physics relations
    const r50 = window.computeEngineThermodynamics(loadW, voltageV, currentA, speedRpm, dhwMm, p50.TFC_kg_per_hr, p50.Exhaust_Temp_C);
    const r150 = window.computeEngineThermodynamics(loadW, voltageV, currentA, speedRpm, dhwMm, p150.TFC_kg_per_hr, p150.Exhaust_Temp_C);

    // 3. Update Visual 1: 50W-Step Model Panel
    document.getElementById('kpi-50-bp').textContent = `${r50.Brake_Power_kW.toFixed(3)} kW`;
    document.getElementById('kpi-50-tfc').textContent = `${r50.TFC_kg_per_hr.toFixed(3)} kg/h`;
    document.getElementById('kpi-50-time').textContent = `Time (t): ${r50.Time_s.toFixed(1)} s`;
    document.getElementById('kpi-50-texg').textContent = `${r50.Exhaust_Temp_C.toFixed(1)} °C`;
    document.getElementById('kpi-50-etabth').textContent = `${r50.Brake_Thermal_Eff_pct.toFixed(2)} %`;
    document.getElementById('kpi-50-bsfc').textContent = r50.BSFC_g_per_kWh ? `${r50.BSFC_g_per_kWh.toFixed(1)} g/kWh` : 'N/A';
    document.getElementById('kpi-50-etam').textContent = `${r50.Mechanical_Eff_pct.toFixed(2)} %`;
    document.getElementById('kpi-50-etav').textContent = `${r50.Volumetric_Eff_pct.toFixed(2)} %`;
    document.getElementById('kpi-50-afr').textContent = `${r50.Air_Fuel_Ratio.toFixed(2)}`;
    document.getElementById('kpi-50-ip').textContent = `${r50.Indicated_Power_kW.toFixed(3)} kW`;
    document.getElementById('kpi-50-etai').textContent = `${r50.Indicated_Thermal_Eff_pct.toFixed(2)} %`;

    // 4. Update Visual 2: 150W-Step Model Panel
    document.getElementById('kpi-150-bp').textContent = `${r150.Brake_Power_kW.toFixed(3)} kW`;
    document.getElementById('kpi-150-tfc').textContent = `${r150.TFC_kg_per_hr.toFixed(3)} kg/h`;
    document.getElementById('kpi-150-texg').textContent = `${r150.Exhaust_Temp_C.toFixed(1)} °C`;
    document.getElementById('kpi-150-etabth').textContent = `${r150.Brake_Thermal_Eff_pct.toFixed(2)} %`;
    document.getElementById('kpi-150-bsfc').textContent = r150.BSFC_g_per_kWh ? `${r150.BSFC_g_per_kWh.toFixed(1)} g/kWh` : 'N/A';
    document.getElementById('kpi-150-etam').textContent = `${r150.Mechanical_Eff_pct.toFixed(2)} %`;
    document.getElementById('kpi-150-etav').textContent = `${r150.Volumetric_Eff_pct.toFixed(2)} %`;
    document.getElementById('kpi-150-afr').textContent = `${r150.Air_Fuel_Ratio.toFixed(2)}`;
    document.getElementById('kpi-150-ip').textContent = `${r150.Indicated_Power_kW.toFixed(3)} kW`;
    document.getElementById('kpi-150-etai').textContent = `${r150.Indicated_Thermal_Eff_pct.toFixed(2)} %`;

    // 5. Update Delta Chips (150W vs 50W difference)
    const updateDelta = (id, delta, unit, decimals = 2) => {
      const el = document.getElementById(id);
      if (!el) return;
      const sign = delta > 0 ? '+' : '';
      el.textContent = `Δ: ${sign}${delta.toFixed(decimals)} ${unit}`;
      el.className = `delta-tag ${Math.abs(delta) < 0.05 ? 'delta-good' : 'delta-diff'}`;
    };

    updateDelta('delta-bp', r150.Brake_Power_kW - r50.Brake_Power_kW, 'kW', 3);
    updateDelta('delta-tfc', r150.TFC_kg_per_hr - r50.TFC_kg_per_hr, 'kg/h', 3);
    updateDelta('delta-texg', r150.Exhaust_Temp_C - r50.Exhaust_Temp_C, '°C', 1);
    updateDelta('delta-etabth', r150.Brake_Thermal_Eff_pct - r50.Brake_Thermal_Eff_pct, '%', 2);
    if (r150.BSFC_g_per_kWh && r50.BSFC_g_per_kWh) {
      updateDelta('delta-bsfc', r150.BSFC_g_per_kWh - r50.BSFC_g_per_kWh, 'g/kWh', 1);
    } else {
      document.getElementById('delta-bsfc').textContent = 'Δ: N/A';
    }
    updateDelta('delta-etam', r150.Mechanical_Eff_pct - r50.Mechanical_Eff_pct, '%', 2);
    updateDelta('delta-etav', r150.Volumetric_Eff_pct - r50.Volumetric_Eff_pct, '%', 2);
    updateDelta('delta-afr', r150.Air_Fuel_Ratio - r50.Air_Fuel_Ratio, '', 2);
    updateDelta('delta-ip', r150.Indicated_Power_kW - r50.Indicated_Power_kW, 'kW', 3);
    updateDelta('delta-etai', r150.Indicated_Thermal_Eff_pct - r50.Indicated_Thermal_Eff_pct, '%', 2);
  }

  // --- Populate Error Calculations Table ---
  function populateErrorsTable() {
    const tbody = document.getElementById('errors-tbody');
    tbody.innerHTML = '';

    const targets = data.targets;
    const m50 = data.dataset_50w.metrics;
    const m150 = data.dataset_150w.metrics;

    targets.forEach(tgt => {
      const e50 = m50[tgt];
      const e150 = m150[tgt];
      if (!e50 || !e150) return;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight: 600; color: #f1f5f9;">${tgt.replace(/_/g, ' ')}</td>
        <td style="color: #38bdf8;">${e50.train.r2.toFixed(4)}</td>
        <td style="color: #38bdf8; font-weight: 700;">${e50.test.r2.toFixed(4)}</td>
        <td>${e50.test.rmse.toFixed(4)}</td>
        <td>${e50.test.mape_pct.toFixed(2)}%</td>
        <td style="color: #fb923c;">${e150.train.r2.toFixed(4)}</td>
        <td style="color: #fb923c; font-weight: 700;">${e150.test.r2.toFixed(4)}</td>
        <td>${e150.test.rmse.toFixed(4)}</td>
        <td>${e150.test.mape_pct.toFixed(2)}%</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // --- Render Plotly Charts ---
  function renderAllCharts() {
    const rec50 = data.dataset_50w.all_records;
    const rec150 = data.dataset_150w.all_records;

    const darkLayoutBase = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.4)',
      font: { family: 'Inter, sans-serif', color: '#94a3b8' },
      margin: { t: 30, r: 20, l: 50, b: 40 },
      legend: { orientation: 'h', y: 1.15, x: 0.1 },
      xaxis: { gridcolor: 'rgba(148, 163, 184, 0.1)', zerolinecolor: 'rgba(148, 163, 184, 0.2)' },
      yaxis: { gridcolor: 'rgba(148, 163, 184, 0.1)', zerolinecolor: 'rgba(148, 163, 184, 0.2)' }
    };

    // 1. R2 Comparison Bar Chart
    const targets = data.targets.filter(t => t !== 'BSFC_g_per_kWh');
    const r2_50 = targets.map(t => data.dataset_50w.metrics[t].test.r2);
    const r2_150 = targets.map(t => data.dataset_150w.metrics[t].test.r2);
    const targetLabels = targets.map(t => t.replace(/_pct|_kg_per_hr|_kW|_C|_s/g, '').replace(/_/g, ' '));

    Plotly.newPlot('chart-r2-comparison', [
      { x: targetLabels, y: r2_50, name: '50W Model Test R²', type: 'bar', marker: { color: '#0ea5e9' } },
      { x: targetLabels, y: r2_150, name: '150W Model Test R²', type: 'bar', marker: { color: '#f97316' } }
    ], {
      ...darkLayoutBase,
      barmode: 'group',
      yaxis: { ...darkLayoutBase.yaxis, range: [0.85, 1.005], title: 'R² Score' }
    }, { responsive: true, displayModeBar: false });

    // 2. Plot: Brake Thermal Efficiency vs Brake Power
    Plotly.newPlot('plot-bth-bp', [
      {
        x: rec50.map(r => r.Brake_Power_kW),
        y: rec50.map(r => r.Brake_Thermal_Eff_pct),
        mode: 'lines+markers', name: '50W Step Model',
        line: { color: '#0ea5e9', width: 2.5 }, marker: { size: 4 }
      },
      {
        x: rec150.map(r => r.Brake_Power_kW),
        y: rec150.map(r => r.Brake_Thermal_Eff_pct),
        mode: 'lines+markers', name: '150W Step Model',
        line: { color: '#f97316', width: 2, dash: 'dot' }, marker: { size: 6 }
      }
    ], {
      ...darkLayoutBase,
      xaxis: { ...darkLayoutBase.xaxis, title: 'Brake Power (kW)' },
      yaxis: { ...darkLayoutBase.yaxis, title: 'ηbth (%)' }
    }, { responsive: true, displayModeBar: false });

    // 3. Plot: BSFC vs Brake Power
    const f50_bsfc = rec50.filter(r => r.Brake_Power_kW > 0.4);
    const f150_bsfc = rec150.filter(r => r.Brake_Power_kW > 0.4);
    Plotly.newPlot('plot-bsfc-bp', [
      {
        x: f50_bsfc.map(r => r.Brake_Power_kW),
        y: f50_bsfc.map(r => r.BSFC_g_per_kWh),
        mode: 'lines+markers', name: '50W Model',
        line: { color: '#0ea5e9', width: 2.5 }
      },
      {
        x: f150_bsfc.map(r => r.Brake_Power_kW),
        y: f150_bsfc.map(r => r.BSFC_g_per_kWh),
        mode: 'lines+markers', name: '150W Model',
        line: { color: '#f97316', width: 2, dash: 'dot' }
      }
    ], {
      ...darkLayoutBase,
      xaxis: { ...darkLayoutBase.xaxis, title: 'Brake Power (kW)' },
      yaxis: { ...darkLayoutBase.yaxis, title: 'BSFC (g/kWh)' }
    }, { responsive: true, displayModeBar: false });

    // 4. Plot: Willans Line (TFC vs BP)
    Plotly.newPlot('plot-willans', [
      {
        x: rec50.map(r => r.Brake_Power_kW),
        y: rec50.map(r => r.TFC_kg_per_hr),
        mode: 'lines+markers', name: '50W Model',
        line: { color: '#10b981', width: 2.5 }
      },
      {
        x: rec150.map(r => r.Brake_Power_kW),
        y: rec150.map(r => r.TFC_kg_per_hr),
        mode: 'lines+markers', name: '150W Model',
        line: { color: '#f59e0b', width: 2, dash: 'dot' }
      }
    ], {
      ...darkLayoutBase,
      xaxis: { ...darkLayoutBase.xaxis, title: 'Brake Power (kW)' },
      yaxis: { ...darkLayoutBase.yaxis, title: 'TFC (kg/hr)' }
    }, { responsive: true, displayModeBar: false });

    // 5. Plot: Exhaust Temp vs Load
    Plotly.newPlot('plot-texg-load', [
      {
        x: rec50.map(r => r.Load_W),
        y: rec50.map(r => r.Exhaust_Temp_C),
        mode: 'lines+markers', name: '50W Model',
        line: { color: '#ef4444', width: 2.5 }
      },
      {
        x: rec150.map(r => r.Load_W),
        y: rec150.map(r => r.Exhaust_Temp_C),
        mode: 'lines+markers', name: '150W Model',
        line: { color: '#f97316', width: 2, dash: 'dot' }
      }
    ], {
      ...darkLayoutBase,
      xaxis: { ...darkLayoutBase.xaxis, title: 'Electrical Load (W)' },
      yaxis: { ...darkLayoutBase.yaxis, title: 'Texg (°C)' }
    }, { responsive: true, displayModeBar: false });

    // 6. Plot: Mechanical Efficiency vs BP
    Plotly.newPlot('plot-etam-bp', [
      {
        x: rec50.map(r => r.Brake_Power_kW),
        y: rec50.map(r => r.Mechanical_Eff_pct),
        mode: 'lines+markers', name: '50W Model',
        line: { color: '#a855f7', width: 2.5 }
      },
      {
        x: rec150.map(r => r.Brake_Power_kW),
        y: rec150.map(r => r.Mechanical_Eff_pct),
        mode: 'lines+markers', name: '150W Model',
        line: { color: '#ec4899', width: 2, dash: 'dot' }
      }
    ], {
      ...darkLayoutBase,
      xaxis: { ...darkLayoutBase.xaxis, title: 'Brake Power (kW)' },
      yaxis: { ...darkLayoutBase.yaxis, title: 'ηm (%)' }
    }, { responsive: true, displayModeBar: false });

    // 7. Plot: Air-Fuel Ratio vs Load
    Plotly.newPlot('plot-afr-load', [
      {
        x: rec50.map(r => r.Load_W),
        y: rec50.map(r => r.Air_Fuel_Ratio),
        mode: 'lines+markers', name: '50W Model',
        line: { color: '#38bdf8', width: 2.5 }
      },
      {
        x: rec150.map(r => r.Load_W),
        y: rec150.map(r => r.Air_Fuel_Ratio),
        mode: 'lines+markers', name: '150W Model',
        line: { color: '#fb923c', width: 2, dash: 'dot' }
      }
    ], {
      ...darkLayoutBase,
      xaxis: { ...darkLayoutBase.xaxis, title: 'Electrical Load (W)' },
      yaxis: { ...darkLayoutBase.yaxis, title: 'Air-Fuel Ratio' }
    }, { responsive: true, displayModeBar: false });

    // Diagnostic plots update
    updateDiagnosticsPlot();
  }

  // --- Diagnostic Plots (Actual vs Predicted) ---
  function updateDiagnosticsPlot() {
    const tgt = selectDiagTarget.value;
    const p50 = data.dataset_50w.predictions;
    const p150 = data.dataset_150w.predictions;

    const darkLayoutBase = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.4)',
      font: { family: 'Inter, sans-serif', color: '#94a3b8' },
      margin: { t: 30, r: 20, l: 50, b: 40 },
      legend: { orientation: 'h', y: 1.15, x: 0.1 },
      xaxis: { title: 'Actual Value', gridcolor: 'rgba(148, 163, 184, 0.1)' },
      yaxis: { title: 'Predicted Value', gridcolor: 'rgba(148, 163, 184, 0.1)' }
    };

    // 50W Diagnostics
    if (p50.train_actual[tgt]) {
      const allVals50 = p50.train_actual[tgt].concat(p50.test_actual[tgt]);
      const min50 = Math.min(...allVals50);
      const max50 = Math.max(...allVals50);

      Plotly.newPlot('plot-diag-50w', [
        {
          x: p50.train_actual[tgt], y: p50.train_predicted[tgt],
          mode: 'markers', name: 'Train Set (75%)',
          marker: { color: '#0ea5e9', size: 6, opacity: 0.8 }
        },
        {
          x: p50.test_actual[tgt], y: p50.test_predicted[tgt],
          mode: 'markers', name: 'Test Set (25%)',
          marker: { color: '#f43f5e', size: 8, symbol: 'diamond' }
        },
        {
          x: [min50, max50], y: [min50, max50],
          mode: 'lines', name: 'Ideal (y = x)',
          line: { color: '#10b981', dash: 'dash', width: 2 }
        }
      ], darkLayoutBase, { responsive: true, displayModeBar: false });
    }

    // 150W Diagnostics
    if (p150.train_actual[tgt]) {
      const allVals150 = p150.train_actual[tgt].concat(p150.test_actual[tgt]);
      const min150 = Math.min(...allVals150);
      const max150 = Math.max(...allVals150);

      Plotly.newPlot('plot-diag-150w', [
        {
          x: p150.train_actual[tgt], y: p150.train_predicted[tgt],
          mode: 'markers', name: 'Train Set (75%)',
          marker: { color: '#f97316', size: 6, opacity: 0.8 }
        },
        {
          x: p150.test_actual[tgt], y: p150.test_predicted[tgt],
          mode: 'markers', name: 'Test Set (25%)',
          marker: { color: '#a855f7', size: 8, symbol: 'diamond' }
        },
        {
          x: [min150, max150], y: [min150, max150],
          mode: 'lines', name: 'Ideal (y = x)',
          line: { color: '#10b981', dash: 'dash', width: 2 }
        }
      ], darkLayoutBase, { responsive: true, displayModeBar: false });
    }
  }

  selectDiagTarget.addEventListener('change', updateDiagnosticsPlot);

  // --- Tab Navigation ---
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(btn.dataset.tab);
      if (targetPane) {
        targetPane.classList.add('active');
        // Trigger resize on Plotly charts in tab
        window.dispatchEvent(new Event('resize'));
      }
    });
  });

  // --- Initial Execution ---
  populateErrorsTable();
  recalculateAll();
  renderAllCharts();
});
