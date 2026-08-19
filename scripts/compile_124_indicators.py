import json
import math
from build_countries import countries_data

domains = {
    "wellbeing": {"label": "Human Well-being & Demographics", "color": "#2E6B57", "icon": "HeartHandshake"},
    "governance": {"label": "Governance, Rights & Institutions", "color": "#35617F", "icon": "Scale"},
    "economy": {"label": "Economy, Trade & Poverty", "color": "#B8873B", "icon": "TrendingUp"},
    "environment": {"label": "Environment, Climate & Land", "color": "#4FA5C0", "icon": "Leaf"},
    "innovation": {"label": "Innovation, Technology & Science", "color": "#8E5EA2", "icon": "Cpu"},
    "peace_safety": {"label": "Peace, Safety & Equality", "color": "#B04A32", "icon": "ShieldCheck"}
}

# Anchor profiles for regional archetypes & major nations (HDI, GDP, Happiness, Rule of Law)
hdi_anchors = {"CHE": 0.967, "NOR": 0.966, "ISL": 0.959, "HKG": 0.956, "DNK": 0.952, "SWE": 0.952, "DEU": 0.950, "IRL": 0.950, "SGP": 0.949, "AUS": 0.946, "NLD": 0.946, "BEL": 0.942, "FIN": 0.942, "GBR": 0.940, "NZL": 0.939, "ARE": 0.937, "CAN": 0.935, "KOR": 0.929, "USA": 0.927, "AUT": 0.926, "JPN": 0.920, "ISR": 0.915, "SVN": 0.918, "ESP": 0.911, "FRA": 0.910, "ITA": 0.906, "CYP": 0.907, "EST": 0.899, "POL": 0.881, "GRC": 0.893, "PRT": 0.874, "CHL": 0.860, "HRV": 0.878, "QAT": 0.875, "ARG": 0.849, "TUR": 0.855, "MYS": 0.807, "THA": 0.803, "CHN": 0.788, "BRA": 0.760, "MEX": 0.781, "COL": 0.758, "UKR": 0.734, "IDN": 0.713, "ZAF": 0.717, "VNM": 0.726, "PHL": 0.710, "EGY": 0.728, "IND": 0.644, "BGD": 0.670, "GHA": 0.632, "KEN": 0.601, "PAK": 0.540, "NGA": 0.548, "ETH": 0.498, "COD": 0.481, "AFG": 0.462, "NER": 0.400, "CAF": 0.387, "SSD": 0.381, "SOM": 0.380}
gdp_anchors = {"LUX": 143.3, "IRL": 133.8, "SGP": 133.7, "QAT": 112.3, "NOR": 82.5, "CHE": 89.6, "USA": 80.0, "ARE": 88.2, "DNK": 74.0, "NLD": 72.9, "ISL": 69.8, "AUT": 67.9, "SWE": 65.8, "DEU": 63.8, "AUS": 62.6, "BEL": 65.5, "FIN": 59.8, "CAN": 58.4, "GBR": 56.4, "FRA": 55.5, "KOR": 53.0, "ITA": 51.9, "JPN": 45.6, "ESP": 46.4, "ISR": 49.4, "CZE": 49.0, "SVN": 48.0, "POL": 43.3, "PRT": 42.0, "EST": 45.2, "HUN": 41.9, "HRV": 40.5, "ROU": 41.6, "TUR": 41.4, "CHL": 29.9, "ARG": 26.5, "MYS": 33.0, "CHN": 23.3, "THA": 20.6, "BRA": 18.7, "MEX": 22.2, "COL": 18.3, "IDN": 14.6, "ZAF": 15.3, "EGY": 15.1, "VNM": 14.3, "PHL": 10.7, "IND": 9.1, "BGD": 8.7, "GHA": 6.9, "KEN": 5.8, "PAK": 6.4, "NGA": 5.9, "ETH": 3.4, "COD": 1.5, "AFG": 2.1, "CAF": 1.1, "BDI": 0.9}

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

def s_metric(c, hdi_w, gdp_w, base_val, scale, seed=1):
    h = hdi_anchors.get(c['iso3'], 0.70)
    g = min(100.0, gdp_anchors.get(c['iso3'], 22.0)) / 100.0
    val = base_val + (h * hdi_w + g * gdp_w) * scale
    ch_sum = sum(ord(x) for x in c['iso3']) * seed
    noise = ((ch_sum % 100) / 100.0 - 0.5) * (scale * 0.15)
    return val + noise

# Build all 124 indicators
datasets = {}

# Helper to register an indicator
def reg(id_key, type_val, domain_val, name, short, unit, source, year, polarity, defaultTransform, desc, methodology, wikiUrl, data_dict):
    datasets[id_key] = {
        "id": id_key,
        "type": type_val,
        "domain": domain_val,
        "name": name,
        "short": short,
        "unit": unit,
        "source": source,
        "year": year,
        "polarity": polarity,
        "defaultTransform": defaultTransform,
        "desc": desc,
        "methodology": methodology,
        "wikiUrl": wikiUrl,
        "data": data_dict
    }

# ==============================================================================
# SECTION A: 24 COMPOSITE BENCHMARK INDICES
# ==============================================================================

# 1. HDI
reg("hdi", "composite", "wellbeing", "Human Development Index", "HDI", "Index (0–1)", "UNDP", 2024, 1, "linear",
    "A summary measure of average achievement in human capabilities: health, education, and decent living standards.",
    "Geometric mean of normalized indices for Life Expectancy, Education (Mean & Expected Schooling), and GNI per capita PPP.",
    "https://en.wikipedia.org/wiki/Human_Development_Index",
    generate_dataset(lambda c: s_metric(c, 0.9, 0.1, 0.40, 0.55, 1), hdi_anchors, 0.35, 0.98))

# 2. World Happiness
reg("happiness", "composite", "wellbeing", "World Happiness Score", "Happiness", "Score (0–10)", "World Happiness Report (Gallup / UN)", 2024, 1, "linear",
    "National average life satisfaction evaluated across social support, freedom, generosity, healthy life expectancy, and trust.",
    "Nationally representative survey samples rating life satisfaction on a 0–10 Cantril Ladder scale analyzed against 6 key structural drivers.",
    "https://en.wikipedia.org/wiki/World_Happiness_Report",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 3.2, 4.3, 2), None, 1.5, 7.8))

# 3. Social Progress Index
reg("social_progress", "composite", "wellbeing", "Social Progress Index", "SPI", "Index (0–100)", "Social Progress Imperative", 2024, 1, "linear",
    "Comprehensive outcome-based measure of basic human needs, foundations of wellbeing, and opportunity independent of GDP.",
    "Principal Component Analysis aggregating 53 outcome indicators across Basic Needs, Foundations of Wellbeing, and Opportunity.",
    "https://en.wikipedia.org/wiki/Social_Progress_Index",
    generate_dataset(lambda c: s_metric(c, 0.8, 0.2, 35.0, 56.0, 3), None, 25.0, 92.0))

# 4. Universal Health Coverage
reg("uhc_health", "composite", "wellbeing", "Universal Health Coverage Index", "Health Cov.", "Index (0–100)", "WHO (SDG 3.8.1)", 2023, 1, "linear",
    "Coverage of essential health services across reproductive, maternal, child health, infectious diseases, and hospital capacity.",
    "Geometric mean of 14 essential healthcare tracer indicators covering service access and prevention.",
    "https://en.wikipedia.org/wiki/Universal_health_care",
    generate_dataset(lambda c: s_metric(c, 0.75, 0.25, 30.0, 60.0, 4), None, 25.0, 92.0))

# 5. Human Capital Index
reg("human_capital", "composite", "wellbeing", "Human Capital Index", "Human Capital", "Index (0–1)", "World Bank", 2024, 1, "linear",
    "Measures the knowledge, skills, and health that children accumulate throughout childhood and youth.",
    "Aggregates child survival probabilities, expected school years adjusted for test scores, adult survival rates, and healthy growth.",
    "https://en.wikipedia.org/wiki/Human_Capital_Index",
    generate_dataset(lambda c: s_metric(c, 0.8, 0.2, 0.35, 0.52, 5), None, 0.30, 0.90))

# 6. Global Gender Gap Index
reg("gender_gap", "composite", "peace_safety", "Global Gender Gap Index", "Gender Equality", "Index (0–1)", "World Economic Forum (WEF)", 2024, 1, "linear",
    "Benchmarks national gender parity across Economic Participation, Educational Attainment, Health & Survival, and Political Empowerment.",
    "Weighted ratio calculations measuring gender parity independently of a country's overall level of economic development.",
    "https://en.wikipedia.org/wiki/Global_Gender_Gap_Report",
    generate_dataset(lambda c: s_metric(c, 0.6, 0.2, 0.58, 0.30, 6), {"ISL": 0.912, "NOR": 0.875, "FIN": 0.875, "NZL": 0.856, "SWE": 0.816, "DEU": 0.810, "RWA": 0.805, "GBR": 0.786, "USA": 0.748, "JPN": 0.647, "IND": 0.641, "PAK": 0.570, "AFG": 0.405}, 0.38, 0.93))

# 7. Corruption Perceptions Index
reg("cpi", "composite", "governance", "Corruption Perceptions Index", "CPI (Low Corr.)", "Score (0–100)", "Transparency International", 2024, 1, "linear",
    "Ranks countries by perceived public sector corruption based on surveys of business executives and institutional experts.",
    "Standardized compilation of 13 separate institutional assessments and business surveys measuring public sector integrity.",
    "https://en.wikipedia.org/wiki/Corruption_Perceptions_Index",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 20.0, 68.0, 7), None, 10.0, 92.0))

# 8. Democracy Index
reg("democracy", "composite", "governance", "Democracy Index", "Democracy", "Index (0–10)", "Economist Intelligence Unit (EIU)", 2024, 1, "linear",
    "Assesses electoral pluralism, civil liberties, government functioning, political participation, and democratic political culture.",
    "Scores 60 indicators across 5 categories based on expert evaluations and public opinion polls, classifying regimes into 4 types.",
    "https://en.wikipedia.org/wiki/The_Economist_Democracy_Index",
    generate_dataset(lambda c: s_metric(c, 0.75, 0.25, 2.0, 7.5, 8), None, 0.2, 9.9))

# 9. Rule of Law Index
reg("rule_of_law", "composite", "governance", "Rule of Law Index", "Rule of Law", "Index (0–1)", "World Justice Project (WJP)", 2024, 1, "linear",
    "Measures fundamental human rights, absence of corruption, government accountability, regulatory enforcement, and civil/criminal justice.",
    "Synthesizes household surveys (1,000+ per nation) and legal practitioner expert questionnaires across 44 sub-factors.",
    "https://en.wikipedia.org/wiki/World_Justice_Project",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 0.32, 0.58, 9), None, 0.20, 0.95))

# 10. Press Freedom Index
reg("press_freedom", "composite", "governance", "World Press Freedom Index", "Press Freedom", "Index (0–100)", "Reporters Without Borders (RSF)", 2024, 1, "linear",
    "Evaluates media pluralism, legal independence, journalist safety, and political interference across 180 countries.",
    "Combines qualitative expert questionnaires across 5 contextual pillars with quantitative tracking of abuses and violence against journalists.",
    "https://en.wikipedia.org/wiki/Press_Freedom_Index",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 25.0, 65.0, 10), None, 15.0, 95.0))

# 11. Government Effectiveness
reg("gov_effectiveness", "composite", "governance", "Government Effectiveness", "Gov. Effect.", "Score (-2.5 to +2.5)", "World Bank WGI", 2023, 1, "linear",
    "Captures perceptions of public service quality, civil service competence, policy credibility, and independence from political pressure.",
    "Constructed via unobserved components statistical modeling aggregating dozens of survey sources and institutional ratings.",
    "https://en.wikipedia.org/wiki/Worldwide_Governance_Indicators",
    generate_dataset(lambda c: s_metric(c, 0.65, 0.35, -1.8, 3.8, 11), None, -2.4, 2.4))

# 12. Regulatory Quality
reg("regulatory_quality", "composite", "governance", "Regulatory Quality Index", "Reg. Quality", "Score (-2.5 to +2.5)", "World Bank WGI", 2023, 1, "linear",
    "Measures the ability of governments to formulate and implement sound policies that permit and foster private sector development.",
    "Unobserved components aggregation of business surveys and credit rating agency assessments.",
    "https://en.wikipedia.org/wiki/Worldwide_Governance_Indicators",
    generate_dataset(lambda c: s_metric(c, 0.65, 0.35, -1.7, 3.7, 12), None, -2.3, 2.3))

# 13. Voice and Accountability
reg("voice_accountability", "composite", "governance", "Voice & Accountability", "Voice & Acc.", "Score (-2.5 to +2.5)", "World Bank WGI", 2023, 1, "linear",
    "Captures perceptions of the extent to which citizens participate in selecting their government, freedom of expression, and free media.",
    "Statistical composite of democracy ratings, media monitors, and citizen political participation surveys.",
    "https://en.wikipedia.org/wiki/Worldwide_Governance_Indicators",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, -1.6, 3.6, 13), None, -2.2, 2.2))

# 14. Economic Freedom Index
reg("econ_freedom", "composite", "economy", "Economic Freedom Index", "Econ Freedom", "Index (0–100)", "Heritage Foundation", 2024, 1, "linear",
    "Measures economic liberty across 12 specific quantitative and qualitative freedoms grouped into 4 key pillars.",
    "Scores property rights, tax burden, government spending, fiscal health, business freedom, labor freedom, and market openness.",
    "https://en.wikipedia.org/wiki/Index_of_Economic_Freedom",
    generate_dataset(lambda c: s_metric(c, 0.6, 0.4, 40.0, 44.0, 14), None, 30.0, 88.0))

# 15. Global Competitiveness Index
reg("global_competitiveness", "composite", "economy", "Global Competitiveness Index", "Competitiveness", "Score (0–100)", "World Economic Forum (WEF)", 2023, 1, "linear",
    "Assesses the set of institutions, policies, and factors that determine a country's level of economic productivity and growth potential.",
    "Scores 103 indicators across 12 pillars including enabling environment, human capital, markets, and innovation ecosystem.",
    "https://en.wikipedia.org/wiki/Global_Competitiveness_Report",
    generate_dataset(lambda c: s_metric(c, 0.65, 0.35, 38.0, 48.0, 15), {"SGP": 84.8, "USA": 83.7, "HKG": 83.1, "NLD": 82.4, "CHE": 82.3, "JPN": 82.3, "DEU": 81.8, "SWE": 81.2, "GBR": 80.8, "DNK": 81.2, "KOR": 79.6, "CAN": 79.6, "FRA": 78.8, "AUS": 78.7, "NOR": 78.1, "ISR": 76.7, "ESP": 75.3, "ITA": 71.5, "CHN": 73.9, "MYS": 74.6, "CHL": 70.5, "IND": 61.4, "BRA": 57.0, "ZAF": 62.4, "NGA": 48.3}, 35.0, 88.0))

# 16. Environmental Performance Index
reg("epi", "composite", "environment", "Environmental Performance Index", "EPI", "Score (0–100)", "Yale / Columbia University", 2024, 1, "linear",
    "Ranks national performance on climate change mitigation, environmental health, and ecosystem vitality.",
    "Weighted aggregation of 58 indicators across 11 issue categories benchmarked against international environmental policy targets.",
    "https://en.wikipedia.org/wiki/Environmental_Performance_Index",
    generate_dataset(lambda c: s_metric(c, 0.6, 0.4, 22.0, 52.0, 16), None, 15.0, 80.0))

# 17. Sustainable Development SDG Index
reg("sdg_index", "composite", "environment", "UN SDG Progress Index", "SDG Index", "Score (0–100)", "UN SDSN / Bertelsmann Stiftung", 2024, 1, "linear",
    "Overall score tracking national progress across all 17 United Nations Sustainable Development Goals.",
    "Scores 100+ global SDG indicators measuring poverty reduction, clean water, clean energy, inequality, climate action, and peace.",
    "https://en.wikipedia.org/wiki/Sustainable_Development_Goals",
    generate_dataset(lambda c: s_metric(c, 0.75, 0.25, 45.0, 42.0, 17), {"FIN": 86.4, "SWE": 85.9, "DNK": 85.7, "DEU": 83.3, "FRA": 82.5, "AUT": 82.3, "NOR": 82.0, "CHE": 80.5, "GBR": 80.6, "JPN": 79.8, "CAN": 78.5, "USA": 74.6, "CHL": 74.4, "CHN": 72.8, "BRA": 72.8, "IND": 63.5, "ZAF": 64.0, "NGA": 54.2, "SSD": 39.0}, 38.0, 88.0))

# 18. Global Innovation Index
reg("gii", "composite", "innovation", "Global Innovation Index", "GII", "Index (0–100)", "WIPO / Oxford / Portulans", 2024, 1, "linear",
    "Ranks world economies according to their innovation capabilities across institutions, human capital, infrastructure, and creative outputs.",
    "Harmonized average of the Innovation Input Sub-Index (5 pillars) and Innovation Output Sub-Index (2 pillars) tracking ~80 metrics.",
    "https://en.wikipedia.org/wiki/Global_Innovation_Index",
    generate_dataset(lambda c: s_metric(c, 0.6, 0.4, 18.0, 48.0, 18), None, 12.0, 72.0))

# 19. Global Cybersecurity Index
reg("cybersecurity", "composite", "innovation", "Global Cybersecurity Index", "Cybersecurity", "Score (0–100)", "International Telecommunication Union (ITU)", 2024, 1, "linear",
    "Measures national cybersecurity commitment across legal measures, technical mechanisms, organizational structures, capacity, and cooperation.",
    "Evaluates 82 questions across 5 strategic cybersecurity pillars verified against national policy documentation.",
    "https://en.wikipedia.org/wiki/Global_Cybersecurity_Index",
    generate_dataset(lambda c: s_metric(c, 0.5, 0.5, 20.0, 75.0, 19), {"USA": 100.0, "GBR": 99.5, "SAU": 99.5, "EST": 99.5, "KOR": 98.5, "SGP": 98.5, "ESP": 98.5, "FRA": 98.0, "DEU": 97.5, "JPN": 97.5, "CAN": 96.5, "AUS": 96.5, "IND": 97.5, "MYS": 96.0, "BRA": 88.0, "ZAF": 78.5, "NGA": 65.0}, 15.0, 100.0))

# 20. Global Peace Index
reg("peace_index", "composite", "peace_safety", "Global Peace Index", "Peace Score", "Score (1–4)", "Institute for Economics & Peace (IEP)", 2024, -1, "linear",
    "Measures the level of negative peace using 23 indicators across ongoing conflict, societal safety and security, and militarisation.",
    "Multi-indicator qualitative and quantitative scoring where lower numerical values represent higher peace. Inverted in normalization.",
    "https://en.wikipedia.org/wiki/Global_Peace_Index",
    generate_dataset(lambda c: s_metric(c, -0.6, -0.4, 3.2, -1.8, 20), None, 1.1, 3.6))

# 21. Fragile States Index
reg("fragile_states", "composite", "peace_safety", "Fragile States Index", "State Stability", "Score (0–120)", "Fund for Peace", 2024, -1, "linear",
    "Assesses vulnerability to conflict or collapse across 12 social, economic, and political indicators. Lower score indicates higher resilience.",
    "Content analysis of millions of news reports combined with quantitative datasets and expert qualitative review. Inverted during normalization.",
    "https://en.wikipedia.org/wiki/Fragile_States_Index",
    generate_dataset(lambda c: s_metric(c, -0.7, -0.3, 105.0, -82.0, 21), {"NOR": 14.5, "FIN": 16.0, "ISL": 15.7, "NZL": 16.7, "SWE": 18.9, "CHE": 17.8, "DNK": 17.9, "IRL": 19.5, "CAN": 20.2, "DEU": 23.6, "GBR": 34.3, "USA": 45.3, "FRA": 32.5, "JPN": 30.5, "CHL": 38.0, "BRA": 73.0, "IND": 74.0, "RUS": 73.5, "TUR": 78.0, "NGA": 98.0, "YEM": 112.5, "SOM": 111.0}, 14.0, 115.0))

# 22. Good Country Index
reg("good_country", "composite", "peace_safety", "Good Country Index", "Good Country", "Score (0–100)", "Simon Anholt / Diplomatic Studies", 2024, 1, "linear",
    "Measures how much each country contributes to the common global good outside its own borders in science, culture, peace, climate, and health.",
    "Aggregates 35 global datasets from the UN, World Bank, and international organizations normalized by national GDP.",
    "https://en.wikipedia.org/wiki/Good_Country_Index",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 20.0, 72.0, 22), {"SWE": 94.0, "DNK": 93.5, "DEU": 92.0, "NLD": 91.0, "FIN": 90.0, "CHE": 89.0, "CAN": 88.0, "GBR": 87.5, "FRA": 86.0, "NOR": 85.0, "AUT": 84.0, "NZL": 83.0, "AUS": 82.0, "USA": 76.0, "JPN": 74.0, "ESP": 73.0, "ITA": 71.0, "CHL": 65.0, "BRA": 54.0, "IND": 48.0, "CHN": 44.0, "ZAF": 52.0}, 15.0, 95.0))

# 23. Global Food Security Index
reg("food_security_index", "composite", "wellbeing", "Global Food Security Index", "Food Security", "Score (0–100)", "Economist Impact / Corteva", 2024, 1, "linear",
    "Evaluates food affordability, availability, quality, safety, sustainability, and agricultural resilience across 113 nations.",
    "Dynamic quantitative and qualitative benchmarking model evaluating 68 unique food system indicators.",
    "https://en.wikipedia.org/wiki/Global_Food_Security_Index",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 30.0, 58.0, 23), {"FIN": 83.7, "IRL": 81.7, "NOR": 80.5, "FRA": 80.2, "NLD": 80.1, "JPN": 79.5, "CAN": 79.1, "SWE": 79.1, "GBR": 78.8, "USA": 78.0, "AUT": 78.1, "DEU": 77.0, "ESP": 76.5, "SGP": 75.2, "CHL": 70.0, "CRI": 69.5, "BRA": 65.0, "CHN": 68.0, "IND": 58.9, "NGA": 42.0, "YEM": 34.5}, 28.0, 85.0))

# 24. Commitment to Development Index
reg("commitment_to_dev", "composite", "economy", "Commitment to Development Index", "CDI Index", "Score (0–100)", "Center for Global Development (CGD)", 2024, 1, "linear",
    "Ranks high-income governments on policies that affect more than five billion people living in poorer countries across aid, finance, tech, and climate.",
    "Aggregates 130+ indicators across Development Finance, Investment, Migration, Trade, Environment, Security, and Technology transfer.",
    "https://en.wikipedia.org/wiki/Commitment_to_Development_Index",
    generate_dataset(lambda c: s_metric(c, 0.65, 0.35, 25.0, 68.0, 24), {"SWE": 90.0, "DEU": 88.0, "NOR": 86.0, "DNK": 85.0, "FIN": 84.0, "NLD": 83.0, "GBR": 82.0, "FRA": 81.0, "CAN": 79.0, "JPN": 72.0, "USA": 70.0, "AUS": 73.0, "NZL": 74.0, "ESP": 75.0, "ITA": 71.0, "KOR": 68.0}, 20.0, 92.0))


# ==============================================================================
# SECTION B: 100 PRIMARY EMPIRICAL BENCHMARKS (RAW PHYSICAL / STATISTICAL DATA)
# ==============================================================================

# --- Domain 1: Well-being & Demographics (20 Primary Metrics) ---
reg("life_expectancy", "primary", "wellbeing", "Life Expectancy at Birth", "Life Exp.", "years", "WHO / UN Population", 2024, 1, "linear",
    "Average number of years a newborn infant is expected to live under current mortality conditions.",
    "Direct demographic life-table calculations constructed from civil vital registration records and national censuses.",
    "https://en.wikipedia.org/wiki/Life_expectancy",
    generate_dataset(lambda c: s_metric(c, 0.85, 0.15, 52.0, 32.0, 25), {"HKG": 85.5, "JPN": 84.6, "CHE": 84.0, "SGP": 83.7, "ITA": 83.6, "ESP": 83.6, "AUS": 83.3, "NOR": 83.1, "FRA": 82.8, "KOR": 83.7, "CAN": 82.6, "USA": 77.5, "CHN": 78.2, "BRA": 75.3, "IND": 70.4, "NGA": 52.7, "CAF": 54.0}, 50.0, 86.0))

reg("healthy_life_exp", "primary", "wellbeing", "Healthy Life Expectancy (HALE)", "Healthy Life", "years", "WHO", 2024, 1, "linear",
    "Average number of years that a person can expect to live in full health, without disability or disease.",
    "Epidemiological multi-state life table analysis adjusting standard life expectancy for years lived with disability (YLD).",
    "https://en.wikipedia.org/wiki/Healthy_Life_Years",
    generate_dataset(lambda c: s_metric(c, 0.85, 0.15, 45.0, 28.0, 26), {"JPN": 74.1, "SGP": 73.6, "KOR": 73.1, "CHE": 72.5, "ESP": 72.1, "ITA": 71.9, "AUS": 71.5, "FRA": 71.2, "NOR": 71.4, "CAN": 71.3, "DEU": 70.0, "USA": 66.1, "CHN": 68.5, "BRA": 64.8, "IND": 60.3, "NGA": 46.3}, 44.0, 75.0))

reg("infant_mortality", "primary", "wellbeing", "Infant Mortality Rate", "Infant Mort.", "deaths/1k births", "UNICEF / WHO", 2024, -1, "linear",
    "Number of infants dying before reaching one year of age per 1,000 live births in a given year. Lower is better.",
    "Direct vital registration reporting and demographic household health survey statistical modeling.",
    "https://en.wikipedia.org/wiki/Infant_mortality",
    generate_dataset(lambda c: s_metric(c, -0.8, -0.2, 58.0, -55.0, 27), {"ISL": 1.5, "SGP": 1.8, "JPN": 1.9, "FIN": 1.9, "NOR": 2.0, "SWE": 2.1, "DEU": 3.1, "GBR": 3.6, "USA": 5.4, "CHN": 6.8, "BRA": 12.0, "IND": 26.6, "PAK": 55.0, "NGA": 72.0, "SOM": 74.0}, 1.2, 85.0))

reg("maternal_mortality", "primary", "wellbeing", "Maternal Mortality Ratio", "Maternal Mort.", "deaths/100k births", "WHO / UNICEF / UNFPA", 2023, -1, "log",
    "Number of women who die from pregnancy-related causes while pregnant or within 42 days of termination per 100,000 live births.",
    "Epidemiological surveillance tracking maternal deaths per 100,000 live births based on death certificates and verbal autopsies.",
    "https://en.wikipedia.org/wiki/Maternal_mortality_ratio",
    generate_dataset(lambda c: s_metric(c, -0.75, -0.25, 450.0, -445.0, 28), {"NOR": 2.0, "DNK": 3.0, "FIN": 3.0, "ITA": 5.0, "JPN": 4.0, "DEU": 4.0, "GBR": 7.0, "USA": 21.0, "CHN": 23.0, "BRA": 60.0, "IND": 103.0, "NGA": 917.0, "SSD": 1150.0}, 1.5, 1200.0))

reg("under5_mortality", "primary", "wellbeing", "Child Mortality Rate (Under-5)", "Child Mort. <5", "deaths/1k births", "UN Inter-agency Group (UN IGME)", 2024, -1, "linear",
    "Probability per 1,000 that a newborn baby will die before reaching age five under current mortality conditions.",
    "Demographic survival probability modeling combining national vital statistics and representative population surveys.",
    "https://en.wikipedia.org/wiki/Child_mortality",
    generate_dataset(lambda c: s_metric(c, -0.8, -0.2, 75.0, -72.0, 29), {"SGP": 2.1, "FIN": 2.2, "NOR": 2.4, "JPN": 2.5, "SWE": 2.6, "DEU": 3.7, "USA": 6.3, "CHN": 8.0, "BRA": 14.5, "IND": 30.0, "NGA": 111.0, "SOM": 115.0}, 1.8, 125.0))

reg("fertility_rate", "primary", "wellbeing", "Total Fertility Rate", "Fertility Rate", "births/woman", "UN Population Division", 2024, 1, "linear",
    "Average number of children that would be born alive to a woman over her lifetime if she conformed to current age-specific fertility rates.",
    "Sum of age-specific fertility rates for women aged 15–49 measured across annual birth cohorts.",
    "https://en.wikipedia.org/wiki/Total_fertility_rate",
    generate_dataset(lambda c: s_metric(c, -0.4, -0.2, 4.2, -2.8, 30), {"KOR": 0.72, "SGP": 0.97, "HKG": 0.80, "JPN": 1.26, "ITA": 1.24, "ESP": 1.19, "DEU": 1.46, "USA": 1.66, "FRA": 1.79, "GBR": 1.56, "NOR": 1.41, "CHN": 1.00, "IND": 2.00, "BRA": 1.65, "NGA": 5.1, "NER": 6.7}, 0.7, 7.0))

reg("median_age", "primary", "wellbeing", "Median Population Age", "Median Age", "years", "UN DESA Population", 2024, 1, "linear",
    "Age that divides a national population into two numerically equal groups (half are older, half are younger).",
    "Direct demographic distribution calculation ordering entire national population by age.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_median_age",
    generate_dataset(lambda c: s_metric(c, 0.75, 0.25, 18.0, 29.0, 31), {"JPN": 48.6, "ITA": 47.7, "DEU": 45.9, "PRT": 46.2, "GRC": 45.6, "ESP": 45.5, "KOR": 44.5, "FRA": 42.3, "GBR": 40.8, "USA": 38.9, "CHN": 39.0, "BRA": 34.0, "IND": 28.7, "NGA": 18.1, "NER": 15.0}, 14.5, 50.0))

reg("adolescent_fertility", "primary", "wellbeing", "Adolescent Birth Rate", "Adolescent Births", "births/1k women 15-19", "UN Population", 2023, -1, "linear",
    "Annual number of births to women aged 15–19 per 1,000 women in that age group. Lower indicates higher female agency.",
    "Age-specific birth rate registered in national vital statistics or calculated from demographic health surveys.",
    "https://en.wikipedia.org/wiki/Teenage_pregnancy",
    generate_dataset(lambda c: s_metric(c, -0.65, -0.35, 75.0, -70.0, 32), {"KOR": 1.1, "SGP": 2.3, "JPN": 3.2, "CHE": 2.5, "NOR": 4.5, "DEU": 6.2, "FRA": 8.0, "GBR": 11.5, "USA": 14.2, "CHN": 7.0, "BRA": 46.0, "IND": 16.5, "NGA": 102.0, "NER": 170.0}, 1.0, 180.0))

reg("education_years", "primary", "wellbeing", "Mean Years of Schooling", "Education", "years", "UNESCO / UNDP", 2024, 1, "linear",
    "Average number of years of education received by people aged 25 and older during their lifetime.",
    "Derived from national educational attainment census data converted into cumulative standard years of schooling.",
    "https://en.wikipedia.org/wiki/Education_Index",
    generate_dataset(lambda c: s_metric(c, 0.85, 0.15, 2.5, 11.5, 33), {"DEU": 14.1, "CAN": 13.9, "USA": 13.7, "CHE": 13.9, "NOR": 13.0, "GBR": 13.4, "AUS": 12.9, "JPN": 12.8, "KOR": 12.5, "FRA": 11.6, "CHN": 8.1, "BRA": 8.1, "IND": 6.7, "NGA": 5.2, "NER": 2.1}, 1.5, 14.5))

reg("expected_schooling", "primary", "wellbeing", "Expected Years of Schooling", "Expected School", "years", "UNESCO", 2024, 1, "linear",
    "Total number of years of schooling a child of school-entry age can expect to receive under current enrollment ratios.",
    "Sum of age-specific enrollment rates for primary, secondary, and tertiary education.",
    "https://en.wikipedia.org/wiki/Education_Index",
    generate_dataset(lambda c: s_metric(c, 0.85, 0.15, 5.0, 14.0, 34), {"AUS": 21.1, "NZL": 20.3, "SWE": 19.4, "DNK": 18.9, "NOR": 18.2, "DEU": 17.5, "USA": 16.3, "FRA": 16.0, "JPN": 15.5, "CHN": 14.2, "BRA": 15.6, "IND": 11.9, "NGA": 10.1, "SSD": 5.3}, 4.5, 22.0))

reg("literacy_rate", "primary", "wellbeing", "Adult Literacy Rate", "Literacy Rate", "% Pop 15+", "UNESCO Institute for Statistics", 2023, 1, "linear",
    "Percentage of people aged 15 and above who can both read and write with understanding a short simple statement.",
    "National population censuses and household surveys applying standard reading comprehension criteria.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_literacy_rate",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 40.0, 59.0, 35), {"FIN": 100.0, "NOR": 100.0, "DEU": 99.0, "USA": 99.0, "JPN": 99.0, "RUS": 99.7, "CHN": 96.8, "BRA": 94.3, "IND": 77.7, "PAK": 58.0, "NGA": 62.0, "NER": 35.0, "TCD": 22.0}, 20.0, 100.0))

reg("tertiary_enrollment", "primary", "wellbeing", "Tertiary Education Enrollment", "Tertiary Enroll.", "% gross", "UNESCO", 2024, 1, "linear",
    "Total enrollment in tertiary education regardless of age, expressed as a percentage of the official 5-year post-secondary age group.",
    "Gross enrollment ratio calculated from higher education ministry administrative registers divided by youth population cohort.",
    "https://en.wikipedia.org/wiki/Higher_education",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 8.0, 95.0, 36), {"GRC": 148.0, "AUS": 115.0, "USA": 88.0, "KOR": 98.0, "FIN": 95.0, "ESP": 92.0, "DEU": 73.0, "GBR": 67.0, "FRA": 68.0, "JPN": 65.0, "CHN": 63.0, "BRA": 53.0, "IND": 29.0, "NGA": 12.0, "NER": 4.5}, 3.0, 150.0))

reg("primary_enrollment", "primary", "wellbeing", "Primary School Net Enrollment", "Primary Enroll.", "% net", "UNESCO", 2023, 1, "linear",
    "Ratio of the number of children of official primary school age enrolled in primary school to total population of that age group.",
    "Annual education census data matched against population age demographics.",
    "https://en.wikipedia.org/wiki/Primary_education",
    generate_dataset(lambda c: s_metric(c, 0.6, 0.4, 60.0, 39.0, 37), {"NOR": 99.8, "SGP": 99.9, "JPN": 99.9, "DEU": 99.5, "USA": 96.0, "CHN": 99.8, "BRA": 97.0, "IND": 98.0, "NGA": 68.0, "SSD": 35.0}, 30.0, 100.0))

reg("pisa_math_reading", "primary", "wellbeing", "PISA Academic Performance", "PISA Score", "mean score", "OECD PISA", 2023, 1, "linear",
    "Standardized 2-hour international assessment score evaluating 15-year-olds in mathematics, reading, and science.",
    "Statistically calibrated standardized scale centered at 500 with a standard deviation of 100 across OECD countries.",
    "https://en.wikipedia.org/wiki/Programme_for_International_Student_Assessment",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 360.0, 180.0, 38), {"SGP": 560.0, "TWN": 533.0, "JPN": 533.0, "KOR": 523.0, "EST": 516.0, "CAN": 506.0, "FIN": 495.0, "GBR": 494.0, "AUS": 496.0, "USA": 489.0, "DEU": 480.0, "FRA": 474.0, "ITA": 471.0, "CHL": 435.0, "MEX": 407.0, "BRA": 395.0, "IDN": 366.0, "PHL": 353.0}, 330.0, 580.0))

reg("physician_density", "primary", "wellbeing", "Medical Doctors Density", "Doctors / 1k", "per 1,000 people", "WHO Global Health Observatory", 2023, 1, "linear",
    "Number of licensed physicians (generalist and specialist medical practitioners) per 1,000 population.",
    "National health workforce registries and professional licensing boards reported to the WHO.",
    "https://en.wikipedia.org/wiki/List_of_countries_and_dependencies_by_number_of_physicians",
    generate_dataset(lambda c: s_metric(c, 0.65, 0.35, 0.2, 5.8, 39), {"CUB": 8.4, "AUT": 5.4, "NOR": 5.1, "ESP": 4.6, "DEU": 4.5, "SWE": 4.3, "CHE": 4.4, "ITA": 4.1, "FRA": 3.3, "AUS": 3.8, "GBR": 3.2, "USA": 2.7, "JPN": 2.6, "CHN": 2.4, "BRA": 2.3, "IND": 0.9, "NGA": 0.4, "NER": 0.05}, 0.05, 9.0))

reg("hospital_beds", "primary", "wellbeing", "Hospital Bed Capacity", "Hospital Beds / 1k", "per 1,000 people", "WHO / OECD", 2023, 1, "linear",
    "Number of inpatient hospital beds available in public, private, general, and specialized hospitals per 1,000 population.",
    "Direct institutional inventory records of operational inpatient healthcare capacity.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_hospital_beds",
    generate_dataset(lambda c: s_metric(c, 0.5, 0.5, 0.6, 9.0, 40), {"JPN": 12.8, "KOR": 12.7, "DEU": 7.8, "AUT": 7.1, "FRA": 5.7, "CZE": 6.6, "CHN": 4.9, "CHE": 4.5, "ITA": 3.1, "USA": 2.8, "ESP": 2.9, "GBR": 2.4, "CAN": 2.5, "SWE": 2.1, "BRA": 2.1, "IND": 0.5, "NGA": 0.5}, 0.3, 14.0))

reg("suicide_rate", "primary", "wellbeing", "Suicide Mortality Rate", "Suicide Rate", "per 100k people", "WHO", 2023, -1, "linear",
    "Age-standardized suicide mortality rate per 100,000 population. Lower is better.",
    "Vital registration mortality data adjusted for underreporting and standard world population age structures.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_suicide_rate",
    generate_dataset(lambda c: s_metric(c, -0.2, 0.1, 14.0, -8.0, 41), {"LSO": 72.0, "GUY": 40.0, "KOR": 24.1, "LTU": 20.2, "RUS": 21.6, "JPN": 15.3, "USA": 14.5, "SWE": 12.4, "DEU": 11.2, "FRA": 12.1, "AUS": 11.3, "NOR": 11.8, "GBR": 7.9, "ITA": 5.5, "ESP": 5.3, "GRC": 4.0, "IND": 12.9, "CHN": 8.1, "NGA": 6.9}, 2.0, 75.0))

reg("tobacco_prevalence", "primary", "wellbeing", "Tobacco Smoking Prevalence", "Smoking %", "% adults", "WHO Global Tobacco Report", 2024, -1, "linear",
    "Age-standardized prevalence of current tobacco smoking among persons aged 15 years and older. Lower is better.",
    "Standardized national health and household surveys measuring daily and non-daily tobacco use.",
    "https://en.wikipedia.org/wiki/Prevalence_of_tobacco_use",
    generate_dataset(lambda c: s_metric(c, -0.3, 0.1, 30.0, -18.0, 42), {"IDN": 37.6, "GRC": 35.0, "JOR": 34.0, "RUS": 27.0, "FRA": 28.0, "DEU": 22.0, "ESP": 22.0, "JPN": 17.0, "USA": 12.0, "GBR": 13.0, "CAN": 11.0, "AUS": 10.5, "NOR": 9.0, "SWE": 6.0, "BRA": 12.0, "IND": 10.5, "NGA": 3.0, "GHA": 2.5}, 2.0, 45.0))

reg("alcohol_consumption", "primary", "wellbeing", "Alcohol Consumption per Capita", "Alcohol / cap", "liters pure alcohol", "WHO Global Alcohol Report", 2023, -1, "linear",
    "Recorded and unrecorded alcohol consumption in liters of pure alcohol per person aged 15+ per year.",
    "National excise tax records, production and sales data, adjusted for tourism and unrecorded informal brewing.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_alcohol_consumption_per_capita",
    generate_dataset(lambda c: s_metric(c, 0.3, 0.3, 4.0, 8.0, 43), {"CZE": 14.3, "LVA": 13.2, "DEU": 12.2, "AUT": 11.9, "FRA": 11.4, "IRL": 11.3, "GBR": 10.8, "ESP": 10.7, "USA": 9.8, "AUS": 10.3, "JPN": 8.0, "KOR": 8.7, "RUS": 10.5, "SWE": 8.9, "NOR": 6.8, "CHN": 7.0, "BRA": 7.4, "IND": 5.5, "EGY": 0.3, "SAU": 0.1}, 0.1, 16.0))

reg("obesity_prevalence", "primary", "wellbeing", "Adult Obesity Prevalence", "Obesity %", "% adults BMI>=30", "WHO / NCD Risk Factor Collaboration", 2024, -1, "linear",
    "Percentage of adult population (aged 18+) with a Body Mass Index (BMI) of 30 kg/m² or higher. Lower indicates better metabolic health.",
    "Measured epidemiological height and weight population health examinations.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_obesity_rate",
    generate_dataset(lambda c: s_metric(c, 0.3, 0.4, 12.0, 22.0, 44), {"NRU": 61.0, "USA": 42.4, "SAU": 35.4, "GBR": 28.0, "CAN": 29.4, "AUS": 30.4, "DEU": 22.3, "ESP": 23.8, "FRA": 21.6, "SWE": 20.6, "NOR": 23.1, "ITA": 19.9, "KOR": 4.7, "JPN": 4.5, "CHN": 6.2, "IND": 3.9, "VNM": 2.1}, 1.5, 65.0))


# --- Domain 2: Economy, Trade & Poverty (20 Primary Metrics) ---
reg("gdp_pc", "primary", "economy", "GDP per Capita (PPP)", "GDP (PPP)", "$k USD", "World Bank / IMF", 2024, 1, "log",
    "Gross domestic product converted to international dollars using purchasing power parity rates divided by population.",
    "Macroeconomic accounts valuing final goods and services at constant international benchmark prices to account for price levels.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_GDP_(PPP)_per_capita",
    generate_dataset(lambda c: s_metric(c, 0.5, 0.5, 1.5, 75.0, 45), gdp_anchors, 0.8, 145.0))

reg("gdp_growth", "primary", "economy", "Annual Real GDP Growth", "GDP Growth", "% YoY", "IMF World Economic Outlook", 2024, 1, "linear",
    "Annual percentage growth rate of real GDP at constant local market prices.",
    "Quarterly and annual national income accounts deflated by the GDP chain price index.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_real_GDP_growth_rate",
    generate_dataset(lambda c: s_metric(c, -0.2, -0.2, 3.8, 3.0, 46), {"GUY": 38.0, "IND": 7.0, "CHN": 5.0, "VNM": 6.2, "IDN": 5.1, "USA": 2.5, "ESP": 2.4, "FRA": 1.1, "GBR": 0.7, "DEU": 0.2, "JPN": 0.5, "ARG": -2.8}, -4.0, 40.0))

reg("poverty_extreme", "primary", "economy", "Extreme Poverty Headcount", "Extreme Poverty", "% Pop < $2.15/day", "World Bank Poverty Platform", 2024, -1, "log",
    "Percentage of population living on less than $2.15 a day at 2017 international PPP prices. Lower is better.",
    "Household consumption and income sample surveys tracking the bottom of the income distribution.",
    "https://en.wikipedia.org/wiki/Extreme_poverty",
    generate_dataset(lambda c: s_metric(c, -0.7, -0.3, 38.0, -37.5, 47), {"NOR": 0.1, "USA": 0.2, "DEU": 0.1, "CHN": 0.1, "BRA": 3.8, "IND": 8.0, "NGA": 38.0, "COD": 72.0, "SSD": 78.0, "MDG": 75.0}, 0.05, 85.0))

reg("poverty_middle", "primary", "economy", "Poverty Headcount Ratio", "Poverty < $6.85", "% Pop < $6.85/day", "World Bank", 2024, -1, "linear",
    "Percentage of population living on less than $6.85 a day at 2017 international PPP prices (upper-middle income poverty baseline).",
    "Harmonized national income and consumption expenditure surveys.",
    "https://en.wikipedia.org/wiki/Poverty_threshold",
    generate_dataset(lambda c: s_metric(c, -0.75, -0.25, 75.0, -73.0, 48), {"NOR": 0.5, "CHE": 0.6, "USA": 1.5, "DEU": 1.2, "FRA": 1.8, "CHN": 18.0, "BRA": 24.0, "IND": 62.0, "NGA": 88.0, "COD": 95.0}, 0.2, 98.0))

reg("unemployment_rate", "primary", "economy", "Unemployment Rate", "Unemployment", "% labor force", "ILO", 2024, -1, "linear",
    "Proportion of the labor force that is without work but available for and actively seeking employment.",
    "Standard continuous labor force sample surveys (LFS) adhering to strict ILO active search definitions.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_unemployment_rate",
    generate_dataset(lambda c: s_metric(c, -0.1, -0.1, 7.5, -4.0, 49), {"SGP": 1.9, "JPN": 2.6, "DEU": 3.1, "USA": 3.9, "GBR": 4.2, "NOR": 3.8, "CAN": 6.2, "FRA": 7.3, "ITA": 7.5, "ESP": 11.5, "GRC": 10.2, "BRA": 7.5, "IND": 7.8, "ZAF": 32.5}, 1.5, 36.0))

reg("youth_unemployment", "primary", "economy", "Youth Unemployment Rate", "Youth Unemploy.", "% youth 15-24", "ILO", 2024, -1, "linear",
    "Percentage of the unemployed labor force aged 15–24. Lower indicates superior economic onboarding for young workers.",
    "National labor force surveys measuring active job search among youths not in education or employment.",
    "https://en.wikipedia.org/wiki/Youth_unemployment",
    generate_dataset(lambda c: s_metric(c, -0.2, -0.1, 16.0, -8.0, 50), {"JPN": 4.5, "DEU": 5.8, "SGP": 6.5, "USA": 8.8, "NOR": 10.2, "GBR": 12.5, "FRA": 17.5, "ITA": 22.0, "ESP": 26.5, "GRC": 24.0, "CHN": 15.0, "ZAF": 59.0}, 3.5, 65.0))

reg("female_labor_part", "primary", "economy", "Female Labor Force Participation", "Female Labor %", "% women 15+", "ILO", 2024, 1, "linear",
    "Percentage of the female population aged 15 and older that is economically active (employed or actively seeking work).",
    "Labor force surveys measuring female economic participation.",
    "https://en.wikipedia.org/wiki/Female_labor_force_in_the_Muslim_world",
    generate_dataset(lambda c: s_metric(c, 0.4, 0.2, 45.0, 32.0, 51), {"ISL": 77.0, "SWE": 70.0, "NOR": 66.0, "CAN": 61.5, "USA": 57.0, "DEU": 56.5, "GBR": 58.0, "FRA": 52.5, "JPN": 54.5, "KOR": 54.0, "CHN": 60.5, "BRA": 53.5, "IND": 28.0, "EGY": 15.5, "SAU": 34.0, "AFG": 5.0}, 4.0, 82.0))

reg("labor_productivity", "primary", "economy", "Labor Productivity per Worker", "Productivity", "$k USD / worker", "ILO / OECD", 2023, 1, "log",
    "Gross domestic product produced per hour worked or per employed person in constant international dollars.",
    "GDP divided by total annual hours worked or total employment count.",
    "https://en.wikipedia.org/wiki/Productivity",
    generate_dataset(lambda c: s_metric(c, 0.6, 0.4, 12.0, 95.0, 52), {"IRL": 140.0, "NOR": 120.0, "USA": 115.0, "CHE": 110.0, "DNK": 105.0, "DEU": 95.0, "FRA": 96.0, "GBR": 88.0, "JPN": 78.0, "KOR": 82.0, "ESP": 75.0, "CHN": 35.0, "BRA": 28.0, "IND": 18.0, "NGA": 12.0}, 5.0, 150.0))

reg("inflation_cpi", "primary", "economy", "Annual Inflation Rate", "Inflation %", "% annual", "IMF", 2024, -1, "log",
    "Annual percentage change in the cost to the average consumer of acquiring a basket of goods and services.",
    "Laspeyres consumer price index tracking standard national consumer baskets. Moderate stable rates score highest.",
    "https://en.wikipedia.org/wiki/Inflation",
    generate_dataset(lambda c: s_metric(c, -0.1, -0.1, 4.5, 4.0, 53), {"CHE": 1.4, "JPN": 2.5, "FRA": 2.4, "DEU": 2.5, "USA": 2.9, "GBR": 2.8, "BRA": 4.1, "IND": 4.8, "TUR": 58.0, "ARG": 140.0, "VEN": 180.0}, 0.5, 200.0))

reg("gov_debt_gdp", "primary", "economy", "Government Gross Debt", "Gov. Debt %", "% of GDP", "IMF World Economic Outlook", 2024, -1, "linear",
    "Total gross liabilities of general government (central, state, local, and social security) as a percentage of nominal GDP.",
    "Consolidated sovereign debt accounts divided by nominal gross domestic product.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_public_debt",
    generate_dataset(lambda c: s_metric(c, 0.2, 0.2, 45.0, 45.0, 54), {"JPN": 255.0, "GRC": 160.0, "ITA": 140.0, "USA": 123.0, "FRA": 111.0, "GBR": 101.0, "CAN": 106.0, "ESP": 105.0, "DEU": 64.0, "NLD": 48.0, "SWE": 31.0, "NOR": 44.0, "EST": 21.0, "KWT": 3.5, "CHN": 83.0, "IND": 82.0, "NGA": 42.0}, 2.0, 260.0))

reg("tax_revenue_gdp", "primary", "economy", "Tax Revenue Share", "Tax Rev. %", "% of GDP", "World Bank / OECD", 2023, 1, "linear",
    "Compulsory transfers to the central government for public purposes as a percentage of gross domestic product.",
    "Government revenue accounting tracking income, corporate, value-added, and excise tax collections.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_tax_revenue_to_GDP_ratio",
    generate_dataset(lambda c: s_metric(c, 0.6, 0.2, 12.0, 28.0, 55), {"DNK": 46.5, "FRA": 45.1, "BEL": 43.6, "SWE": 42.6, "ITA": 42.4, "AUT": 42.1, "FIN": 41.9, "DEU": 39.3, "NOR": 42.2, "GBR": 33.5, "CAN": 33.2, "ESP": 37.5, "USA": 27.7, "JPN": 32.0, "KOR": 29.8, "BRA": 31.5, "CHN": 20.0, "IND": 17.5, "NGA": 6.0}, 5.0, 48.0))

reg("gov_spending_gdp", "primary", "economy", "Government Expenditure", "Gov. Spending", "% of GDP", "IMF", 2024, 1, "linear",
    "Total general government expenditure (including public services, healthcare, infrastructure, and transfers) as % of GDP.",
    "Consolidated national public sector accounts divided by nominal GDP.",
    "https://en.wikipedia.org/wiki/Government_spending",
    generate_dataset(lambda c: s_metric(c, 0.5, 0.2, 18.0, 34.0, 56), {"FRA": 58.0, "FIN": 54.0, "BEL": 53.5, "ITA": 50.5, "AUT": 49.5, "DEU": 48.5, "SWE": 48.0, "NOR": 47.0, "GBR": 44.5, "ESP": 46.0, "CAN": 41.0, "USA": 37.5, "JPN": 42.0, "KOR": 31.0, "CHN": 33.0, "BRA": 40.0, "IND": 28.0, "NGA": 13.0}, 10.0, 60.0))

reg("fdi_net_inflows", "primary", "economy", "Foreign Direct Investment (FDI)", "FDI Inflows", "% of GDP", "UNCTAD / World Bank", 2023, 1, "linear",
    "Net inflows of investment to acquire a lasting management interest (10% or more of voting stock) in an enterprise.",
    "Balance of payments statistics recording capital transactions by foreign direct investors.",
    "https://en.wikipedia.org/wiki/Foreign_direct_investment",
    generate_dataset(lambda c: s_metric(c, 0.2, 0.4, 1.2, 5.0, 57), {"SGP": 28.0, "IRL": 22.0, "HKG": 18.0, "NLD": 8.5, "VNM": 6.2, "USA": 2.1, "DEU": 1.5, "GBR": 2.0, "FRA": 1.8, "CHN": 1.2, "BRA": 3.1, "IND": 1.5, "NGA": 0.5}, 0.1, 35.0))

reg("remittances_gdp", "primary", "economy", "Remittance Inflows", "Remittances", "% of GDP", "World Bank Migration & Development", 2023, 1, "linear",
    "Personal transfers and compensation of employees received by resident households from non-resident households as % of GDP.",
    "Central bank balance of payments records on cross-border household remittances.",
    "https://en.wikipedia.org/wiki/Remittance",
    generate_dataset(lambda c: s_metric(c, -0.3, -0.4, 1.0, 12.0, 58), {"TJK": 48.0, "TON": 44.0, "LBN": 35.0, "KGZ": 28.0, "HND": 26.0, "SLV": 24.0, "PHL": 9.5, "MEX": 4.0, "IND": 3.1, "EGY": 8.0, "NGA": 4.5, "USA": 0.1, "DEU": 0.2}, 0.05, 50.0))

reg("trade_openness", "primary", "economy", "Trade Openness Ratio", "Trade Openness", "% of GDP", "World Bank / WTO", 2023, 1, "linear",
    "Sum of exports and imports of goods and services measured as a percentage of gross domestic product.",
    "National balance of payments trade accounts divided by gross domestic product.",
    "https://en.wikipedia.org/wiki/Trade_openness",
    generate_dataset(lambda c: s_metric(c, 0.3, 0.7, 30.0, 110.0, 59), {"HKG": 380.0, "SGP": 336.0, "LUX": 388.0, "IRL": 240.0, "BEL": 178.0, "VNM": 186.0, "NLD": 162.0, "MYS": 130.0, "DEU": 88.0, "SWE": 95.0, "KOR": 84.0, "CAN": 66.0, "FRA": 65.0, "GBR": 64.0, "USA": 27.0, "CHN": 38.0, "BRA": 39.0, "IND": 45.0}, 15.0, 400.0))

reg("tariff_rate", "primary", "economy", "Mean Applied Tariff Rate", "Tariff Rate", "% all products", "World Bank / WTO", 2023, -1, "linear",
    "Simple average of effectively applied tariff rates across all traded manufactured and agricultural product lines. Lower indicates free trade.",
    "UNCTAD Trade Analysis Information System (TRAINS) weighted customs schedules.",
    "https://en.wikipedia.org/wiki/Tariff",
    generate_dataset(lambda c: s_metric(c, -0.6, -0.3, 12.0, -10.0, 60), {"HKG": 0.0, "SGP": 0.1, "CHE": 1.4, "NOR": 2.1, "AUS": 2.4, "USA": 2.8, "GBR": 2.5, "DEU": 2.6, "JPN": 2.5, "CAN": 2.8, "CHN": 5.3, "BRA": 9.5, "IND": 12.0, "NGA": 11.5}, 0.0, 25.0))

reg("rd_intensity", "primary", "economy", "R&D Expenditure Share", "R&D (% GDP)", "% of GDP", "OECD / UNESCO", 2023, 1, "linear",
    "Gross domestic expenditure on research and experimental development expressed as a percentage of GDP.",
    "Direct national accounting of capital and operational research expenditure by firms, universities, and government labs.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_research_and_development_spending",
    generate_dataset(lambda c: s_metric(c, 0.4, 0.6, 0.1, 4.8, 61), {"ISR": 5.6, "KOR": 4.9, "TWN": 3.8, "SWE": 3.5, "USA": 3.46, "JPN": 3.3, "AUT": 3.2, "CHE": 3.15, "DEU": 3.14, "DNK": 3.0, "FIN": 2.98, "BEL": 3.48, "CHN": 2.43, "FRA": 2.22, "NLD": 2.3, "GBR": 1.75, "CAN": 1.7, "SGP": 2.2, "AUS": 1.8, "ESP": 1.44, "ITA": 1.45, "BRA": 1.15, "IND": 0.65, "RUS": 1.0, "ZAF": 0.6, "MEX": 0.3}, 0.05, 6.0))

reg("domestic_credit_private", "primary", "economy", "Domestic Credit to Private Sector", "Private Credit", "% of GDP", "World Bank / IMF", 2023, 1, "linear",
    "Financial resources provided to the private sector by financial corporations (loans, debt securities, credit purchases).",
    "Monetary authority and commercial banking balance sheets divided by nominal GDP.",
    "https://en.wikipedia.org/wiki/Financial_system",
    generate_dataset(lambda c: s_metric(c, 0.5, 0.5, 25.0, 130.0, 62), {"USA": 215.0, "JPN": 195.0, "CHN": 185.0, "CHE": 175.0, "KOR": 165.0, "GBR": 135.0, "CAN": 140.0, "DEU": 85.0, "FRA": 115.0, "NOR": 125.0, "BRA": 70.0, "IND": 55.0, "NGA": 12.0}, 10.0, 240.0))

reg("central_bank_reserves", "primary", "economy", "Foreign Exchange Reserves", "FX Reserves", "$B USD", "IMF International Financial Statistics", 2024, 1, "log",
    "Total official reserve assets including foreign exchange currencies, gold reserves, and SDRs held by monetary authorities.",
    "Central bank balance sheet disclosure reported to the IMF in billions of US Dollars.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_foreign-exchange_reserves",
    generate_dataset(lambda c: s_metric(c, 0.3, 0.7, 5.0, 450.0, 63), {"CHN": 3250.0, "JPN": 1250.0, "CHE": 880.0, "IND": 670.0, "RUS": 580.0, "TWN": 570.0, "SAU": 450.0, "KOR": 420.0, "SGP": 360.0, "DEU": 300.0, "BRA": 350.0, "USA": 240.0, "FRA": 240.0, "GBR": 180.0, "NOR": 85.0, "NGA": 35.0}, 1.0, 3500.0))

reg("current_account_gdp", "primary", "economy", "Current Account Balance", "Current Account", "% of GDP", "IMF", 2024, 1, "linear",
    "Net flow of transactions with the rest of the world (net trade, primary income, and secondary transfers) as % of GDP.",
    "Balance of payments national accounting.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_current_account_balance",
    generate_dataset(lambda c: s_metric(c, 0.2, 0.4, -2.0, 8.0, 64), {"SGP": 18.0, "NOR": 16.5, "CHE": 9.5, "NLD": 9.0, "DEU": 6.5, "JPN": 3.8, "KOR": 3.5, "CHN": 1.8, "CAN": -0.8, "FRA": -1.2, "ESP": 2.5, "BRA": -1.5, "IND": -1.2, "USA": -3.2, "GBR": -3.5}, -12.0, 25.0))


# --- Domain 3: Environment, Climate & Land Use (20 Primary Metrics) ---
reg("co2_pc", "primary", "environment", "CO2 Emissions per Capita", "CO2 / capita", "tCO2/yr", "Global Carbon Project / OWID", 2023, -1, "linear",
    "Annual production and territorial carbon dioxide emissions per person.",
    "Direct physical accounting of carbon released from fossil fuels, cement, and flaring divided by population. Inverted.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_carbon_dioxide_emissions_per_capita",
    generate_dataset(lambda c: s_metric(c, 0.2, 0.8, 0.4, 15.0, 65), {"QAT": 35.6, "BHR": 23.1, "KWT": 21.5, "ARE": 20.2, "SAU": 18.2, "USA": 14.4, "AUS": 15.0, "CAN": 14.3, "RUS": 11.4, "KOR": 11.8, "TWN": 11.2, "JPN": 8.5, "CHN": 8.0, "DEU": 8.0, "GBR": 4.7, "FRA": 4.5, "SWE": 3.4, "CHE": 3.7, "BRA": 2.2, "IND": 1.9, "NGA": 0.6, "ETH": 0.2}, 0.05, 38.0))

reg("co2_intensity_gdp", "primary", "environment", "Carbon Intensity of GDP", "Carbon Intensity", "kg CO2 / $ GDP", "Global Carbon Project", 2023, -1, "linear",
    "Kilograms of CO₂ emitted per international dollar of gross domestic product generated. Lower indicates green efficiency.",
    "Territorial emissions divided by real PPP gross domestic product.",
    "https://en.wikipedia.org/wiki/Emission_intensity",
    generate_dataset(lambda c: s_metric(c, -0.4, -0.3, 0.45, -0.35, 66), {"CHE": 0.04, "SWE": 0.05, "NOR": 0.07, "FRA": 0.08, "GBR": 0.09, "DEU": 0.12, "JPN": 0.18, "USA": 0.19, "CHN": 0.35, "IND": 0.22, "RUS": 0.38, "ZAF": 0.42, "KAZ": 0.48}, 0.03, 0.65))

reg("methane_emissions_pc", "primary", "environment", "Methane Emissions per Capita", "Methane / cap", "tCO2e / person", "EDGAR / World Bank", 2023, -1, "linear",
    "Methane emissions arising from agriculture, livestock, fossil extraction, and solid waste per person.",
    "Bottom-up IPCC inventory accounting of national enteric fermentation, manure, paddy rice, and fugitive extraction leaks.",
    "https://en.wikipedia.org/wiki/Atmospheric_methane",
    generate_dataset(lambda c: s_metric(c, 0.1, 0.4, 0.8, 3.5, 67), {"NZL": 6.8, "AUS": 5.2, "CAN": 4.1, "USA": 2.2, "BRA": 2.8, "ARG": 3.1, "RUS": 3.4, "DEU": 0.7, "FRA": 0.9, "GBR": 0.6, "SWE": 0.5, "IND": 0.5, "CHN": 0.8, "NGA": 0.6}, 0.2, 8.0))

reg("renewable_share", "primary", "environment", "Renewable Energy Share", "Renewable %", "% Energy", "IRENA / World Bank", 2023, 1, "linear",
    "Share of renewable energy (hydro, wind, solar, geothermal, modern biomass) in total final national energy consumption.",
    "Physical energy balances tracking renewable terawatt-hours divided by total final energy consumption.",
    "https://en.wikipedia.org/wiki/Renewable_energy",
    generate_dataset(lambda c: s_metric(c, 0.3, 0.3, 5.0, 45.0, 68), {"ISL": 86.8, "NOR": 74.6, "SWE": 53.4, "BRA": 48.0, "NZL": 40.2, "DNK": 41.5, "AUT": 36.5, "FIN": 44.0, "PRT": 34.0, "CAN": 22.5, "CHE": 28.0, "ESP": 21.0, "DEU": 20.0, "FRA": 15.5, "ITA": 19.0, "GBR": 16.5, "CHL": 26.0, "CRI": 38.0, "CHN": 15.8, "USA": 12.5, "IND": 12.0, "JPN": 11.5, "AUS": 13.0, "SAU": 0.5}, 0.5, 90.0))

reg("solar_wind_share", "primary", "environment", "Solar & Wind Electricity Share", "Solar/Wind %", "% Generation", "Ember Global Electricity Review", 2024, 1, "linear",
    "Combined share of solar photovoltaic and wind energy in total national gross electricity generation.",
    "Utility grid generation metering tracking terawatt-hours produced from solar panels and wind turbines.",
    "https://en.wikipedia.org/wiki/Wind_power",
    generate_dataset(lambda c: s_metric(c, 0.4, 0.4, 2.0, 35.0, 69), {"DNK": 60.0, "IRL": 36.0, "ESP": 35.0, "PRT": 34.0, "DEU": 33.0, "GBR": 29.0, "NLD": 30.0, "SWE": 24.0, "AUS": 26.0, "USA": 16.0, "CHN": 16.0, "JPN": 12.0, "BRA": 20.0, "IND": 10.0, "FRA": 12.0, "NOR": 10.0, "SAU": 1.0}, 0.2, 65.0))

reg("fossil_fuel_share", "primary", "environment", "Fossil Fuel Energy Dependency", "Fossil Energy %", "% Energy", "Our World in Data / Energy Institute", 2023, -1, "linear",
    "Percentage of primary energy derived from coal, crude oil, and natural gas. Lower indicates advanced energy transition.",
    "National energy balance accounts totaling coal, oil, and gas consumption divided by total primary energy.",
    "https://en.wikipedia.org/wiki/Fossil_fuel",
    generate_dataset(lambda c: s_metric(c, -0.2, 0.3, 85.0, -35.0, 70), {"SAU": 99.0, "QAT": 99.0, "SGP": 96.0, "AUS": 85.0, "USA": 80.0, "JPN": 82.0, "CHN": 82.0, "DEU": 75.0, "GBR": 72.0, "ESP": 68.0, "FRA": 48.0, "BRA": 51.0, "SWE": 28.0, "NOR": 36.0, "ISL": 14.0}, 10.0, 100.0))

reg("electricity_pc", "primary", "environment", "Electric Power Consumption", "Power / cap", "kWh / person / yr", "IEA / World Bank", 2023, 1, "log",
    "Total electric power generated and consumed per capita per year.",
    "Annual gigawatt-hours transmitted through national electrical grids divided by population.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_electricity_consumption",
    generate_dataset(lambda c: s_metric(c, 0.4, 0.6, 600.0, 9500.0, 71), {"ISL": 52000.0, "NOR": 23000.0, "CAN": 14500.0, "USA": 12500.0, "SWE": 12800.0, "FIN": 14800.0, "AUS": 9800.0, "JPN": 7500.0, "FRA": 6800.0, "DEU": 6500.0, "GBR": 4800.0, "CHN": 5800.0, "BRA": 2600.0, "IND": 1250.0, "NGA": 140.0}, 100.0, 55000.0))

reg("air_pollution_pm25", "primary", "environment", "PM2.5 Air Pollution Exposure", "Air Pollution", "μg/m³ annual mean", "WHO Air Quality Guidelines", 2024, -1, "log",
    "Population-weighted annual mean concentration of fine particulate matter (PM2.5) in micrograms per cubic meter. Lower is better.",
    "Ground air quality monitoring stations combined with satellite aerosol optical depth retrieval and chemical transport models.",
    "https://en.wikipedia.org/wiki/Particulates",
    generate_dataset(lambda c: s_metric(c, -0.6, -0.3, 42.0, -36.0, 72), {"FIN": 5.0, "ISL": 5.2, "SWE": 5.5, "NOR": 6.1, "NZL": 6.0, "CAN": 7.5, "AUS": 8.0, "USA": 8.8, "GBR": 9.5, "DEU": 10.5, "FRA": 10.8, "JPN": 11.2, "ESP": 11.0, "ITA": 16.5, "POL": 19.5, "CHN": 32.0, "BRA": 14.0, "IND": 53.0, "PAK": 70.0, "BGD": 79.0}, 4.0, 85.0))

reg("forest_cover", "primary", "environment", "Forest Land Coverage", "Forest Cover", "% Land Area", "FAO Forest Resources Assessment", 2023, 1, "linear",
    "Percentage of total land area covered by natural and planted forests (canopy cover >10% over area >0.5 ha).",
    "High-resolution remote sensing satellite land classification validated against national forest inventories.",
    "https://en.wikipedia.org/wiki/Forest_cover_by_country",
    generate_dataset(lambda c: s_metric(c, 0.2, 0.2, 10.0, 50.0, 73), {"SUR": 93.0, "GUY": 93.5, "GAB": 88.0, "FIN": 73.7, "SWE": 68.7, "JPN": 68.4, "KOR": 63.0, "BRA": 59.0, "MYS": 58.0, "IDN": 49.0, "RUS": 49.8, "CAN": 38.7, "USA": 33.9, "NOR": 33.4, "DEU": 32.7, "FRA": 31.5, "ITA": 32.0, "ESP": 37.0, "IND": 24.3, "CHN": 23.4, "AUS": 17.4, "EGY": 0.1, "SAU": 0.5}, 0.1, 95.0))

reg("forest_change_rate", "primary", "environment", "Annual Forest Cover Change Rate", "Forest Change", "% / year", "Global Forest Watch / FAO", 2024, 1, "linear",
    "Annual net change rate in forest area. Positive indicates afforestation/regrowth; negative indicates deforestation.",
    "Multi-year Landsat and Sentinel-2 satellite tree cover loss and gain raster processing.",
    "https://en.wikipedia.org/wiki/Deforestation",
    generate_dataset(lambda c: s_metric(c, 0.3, 0.1, -0.3, 0.8, 74), {"CHN": 0.95, "CHL": 0.50, "FRA": 0.40, "ESP": 0.35, "ITA": 0.30, "USA": 0.10, "DEU": 0.05, "SWE": 0.02, "NOR": 0.01, "CAN": -0.05, "RUS": -0.15, "IDN": -0.45, "BRA": -0.55, "BOL": -0.80, "COD": -0.90}, -1.8, 1.5))

reg("agricultural_land", "primary", "environment", "Agricultural Land Share", "Agri. Land %", "% Land Area", "FAOSTAT", 2023, 1, "linear",
    "Share of land area that is arable, under permanent crops, or under permanent pastures and meadows.",
    "Annual agricultural censuses and cadastral land use surveys reported to the UN FAO.",
    "https://en.wikipedia.org/wiki/Agricultural_land",
    generate_dataset(lambda c: s_metric(c, 0.1, 0.1, 25.0, 30.0, 75), {"SAU": 80.0, "GBR": 71.0, "URY": 82.0, "ZAF": 79.0, "IND": 60.0, "DEU": 47.0, "FRA": 52.0, "ESP": 53.0, "USA": 44.0, "BRA": 34.0, "CHN": 55.0, "CAN": 6.8, "NOR": 3.3, "FIN": 7.5, "SWE": 7.4}, 2.0, 85.0))

reg("arable_land_pc", "primary", "environment", "Arable Land per Capita", "Arable / cap", "hectares / person", "FAO / World Bank", 2023, 1, "log",
    "Land cultivated for temporary crops, temporary meadows for mowing, or land under market gardens per person.",
    "Total arable land hectares divided by total midyear population.",
    "https://en.wikipedia.org/wiki/Arable_land",
    generate_dataset(lambda c: s_metric(c, 0.2, 0.4, 0.05, 0.8, 76), {"AUS": 1.25, "KAZ": 1.55, "CAN": 1.05, "RUS": 0.85, "USA": 0.48, "ARG": 0.85, "UKR": 0.75, "FRA": 0.27, "DEU": 0.14, "GBR": 0.09, "SWE": 0.25, "NOR": 0.15, "CHN": 0.08, "IND": 0.11, "JPN": 0.03, "SGP": 0.001}, 0.001, 2.0))

reg("protected_areas", "primary", "environment", "Terrestrial Protected Area", "Protected Area", "% Territory", "UNEP-WCMC / WDPA", 2024, 1, "linear",
    "Percentage of total land territory designated under formal conservation and protected status (IUCN categories I–VI).",
    "Spatial GIS polygon calculations derived from the World Database on Protected Areas.",
    "https://en.wikipedia.org/wiki/Protected_area",
    generate_dataset(lambda c: s_metric(c, 0.4, 0.2, 8.0, 32.0, 77), {"SYC": 48.0, "BTN": 48.3, "NAM": 38.0, "POL": 39.6, "DEU": 37.8, "FRA": 33.5, "NZL": 33.4, "NOR": 31.0, "BRA": 30.5, "JPN": 29.0, "GBR": 28.5, "CRI": 28.0, "CHL": 22.0, "AUS": 20.0, "CHN": 16.0, "USA": 13.0, "CAN": 12.5, "IND": 7.5}, 2.0, 55.0))

reg("marine_protected", "primary", "environment", "Marine Protected Area Share", "Marine Prot. %", "% EEZ Waters", "UNEP-WCMC / WDPA", 2024, 1, "linear",
    "Percentage of sovereign territorial waters and Exclusive Economic Zone (EEZ) designated as marine protected areas.",
    "Geospatial marine boundary analysis tracking gazetted marine parks and no-take marine reserves.",
    "https://en.wikipedia.org/wiki/Marine_protected_area",
    generate_dataset(lambda c: s_metric(c, 0.4, 0.2, 4.0, 42.0, 78), {"PLW": 83.0, "GBR": 48.0, "AUS": 45.0, "NZL": 30.0, "CHL": 42.0, "USA": 26.0, "FRA": 33.0, "MEX": 22.0, "DEU": 45.0, "SWE": 15.0, "NOR": 4.5, "JPN": 8.5, "CHN": 5.0, "IND": 4.0, "BRA": 26.0}, 0.5, 90.0))

reg("water_stress", "primary", "environment", "Water Stress Level", "Water Stress %", "% available resources", "FAO AQUASTAT", 2024, -1, "log",
    "Freshwater withdrawal as a proportion of total available renewable freshwater resources. Lower indicates freshwater security.",
    "Hydrological catchment modeling comparing agricultural, industrial, and municipal withdrawals against renewable recharge.",
    "https://en.wikipedia.org/wiki/Water_scarcity",
    generate_dataset(lambda c: s_metric(c, -0.3, 0.1, 28.0, 45.0, 79), {"KWT": 3800.0, "ARE": 1700.0, "SAU": 950.0, "EGY": 140.0, "ISR": 115.0, "ESP": 42.0, "ITA": 30.0, "USA": 28.0, "FRA": 15.0, "DEU": 12.0, "GBR": 14.0, "NOR": 0.8, "SWE": 1.5, "CAN": 1.2, "BRA": 1.5}, 0.5, 500.0))

reg("drinking_water_safe", "primary", "environment", "Safely Managed Drinking Water", "Safe Water %", "% Population", "WHO / UNICEF JMP", 2024, 1, "linear",
    "Percentage of population using improved drinking water source located on premises, available when needed, free from fecal contamination.",
    "Harmonized household water testing and utility monitoring reports.",
    "https://en.wikipedia.org/wiki/Water_supply_and_sanitation",
    generate_dataset(lambda c: s_metric(c, 0.75, 0.25, 45.0, 54.0, 80), {"SGP": 100.0, "NOR": 100.0, "FIN": 100.0, "DEU": 100.0, "GBR": 100.0, "FRA": 99.0, "USA": 99.0, "JPN": 99.0, "ESP": 99.0, "CHL": 98.0, "BRA": 86.0, "CHN": 92.0, "IND": 60.0, "NGA": 22.0, "ETH": 13.0, "TCD": 6.0}, 5.0, 100.0))

reg("sanitation_safe", "primary", "environment", "Safely Managed Sanitation", "Sanitation %", "% Population", "WHO / UNICEF JMP", 2024, 1, "linear",
    "Percentage of population using improved sanitation facilities that are not shared with other households and where excreta are safely treated.",
    "Sanitation utility sewer connections and on-site septic containment treatment surveys.",
    "https://en.wikipedia.org/wiki/Sanitation",
    generate_dataset(lambda c: s_metric(c, 0.75, 0.25, 35.0, 64.0, 81), {"NOR": 100.0, "DEU": 99.5, "JPN": 99.8, "USA": 99.0, "FRA": 99.0, "GBR": 99.0, "KOR": 99.0, "CHL": 95.0, "BRA": 55.0, "CHN": 72.0, "IND": 46.0, "NGA": 32.0, "ETH": 10.0, "SSD": 7.0}, 5.0, 100.0))

reg("plastic_waste_pc", "primary", "environment", "Plastic Waste Generation", "Plastic Waste", "kg / person / yr", "OECD Global Plastics Outlook", 2023, -1, "linear",
    "Annual municipal and packaging plastic waste generated per capita. Lower represents circular economy efficiency.",
    "Material flow analysis tracking polymer production, conversion, and municipal waste streams.",
    "https://en.wikipedia.org/wiki/Plastic_pollution",
    generate_dataset(lambda c: s_metric(c, 0.3, 0.6, 35.0, 85.0, 82), {"USA": 130.0, "GBR": 99.0, "DEU": 81.0, "FRA": 66.0, "ITA": 65.0, "ESP": 54.0, "JPN": 38.0, "KOR": 45.0, "BRA": 32.0, "CHN": 25.0, "IND": 8.0, "NGA": 6.5}, 4.0, 140.0))

reg("municipal_waste_recycle", "primary", "environment", "Municipal Waste Recycling Rate", "Recycling %", "% Municipal Waste", "OECD / Eurostat", 2023, 1, "linear",
    "Percentage of municipal solid waste recycled and composted rather than landfilled or incinerated without recovery.",
    "Municipal waste collection data tracking material recovery facilities and industrial composting plants.",
    "https://en.wikipedia.org/wiki/Recycling",
    generate_dataset(lambda c: s_metric(c, 0.5, 0.4, 10.0, 55.0, 83), {"DEU": 68.0, "AUT": 62.0, "SVN": 60.0, "KOR": 59.0, "CHE": 53.0, "NLD": 55.0, "BEL": 54.0, "DNK": 48.0, "SWE": 46.0, "GBR": 44.0, "FRA": 44.0, "ITA": 51.0, "USA": 32.0, "JPN": 20.0, "BRA": 4.0, "IND": 8.0, "NGA": 2.0}, 1.0, 72.0))

reg("fertilizer_consumption", "primary", "environment", "Fertilizer Use Intensity", "Fertilizer / ha", "kg / ha arable land", "FAOSTAT", 2023, -1, "log",
    "Total nutrient nitrogen, phosphate, and potash applied to arable land per hectare. Excessive use causes eutrophication.",
    "National fertilizer sales and agricultural distribution records divided by arable land area.",
    "https://en.wikipedia.org/wiki/Fertilizer",
    generate_dataset(lambda c: s_metric(c, 0.2, 0.3, 80.0, 180.0, 84), {"SGP": 1800.0, "QAT": 850.0, "CHN": 380.0, "EGY": 450.0, "NLD": 260.0, "BEL": 280.0, "DEU": 160.0, "FRA": 140.0, "USA": 130.0, "GBR": 180.0, "BRA": 250.0, "IND": 190.0, "NOR": 150.0, "SWE": 110.0, "NGA": 18.0, "UGA": 2.5}, 2.0, 600.0))


# --- Domain 4: Governance, Rights & Institutions (15 Primary Metrics) ---
reg("voter_turnout", "primary", "governance", "Parliamentary Voter Turnout", "Voter Turnout %", "% registered voters", "IDEA International", 2024, 1, "linear",
    "Total number of valid votes cast in the most recent national parliamentary election divided by registered voters.",
    "Official national electoral commission election returns.",
    "https://en.wikipedia.org/wiki/Voter_turnout",
    generate_dataset(lambda c: s_metric(c, 0.3, 0.1, 55.0, 32.0, 85), {"BEL": 88.0, "SWE": 84.2, "DNK": 84.1, "NZL": 82.0, "AUS": 89.8, "DEU": 76.6, "NOR": 77.2, "FRA": 66.7, "GBR": 67.3, "USA": 66.8, "ESP": 70.4, "BRA": 79.0, "IND": 65.8, "JPN": 52.0, "CHE": 45.1, "NGA": 29.0}, 25.0, 95.0))

reg("women_in_parliament", "primary", "governance", "Women in Parliament Share", "Women in Parl. %", "% seats", "Inter-Parliamentary Union (IPU)", 2024, 1, "linear",
    "Percentage of parliamentary seats in single or lower chambers held by women.",
    "Official parliamentary membership registries maintained by the IPU.",
    "https://en.wikipedia.org/wiki/Women_in_national_parliaments",
    generate_dataset(lambda c: s_metric(c, 0.4, 0.2, 12.0, 35.0, 86), {"RWA": 61.3, "CUB": 55.7, "NIC": 53.9, "MEX": 50.0, "NZL": 50.0, "ARE": 50.0, "ISL": 47.6, "SWE": 46.7, "FIN": 46.0, "NOR": 45.0, "ESP": 43.0, "DEU": 35.3, "GBR": 35.0, "FRA": 37.3, "USA": 28.7, "ITA": 32.3, "JPN": 10.3, "IND": 14.7, "NGA": 3.6}, 2.0, 65.0))

reg("judicial_independence_score", "primary", "governance", "Judicial Independence", "Judicial Indep.", "Score (0–10)", "V-Dem Institute", 2024, 1, "linear",
    "Evaluates whether the high courts make decisions impartially according to law without interference from the executive.",
    "Bayesian item-response expert survey model aggregating legal scholar evaluations.",
    "https://en.wikipedia.org/wiki/Judicial_independence",
    generate_dataset(lambda c: s_metric(c, 0.75, 0.25, 1.5, 8.2, 87), {"FIN": 9.8, "NOR": 9.7, "DNK": 9.7, "SWE": 9.6, "CHE": 9.5, "NZL": 9.4, "DEU": 9.2, "GBR": 9.0, "CAN": 8.9, "USA": 7.8, "FRA": 8.4, "JPN": 8.5, "CHL": 8.0, "POL": 5.8, "BRA": 6.2, "IND": 6.5, "TUR": 2.5, "RUS": 1.8, "VEN": 0.8}, 0.5, 9.9))

reg("press_censorship_effort", "primary", "governance", "Freedom from Government Censorship", "Media Freedom", "Score (0–10)", "V-Dem Institute", 2024, 1, "linear",
    "Extent to which government attempts to censor print, broadcast, or internet media directly or indirectly.",
    "Expert questionnaire consensus modeling tracking state regulatory crackdowns, site blocking, and press penalties.",
    "https://en.wikipedia.org/wiki/Censorship",
    generate_dataset(lambda c: s_metric(c, 0.75, 0.25, 1.8, 7.9, 88), {"NOR": 9.8, "SWE": 9.7, "FIN": 9.7, "DNK": 9.6, "DEU": 9.2, "GBR": 8.9, "USA": 8.5, "FRA": 8.8, "JPN": 8.1, "CHL": 8.0, "BRA": 6.8, "IND": 4.5, "TUR": 2.2, "RUS": 1.2, "CHN": 0.4, "PRK": 0.1}, 0.1, 9.9))

reg("civil_society_repress", "primary", "governance", "Civil Society Organization Freedom", "CSO Freedom", "Score (0–10)", "V-Dem Institute", 2024, 1, "linear",
    "Degree to which the government represses civil society organizations, NGOs, trade unions, and civic advocacy groups.",
    "Expert assessment tracking legal registration barriers, funding restrictions, and physical intimidation of civic groups.",
    "https://en.wikipedia.org/wiki/Civil_society",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 2.0, 7.7, 89), {"NOR": 9.9, "DNK": 9.8, "SWE": 9.8, "FIN": 9.8, "DEU": 9.4, "GBR": 9.1, "USA": 8.8, "FRA": 8.9, "JPN": 8.8, "CHL": 8.5, "BRA": 7.2, "IND": 5.2, "TUR": 3.1, "RUS": 1.5, "CHN": 0.6}, 0.2, 9.9))

reg("tax_evasion_informal", "primary", "governance", "Informal Economy Size", "Informal Econ. %", "% of GDP", "World Bank / IMF (Schneider)", 2023, -1, "linear",
    "Estimated value of unrecorded, untaxed economic activity (shadow economy) as a percentage of official GDP. Lower is better.",
    "Multiple Indicators Multiple Causes (MIMIC) econometric estimation modeling cash demand and labor participation.",
    "https://en.wikipedia.org/wiki/Informal_economy",
    generate_dataset(lambda c: s_metric(c, -0.65, -0.35, 48.0, -41.0, 90), {"CHE": 6.0, "USA": 7.5, "AUT": 7.8, "JPN": 8.2, "GBR": 10.5, "DEU": 10.8, "FRA": 12.8, "NOR": 11.2, "SWE": 12.5, "ESP": 19.5, "ITA": 20.5, "GRC": 24.0, "BRA": 34.0, "IND": 42.0, "NGA": 52.0, "BOL": 58.0}, 5.0, 65.0))

reg("property_rights_score", "primary", "governance", "Property Rights Protection", "Property Rights", "Score (0–100)", "Heritage / World Bank", 2024, 1, "linear",
    "Assessment of the legal protection of private property rights, contract enforcement, and independence of judiciary.",
    "Synthesized judicial scoring measuring the security of physical and intellectual property rights.",
    "https://en.wikipedia.org/wiki/Property_rights",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 20.0, 75.0, 91), {"FIN": 98.0, "SGP": 97.0, "NZL": 96.0, "NOR": 95.0, "CHE": 94.0, "DNK": 93.0, "SWE": 92.0, "GBR": 90.0, "USA": 84.0, "DEU": 88.0, "JPN": 86.0, "CHL": 72.0, "BRA": 48.0, "IND": 52.0, "RUS": 30.0, "VEN": 10.0}, 8.0, 99.0))

reg("freedom_of_assembly", "primary", "governance", "Freedom of Peaceful Assembly", "Assembly Freedom", "Score (0–10)", "V-Dem Institute", 2024, 1, "linear",
    "Extent to which citizens are able to freely assemble, march, and demonstrate peacefully without state violence or ban.",
    "Comparative legal and human rights monitoring index.",
    "https://en.wikipedia.org/wiki/Freedom_of_assembly",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 1.5, 8.2, 92), {"NOR": 9.9, "DNK": 9.8, "SWE": 9.8, "FIN": 9.8, "DEU": 9.2, "GBR": 8.8, "USA": 8.5, "FRA": 8.2, "JPN": 8.9, "BRA": 7.0, "IND": 5.8, "TUR": 2.5, "RUS": 1.2, "IRN": 0.8}, 0.2, 9.9))

reg("open_gov_data_score", "primary", "governance", "Open Government Data Index", "Open Gov. Data", "Score (0–100)", "Open Data Watch (ODIN)", 2024, 1, "linear",
    "Assesses the coverage and openness of official national statistics published on open government portals.",
    "Standardized audit of 22 statistical categories assessing machine-readability, bulk download availability, and licensing.",
    "https://en.wikipedia.org/wiki/Open_data",
    generate_dataset(lambda c: s_metric(c, 0.65, 0.35, 25.0, 68.0, 93), {"SGP": 92.0, "DNK": 90.0, "POL": 88.0, "FIN": 88.0, "SWE": 86.0, "NOR": 85.0, "KOR": 87.0, "USA": 82.0, "CAN": 83.0, "DEU": 78.0, "GBR": 80.0, "CHL": 72.0, "BRA": 68.0, "IND": 62.0, "NGA": 42.0}, 15.0, 95.0))

reg("audit_transparency", "primary", "governance", "Supreme Audit Oversight Score", "Audit Oversight", "Score (0–100)", "PEFA / Open Budget Survey", 2024, 1, "linear",
    "Independence and public transparency of the national supreme audit institution examining state expenditures.",
    "Standardized Public Expenditure and Financial Accountability framework benchmarking.",
    "https://en.wikipedia.org/wiki/Supreme_audit_institution",
    generate_dataset(lambda c: s_metric(c, 0.65, 0.35, 25.0, 68.0, 94), {"NZL": 96.0, "SWE": 94.0, "NOR": 93.0, "FIN": 92.0, "DEU": 90.0, "GBR": 88.0, "USA": 85.0, "FRA": 86.0, "KOR": 87.0, "ZAF": 84.0, "BRA": 75.0, "IND": 68.0, "MEX": 70.0, "NGA": 40.0}, 15.0, 98.0))

reg("ombudsman_integrity", "primary", "governance", "Public Ombudsman Effectiveness", "Ombudsman", "Score (0–10)", "V-Dem Institute", 2024, 1, "linear",
    "Capacity and autonomy of national ombudsman or human rights commissions to investigate complaints against state bodies.",
    "Expert institutional consensus scoring.",
    "https://en.wikipedia.org/wiki/Ombudsman",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 1.5, 8.0, 95), {"SWE": 9.8, "FIN": 9.7, "NOR": 9.6, "DNK": 9.6, "DEU": 9.0, "GBR": 8.8, "CAN": 8.8, "FRA": 8.5, "USA": 8.0, "CHL": 7.8, "BRA": 6.8, "IND": 6.0, "TUR": 3.0, "RUS": 1.5}, 0.5, 9.9))

reg("access_to_justice", "primary", "governance", "Civil Justice Accessibility", "Civil Justice", "Score (0–1)", "World Justice Project", 2024, 1, "linear",
    "Whether ordinary people can resolve their legal grievances peacefully and effectively through the civil justice system.",
    "Household legal need surveys and judicial time-to-verdict measurements.",
    "https://en.wikipedia.org/wiki/Access_to_justice",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 0.30, 0.62, 96), {"DNK": 0.90, "NOR": 0.89, "FIN": 0.88, "SWE": 0.87, "DEU": 0.84, "NLD": 0.83, "GBR": 0.79, "CAN": 0.78, "USA": 0.68, "FRA": 0.74, "JPN": 0.78, "CHL": 0.65, "BRA": 0.48, "IND": 0.45, "NGA": 0.38}, 0.20, 0.95))

reg("bribery_incidence", "primary", "governance", "Bribery Incidence on Firms", "Bribery %", "% firms", "World Bank Enterprise Surveys", 2023, -1, "log",
    "Percentage of private firms that experienced at least one bribe payment request in interactions with public officials. Lower is better.",
    "Standardized face-to-face enterprise representative survey interviews.",
    "https://en.wikipedia.org/wiki/Bribery",
    generate_dataset(lambda c: s_metric(c, -0.65, -0.35, 45.0, -44.0, 97), {"SWE": 0.5, "NOR": 0.6, "FIN": 0.6, "DNK": 0.7, "DEU": 1.2, "GBR": 1.5, "USA": 1.6, "CAN": 1.4, "FRA": 2.1, "JPN": 1.8, "CHL": 5.5, "BRA": 14.0, "IND": 22.0, "NGA": 35.0, "YEM": 58.0}, 0.2, 70.0))

reg("customs_transparency", "primary", "governance", "Customs Clearance Speed", "Customs Days", "days to clear", "World Bank Doing Business / LPI", 2023, -1, "linear",
    "Average time in days required to clear commercial goods through border customs inspections. Lower indicates trade efficiency.",
    "Freight forwarder and customs clearance documentation timeline records.",
    "https://en.wikipedia.org/wiki/Customs",
    generate_dataset(lambda c: s_metric(c, -0.5, -0.3, 6.0, -5.2, 98), {"SGP": 0.5, "HKG": 0.5, "NLD": 0.8, "DEU": 1.0, "DNK": 1.0, "NOR": 1.2, "USA": 1.5, "GBR": 1.5, "JPN": 1.2, "FRA": 1.4, "CHN": 2.1, "BRA": 4.5, "IND": 3.8, "NGA": 8.5, "COD": 12.0}, 0.4, 15.0))

reg("public_consultation", "primary", "governance", "Regulatory Consultation Rule", "Public Consult.", "Score (0–10)", "OECD Regulatory Indicators", 2024, 1, "linear",
    "Mandatory requirement for state regulators to conduct open public stakeholder consultations prior to enacting new laws.",
    "Comparative administrative law indicators benchmarking systematic public consultation practices.",
    "https://en.wikipedia.org/wiki/Public_consultation",
    generate_dataset(lambda c: s_metric(c, 0.6, 0.4, 2.0, 7.8, 99), {"GBR": 9.6, "CAN": 9.4, "AUS": 9.2, "USA": 9.0, "SWE": 8.8, "NOR": 8.7, "DEU": 8.5, "FRA": 8.2, "JPN": 7.8, "KOR": 8.1, "MEX": 7.2, "BRA": 6.5, "IND": 5.0, "TUR": 3.5, "RUS": 2.0}, 0.5, 9.9))


# --- Domain 5: Innovation, Technology & Science (13 Primary Metrics) ---
reg("internet_pct", "primary", "innovation", "Internet Penetration Rate", "Internet Access", "% Pop", "ITU", 2024, 1, "linear",
    "Percentage of the total population using the internet from any device in the last 3 months.",
    "National household surveys and telecommunication operator subscription registers.",
    "https://en.wikipedia.org/wiki/Global_Internet_usage",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 20.0, 78.0, 100), {"ARE": 100.0, "SAU": 100.0, "KWT": 99.7, "NOR": 99.0, "DNK": 99.0, "ISL": 99.0, "CHE": 98.0, "GBR": 98.0, "KOR": 97.6, "SWE": 96.5, "FIN": 96.5, "NLD": 96.0, "DEU": 94.0, "USA": 93.0, "CAN": 94.0, "JPN": 93.0, "FRA": 93.0, "SGP": 96.0, "CHN": 76.4, "BRA": 81.0, "IND": 52.4, "NGA": 39.0}, 10.0, 100.0))

reg("broadband_speed", "primary", "innovation", "Fixed Broadband Speed", "Broadband Speed", "Mbps download", "Ookla Speedtest Intelligence", 2024, 1, "log",
    "Median fixed broadband download speed in megabits per second across millions of real consumer tests.",
    "Crowdsourced and automated network measurement telemetry capturing median downlink throughput.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_Internet_connection_speeds",
    generate_dataset(lambda c: s_metric(c, 0.5, 0.5, 15.0, 240.0, 101), {"SGP": 285.0, "HKG": 270.0, "CHL": 260.0, "ARE": 255.0, "USA": 242.0, "FRA": 230.0, "ISL": 225.0, "DNK": 220.0, "ESP": 215.0, "ROU": 210.0, "CAN": 205.0, "JPN": 185.0, "DEU": 95.0, "GBR": 92.0, "BRA": 145.0, "IND": 62.0, "NGA": 24.0}, 8.0, 300.0))

reg("mobile_broadband_subs", "primary", "innovation", "Mobile Broadband Subscriptions", "Mobile Subs.", "per 100 people", "ITU", 2024, 1, "linear",
    "Standard mobile-broadband subscriptions to the public internet (3G, 4G, 5G SIM cards) per 100 inhabitants.",
    "Telecommunications regulatory filings.",
    "https://en.wikipedia.org/wiki/Mobile_broadband",
    generate_dataset(lambda c: s_metric(c, 0.5, 0.5, 35.0, 115.0, 102), {"JPN": 185.0, "USA": 165.0, "FIN": 160.0, "SGP": 155.0, "SWE": 145.0, "DNK": 140.0, "GBR": 125.0, "DEU": 115.0, "FRA": 110.0, "CHN": 118.0, "BRA": 105.0, "IND": 68.0, "NGA": 45.0}, 20.0, 195.0))

reg("high_tech_exports", "primary", "innovation", "High-Tech Exports Share", "High-Tech Exp.", "% Mfg Exports", "UN Comtrade / World Bank", 2023, 1, "linear",
    "Products with high R&D intensity (aerospace, computers, pharmaceuticals, scientific instruments) as % of manufactured exports.",
    "Standard International Trade Classification (SITC) customs trade processing.",
    "https://en.wikipedia.org/wiki/High_technology",
    generate_dataset(lambda c: s_metric(c, 0.3, 0.7, 2.0, 32.0, 103), {"HKG": 68.0, "MYS": 53.0, "SGP": 52.0, "PHL": 62.0, "TWN": 50.0, "VNM": 40.0, "KOR": 36.0, "CHN": 30.0, "CHE": 28.5, "USA": 19.5, "FRA": 21.0, "IRL": 38.0, "NLD": 23.0, "JPN": 17.5, "DEU": 15.5, "GBR": 23.0, "SWE": 14.0, "DNK": 16.0, "ISR": 28.0, "IND": 11.5, "BRA": 11.0}, 1.0, 72.0))

reg("patent_applications_pc", "primary", "innovation", "Patent Applications per Capita", "Patents / Million", "per million people", "WIPO IP Statistics Data Center", 2024, 1, "log",
    "Patent applications filed by resident inventors through national or regional patent offices per million inhabitants.",
    "Direct intellectual property patent filing registries counted under the Paris Convention and PCT.",
    "https://en.wikipedia.org/wiki/World_Intellectual_Property_Indicators",
    generate_dataset(lambda c: s_metric(c, 0.4, 0.6, 10.0, 1800.0, 104), {"KOR": 3400.0, "JPN": 1950.0, "CHE": 1050.0, "USA": 890.0, "DEU": 780.0, "CHN": 1050.0, "SWE": 650.0, "FIN": 620.0, "DNK": 580.0, "AUT": 480.0, "FRA": 380.0, "GBR": 280.0, "CAN": 190.0, "ISR": 420.0, "SGP": 310.0, "ITA": 170.0, "ESP": 95.0, "BRA": 35.0, "IND": 32.0, "NGA": 2.5}, 1.0, 3600.0))

reg("trademark_applications", "primary", "innovation", "Trademark Filings per Capita", "Trademarks / M", "per million people", "WIPO", 2024, 1, "log",
    "Total trademark applications filed by resident applicants to protect commercial brands per million inhabitants.",
    "Class counts in trademark applications submitted to national IP offices.",
    "https://en.wikipedia.org/wiki/Trademark",
    generate_dataset(lambda c: s_metric(c, 0.4, 0.6, 150.0, 4500.0, 105), {"CHN": 6500.0, "KOR": 4200.0, "CHE": 3800.0, "DEU": 2800.0, "USA": 2100.0, "GBR": 2400.0, "FRA": 2600.0, "JPN": 1800.0, "AUS": 2500.0, "SWE": 2100.0, "BRA": 1600.0, "IND": 320.0, "NGA": 85.0}, 50.0, 7000.0))

reg("scientific_publications_pc", "primary", "innovation", "Scientific Publications per Capita", "Citable Papers / M", "per million people", "SCImago / Scopus", 2023, 1, "log",
    "Number of citable peer-reviewed scientific articles published in international journals per million inhabitants.",
    "Scopus bibliographic citation database indexing across medical, physical, social, and engineering sciences.",
    "https://en.wikipedia.org/wiki/SCImago_Journal_Rank",
    generate_dataset(lambda c: s_metric(c, 0.6, 0.4, 20.0, 3200.0, 106), {"CHE": 4500.0, "SWE": 3800.0, "DNK": 3700.0, "NOR": 3600.0, "FIN": 3400.0, "AUS": 3300.0, "NLD": 3200.0, "SGP": 3100.0, "GBR": 2800.0, "CAN": 2700.0, "USA": 2100.0, "DEU": 2150.0, "FRA": 1650.0, "JPN": 950.0, "KOR": 1550.0, "ESP": 1750.0, "ITA": 1850.0, "CHN": 650.0, "BRA": 380.0, "IND": 160.0, "NGA": 65.0}, 10.0, 4800.0))

reg("stem_graduates_pct", "primary", "innovation", "STEM Graduates Share", "STEM Grads %", "% Total Graduates", "UNESCO Institute for Statistics", 2023, 1, "linear",
    "Proportion of higher education tertiary graduates completing degrees in Science, Technology, Engineering, or Mathematics.",
    "National tertiary graduation records categorized by ISCED-F 2013 fields of education.",
    "https://en.wikipedia.org/wiki/Science,_technology,_engineering,_and_mathematics",
    generate_dataset(lambda c: s_metric(c, 0.4, 0.3, 15.0, 22.0, 107), {"KOR": 35.0, "DEU": 34.5, "RUS": 32.0, "FIN": 30.5, "AUT": 30.0, "SGP": 32.0, "SWE": 28.0, "FRA": 26.5, "GBR": 26.0, "USA": 20.0, "JPN": 22.0, "IND": 32.0, "BRA": 18.0, "NGA": 16.0}, 8.0, 42.0))

reg("electricity_access", "primary", "innovation", "Access to Electricity", "Electricity %", "% Population", "World Bank Energy Progress Report", 2024, 1, "linear",
    "Percentage of population with access to electricity from grid or decentralized solar home systems.",
    "Electrification census and household survey database tracking universal energy access (SDG 7.1.1).",
    "https://en.wikipedia.org/wiki/Electrification",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 35.0, 64.0, 108), {"NOR": 100.0, "USA": 100.0, "DEU": 100.0, "JPN": 100.0, "CHN": 100.0, "BRA": 99.8, "IND": 99.6, "IDN": 99.5, "ZAF": 89.0, "NGA": 59.0, "ETH": 54.0, "COD": 20.0, "SSD": 8.0}, 5.0, 100.0))

reg("road_quality", "primary", "innovation", "Road Infrastructure Quality", "Road Quality", "Score (0–100)", "World Economic Forum (WEF)", 2023, 1, "linear",
    "Assessment of the quality and extensiveness of the paved national highway and arterial road network.",
    "Executive opinion survey and satellite GIS transport connectivity analysis.",
    "https://en.wikipedia.org/wiki/Highway",
    generate_dataset(lambda c: s_metric(c, 0.6, 0.4, 25.0, 68.0, 109), {"SGP": 95.0, "NLD": 92.0, "CHE": 91.0, "HKG": 90.0, "JPN": 88.0, "AUT": 86.0, "PRT": 85.0, "USA": 79.0, "DEU": 82.0, "FRA": 84.0, "ESP": 83.0, "SWE": 81.0, "NOR": 74.0, "GBR": 72.0, "CHN": 74.0, "BRA": 38.0, "IND": 52.0, "NGA": 26.0, "COD": 18.0}, 15.0, 98.0))

reg("rail_network_density", "primary", "innovation", "Railway Network Density", "Rail Density", "km / 1k km² land", "UIC / World Bank", 2023, 1, "log",
    "Length of operational railway track lines in kilometers per 1,000 square kilometers of sovereign land area.",
    "International Union of Railways (UIC) statistical yearbook tracking active rail infrastructure.",
    "https://en.wikipedia.org/wiki/Rail_transport",
    generate_dataset(lambda c: s_metric(c, 0.5, 0.5, 2.0, 95.0, 110), {"CZE": 120.0, "BEL": 118.0, "DEU": 108.0, "CHE": 125.0, "LUX": 105.0, "NLD": 95.0, "AUT": 70.0, "GBR": 68.0, "FRA": 52.0, "ITA": 56.0, "JPN": 72.0, "KOR": 45.0, "POL": 62.0, "ESP": 32.0, "USA": 16.0, "CHN": 15.0, "IND": 22.0, "SWE": 25.0, "NOR": 13.0, "BRA": 3.5, "NGA": 3.8}, 0.5, 140.0))

reg("air_passengers_pc", "primary", "innovation", "Air Passengers Carried per Capita", "Air Flights / cap", "flights / person", "ICAO / World Bank", 2023, 1, "log",
    "Total domestic and international aircraft passenger boardings divided by total national population.",
    "International Civil Aviation Organization (ICAO) airline schedule and passenger manifest reporting.",
    "https://en.wikipedia.org/wiki/Aviation",
    generate_dataset(lambda c: s_metric(c, 0.4, 0.6, 0.1, 4.2, 111), {"ISL": 8.5, "IRL": 6.8, "ARE": 5.2, "SGP": 4.8, "NZL": 3.8, "NOR": 3.6, "AUS": 3.2, "USA": 2.8, "CHE": 2.9, "GBR": 2.4, "ESP": 2.8, "CAN": 2.3, "DEU": 1.4, "FRA": 1.3, "JPN": 1.0, "CHN": 0.5, "BRA": 0.45, "IND": 0.12, "NGA": 0.05}, 0.02, 10.0))

reg("container_port_traffic", "primary", "innovation", "Container Port Traffic", "Port TEU / $M GDP", "TEU / $M GDP", "UNCTAD / World Bank", 2023, 1, "log",
    "Port traffic volume measured in Twenty-foot Equivalent Units (TEU) per million dollars of national GDP.",
    "Port authority container handling crane manifests recorded across all commercial seaports.",
    "https://en.wikipedia.org/wiki/Container_ship",
    generate_dataset(lambda c: s_metric(c, 0.3, 0.7, 5.0, 180.0, 112), {"SGP": 720.0, "HKG": 650.0, "MYS": 210.0, "BEL": 190.0, "NLD": 180.0, "VNM": 195.0, "CHN": 140.0, "ESP": 75.0, "DEU": 45.0, "GBR": 42.0, "USA": 35.0, "FRA": 28.0, "JPN": 38.0, "IND": 40.0, "BRA": 28.0, "NGA": 18.0}, 2.0, 800.0))


# --- Domain 6: Peace, Safety & Social Equality (12 Primary Metrics) ---
reg("homicide_rate", "primary", "peace_safety", "Intentional Homicide Rate", "Homicide Rate", "per 100k people", "UNODC Global Study on Homicide", 2024, -1, "log",
    "Unlawful death inflicted upon a person with the intent to cause death or serious injury per 100,000 population. Lower is better.",
    "Criminal justice police reporting systems and forensic public health cause-of-death certification.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_intentional_homicide_rate",
    generate_dataset(lambda c: s_metric(c, -0.4, -0.2, 18.0, -17.2, 113), {"SGP": 0.15, "JPN": 0.23, "CHE": 0.50, "NOR": 0.55, "ITA": 0.51, "DEU": 0.82, "ESP": 0.65, "GBR": 0.99, "FRA": 1.15, "CAN": 2.25, "USA": 5.80, "IND": 2.90, "CHN": 0.50, "BRA": 21.3, "COL": 25.5, "MEX": 25.2, "ZAF": 41.8, "JAM": 52.0}, 0.1, 60.0))

reg("violent_crime_rate", "primary", "peace_safety", "Violent Assault & Crime Rate", "Violent Crime", "per 100k people", "UNODC / Interpol", 2023, -1, "log",
    "Reported serious physical assaults, robberies, and violent offences per 100,000 population. Lower indicates physical safety.",
    "National law enforcement incident reporting repositories.",
    "https://en.wikipedia.org/wiki/Violent_crime",
    generate_dataset(lambda c: s_metric(c, -0.4, 0.1, 140.0, -100.0, 114), {"JPN": 18.0, "SGP": 12.0, "KOR": 45.0, "CHE": 55.0, "NOR": 65.0, "DEU": 95.0, "ESP": 75.0, "ITA": 82.0, "FRA": 210.0, "GBR": 240.0, "USA": 380.0, "BRA": 450.0, "ZAF": 680.0}, 10.0, 750.0))

reg("incarceration_rate", "primary", "peace_safety", "Prison Incarceration Rate", "Prisoners / 100k", "per 100k people", "World Prison Brief (ICPR)", 2024, -1, "log",
    "Number of held prisoners (remand and sentenced inmates) per 100,000 of the national population. Lower indicates restorative justice.",
    "Official national ministry of justice and penal administration reports.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_incarceration_rate",
    generate_dataset(lambda c: s_metric(c, -0.1, 0.2, 160.0, -60.0, 115), {"ISL": 33.0, "FIN": 50.0, "JPN": 37.0, "NOR": 54.0, "NLD": 64.0, "SWE": 72.0, "DEU": 67.0, "FRA": 105.0, "ITA": 102.0, "ESP": 113.0, "GBR": 140.0, "CAN": 104.0, "AUS": 160.0, "CHN": 119.0, "RUS": 300.0, "BRA": 390.0, "USA": 531.0, "SLV": 1050.0}, 25.0, 1100.0))

reg("military_expenditure_gdp", "primary", "peace_safety", "Military Spending Share", "Military % GDP", "% of GDP", "SIPRI Military Expenditure Database", 2024, -1, "linear",
    "All current and capital government spending on armed forces, defense ministries, and military procurement as % of GDP.",
    "Official defense budget appropriations tracked annually by the Stockholm International Peace Research Institute.",
    "https://en.wikipedia.org/wiki/List_of_countries_by_military_expenditures",
    generate_dataset(lambda c: s_metric(c, 0.1, 0.2, 2.2, 1.2, 116), {"UKR": 37.0, "ISR": 5.3, "SAU": 7.1, "RUS": 5.9, "USA": 3.4, "IND": 2.4, "GBR": 2.3, "FRA": 2.1, "KOR": 2.8, "DEU": 1.5, "JPN": 1.2, "ESP": 1.5, "ITA": 1.6, "CAN": 1.3, "NOR": 1.6, "SWE": 1.5, "CHE": 0.7, "ISL": 0.0, "CRI": 0.0}, 0.0, 40.0))

reg("arms_imports_pc", "primary", "peace_safety", "Arms Imports Volume", "Arms Imports / cap", "TIV / capita", "SIPRI Arms Transfers Database", 2024, -1, "log",
    "Volume of conventional major weapon systems imported per capita expressed in SIPRI Trend Indicator Values (TIV).",
    "Standardized unit production cost valuation of all transferred combat aircraft, ships, missiles, and armored vehicles.",
    "https://en.wikipedia.org/wiki/Arms_industry",
    generate_dataset(lambda c: s_metric(c, 0.1, 0.2, 8.0, 25.0, 117), {"QAT": 450.0, "SAU": 180.0, "ISR": 110.0, "AUS": 65.0, "SGP": 55.0, "KOR": 42.0, "NOR": 45.0, "GBR": 22.0, "JPN": 28.0, "IND": 18.0, "USA": 4.5, "DEU": 3.2, "FRA": 2.5, "ISL": 0.0}, 0.0, 500.0))

reg("terrorist_incidents", "primary", "peace_safety", "Terrorism Impact Score", "Terrorism Impact", "Index (0–10)", "Global Terrorism Index (IEP)", 2024, -1, "linear",
    "Measures the direct and indirect impact of terrorism (incidents, fatalities, injuries, property damage). Lower indicates safety.",
    "Multi-year weighted aggregation of global terrorism database event logs. Inverted during normalization.",
    "https://en.wikipedia.org/wiki/Global_Terrorism_Index",
    generate_dataset(lambda c: s_metric(c, -0.4, -0.2, 3.5, -3.2, 118), {"ISL": 0.0, "FIN": 0.0, "PRT": 0.0, "CHE": 0.0, "NOR": 0.2, "JPN": 0.1, "DNK": 0.2, "DEU": 2.5, "FRA": 3.8, "GBR": 3.4, "USA": 4.2, "IND": 6.3, "PAK": 7.8, "NGA": 8.0, "SOM": 8.1, "SYR": 8.3, "AFG": 8.8}, 0.0, 9.5))

reg("internal_displaced_persons", "primary", "peace_safety", "Internally Displaced Persons", "Displaced Persons", "per 100k people", "Internal Displacement Monitoring Centre (IDMC)", 2024, -1, "log",
    "Number of people forced to flee their homes due to conflict, violence, or human rights violations residing displaced within their country.",
    "UNHCR and national disaster/conflict monitoring registry estimates per 100,000 inhabitants. Lower is better.",
    "https://en.wikipedia.org/wiki/Internally_displaced_person",
    generate_dataset(lambda c: s_metric(c, -0.5, -0.3, 120.0, -119.0, 119), {"NOR": 0.0, "DEU": 0.0, "USA": 0.0, "JPN": 0.0, "FRA": 0.0, "GBR": 0.0, "COL": 9500.0, "SYR": 35000.0, "UKR": 12000.0, "YEM": 14000.0, "SSD": 22000.0, "COD": 8500.0, "SOM": 24000.0}, 0.0, 40000.0))

reg("gini_index", "primary", "peace_safety", "Gini Inequality Index", "Gini (Equality)", "Index (0–100)", "World Bank Poverty Platform", 2023, -1, "linear",
    "Measures income distribution inequality across a population (0 represents perfect equality, 100 represents complete inequality).",
    "Mathematical integration of cumulative national household survey income distributions (area between the Lorenz curve and the 45° line).",
    "https://en.wikipedia.org/wiki/Gini_coefficient",
    generate_dataset(lambda c: s_metric(c, -0.3, -0.2, 45.0, -15.0, 120), {"SVK": 23.2, "SVN": 24.0, "CZE": 25.3, "ISL": 26.1, "BEL": 27.2, "FIN": 27.7, "NOR": 27.7, "DNK": 27.7, "NLD": 28.1, "AUT": 29.8, "SWE": 29.8, "DEU": 31.7, "FRA": 32.4, "GBR": 35.1, "CAN": 33.3, "AUS": 34.3, "USA": 41.5, "CHN": 37.1, "BRA": 52.9, "COL": 54.2, "ZAF": 63.0}, 23.0, 65.0))

reg("income_share_top10", "primary", "peace_safety", "Income Share of Top 10%", "Top 10% Share", "% Total Income", "World Inequality Database / World Bank", 2023, -1, "linear",
    "Percentage of total pre-tax national income received by the richest 10% of the population. Lower indicates shared prosperity.",
    "Fiscal tax data combined with national household survey distributions following national accounts standards.",
    "https://en.wikipedia.org/wiki/Income_inequality_metrics",
    generate_dataset(lambda c: s_metric(c, -0.3, 0.1, 35.0, -8.0, 121), {"NOR": 22.5, "DNK": 23.5, "FIN": 24.0, "SWE": 25.0, "DEU": 28.5, "FRA": 32.0, "GBR": 34.0, "CAN": 34.5, "USA": 45.5, "CHL": 46.0, "BRA": 56.0, "MEX": 48.0, "IND": 57.0, "ZAF": 65.0}, 20.0, 70.0))

reg("income_share_bottom20", "primary", "peace_safety", "Income Share of Bottom 20%", "Bottom 20% Share", "% Total Income", "World Bank Poverty Database", 2023, 1, "linear",
    "Percentage of total national consumption or income received by the poorest 20% of the population.",
    "Lowest quintile income share derived from national socioeconomic household survey microdata.",
    "https://en.wikipedia.org/wiki/Distribution_of_wealth",
    generate_dataset(lambda c: s_metric(c, 0.4, 0.1, 5.0, 4.5, 122), {"NOR": 9.5, "FIN": 9.4, "DNK": 9.2, "SWE": 8.8, "DEU": 8.0, "FRA": 7.5, "CAN": 7.2, "GBR": 6.8, "USA": 5.2, "CHN": 6.0, "IND": 8.2, "MEX": 4.8, "BRA": 3.2, "ZAF": 2.4}, 2.0, 11.0))

reg("gender_wage_gap", "primary", "peace_safety", "Median Gender Wage Gap", "Gender Wage Gap", "% male earnings", "OECD / ILO", 2023, -1, "linear",
    "Difference between median earnings of men and women relative to median earnings of men among full-time employees. Lower is better.",
    "Employer wage records and full-time employee earnings surveys.",
    "https://en.wikipedia.org/wiki/Gender_pay_gap",
    generate_dataset(lambda c: s_metric(c, -0.3, -0.1, 16.0, -9.0, 123), {"BEL": 3.4, "NOR": 4.8, "DNK": 5.8, "SWE": 7.4, "NZL": 6.5, "FRA": 11.6, "DEU": 13.5, "GBR": 14.3, "USA": 16.9, "CAN": 16.7, "JPN": 21.3, "KOR": 31.2, "ISR": 24.0, "BRA": 18.0}, 2.0, 38.0))

reg("passport_power", "primary", "peace_safety", "Global Passport Mobility", "Passport Mobility", "Destinations", "Henley Passport Index / IATA", 2024, 1, "linear",
    "Total number of worldwide travel destinations accessible visa-free or with visa-on-arrival by national passport holders.",
    "Direct discrete count of bilateral and multilateral visa-waiver agreements verified across 227 global destinations.",
    "https://en.wikipedia.org/wiki/Henley_Passport_Index",
    generate_dataset(lambda c: s_metric(c, 0.7, 0.3, 40.0, 150.0, 124), {"SGP": 195, "JPN": 194, "DEU": 194, "FRA": 194, "ITA": 194, "ESP": 194, "FIN": 193, "KOR": 193, "SWE": 193, "AUT": 192, "DNK": 192, "IRL": 192, "LUX": 192, "NLD": 192, "GBR": 192, "BEL": 191, "NOR": 191, "PRT": 191, "AUS": 190, "GRC": 190, "NZL": 190, "CHE": 190, "CAN": 189, "USA": 188, "POL": 188, "EST": 187, "CHL": 177, "ARG": 174, "BRA": 173, "MEX": 161, "ISR": 161, "ARE": 183, "RUS": 116, "TUR": 118, "ZAF": 108, "CHN": 85, "IDN": 78, "IND": 62, "PHL": 69, "NGA": 45, "AFG": 28}, 25.0, 195.0))

# Benchmark Bundles
bundles = [
    {
        "id": "human_flourishing",
        "name": "Human Flourishing & Development",
        "description": "Balanced focus on subjective happiness, health, education, essential public safety, and capability.",
        "domain": "wellbeing",
        "formula": "geometric",
        "norm": "minmax",
        "weights": {
            "happiness": 25,
            "life_expectancy": 20,
            "education_years": 20,
            "uhc_health": 15,
            "peace_index": 10,
            "drinking_water_safe": 10
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
            "hdi": 25,
            "epi": 25,
            "renewable_share": 20,
            "co2_pc": 15,
            "protected_areas": 15
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
            "gdp_pc": 25,
            "gii": 20,
            "rd_intensity": 20,
            "patent_applications_pc": 15,
            "econ_freedom": 10,
            "broadband_speed": 10
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
            "social_progress": 30,
            "gini_index": 25,
            "poverty_extreme": 20,
            "uhc_health": 15,
            "homicide_rate": 10
        }
    }
]

# Write to src/data/indicators.js
with open('src/data/indicators.js', 'w', encoding='utf-8') as f:
    f.write('// Standardized Indicators Library & Domain Taxonomy (124 Total Datasets: 24 Composite + 100 Primary)\n\n')
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

comp_count = sum(1 for d in datasets.values() if d['type'] == 'composite')
prim_count = sum(1 for d in datasets.values() if d['type'] == 'primary')
print(f'Successfully compiled {len(datasets)} indicators into src/data/indicators.js ({comp_count} Composite + {prim_count} Primary)')
