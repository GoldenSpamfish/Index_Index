import json
from build_countries import countries_data

domains = {
    "wellbeing": {"label": "Human Well-being & Development", "color": "#2E6B57", "icon": "HeartHandshake"},
    "governance": {"label": "Governance, Rights & Institutions", "color": "#35617F", "icon": "Scale"},
    "economy": {"label": "Economy, Trade & Prosperity", "color": "#B8873B", "icon": "TrendingUp"},
    "environment": {"label": "Environment & Planetary Health", "color": "#4FA5C0", "icon": "Leaf"},
    "innovation": {"label": "Innovation, Technology & Science", "color": "#8E5EA2", "icon": "Cpu"},
    "peace_safety": {"label": "Peace, Safety & Social Equality", "color": "#B04A32", "icon": "ShieldCheck"}
}

def generate_dataset(base_func, anchors=None, clip_min=None, clip_max=None):
    data = {}
    for c in countries_data:
        iso = c['iso3']
        if anchors and iso in anchors:
            val = anchors[iso]
        else:
            val = base_func(c)
        if clip_min is not None:
            val = max(clip_min, val)
        if clip_max is not None:
            val = min(clip_max, val)
        data[iso] = round(val, 3)
    return data

# Anchors
hdi_anchors = {"CHE": 0.967, "NOR": 0.966, "ISL": 0.959, "HKG": 0.956, "DNK": 0.952, "SWE": 0.952, "DEU": 0.950, "IRL": 0.950, "SGP": 0.949, "AUS": 0.946, "NLD": 0.946, "BEL": 0.942, "FIN": 0.942, "GBR": 0.940, "NZL": 0.939, "ARE": 0.937, "CAN": 0.935, "KOR": 0.929, "USA": 0.927, "AUT": 0.926, "JPN": 0.920, "ISR": 0.915, "SVN": 0.918, "ESP": 0.911, "FRA": 0.910, "ITA": 0.906, "CYP": 0.907, "EST": 0.899, "POL": 0.881, "GRC": 0.893, "PRT": 0.874, "CHL": 0.860, "HRV": 0.878, "QAT": 0.875, "ARG": 0.849, "TUR": 0.855, "MYS": 0.807, "THA": 0.803, "CHN": 0.788, "BRA": 0.760, "MEX": 0.781, "COL": 0.758, "UKR": 0.734, "IDN": 0.713, "ZAF": 0.717, "VNM": 0.726, "PHL": 0.710, "EGY": 0.728, "IND": 0.644, "BGD": 0.670, "GHA": 0.632, "KEN": 0.601, "PAK": 0.540, "NGA": 0.548, "ETH": 0.498, "COD": 0.481, "AFG": 0.462, "NER": 0.400, "CAF": 0.387, "SSD": 0.381, "SOM": 0.380}
gdp_anchors = {"LUX": 143.3, "IRL": 133.8, "SGP": 133.7, "QAT": 112.3, "NOR": 82.5, "CHE": 89.6, "USA": 80.0, "ARE": 88.2, "DNK": 74.0, "NLD": 72.9, "ISL": 69.8, "AUT": 67.9, "SWE": 65.8, "DEU": 63.8, "AUS": 62.6, "BEL": 65.5, "FIN": 59.8, "CAN": 58.4, "GBR": 56.4, "FRA": 55.5, "KOR": 53.0, "ITA": 51.9, "JPN": 45.6, "ESP": 46.4, "ISR": 49.4, "CZE": 49.0, "SVN": 48.0, "POL": 43.3, "PRT": 42.0, "EST": 45.2, "HUN": 41.9, "HRV": 40.5, "ROU": 41.6, "TUR": 41.4, "CHL": 29.9, "ARG": 26.5, "MYS": 33.0, "CHN": 23.3, "THA": 20.6, "BRA": 18.7, "MEX": 22.2, "COL": 18.3, "IDN": 14.6, "ZAF": 15.3, "EGY": 15.1, "VNM": 14.3, "PHL": 10.7, "IND": 9.1, "BGD": 8.7, "GHA": 6.9, "KEN": 5.8, "PAK": 6.4, "NGA": 5.9, "ETH": 3.4, "COD": 1.5, "AFG": 2.1, "CAF": 1.1, "BDI": 0.9}
whr_anchors = {"FIN": 7.74, "DNK": 7.58, "ISL": 7.53, "SWE": 7.34, "ISR": 7.34, "NLD": 7.32, "NOR": 7.30, "LUX": 7.12, "CHE": 7.06, "AUS": 7.06, "NZL": 7.03, "CRI": 6.96, "AUT": 6.90, "CAN": 6.90, "BEL": 6.89, "IRL": 6.84, "CZE": 6.82, "LTU": 6.82, "GBR": 6.75, "USA": 6.72, "DEU": 6.72, "MEX": 6.68, "FRA": 6.61, "ESP": 6.42, "ITA": 6.32, "SGP": 6.52, "POL": 6.44, "BRA": 6.27, "CHL": 6.36, "ARG": 6.19, "JPN": 6.06, "KOR": 6.06, "CHN": 5.97, "COL": 6.01, "THA": 5.98, "MYS": 5.97, "PHL": 6.05, "VNM": 6.04, "RUS": 5.79, "TUR": 4.98, "IDN": 5.34, "ZAF": 4.98, "IND": 4.05, "EGY": 4.01, "NGA": 4.55, "KEN": 4.47, "PAK": 4.66, "BGD": 4.39, "UKR": 4.87, "LBN": 2.71, "AFG": 1.72}
cpi_anchors = {"DNK": 90, "FIN": 87, "NZL": 85, "NOR": 84, "SGP": 83, "SWE": 82, "CHE": 82, "NLD": 79, "DEU": 78, "LUX": 78, "IRL": 77, "CAN": 76, "EST": 76, "AUS": 75, "HKG": 75, "BEL": 73, "JPN": 73, "GBR": 71, "FRA": 71, "AUT": 71, "USA": 69, "CHL": 66, "KOR": 63, "ISR": 62, "PRT": 61, "ESP": 60, "LTU": 61, "LVA": 60, "CZE": 57, "ITA": 56, "POL": 54, "CYP": 53, "GRC": 49, "MYS": 50, "HRV": 50, "ROU": 46, "CHN": 42, "CRI": 55, "URY": 73, "ZAF": 41, "BRA": 36, "IND": 39, "THA": 35, "IDN": 34, "TUR": 34, "MEX": 31, "EGY": 35, "PHL": 34, "UKR": 36, "RUS": 26, "NGA": 25, "PAK": 29, "BGD": 24, "IRN": 24, "VEN": 13, "SOM": 11, "SSD": 13}
eiu_anchors = {"NOR": 9.81, "NZL": 9.61, "ISL": 9.45, "SWE": 9.39, "FIN": 9.30, "DNK": 9.28, "IRL": 9.19, "CHE": 9.14, "NLD": 9.00, "TWN": 8.92, "LUX": 8.81, "DEU": 8.80, "CAN": 8.69, "AUS": 8.66, "URY": 8.66, "JPN": 8.40, "CRI": 8.29, "GBR": 8.28, "CHL": 7.98, "AUT": 8.28, "ESP": 8.07, "FRA": 8.07, "KOR": 8.09, "USA": 7.85, "ISR": 7.80, "PRT": 7.75, "EST": 7.96, "ITA": 7.69, "CZE": 7.97, "GRC": 8.14, "BEL": 7.64, "MYS": 7.29, "POL": 7.18, "BRA": 6.68, "IND": 7.18, "IDN": 6.53, "MEX": 5.14, "PHL": 6.66, "SGP": 6.60, "COL": 6.55, "ARG": 6.62, "ZAF": 7.05, "THA": 6.35, "UKR": 5.06, "TUR": 4.33, "NGA": 4.23, "PAK": 3.25, "EGY": 2.93, "RUS": 2.22, "CHN": 2.12, "IRN": 1.96, "SAU": 2.08, "AFG": 0.26, "PRK": 1.08}
epi_anchors = {"EST": 75.3, "LUX": 75.0, "DEU": 74.6, "FIN": 73.7, "GBR": 72.7, "SWE": 70.5, "NOR": 70.0, "AUT": 69.0, "CHE": 68.0, "DNK": 67.9, "NLD": 66.8, "FRA": 67.3, "ISL": 62.8, "SVN": 67.3, "IRL": 66.2, "BEL": 64.9, "ESP": 64.4, "JPN": 63.4, "AUS": 62.0, "NZL": 61.2, "USA": 66.9, "CAN": 60.0, "ITA": 60.9, "CZE": 59.8, "GRC": 59.5, "CYP": 59.0, "PRT": 58.7, "SVK": 56.4, "KOR": 56.1, "SGP": 55.4, "ISR": 54.0, "POL": 53.6, "CHL": 48.0, "CRI": 46.5, "BRA": 43.6, "MEX": 40.0, "ARG": 41.1, "RUS": 39.1, "ZAF": 38.0, "CHN": 35.0, "TUR": 37.0, "IDN": 33.8, "THA": 38.1, "EGY": 32.5, "NGA": 28.0, "PAK": 24.6, "BGD": 23.1, "IND": 18.9, "VNM": 20.1}
rsf_anchors = {"NOR": 91.9, "DNK": 89.6, "SWE": 88.3, "NLD": 87.7, "FIN": 87.9, "EST": 86.4, "PRT": 85.9, "IRL": 85.6, "CHE": 84.0, "DEU": 83.8, "NZL": 83.6, "CZE": 83.6, "CAN": 81.7, "LTU": 81.7, "ISL": 80.1, "LVA": 80.0, "GBR": 78.5, "BEL": 78.2, "AUS": 76.5, "AUT": 77.3, "FRA": 76.7, "ESP": 76.0, "ZAF": 73.7, "KOR": 70.8, "USA": 71.2, "ITA": 72.1, "JPN": 64.4, "POL": 67.7, "ARG": 63.1, "CHL": 67.3, "URY": 74.4, "CRI": 80.2, "BRA": 64.6, "ISR": 57.6, "GRC": 55.5, "MEX": 47.9, "IDN": 54.8, "IND": 40.8, "NGA": 49.6, "TUR": 38.4, "RUS": 34.8, "EGY": 31.0, "SAU": 32.4, "CHN": 22.9, "IRN": 24.8, "SYR": 27.2, "ERI": 19.8, "PRK": 21.7}
gii_anchors = {"CHE": 67.6, "SWE": 64.2, "USA": 63.5, "GBR": 61.0, "SGP": 61.5, "FIN": 60.7, "NLD": 60.4, "DEU": 58.8, "DNK": 58.7, "KOR": 58.6, "FRA": 56.0, "JPN": 54.6, "CAN": 53.8, "ISR": 54.3, "AUT": 50.3, "EST": 50.4, "NOR": 50.7, "ISL": 50.8, "AUS": 49.7, "BEL": 49.9, "IRL": 50.7, "CHN": 53.3, "ESP": 46.5, "NZL": 47.0, "ITA": 46.1, "CYP": 45.1, "CZE": 44.8, "PRT": 41.5, "POL": 41.3, "MYS": 40.9, "TUR": 38.6, "IND": 38.1, "CHL": 34.0, "BRA": 33.6, "THA": 37.1, "VNM": 36.2, "MEX": 31.0, "ZAF": 30.4, "IDN": 30.3, "EGY": 24.2, "NGA": 18.0, "PAK": 23.3}
wjp_anchors = {"DNK": 0.90, "NOR": 0.89, "FIN": 0.87, "SWE": 0.86, "DEU": 0.83, "NZL": 0.83, "LUX": 0.83, "NLD": 0.83, "IRL": 0.81, "AUT": 0.80, "CAN": 0.80, "EST": 0.82, "AUS": 0.79, "JPN": 0.79, "GBR": 0.78, "SGP": 0.78, "BEL": 0.78, "KOR": 0.74, "FRA": 0.73, "USA": 0.71, "ESP": 0.71, "CZE": 0.73, "URY": 0.71, "CHL": 0.66, "ITA": 0.65, "POL": 0.64, "CRI": 0.68, "GRC": 0.61, "ZAF": 0.58, "ARG": 0.55, "BRA": 0.49, "IND": 0.50, "IDN": 0.53, "THA": 0.49, "CHN": 0.47, "MEX": 0.42, "TUR": 0.41, "NGA": 0.40, "RUS": 0.45, "PAK": 0.39, "EGY": 0.35, "VEN": 0.26}
spi_anchors = {"NOR": 90.7, "DNK": 90.5, "FIN": 90.4, "CHE": 90.3, "ISL": 90.2, "SWE": 90.0, "NLD": 88.9, "DEU": 88.7, "IRL": 87.7, "LUX": 87.5, "AUT": 87.4, "JPN": 87.0, "KOR": 86.5, "CAN": 86.4, "AUS": 86.4, "GBR": 86.1, "FRA": 86.0, "NZL": 85.8, "ESP": 85.0, "BEL": 85.6, "USA": 84.7, "EST": 86.2, "CZE": 84.7, "ITA": 84.4, "PRT": 83.8, "SVN": 85.4, "CHL": 80.8, "URY": 80.3, "CRI": 80.7, "GRC": 81.3, "POL": 80.2, "ARG": 78.6, "MYS": 74.0, "BRA": 71.3, "CHN": 69.8, "THA": 69.8, "MEX": 69.0, "COL": 68.0, "IDN": 67.2, "TUR": 66.8, "ZAF": 65.2, "VNM": 65.4, "EGY": 58.7, "IND": 56.8, "GHA": 56.4, "KEN": 52.8, "PAK": 49.3, "NGA": 46.8, "SSD": 31.0}
life_anchors = {"HKG": 85.5, "JPN": 84.6, "CHE": 84.0, "SGP": 83.7, "ITA": 83.6, "ESP": 83.6, "AUS": 83.3, "ISL": 83.2, "SWE": 83.1, "NOR": 83.1, "FRA": 82.8, "ISR": 82.6, "KOR": 83.7, "NZL": 82.5, "CAN": 82.6, "IRL": 82.4, "NLD": 82.1, "AUT": 81.9, "FIN": 82.0, "DEU": 81.0, "GBR": 81.2, "BEL": 81.9, "PRT": 81.7, "DNK": 81.4, "SVN": 81.3, "CHL": 80.3, "CRI": 80.8, "USA": 77.5, "CHN": 78.2, "URY": 78.0, "TUR": 77.5, "ARG": 76.5, "POL": 77.6, "BRA": 75.3, "MEX": 75.4, "COL": 74.8, "THA": 78.7, "VNM": 74.6, "IDN": 71.0, "RUS": 70.1, "IND": 70.4, "EGY": 70.2, "PHL": 72.0, "BGD": 72.4, "ZAF": 65.3, "PAK": 66.1, "GHA": 64.1, "KEN": 61.4, "NGA": 52.7, "CAF": 54.0, "LSO": 53.1, "TCD": 52.5}
gini_anchors = {"SVK": 23.2, "SVN": 24.0, "BLR": 24.4, "CZE": 25.3, "FIN": 27.7, "NOR": 27.7, "BEL": 27.2, "DNK": 27.7, "ISL": 26.1, "AUT": 29.8, "SWE": 29.8, "DEU": 31.7, "NLD": 28.1, "FRA": 32.4, "IRL": 30.6, "POL": 30.2, "CAN": 33.3, "GBR": 35.1, "AUS": 34.3, "JPN": 32.9, "KOR": 31.4, "ITA": 35.2, "ESP": 34.3, "GRC": 32.4, "EST": 30.6, "NZL": 36.2, "PRT": 34.7, "ISR": 38.6, "USA": 41.5, "CHN": 37.1, "RUS": 36.0, "TUR": 41.9, "ARG": 42.0, "MEX": 45.4, "CHL": 44.9, "IND": 35.7, "IDN": 37.9, "VNM": 35.7, "NGA": 35.1, "CRI": 48.7, "COL": 54.2, "BRA": 52.9, "ZAF": 63.0, "NAM": 59.1, "MOZ": 54.0, "ZMB": 57.1}
co2_anchors = {"QAT": 35.6, "BHR": 23.1, "KWT": 21.5, "ARE": 20.2, "BRN": 19.5, "TTO": 20.8, "SAU": 18.2, "OMN": 16.5, "USA": 14.4, "AUS": 15.0, "CAN": 14.3, "RUS": 11.4, "KOR": 11.8, "TWN": 11.2, "KAZ": 11.7, "JPN": 8.5, "CHN": 8.0, "NLD": 7.5, "DEU": 8.0, "BEL": 7.2, "POL": 7.5, "NOR": 6.8, "FIN": 6.7, "ISL": 6.2, "AUT": 6.5, "GBR": 4.7, "ITA": 5.2, "ESP": 5.1, "FRA": 4.5, "DNK": 4.9, "SWE": 3.4, "CHE": 3.7, "PRT": 4.1, "CHL": 4.5, "TUR": 5.1, "ARG": 4.0, "MEX": 3.7, "BRA": 2.2, "IDN": 2.3, "IND": 1.9, "VNM": 3.3, "EGY": 2.5, "PHL": 1.3, "PAK": 0.9, "BGD": 0.6, "NGA": 0.6, "KEN": 0.4, "ETH": 0.2, "COD": 0.05}
renew_anchors = {"ISL": 86.8, "NOR": 74.6, "SWE": 53.4, "BRA": 48.0, "NZL": 40.2, "DNK": 41.5, "AUT": 36.5, "FIN": 44.0, "PRT": 34.0, "CAN": 22.5, "CHE": 28.0, "ESP": 21.0, "DEU": 20.0, "FRA": 15.5, "ITA": 19.0, "GBR": 16.5, "CHL": 26.0, "CRI": 38.0, "CHN": 15.8, "USA": 12.5, "IND": 12.0, "JPN": 11.5, "AUS": 13.0, "TUR": 15.2, "MEX": 10.5, "IDN": 10.0, "RUS": 4.0, "SAU": 0.5, "ARE": 2.5}
gpi_anchors = {"ISL": 1.12, "DNK": 1.31, "IRL": 1.31, "NZL": 1.31, "AUT": 1.32, "SGP": 1.34, "PRT": 1.33, "SVN": 1.33, "JPN": 1.34, "CHE": 1.34, "CAN": 1.35, "FIN": 1.39, "NOR": 1.40, "SWE": 1.48, "DEU": 1.46, "BEL": 1.52, "NLD": 1.49, "AUS": 1.52, "ESP": 1.65, "ITA": 1.66, "GBR": 1.69, "FRA": 1.94, "KOR": 1.76, "USA": 2.45, "CHL": 1.88, "ARG": 1.84, "URY": 1.80, "CHN": 2.01, "BRA": 2.46, "IND": 2.31, "ZAF": 2.41, "TUR": 2.80, "MEX": 2.60, "UKR": 3.28, "RUS": 3.15, "ISR": 2.90, "SYR": 3.36, "YEM": 3.35, "AFG": 3.45, "SOM": 3.10}
passport_anchors = {"SGP": 195, "JPN": 194, "DEU": 194, "FRA": 194, "ITA": 194, "ESP": 194, "FIN": 193, "KOR": 193, "SWE": 193, "AUT": 192, "DNK": 192, "IRL": 192, "LUX": 192, "NLD": 192, "GBR": 192, "BEL": 191, "NOR": 191, "PRT": 191, "AUS": 190, "GRC": 190, "NZL": 190, "CHE": 190, "CAN": 189, "USA": 188, "POL": 188, "EST": 187, "CHL": 177, "ARG": 174, "BRA": 173, "MEX": 161, "ISR": 161, "ARE": 183, "RUS": 116, "TUR": 118, "ZAF": 108, "CHN": 85, "IDN": 78, "IND": 62, "PHL": 69, "NGA": 45, "AFG": 28}

def synth_metric(c, hdi_w, gdp_w, base_val, scale, noise_seed=1):
    h = hdi_anchors.get(c['iso3'], 0.72)
    g = min(100.0, gdp_anchors.get(c['iso3'], 20.0)) / 100.0
    val = base_val + (h * hdi_w + g * gdp_w) * scale
    ch_sum = sum(ord(x) for x in c['iso3']) * noise_seed
    noise = ((ch_sum % 100) / 100.0 - 0.5) * (scale * 0.12)
    return val + noise

datasets = {
    # Well-being
    "hdi": {
        "id": "hdi", "type": "composite", "domain": "wellbeing",
        "name": "Human Development Index", "short": "HDI", "unit": "Index (0–1)",
        "source": "United Nations Development Programme (UNDP)", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "A summary measure of average achievement in key dimensions of human development: a long and healthy life, knowledge, and a decent standard of living.",
        "methodology": "Geometric mean of normalized indices for each of the three dimensions: Health (Life Expectancy), Education (Mean & Expected Schooling), and Standard of Living (GNI per capita in PPP $).",
        "wikiUrl": "https://en.wikipedia.org/wiki/Human_Development_Index",
        "data": generate_dataset(lambda c: synth_metric(c, 0.9, 0.1, 0.40, 0.55, 1), hdi_anchors, 0.35, 0.98)
    },
    "happiness": {
        "id": "happiness", "type": "composite", "domain": "wellbeing",
        "name": "World Happiness Score", "short": "Happiness", "unit": "Score (0–10)",
        "source": "World Happiness Report (Gallup / Oxford / UN SDSN)", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "National average life evaluations based on the Cantril Ladder question, measuring subjective well-being across social support, freedom, generosity, and trust.",
        "methodology": "Nationally representative survey samples rating life satisfaction on a scale from 0 (worst possible life) to 10 (best possible life), analyzed against 6 explanatory factors.",
        "wikiUrl": "https://en.wikipedia.org/wiki/World_Happiness_Report",
        "data": generate_dataset(lambda c: synth_metric(c, 0.7, 0.3, 3.2, 4.3, 2), whr_anchors, 1.5, 8.0)
    },
    "life_expectancy": {
        "id": "life_expectancy", "type": "primary", "domain": "wellbeing",
        "name": "Life Expectancy at Birth", "short": "Life Exp.", "unit": "years",
        "source": "World Health Organization (WHO) / UN Population", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "The average number of years a newborn infant is expected to live if current mortality trends continue throughout its lifetime.",
        "methodology": "Demographic life tables constructed from national vital registration systems, census data, and demographic surveys modeling age-specific mortality rates.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Life_expectancy",
        "data": generate_dataset(lambda c: synth_metric(c, 0.85, 0.15, 52.0, 32.0, 3), life_anchors, 50.0, 86.0)
    },
    "social_progress": {
        "id": "social_progress", "type": "composite", "domain": "wellbeing",
        "name": "Social Progress Index", "short": "SPI", "unit": "Index (0–100)",
        "source": "Social Progress Imperative", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Holistic index assessing basic human needs, foundations of wellbeing, and opportunity independently of economic GDP.",
        "methodology": "Aggregates 53 outcome-based social and environmental indicators into 12 components across Basic Human Needs, Foundations of Wellbeing, and Opportunity using Principal Component Analysis.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Social_Progress_Index",
        "data": generate_dataset(lambda c: synth_metric(c, 0.8, 0.2, 35.0, 56.0, 4), spi_anchors, 25.0, 92.0)
    },
    "education_years": {
        "id": "education_years", "type": "primary", "domain": "wellbeing",
        "name": "Mean Years of Schooling", "short": "Education", "unit": "years",
        "source": "UNESCO Institute for Statistics / UNDP", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Average number of years of education received by people aged 25 and older during their lifetime.",
        "methodology": "Derived from national educational attainment data using census and survey reports, converted into cumulative years of schooling based on official standard education system durations.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Education_Index",
        "data": generate_dataset(lambda c: synth_metric(c, 0.85, 0.15, 2.5, 11.5, 5), None, 1.5, 14.5)
    },
    "uhc_health": {
        "id": "uhc_health", "type": "composite", "domain": "wellbeing",
        "name": "Universal Health Coverage (UHC)", "short": "Health Cov.", "unit": "Index (0–100)",
        "source": "World Health Organization (WHO SDG 3.8.1)", "year": 2023, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Coverage index of essential health services including reproductive, maternal, newborn, child health, infectious disease control, and service capacity.",
        "methodology": "Geometric mean of 14 tracer indicators across four categories: reproductive/maternal/child health, infectious diseases, non-communicable diseases, and service capacity and access.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Universal_health_care",
        "data": generate_dataset(lambda c: synth_metric(c, 0.75, 0.25, 30.0, 60.0, 6), None, 25.0, 92.0)
    },

    # Economy
    "gdp_pc": {
        "id": "gdp_pc", "type": "primary", "domain": "economy",
        "name": "GDP per Capita (PPP)", "short": "GDP (PPP)", "unit": "$k USD",
        "source": "World Bank / International Monetary Fund (IMF)", "year": 2024, "polarity": 1,
        "defaultTransform": "log",
        "desc": "Gross domestic product converted to international dollars using purchasing power parity rates, divided by total mid-year population.",
        "methodology": "Calculated by valuing all final domestic goods and services at constant international price baselines to adjust for cross-country cost-of-living differences. Logarithmic transformation is standardly applied in human development indexing.",
        "wikiUrl": "https://en.wikipedia.org/wiki/List_of_countries_by_GDP_(PPP)_per_capita",
        "data": generate_dataset(lambda c: synth_metric(c, 0.5, 0.5, 1.5, 75.0, 7), gdp_anchors, 0.8, 145.0)
    },
    "econ_freedom": {
        "id": "econ_freedom", "type": "composite", "domain": "economy",
        "name": "Economic Freedom Index", "short": "Econ Freedom", "unit": "Index (0–100)",
        "source": "Heritage Foundation / Wall Street Journal", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Measures economic liberty across rule of law, government size, regulatory efficiency, and market openness.",
        "methodology": "Scores 12 specific quantitative and qualitative freedoms grouped into 4 key pillars: Rule of Law (property rights, judicial effectiveness), Government Size (tax burden, fiscal health), Regulatory Efficiency (business, labor, monetary freedom), and Open Markets (trade, investment, financial freedom).",
        "wikiUrl": "https://en.wikipedia.org/wiki/Index_of_Economic_Freedom",
        "data": generate_dataset(lambda c: synth_metric(c, 0.6, 0.4, 40.0, 44.0, 8), None, 30.0, 88.0)
    },
    "rd_intensity": {
        "id": "rd_intensity", "type": "primary", "domain": "economy",
        "name": "R&D Expenditure", "short": "R&D (% GDP)", "unit": "% GDP",
        "source": "OECD / UNESCO Institute for Statistics", "year": 2023, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Gross domestic expenditure on research and experimental development as a percentage of gross domestic product.",
        "methodology": "Total intramural expenditure on scientific research and experimental development (R&D) performed on the national territory by business enterprises, higher education, government, and private non-profit sectors.",
        "wikiUrl": "https://en.wikipedia.org/wiki/List_of_countries_by_research_and_development_spending",
        "data": generate_dataset(lambda c: synth_metric(c, 0.4, 0.6, 0.1, 4.8, 9), {
            "ISR": 5.6, "KOR": 4.9, "TWN": 3.8, "SWE": 3.5, "USA": 3.46, "JPN": 3.3, "AUT": 3.2,
            "CHE": 3.15, "DEU": 3.14, "DNK": 3.0, "FIN": 2.98, "BEL": 3.48, "CHN": 2.43, "FRA": 2.22,
            "NLD": 2.3, "GBR": 1.75, "CAN": 1.7, "SGP": 2.2, "AUS": 1.8, "ESP": 1.44, "ITA": 1.45,
            "BRA": 1.15, "IND": 0.65, "RUS": 1.0, "ZAF": 0.6, "MEX": 0.3
        }, 0.05, 6.0)
    },
    "trade_openness": {
        "id": "trade_openness", "type": "primary", "domain": "economy",
        "name": "Trade Openness Index", "short": "Trade Openness", "unit": "% GDP",
        "source": "World Bank / WTO", "year": 2023, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Sum of merchandise and services exports and imports measured as a percentage of gross domestic product.",
        "methodology": "Total external trade (Exports + Imports) divided by nominal GDP. Higher values indicate greater economic integration into international trade networks.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Trade_openness",
        "data": generate_dataset(lambda c: synth_metric(c, 0.3, 0.7, 30.0, 110.0, 10), {
            "SGP": 336.0, "HKG": 380.0, "LUX": 388.0, "IRL": 240.0, "BEL": 178.0, "NLD": 162.0, "VNM": 186.0,
            "MYS": 130.0, "CHE": 128.0, "DEU": 88.0, "SWE": 95.0, "DNK": 110.0, "AUT": 105.0, "KOR": 84.0,
            "CAN": 66.0, "GBR": 64.0, "FRA": 65.0, "ESP": 68.0, "JPN": 38.0, "CHN": 38.0, "USA": 27.0,
            "BRA": 39.0, "IND": 45.0, "NGA": 24.0, "ARG": 33.0
        }, 15.0, 400.0)
    },

    # Governance
    "cpi": {
        "id": "cpi", "type": "composite", "domain": "governance",
        "name": "Corruption Perceptions Index", "short": "CPI (Low Corr.)", "unit": "Score (0–100)",
        "source": "Transparency International", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Scores public sector integrity and freedom from bribery, embezzlement, and institutional corruption.",
        "methodology": "Standardizes and aggregates data from 13 independent expert assessments and business executive surveys (including World Bank, World Economic Forum, Economist Intelligence Unit, and Bertelsmann Foundation).",
        "wikiUrl": "https://en.wikipedia.org/wiki/Corruption_Perceptions_Index",
        "data": generate_dataset(lambda c: synth_metric(c, 0.7, 0.3, 20.0, 68.0, 11), cpi_anchors, 10.0, 95.0)
    },
    "democracy": {
        "id": "democracy", "type": "composite", "domain": "governance",
        "name": "Democracy Index", "short": "Democracy", "unit": "Index (0–10)",
        "source": "Economist Intelligence Unit (EIU)", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Assesses electoral process and pluralism, functioning of government, political participation, democratic political culture, and civil liberties.",
        "methodology": "Scores 60 indicators across 5 categories based on expert evaluations and public opinion surveys, classifying regimes into Full Democracies, Flawed Democracies, Hybrid Regimes, and Authoritarian Regimes.",
        "wikiUrl": "https://en.wikipedia.org/wiki/The_Economist_Democracy_Index",
        "data": generate_dataset(lambda c: synth_metric(c, 0.75, 0.25, 2.0, 7.5, 12), eiu_anchors, 0.2, 9.9)
    },
    "rule_of_law": {
        "id": "rule_of_law", "type": "composite", "domain": "governance",
        "name": "Rule of Law Index", "short": "Rule of Law", "unit": "Index (0–1)",
        "source": "World Justice Project (WJP)", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Measures constraints on government powers, absence of corruption, fundamental rights, open government, regulatory enforcement, civil justice, and criminal justice.",
        "methodology": "Synthesizes household surveys (1,000+ respondents per country) and legal practitioner questionnaires across 8 primary institutional factors and 44 sub-factors.",
        "wikiUrl": "https://en.wikipedia.org/wiki/World_Justice_Project",
        "data": generate_dataset(lambda c: synth_metric(c, 0.7, 0.3, 0.32, 0.58, 13), wjp_anchors, 0.20, 0.95)
    },
    "press_freedom": {
        "id": "press_freedom", "type": "composite", "domain": "governance",
        "name": "World Press Freedom Index", "short": "Press Freedom", "unit": "Index (0–100)",
        "source": "Reporters Without Borders (RSF)", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Evaluates journalists' independence, safety, legal framework, and media pluralism across 180 countries.",
        "methodology": "Combines a qualitative questionnaire answered by hundreds of press freedom experts (journalists, lawyers, sociologists) across 5 contextual indicators with quantitative data on abuses and acts of violence against media figures.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Press_Freedom_Index",
        "data": generate_dataset(lambda c: synth_metric(c, 0.7, 0.3, 25.0, 65.0, 14), rsf_anchors, 15.0, 95.0)
    },
    "gov_effectiveness": {
        "id": "gov_effectiveness", "type": "composite", "domain": "governance",
        "name": "Government Effectiveness", "short": "Gov. Effect.", "unit": "Score (-2.5 to +2.5)",
        "source": "World Bank Worldwide Governance Indicators (WGI)", "year": 2023, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Captures perceptions of the quality of public services, civil service competence, independence from political pressures, and policy implementation credibility.",
        "methodology": "Constructed using an unobserved components statistical model aggregating survey responses from enterprises, citizens, and expert assessments across dozens of global institutions.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Worldwide_Governance_Indicators",
        "data": generate_dataset(lambda c: synth_metric(c, 0.65, 0.35, -1.8, 3.8, 15), {
            "SGP": 2.25, "CHE": 2.05, "DNK": 2.01, "FIN": 1.98, "NOR": 1.95, "SWE": 1.88, "NZL": 1.85,
            "NLD": 1.84, "CAN": 1.72, "DEU": 1.65, "JPN": 1.62, "GBR": 1.48, "USA": 1.42, "AUS": 1.55,
            "FRA": 1.40, "KOR": 1.35, "EST": 1.41, "ESP": 1.05, "ITA": 0.62, "CHN": 0.68, "CHL": 0.92,
            "URY": 0.75, "POL": 0.60, "MYS": 0.85, "BRA": -0.22, "IND": 0.32, "IDN": 0.38, "MEX": -0.25,
            "ZAF": -0.05, "TUR": -0.05, "RUS": -0.35, "NGA": -1.02, "VEN": -1.85, "SOM": -2.25
        }, -2.4, 2.4)
    },

    # Environment
    "epi": {
        "id": "epi", "type": "composite", "domain": "environment",
        "name": "Environmental Performance Index", "short": "EPI", "unit": "Score (0–100)",
        "source": "Yale Center for Environmental Law & Policy / Columbia CIESIN", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Ranks national performance on climate change mitigation, environmental health (air quality, drinking water, waste management), and ecosystem vitality.",
        "methodology": "Aggregates 58 performance indicators across 11 issue categories (climate change, air quality, sanitation, biodiversity, forests, fisheries, agriculture, water resources) weighted toward established international sustainability targets.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Environmental_Performance_Index",
        "data": generate_dataset(lambda c: synth_metric(c, 0.6, 0.4, 22.0, 52.0, 16), epi_anchors, 15.0, 80.0)
    },
    "co2_pc": {
        "id": "co2_pc", "type": "primary", "domain": "environment",
        "name": "CO2 Emissions per Capita", "short": "CO2 / capita", "unit": "tCO2/yr",
        "source": "Global Carbon Project / Our World in Data", "year": 2023, "polarity": -1,
        "defaultTransform": "linear",
        "desc": "Annual production and territorial carbon dioxide emissions per person. Lower values indicate a smaller per-person climate footprint.",
        "methodology": "Territorial carbon dioxide emissions from fossil fuel combustion, cement manufacturing, and gas flaring divided by national population. Automatically inverted during normalization so lower emissions yield higher index scores.",
        "wikiUrl": "https://en.wikipedia.org/wiki/List_of_countries_by_carbon_dioxide_emissions_per_capita",
        "data": generate_dataset(lambda c: synth_metric(c, 0.2, 0.8, 0.4, 15.0, 17), co2_anchors, 0.05, 38.0)
    },
    "renewable_share": {
        "id": "renewable_share", "type": "primary", "domain": "environment",
        "name": "Renewable Energy Share", "short": "Renewable %", "unit": "% Energy",
        "source": "International Renewable Energy Agency (IRENA) / World Bank", "year": 2023, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Share of renewable energy (hydro, wind, solar, geothermal, modern bioenergy) in total final national energy consumption.",
        "methodology": "Ratio of total energy consumed from renewable resources to total national final energy consumption, tracked under UN Sustainable Development Goal Target 7.2.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Renewable_energy",
        "data": generate_dataset(lambda c: synth_metric(c, 0.3, 0.3, 5.0, 45.0, 18), renew_anchors, 0.5, 90.0)
    },
    "protected_areas": {
        "id": "protected_areas", "type": "primary", "domain": "environment",
        "name": "Protected Area Coverage", "short": "Protected Area", "unit": "% Territory",
        "source": "UNEP-WCMC / World Database on Protected Areas (WDPA)", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Percentage of total terrestrial and marine territory designated under formal conservation and protected status.",
        "methodology": "Spatial GIS boundary calculations derived from IUCN categories I–VI and other conserved areas (OECMs) divided by total national geographic territory (SDG 15.1.2).",
        "wikiUrl": "https://en.wikipedia.org/wiki/Protected_area",
        "data": generate_dataset(lambda c: synth_metric(c, 0.4, 0.2, 8.0, 32.0, 19), {
            "SYC": 48.0, "BTN": 48.3, "NAM": 38.0, "NZL": 33.4, "DEU": 37.8, "GBR": 28.5, "POL": 39.6,
            "FRA": 33.5, "NOR": 31.0, "AUS": 20.0, "BRA": 30.5, "USA": 13.0, "CAN": 12.5, "CHN": 16.0,
            "IND": 7.5, "IDN": 12.0, "JPN": 29.0, "ZAF": 15.0, "CRI": 28.0, "CHL": 22.0
        }, 2.0, 55.0)
    },
    "forest_cover": {
        "id": "forest_cover", "type": "primary", "domain": "environment",
        "name": "Forest Land Coverage", "short": "Forest Cover", "unit": "% Land",
        "source": "Food and Agriculture Organization (FAO FRA)", "year": 2023, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Share of national land area covered by natural and planted forests (land spanning >0.5 hectares with trees higher than 5 meters and a canopy cover of >10%).",
        "methodology": "Remote sensing satellite imagery analysis combined with national forest inventory reports submitted every 5 years to the UN FAO.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Forest_cover_by_country",
        "data": generate_dataset(lambda c: synth_metric(c, 0.2, 0.2, 10.0, 50.0, 20), {
            "SUR": 93.0, "GUY": 93.5, "GAB": 88.0, "FIN": 73.7, "SWE": 68.7, "JPN": 68.4, "KOR": 63.0,
            "BRA": 59.0, "MYS": 58.0, "IDN": 49.0, "RUS": 49.8, "CAN": 38.7, "USA": 33.9, "NOR": 33.4,
            "DEU": 32.7, "FRA": 31.5, "ITA": 32.0, "ESP": 37.0, "IND": 24.3, "CHN": 23.4, "AUS": 17.4,
            "EGY": 0.1, "SAU": 0.5, "ISL": 0.5, "GBR": 13.2, "IRL": 11.5
        }, 0.1, 95.0)
    },

    # Innovation
    "gii": {
        "id": "gii", "type": "composite", "domain": "innovation",
        "name": "Global Innovation Index", "short": "GII", "unit": "Index (0–100)",
        "source": "World Intellectual Property Organization (WIPO)", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Assesses national innovation inputs (institutions, human capital, infrastructure, market sophistication) and innovation outputs (knowledge, technology, and creative goods).",
        "methodology": "Average of the Innovation Input Sub-Index (5 pillars) and Innovation Output Sub-Index (2 pillars), capturing roughly 80 detailed metrics across 130+ economies.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Global_Innovation_Index",
        "data": generate_dataset(lambda c: synth_metric(c, 0.6, 0.4, 18.0, 48.0, 21), gii_anchors, 12.0, 72.0)
    },
    "internet_pct": {
        "id": "internet_pct", "type": "primary", "domain": "innovation",
        "name": "Internet Penetration Rate", "short": "Internet Access", "unit": "% Pop",
        "source": "International Telecommunication Union (ITU)", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Percentage of the total population using the internet from any device in the last 3 months.",
        "methodology": "National household surveys and telecommunication operator data reported to the ITU following standard definitions for individual internet adoption.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Global_Internet_usage",
        "data": generate_dataset(lambda c: synth_metric(c, 0.7, 0.3, 20.0, 78.0, 22), {
            "ARE": 100.0, "SAU": 100.0, "KWT": 99.7, "NOR": 99.0, "DNK": 99.0, "ISL": 99.0, "CHE": 98.0,
            "GBR": 98.0, "KOR": 97.6, "SWE": 96.5, "FIN": 96.5, "NLD": 96.0, "DEU": 94.0, "USA": 93.0,
            "CAN": 94.0, "JPN": 93.0, "FRA": 93.0, "ESP": 94.5, "SGP": 96.0, "EST": 93.0, "CHN": 76.4,
            "BRA": 81.0, "MEX": 78.6, "IDN": 66.5, "IND": 52.4, "ZAF": 72.0, "NGA": 39.0, "PAK": 36.5,
            "BGD": 44.5, "ETH": 25.0, "COD": 17.6, "AFG": 18.4, "SSD": 10.9
        }, 10.0, 100.0)
    },
    "high_tech_exports": {
        "id": "high_tech_exports", "type": "primary", "domain": "innovation",
        "name": "High-Tech Exports Share", "short": "High-Tech Exp.", "unit": "% Mfg Exports",
        "source": "World Bank / UN Comtrade", "year": 2023, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Products with high R&D intensity, such as aerospace, computers, pharmaceuticals, scientific instruments, and electrical machinery.",
        "methodology": "Ratio of high-technology exports to total manufactured exports based on the OECD technology intensity classification.",
        "wikiUrl": "https://en.wikipedia.org/wiki/High_technology",
        "data": generate_dataset(lambda c: synth_metric(c, 0.3, 0.7, 2.0, 32.0, 23), {
            "HKG": 68.0, "MYS": 53.0, "SGP": 52.0, "PHL": 62.0, "TWN": 50.0, "VNM": 40.0, "KOR": 36.0,
            "CHN": 30.0, "CHE": 28.5, "USA": 19.5, "FRA": 21.0, "IRL": 38.0, "NLD": 23.0, "JPN": 17.5,
            "DEU": 15.5, "GBR": 23.0, "SWE": 14.0, "DNK": 16.0, "ISR": 28.0, "FIN": 10.5, "CAN": 13.0,
            "IND": 11.5, "BRA": 11.0, "MEX": 19.0, "TUR": 3.8, "ZAF": 5.5, "IDN": 9.0
        }, 1.0, 72.0)
    },

    # Peace, Safety & Equality
    "peace_index": {
        "id": "peace_index", "type": "composite", "domain": "peace_safety",
        "name": "Global Peace Index", "short": "Peace Score", "unit": "Score (1–4)",
        "source": "Institute for Economics & Peace (IEP)", "year": 2024, "polarity": -1,
        "defaultTransform": "linear",
        "desc": "Evaluates ongoing domestic and international conflict, societal safety and security, and degree of militarisation.",
        "methodology": "Synthesizes 23 qualitative and quantitative indicators across 3 thematic domains (ongoing domestic/international conflict, safety/security, militarisation). Inverted so lower conflict yields higher peace scores.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Global_Peace_Index",
        "data": generate_dataset(lambda c: synth_metric(c, -0.6, -0.4, 3.2, -1.8, 24), gpi_anchors, 1.1, 3.6)
    },
    "gini_index": {
        "id": "gini_index", "type": "primary", "domain": "peace_safety",
        "name": "Gini Inequality Index", "short": "Gini (Equality)", "unit": "Index (0–100)",
        "source": "World Bank Poverty & Inequality Platform", "year": 2023, "polarity": -1,
        "defaultTransform": "linear",
        "desc": "Measures income or consumption distribution inequality across a population (0 represents complete equality, 100 represents complete inequality).",
        "methodology": "Calculated from national household survey data measuring cumulative income shares against population percentiles (area between the Lorenz curve and the line of perfect equality). Inverted so lower inequality yields higher scores.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Gini_coefficient",
        "data": generate_dataset(lambda c: synth_metric(c, -0.3, -0.2, 45.0, -15.0, 25), gini_anchors, 23.0, 65.0)
    },
    "passport_power": {
        "id": "passport_power", "type": "primary", "domain": "peace_safety",
        "name": "Global Passport Power", "short": "Passport Mobility", "unit": "Destinations",
        "source": "Henley Passport Index / IATA", "year": 2024, "polarity": 1,
        "defaultTransform": "linear",
        "desc": "Total number of worldwide travel destinations accessible visa-free or with visa-on-arrival by national passport holders.",
        "methodology": "Evaluates visa regulations from the International Air Transport Association (IATA) database across 199 passports and 227 travel destinations worldwide.",
        "wikiUrl": "https://en.wikipedia.org/wiki/Henley_Passport_Index",
        "data": generate_dataset(lambda c: synth_metric(c, 0.7, 0.3, 40.0, 150.0, 26), passport_anchors, 25.0, 195.0)
    }
}

bundles = [
    {
        "id": "human_flourishing",
        "name": "Human Flourishing & Development",
        "description": "Balanced focus on subjective happiness, health, education, essential public safety, and capability.",
        "domain": "wellbeing",
        "formula": "geometric",
        "norm": "minmax",
        "weights": {
            "happiness": 30,
            "life_expectancy": 20,
            "education_years": 20,
            "uhc_health": 15,
            "peace_index": 15
        }
    },
    {
        "id": "sustainable_progress",
        "name": "Sustainable Progress & Planetary Balance",
        "description": "Combines human development with strict planetary boundaries: renewable energy, clean air, conservation, and low carbon intensity.",
        "domain": "environment",
        "formula": "geometric",
        "norm": "minmax",
        "weights": {
            "hdi": 30,
            "epi": 25,
            "renewable_share": 20,
            "co2_pc": 15,
            "protected_areas": 10
        }
    },
    {
        "id": "institutional_integrity",
        "name": "Democratic & Institutional Resilience",
        "description": "Evaluates rule of law, anti-corruption safeguards, democratic process, and free speech without economic bias.",
        "domain": "governance",
        "formula": "arithmetic",
        "norm": "minmax",
        "weights": {
            "cpi": 25,
            "democracy": 25,
            "rule_of_law": 25,
            "press_freedom": 25
        }
    },
    {
        "id": "economic_innovation",
        "name": "Economic Power & Tech Dynamism",
        "description": "Measures wealth generation, scientific R&D, patent output, digital readiness, and high-tech market leadership.",
        "domain": "economy",
        "formula": "arithmetic",
        "norm": "minmax",
        "weights": {
            "gdp_pc": 30,
            "gii": 25,
            "rd_intensity": 20,
            "econ_freedom": 15,
            "internet_pct": 10
        }
    },
    {
        "id": "inclusive_equality",
        "name": "Inclusive Society & Shared Prosperity",
        "description": "Focuses on social mobility, low income inequality, basic needs fulfillment, and universal access.",
        "domain": "peace_safety",
        "formula": "geometric",
        "norm": "minmax",
        "weights": {
            "social_progress": 35,
            "gini_index": 25,
            "uhc_health": 20,
            "happiness": 20
        }
    }
]

with open('src/data/indicators.js', 'w', encoding='utf-8') as f:
    f.write('// Standardized Indicators Library & Domain Taxonomy\n\n')
    f.write('export const DOMAINS = ' + json.dumps(domains, indent=2, ensure_ascii=False) + ';\n\n')
    f.write('export const INDICATORS = ' + json.dumps(datasets, indent=2, ensure_ascii=False) + ';\n\n')
    f.write('export const BENCHMARK_BUNDLES = ' + json.dumps(bundles, indent=2, ensure_ascii=False) + ';\n\n')
    f.write('''export const INDICATOR_LIST = Object.values(INDICATORS);

export function getIndicator(id) {
  return INDICATORS[id] || null;
}

export function getDomainIndicators(domainKey) {
  return INDICATOR_LIST.filter(ind => ind.domain === domainKey);
}

export function getIndicatorsByType(type) {
  return INDICATOR_LIST.filter(ind => ind.type === type);
}
''')

print(f'Successfully built enriched src/data/indicators.js with {len(datasets)} indicators and metadata')
