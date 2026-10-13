# 4-Stroke Diesel Engine ML Prediction & Dual Performance Dashboard

> **Interactive Web Dashboard deployed via Netlify**  
> Machine Learning intelligence platform trained on **50W Step** ($N=121$) and **150W Step** ($N=41$) augmented experimental datasets with **75% Train / 25% Test** validation.

[![Netlify Status](https://api.netlify.com/api/v1/badges/deploy-status)](https://app.netlify.com/)

---

## ⚡ Key Highlights

- **Dual Visual Panels**: Side-by-side dedicated prediction visuals for **50W-step** and **150W-step** models.
- **5 Manual Sensor Inputs**:
  1. **Electrical Load ($W$)**
  2. **Terminal Voltage ($V$)**
  3. **Phase Current ($I$)**
  4. **Engine Speed ($N$, RPM)**
  5. **Manometer Reading ($\Delta h_w$, mm of water)**
- **Physics-Informed Hybrid Engine**: Remaining 16 parameters calculated via first-principles thermodynamic governing relations.
- **Complete Error Metric Matrices**: Displays Train ($75\%$) and Test ($25\%$) $R^2$, RMSE, MAE, MSE, and MAPE metrics.
- **Interactive Visualizations**: Actual vs Predicted scatter plots, residual analysis, and engine characteristic performance curves (Brake Thermal Efficiency, BSFC, Willans line, Exhaust Temp).

---

## 🚀 Netlify Deployment Guide

This repository is optimized for immediate, zero-configuration static deployment on **Netlify**:

1. Log in to [Netlify](https://app.netlify.com/).
2. Click **Add new site** > **Import an existing project**.
3. Select **GitHub** and authorize access to `faraaz-748-019/4stroke-trial_1`.
4. Deployment settings:
   - **Branch to deploy**: `main`
   - **Base directory**: Leave blank (root)
   - **Build command**: Leave blank (pure static site)
   - **Publish directory**: `.`
5. Click **Deploy Site**. Netlify will publish your site instantly with a free HTTPS URL!

---

## 📁 Repository Structure

```
├── index.html                   # Core dashboard interface
├── style.css                    # Dark glassmorphic styling
├── app.js                       # Interactive controls & Plotly chart engines
├── physics.js                   # Client-side thermodynamic formula engine
├── data.js                      # Pre-compiled evaluation metrics & augmented datasets
├── model_evaluation_summary.json# Complete model evaluation metrics
├── netlify.toml                 # Netlify deployment configuration & security headers
├── .gitignore                   # Excludes temporary and non-essential files
└── README.md                    # Project documentation
```

---

## 🔬 Test Rig Specifications

- **Engine Make:** Kirloskar 4-Stroke CI Twin-Cylinder
- **Rated Power:** 14 HP (10.64 kW) @ 1500 RPM
- **Cylinder Bore ($D$):** 87.5 mm ($0.0875\text{ m}$)
- **Stroke Length ($L$):** 110.0 mm ($0.110\text{ m}$)
- **Orifice Diameter ($d_o$):** 20.0 mm ($0.020\text{ m}$)
- **Calorific Value of Diesel:** 45,300 kJ/kg
- **Friction Power (Willans line):** 4.44 kW
- **Power Factor ($\cos\Phi$):** 1.0 (resistive load bank)
