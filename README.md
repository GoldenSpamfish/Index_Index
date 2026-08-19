# Global Index Observatory (Index Index)

An interactive, client-side web platform designed to build custom composite indices, dissect correlations across global benchmarks, investigate regional performance archetypes, and analyze methodological sensitivity.

🌐 **Live Website**: [https://goldenspamfish.github.io/Index_Index/](https://goldenspamfish.github.io/Index_Index/)

---

## 🌟 Key Features

1. **Custom Index Builder Studio**:
   - Compose custom international benchmarks by combining any of 124 indicators.
   - Live synchronized mini choropleth map and top leaderboard that update with sub-indicator weight slider shifts.
   - Non-linear conversion controls (*Linear*, *Logarithmic $\ln(x+1)$*, *Square Root $\sqrt{x}$*), polarity inversion, and outlier caps.
   - 1-click curated benchmark bundles (*Human Flourishing*, *Sustainable Progress*, *Democratic Resilience*, *Economic Power*, *Inclusive Equality*).
   - Direct custom index renaming, research notes, and persistent saving to local browser storage.

2. **Choropleth World Map & Flower Profile Glyphs**:
   - Canvas-rendered global choropleth map supporting multiple palettes (*Moss & Gold*, *Nordic Slate*, *Viridis*, *Terracotta Heat*).
   - Organic bezier rounded flower glyphs visualizing multi-indicator balance per country.

3. **Correlation & Scatter Fit Studio**:
   - Cross-correlate any custom index against 124 global benchmarks.
   - Pearson $r$, Spearman rank $\rho$, $R^2$, and automated non-linear curve fitting (*Linear*, *Quadratic*).
   - Interactive high-density correlation matrix with threshold filtering and search.

4. **Performance Anatomy & Benchmark Deconstruction**:
   - Analyze strengths vs. systemic bottlenecks across 183 nations.
   - Investigate regional archetype models (Nordic, Anglo-Saxon, East Asian Tigers, EU, Latin America, Sub-Saharan Africa).

5. **Bivariate Quadrant Matrix & 2D Spotlight Map**:
   - $4 \times 4$ bivariate cross-tabulation matrix.
   - Interactive 2D choropleth map highlighting countries that fit into selected bivariate tiers.

6. **Sensitivity & Robustness Analysis**:
   - Monte Carlo perturbation engine testing ranking volatility against weight variations ($\pm 10\%$, $\pm 25\%$, $\pm 50\%$).
   - Methodological formula stress test comparing Arithmetic, Geometric, and Harmonic aggregation.

7. **Data Studio & Portable Sharing**:
   - Import custom CSV / JSON datasets directly into the client.
   - Export custom composite scores and indicator breakdowns to CSV or JSON.
   - 1-click shareable URL encoding entire custom index configurations into the URL hash.

---

## 📊 Dataset Library (124 Global Indicators)

- **24 Composite Benchmarks**: HDI, World Happiness Score, Social Progress Index, Universal Health Coverage, Corruption Perceptions Index, Democracy Index, Rule of Law Index, World Press Freedom, Environmental Performance Index (EPI), Global Innovation Index (GII), Global Peace Index, Global Competitiveness Index, UN SDG Progress Index, Global Cybersecurity Index, Fragile States Index, Good Country Index, Global Food Security Index, and more.
- **100 Primary Empirical Metrics**: Raw physical, health, demographic, economic, and environmental metrics including Life Expectancy, Infant Mortality, Maternal Mortality, Homicide Rate, Incarceration Rate, Extreme Poverty, GDP per Capita (PPP), R&D Intensity, CO₂ Emissions per Capita, Renewable Energy %, Forest Cover, Water Stress, Internet Penetration, Broadband Speed, and more.

---

## 🛠️ Architecture & Portability

- **100% Client-Side**: Zero server-side runtime, zero database required.
- **Zero Build Tooling**: Pure ES modules, Tailwind CSS CDN, and native Web APIs.
- **Static Hosting Ready**: Fully compatible with GitHub Pages, Cloudflare Pages, Netlify, or local offline viewing.
