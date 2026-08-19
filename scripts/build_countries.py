import os
import json

os.makedirs('src/data', exist_ok=True)
os.makedirs('src/engine', exist_ok=True)
os.makedirs('src/modules', exist_ok=True)
os.makedirs('src/styles', exist_ok=True)

# 1. Countries database
countries_data = [
    # Nordics
    {"iso3": "NOR", "name": "Norway", "continent": "Europe", "region": "Northern Europe", "income": "High income", "blocs": ["nordic", "oecd", "europe"]},
    {"iso3": "DNK", "name": "Denmark", "continent": "Europe", "region": "Northern Europe", "income": "High income", "blocs": ["nordic", "eu", "oecd", "europe"]},
    {"iso3": "SWE", "name": "Sweden", "continent": "Europe", "region": "Northern Europe", "income": "High income", "blocs": ["nordic", "eu", "oecd", "europe"]},
    {"iso3": "FIN", "name": "Finland", "continent": "Europe", "region": "Northern Europe", "income": "High income", "blocs": ["nordic", "eu", "oecd", "europe"]},
    {"iso3": "ISL", "name": "Iceland", "continent": "Europe", "region": "Northern Europe", "income": "High income", "blocs": ["nordic", "oecd", "europe"]},

    # Western & Southern Europe
    {"iso3": "CHE", "name": "Switzerland", "continent": "Europe", "region": "Western Europe", "income": "High income", "blocs": ["oecd", "europe"]},
    {"iso3": "NLD", "name": "Netherlands", "continent": "Europe", "region": "Western Europe", "income": "High income", "blocs": ["eu", "oecd", "g20", "europe"]},
    {"iso3": "DEU", "name": "Germany", "continent": "Europe", "region": "Western Europe", "income": "High income", "blocs": ["eu", "oecd", "g7", "g20", "europe"]},
    {"iso3": "FRA", "name": "France", "continent": "Europe", "region": "Western Europe", "income": "High income", "blocs": ["eu", "oecd", "g7", "g20", "europe"]},
    {"iso3": "GBR", "name": "United Kingdom", "continent": "Europe", "region": "Northern Europe", "income": "High income", "blocs": ["oecd", "g7", "g20", "anglo", "europe"]},
    {"iso3": "IRL", "name": "Ireland", "continent": "Europe", "region": "Northern Europe", "income": "High income", "blocs": ["eu", "oecd", "europe"]},
    {"iso3": "BEL", "name": "Belgium", "continent": "Europe", "region": "Western Europe", "income": "High income", "blocs": ["eu", "oecd", "europe"]},
    {"iso3": "AUT", "name": "Austria", "continent": "Europe", "region": "Western Europe", "income": "High income", "blocs": ["eu", "oecd", "europe"]},
    {"iso3": "LUX", "name": "Luxembourg", "continent": "Europe", "region": "Western Europe", "income": "High income", "blocs": ["eu", "oecd", "europe"]},
    {"iso3": "ESP", "name": "Spain", "continent": "Europe", "region": "Southern Europe", "income": "High income", "blocs": ["eu", "oecd", "europe"]},
    {"iso3": "ITA", "name": "Italy", "continent": "Europe", "region": "Southern Europe", "income": "High income", "blocs": ["eu", "oecd", "g7", "g20", "europe"]},
    {"iso3": "PRT", "name": "Portugal", "continent": "Europe", "region": "Southern Europe", "income": "High income", "blocs": ["eu", "oecd", "europe"]},
    {"iso3": "GRC", "name": "Greece", "continent": "Europe", "region": "Southern Europe", "income": "High income", "blocs": ["eu", "oecd", "europe"]},
    {"iso3": "CYP", "name": "Cyprus", "continent": "Europe", "region": "Southern Europe", "income": "High income", "blocs": ["eu", "europe"]},
    {"iso3": "MLT", "name": "Malta", "continent": "Europe", "region": "Southern Europe", "income": "High income", "blocs": ["eu", "sids", "europe"]},

    # Eastern Europe & Baltics
    {"iso3": "EST", "name": "Estonia", "continent": "Europe", "region": "Northern Europe", "income": "High income", "blocs": ["eu", "oecd", "baltics", "europe"]},
    {"iso3": "LVA", "name": "Latvia", "continent": "Europe", "region": "Northern Europe", "income": "High income", "blocs": ["eu", "oecd", "baltics", "europe"]},
    {"iso3": "LTU", "name": "Lithuania", "continent": "Europe", "region": "Northern Europe", "income": "High income", "blocs": ["eu", "oecd", "baltics", "europe"]},
    {"iso3": "POL", "name": "Poland", "continent": "Europe", "region": "Eastern Europe", "income": "High income", "blocs": ["eu", "oecd", "europe"]},
    {"iso3": "CZE", "name": "Czechia", "continent": "Europe", "region": "Eastern Europe", "income": "High income", "blocs": ["eu", "oecd", "europe"]},
    {"iso3": "SVK", "name": "Slovakia", "continent": "Europe", "region": "Eastern Europe", "income": "High income", "blocs": ["eu", "oecd", "europe"]},
    {"iso3": "SVN", "name": "Slovenia", "continent": "Europe", "region": "Southern Europe", "income": "High income", "blocs": ["eu", "oecd", "europe"]},
    {"iso3": "HUN", "name": "Hungary", "continent": "Europe", "region": "Eastern Europe", "income": "High income", "blocs": ["eu", "oecd", "europe"]},
    {"iso3": "HRV", "name": "Croatia", "continent": "Europe", "region": "Southern Europe", "income": "High income", "blocs": ["eu", "oecd", "europe"]},
    {"iso3": "ROU", "name": "Romania", "continent": "Europe", "region": "Eastern Europe", "income": "High income", "blocs": ["eu", "europe"]},
    {"iso3": "BGR", "name": "Bulgaria", "continent": "Europe", "region": "Eastern Europe", "income": "Upper middle income", "blocs": ["eu", "europe"]},
    {"iso3": "SRB", "name": "Serbia", "continent": "Europe", "region": "Southern Europe", "income": "Upper middle income", "blocs": ["europe"]},
    {"iso3": "BIH", "name": "Bosnia and Herzegovina", "continent": "Europe", "region": "Southern Europe", "income": "Upper middle income", "blocs": ["europe"]},
    {"iso3": "ALB", "name": "Albania", "continent": "Europe", "region": "Southern Europe", "income": "Upper middle income", "blocs": ["europe"]},
    {"iso3": "MKD", "name": "North Macedonia", "continent": "Europe", "region": "Southern Europe", "income": "Upper middle income", "blocs": ["europe"]},
    {"iso3": "MNE", "name": "Montenegro", "continent": "Europe", "region": "Southern Europe", "income": "Upper middle income", "blocs": ["europe"]},
    {"iso3": "UKR", "name": "Ukraine", "continent": "Europe", "region": "Eastern Europe", "income": "Lower middle income", "blocs": ["europe"]},
    {"iso3": "MDA", "name": "Moldova", "continent": "Europe", "region": "Eastern Europe", "income": "Upper middle income", "blocs": ["europe"]},
    {"iso3": "BLR", "name": "Belarus", "continent": "Europe", "region": "Eastern Europe", "income": "Upper middle income", "blocs": ["europe"]},
    {"iso3": "RUS", "name": "Russia", "continent": "Europe", "region": "Eastern Europe", "income": "High income", "blocs": ["brics", "g20"]},

    # North America & Oceania
    {"iso3": "USA", "name": "United States", "continent": "North America", "region": "Northern America", "income": "High income", "blocs": ["oecd", "g7", "g20", "anglo"]},
    {"iso3": "CAN", "name": "Canada", "continent": "North America", "region": "Northern America", "income": "High income", "blocs": ["oecd", "g7", "g20", "anglo"]},
    {"iso3": "AUS", "name": "Australia", "continent": "Oceania", "region": "Australia and New Zealand", "income": "High income", "blocs": ["oecd", "g20", "anglo"]},
    {"iso3": "NZL", "name": "New Zealand", "continent": "Oceania", "region": "Australia and New Zealand", "income": "High income", "blocs": ["oecd", "anglo"]},

    # East & South-East Asia
    {"iso3": "JPN", "name": "Japan", "continent": "Asia", "region": "Eastern Asia", "income": "High income", "blocs": ["oecd", "g7", "g20", "east_asia"]},
    {"iso3": "KOR", "name": "South Korea", "continent": "Asia", "region": "Eastern Asia", "income": "High income", "blocs": ["oecd", "g20", "east_asia"]},
    {"iso3": "SGP", "name": "Singapore", "continent": "Asia", "region": "South-Eastern Asia", "income": "High income", "blocs": ["asean", "east_asia"]},
    {"iso3": "TWN", "name": "Taiwan", "continent": "Asia", "region": "Eastern Asia", "income": "High income", "blocs": ["east_asia"]},
    {"iso3": "HKG", "name": "Hong Kong", "continent": "Asia", "region": "Eastern Asia", "income": "High income", "blocs": ["east_asia"]},
    {"iso3": "CHN", "name": "China", "continent": "Asia", "region": "Eastern Asia", "income": "Upper middle income", "blocs": ["brics", "g20", "east_asia"]},
    {"iso3": "MYS", "name": "Malaysia", "continent": "Asia", "region": "South-Eastern Asia", "income": "Upper middle income", "blocs": ["asean"]},
    {"iso3": "THA", "name": "Thailand", "continent": "Asia", "region": "South-Eastern Asia", "income": "Upper middle income", "blocs": ["asean"]},
    {"iso3": "IDN", "name": "Indonesia", "continent": "Asia", "region": "South-Eastern Asia", "income": "Upper middle income", "blocs": ["asean", "g20"]},
    {"iso3": "VNM", "name": "Vietnam", "continent": "Asia", "region": "South-Eastern Asia", "income": "Lower middle income", "blocs": ["asean"]},
    {"iso3": "PHL", "name": "Philippines", "continent": "Asia", "region": "South-Eastern Asia", "income": "Lower middle income", "blocs": ["asean"]},
    {"iso3": "KHM", "name": "Cambodia", "continent": "Asia", "region": "South-Eastern Asia", "income": "Lower middle income", "blocs": ["asean"]},
    {"iso3": "LAO", "name": "Laos", "continent": "Asia", "region": "South-Eastern Asia", "income": "Lower middle income", "blocs": ["asean"]},
    {"iso3": "MMR", "name": "Myanmar", "continent": "Asia", "region": "South-Eastern Asia", "income": "Lower middle income", "blocs": ["asean"]},
    {"iso3": "BRN", "name": "Brunei", "continent": "Asia", "region": "South-Eastern Asia", "income": "High income", "blocs": ["asean"]},
    {"iso3": "TLS", "name": "Timor-Leste", "continent": "Asia", "region": "South-Eastern Asia", "income": "Lower middle income", "blocs": ["sids"]},
    {"iso3": "MNG", "name": "Mongolia", "continent": "Asia", "region": "Eastern Asia", "income": "Upper middle income", "blocs": []},

    # South Asia
    {"iso3": "IND", "name": "India", "continent": "Asia", "region": "Southern Asia", "income": "Lower middle income", "blocs": ["brics", "g20", "south_asia"]},
    {"iso3": "PAK", "name": "Pakistan", "continent": "Asia", "region": "Southern Asia", "income": "Lower middle income", "blocs": ["south_asia"]},
    {"iso3": "BGD", "name": "Bangladesh", "continent": "Asia", "region": "Southern Asia", "income": "Lower middle income", "blocs": ["south_asia"]},
    {"iso3": "LKA", "name": "Sri Lanka", "continent": "Asia", "region": "Southern Asia", "income": "Lower middle income", "blocs": ["south_asia"]},
    {"iso3": "NPL", "name": "Nepal", "continent": "Asia", "region": "Southern Asia", "income": "Lower middle income", "blocs": ["south_asia"]},
    {"iso3": "BTN", "name": "Bhutan", "continent": "Asia", "region": "Southern Asia", "income": "Lower middle income", "blocs": ["south_asia"]},
    {"iso3": "MDV", "name": "Maldives", "continent": "Asia", "region": "Southern Asia", "income": "Upper middle income", "blocs": ["sids", "south_asia"]},
    {"iso3": "AFG", "name": "Afghanistan", "continent": "Asia", "region": "Southern Asia", "income": "Low income", "blocs": ["south_asia"]},

    # Middle East & North Africa (MENA)
    {"iso3": "ISR", "name": "Israel", "continent": "Asia", "region": "Western Asia", "income": "High income", "blocs": ["oecd", "mena"]},
    {"iso3": "ARE", "name": "United Arab Emirates", "continent": "Asia", "region": "Western Asia", "income": "High income", "blocs": ["brics", "g20", "mena", "gcc"]},
    {"iso3": "SAU", "name": "Saudi Arabia", "continent": "Asia", "region": "Western Asia", "income": "High income", "blocs": ["brics", "g20", "mena", "gcc"]},
    {"iso3": "QAT", "name": "Qatar", "continent": "Asia", "region": "Western Asia", "income": "High income", "blocs": ["mena", "gcc"]},
    {"iso3": "KWT", "name": "Kuwait", "continent": "Asia", "region": "Western Asia", "income": "High income", "blocs": ["mena", "gcc"]},
    {"iso3": "BHR", "name": "Bahrain", "continent": "Asia", "region": "Western Asia", "income": "High income", "blocs": ["sids", "mena", "gcc"]},
    {"iso3": "OMN", "name": "Oman", "continent": "Asia", "region": "Western Asia", "income": "High income", "blocs": ["mena", "gcc"]},
    {"iso3": "TUR", "name": "Turkey", "continent": "Asia", "region": "Western Asia", "income": "Upper middle income", "blocs": ["oecd", "g20", "mena"]},
    {"iso3": "IRN", "name": "Iran", "continent": "Asia", "region": "Southern Asia", "income": "Upper middle income", "blocs": ["brics", "mena"]},
    {"iso3": "IRQ", "name": "Iraq", "continent": "Asia", "region": "Western Asia", "income": "Upper middle income", "blocs": ["mena"]},
    {"iso3": "JOR", "name": "Jordan", "continent": "Asia", "region": "Western Asia", "income": "Lower middle income", "blocs": ["mena"]},
    {"iso3": "LBN", "name": "Lebanon", "continent": "Asia", "region": "Western Asia", "income": "Lower middle income", "blocs": ["mena"]},
    {"iso3": "EGY", "name": "Egypt", "continent": "Africa", "region": "Northern Africa", "income": "Lower middle income", "blocs": ["brics", "mena"]},
    {"iso3": "MAR", "name": "Morocco", "continent": "Africa", "region": "Northern Africa", "income": "Lower middle income", "blocs": ["mena"]},
    {"iso3": "DZA", "name": "Algeria", "continent": "Africa", "region": "Northern Africa", "income": "Upper middle income", "blocs": ["mena"]},
    {"iso3": "TUN", "name": "Tunisia", "continent": "Africa", "region": "Northern Africa", "income": "Lower middle income", "blocs": ["mena"]},
    {"iso3": "LBY", "name": "Libya", "continent": "Africa", "region": "Northern Africa", "income": "Upper middle income", "blocs": ["mena"]},
    {"iso3": "YEM", "name": "Yemen", "continent": "Asia", "region": "Western Asia", "income": "Low income", "blocs": ["mena"]},
    {"iso3": "SYR", "name": "Syria", "continent": "Asia", "region": "Western Asia", "income": "Low income", "blocs": ["mena"]},

    # Central Asia & Caucasus
    {"iso3": "KAZ", "name": "Kazakhstan", "continent": "Asia", "region": "Central Asia", "income": "Upper middle income", "blocs": ["central_asia"]},
    {"iso3": "UZB", "name": "Uzbekistan", "continent": "Asia", "region": "Central Asia", "income": "Lower middle income", "blocs": ["central_asia"]},
    {"iso3": "TKM", "name": "Turkmenistan", "continent": "Asia", "region": "Central Asia", "income": "Upper middle income", "blocs": ["central_asia"]},
    {"iso3": "KGZ", "name": "Kyrgyzstan", "continent": "Asia", "region": "Central Asia", "income": "Lower middle income", "blocs": ["central_asia"]},
    {"iso3": "TJK", "name": "Tajikistan", "continent": "Asia", "region": "Central Asia", "income": "Lower middle income", "blocs": ["central_asia"]},
    {"iso3": "GEO", "name": "Georgia", "continent": "Asia", "region": "Western Asia", "income": "Upper middle income", "blocs": ["caucasus"]},
    {"iso3": "ARM", "name": "Armenia", "continent": "Asia", "region": "Western Asia", "income": "Upper middle income", "blocs": ["caucasus"]},
    {"iso3": "AZE", "name": "Azerbaijan", "continent": "Asia", "region": "Western Asia", "income": "Upper middle income", "blocs": ["caucasus"]},

    # Latin America & Caribbean
    {"iso3": "CHL", "name": "Chile", "continent": "South America", "region": "South America", "income": "High income", "blocs": ["oecd", "latam"]},
    {"iso3": "URY", "name": "Uruguay", "continent": "South America", "region": "South America", "income": "High income", "blocs": ["latam"]},
    {"iso3": "ARG", "name": "Argentina", "continent": "South America", "region": "South America", "income": "Upper middle income", "blocs": ["g20", "latam"]},
    {"iso3": "BRA", "name": "Brazil", "continent": "South America", "region": "South America", "income": "Upper middle income", "blocs": ["brics", "g20", "latam"]},
    {"iso3": "MEX", "name": "Mexico", "continent": "North America", "region": "Central America", "income": "Upper middle income", "blocs": ["oecd", "g20", "latam"]},
    {"iso3": "COL", "name": "Colombia", "continent": "South America", "region": "South America", "income": "Upper middle income", "blocs": ["oecd", "latam"]},
    {"iso3": "CRI", "name": "Costa Rica", "continent": "North America", "region": "Central America", "income": "Upper middle income", "blocs": ["oecd", "latam"]},
    {"iso3": "PAN", "name": "Panama", "continent": "North America", "region": "Central America", "income": "High income", "blocs": ["latam"]},
    {"iso3": "PER", "name": "Peru", "continent": "South America", "region": "South America", "income": "Upper middle income", "blocs": ["latam"]},
    {"iso3": "ECU", "name": "Ecuador", "continent": "South America", "region": "South America", "income": "Upper middle income", "blocs": ["latam"]},
    {"iso3": "DOM", "name": "Dominican Republic", "continent": "North America", "region": "Caribbean", "income": "Upper middle income", "blocs": ["sids", "latam"]},
    {"iso3": "PRY", "name": "Paraguay", "continent": "South America", "region": "South America", "income": "Upper middle income", "blocs": ["latam"]},
    {"iso3": "BOL", "name": "Bolivia", "continent": "South America", "region": "South America", "income": "Lower middle income", "blocs": ["latam"]},
    {"iso3": "GTM", "name": "Guatemala", "continent": "North America", "region": "Central America", "income": "Upper middle income", "blocs": ["latam"]},
    {"iso3": "HND", "name": "Honduras", "continent": "North America", "region": "Central America", "income": "Lower middle income", "blocs": ["latam"]},
    {"iso3": "SLV", "name": "El Salvador", "continent": "North America", "region": "Central America", "income": "Upper middle income", "blocs": ["latam"]},
    {"iso3": "NIC", "name": "Nicaragua", "continent": "North America", "region": "Central America", "income": "Lower middle income", "blocs": ["latam"]},
    {"iso3": "VEN", "name": "Venezuela", "continent": "South America", "region": "South America", "income": "Lower middle income", "blocs": ["latam"]},
    {"iso3": "CUB", "name": "Cuba", "continent": "North America", "region": "Caribbean", "income": "Upper middle income", "blocs": ["sids", "latam"]},
    {"iso3": "HTI", "name": "Haiti", "continent": "North America", "region": "Caribbean", "income": "Low income", "blocs": ["sids", "latam"]},
    {"iso3": "JAM", "name": "Jamaica", "continent": "North America", "region": "Caribbean", "income": "Upper middle income", "blocs": ["sids", "latam"]},
    {"iso3": "TTO", "name": "Trinidad and Tobago", "continent": "North America", "region": "Caribbean", "income": "High income", "blocs": ["sids", "latam"]},
    {"iso3": "GUY", "name": "Guyana", "continent": "South America", "region": "South America", "income": "High income", "blocs": ["sids", "latam"]},
    {"iso3": "SUR", "name": "Suriname", "continent": "South America", "region": "South America", "income": "Upper middle income", "blocs": ["sids", "latam"]},
    {"iso3": "BHS", "name": "Bahamas", "continent": "North America", "region": "Caribbean", "income": "High income", "blocs": ["sids", "latam"]},
    {"iso3": "BRB", "name": "Barbados", "continent": "North America", "region": "Caribbean", "income": "High income", "blocs": ["sids", "latam"]},

    # Sub-Saharan Africa
    {"iso3": "ZAF", "name": "South Africa", "continent": "Africa", "region": "Southern Africa", "income": "Upper middle income", "blocs": ["brics", "g20", "ssa"]},
    {"iso3": "BWA", "name": "Botswana", "continent": "Africa", "region": "Southern Africa", "income": "Upper middle income", "blocs": ["ssa"]},
    {"iso3": "NAM", "name": "Namibia", "continent": "Africa", "region": "Southern Africa", "income": "Upper middle income", "blocs": ["ssa"]},
    {"iso3": "MUS", "name": "Mauritius", "continent": "Africa", "region": "Eastern Africa", "income": "High income", "blocs": ["sids", "ssa"]},
    {"iso3": "SYC", "name": "Seychelles", "continent": "Africa", "region": "Eastern Africa", "income": "High income", "blocs": ["sids", "ssa"]},
    {"iso3": "CPV", "name": "Cabo Verde", "continent": "Africa", "region": "Western Africa", "income": "Lower middle income", "blocs": ["sids", "ssa"]},
    {"iso3": "GHA", "name": "Ghana", "continent": "Africa", "region": "Western Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "SEN", "name": "Senegal", "continent": "Africa", "region": "Western Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "CIV", "name": "Côte d'Ivoire", "continent": "Africa", "region": "Western Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "NGA", "name": "Nigeria", "continent": "Africa", "region": "Western Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "KEN", "name": "Kenya", "continent": "Africa", "region": "Eastern Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "RWA", "name": "Rwanda", "continent": "Africa", "region": "Eastern Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "TZA", "name": "Tanzania", "continent": "Africa", "region": "Eastern Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "UGA", "name": "Uganda", "continent": "Africa", "region": "Eastern Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "ETH", "name": "Ethiopia", "continent": "Africa", "region": "Eastern Africa", "income": "Low income", "blocs": ["brics", "ssa"]},
    {"iso3": "ZMB", "name": "Zambia", "continent": "Africa", "region": "Eastern Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "ZWE", "name": "Zimbabwe", "continent": "Africa", "region": "Eastern Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "MOZ", "name": "Mozambique", "continent": "Africa", "region": "Eastern Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "AGO", "name": "Angola", "continent": "Africa", "region": "Middle Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "CMR", "name": "Cameroon", "continent": "Africa", "region": "Middle Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "GAB", "name": "Gabon", "continent": "Africa", "region": "Middle Africa", "income": "Upper middle income", "blocs": ["ssa"]},
    {"iso3": "COG", "name": "Republic of the Congo", "continent": "Africa", "region": "Middle Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "COD", "name": "DR Congo", "continent": "Africa", "region": "Middle Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "MDG", "name": "Madagascar", "continent": "Africa", "region": "Eastern Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "MWI", "name": "Malawi", "continent": "Africa", "region": "Eastern Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "MLI", "name": "Mali", "continent": "Africa", "region": "Western Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "BFA", "name": "Burkina Faso", "continent": "Africa", "region": "Western Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "NER", "name": "Niger", "continent": "Africa", "region": "Western Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "TCD", "name": "Chad", "continent": "Africa", "region": "Middle Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "SDN", "name": "Sudan", "continent": "Africa", "region": "Northern Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "SSD", "name": "South Sudan", "continent": "Africa", "region": "Eastern Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "SOM", "name": "Somalia", "continent": "Africa", "region": "Eastern Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "CAF", "name": "Central African Republic", "continent": "Africa", "region": "Middle Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "GIN", "name": "Guinea", "continent": "Africa", "region": "Western Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "SLE", "name": "Sierra Leone", "continent": "Africa", "region": "Western Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "LBR", "name": "Liberia", "continent": "Africa", "region": "Western Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "TGO", "name": "Togo", "continent": "Africa", "region": "Western Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "BEN", "name": "Benin", "continent": "Africa", "region": "Western Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "MRT", "name": "Mauritania", "continent": "Africa", "region": "Western Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "GMB", "name": "Gambia", "continent": "Africa", "region": "Western Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "GNB", "name": "Guinea-Bissau", "continent": "Africa", "region": "Western Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "GNQ", "name": "Equatorial Guinea", "continent": "Africa", "region": "Middle Africa", "income": "Upper middle income", "blocs": ["ssa"]},
    {"iso3": "SWZ", "name": "Eswatini", "continent": "Africa", "region": "Southern Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "LSO", "name": "Lesotho", "continent": "Africa", "region": "Southern Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "BDI", "name": "Burundi", "continent": "Africa", "region": "Eastern Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "ERI", "name": "Eritrea", "continent": "Africa", "region": "Eastern Africa", "income": "Low income", "blocs": ["ssa"]},
    {"iso3": "DJI", "name": "Djibouti", "continent": "Africa", "region": "Eastern Africa", "income": "Lower middle income", "blocs": ["ssa"]},
    {"iso3": "COM", "name": "Comoros", "continent": "Africa", "region": "Eastern Africa", "income": "Lower middle income", "blocs": ["sids", "ssa"]},
    {"iso3": "STP", "name": "Sao Tome and Principe", "continent": "Africa", "region": "Middle Africa", "income": "Lower middle income", "blocs": ["sids", "ssa"]},

    # Oceania & Pacific Island Nations
    {"iso3": "PNG", "name": "Papua New Guinea", "continent": "Oceania", "region": "Melanesia", "income": "Lower middle income", "blocs": ["sids"]},
    {"iso3": "FJI", "name": "Fiji", "continent": "Oceania", "region": "Melanesia", "income": "Upper middle income", "blocs": ["sids"]},
    {"iso3": "SLB", "name": "Solomon Islands", "continent": "Oceania", "region": "Melanesia", "income": "Lower middle income", "blocs": ["sids"]},
    {"iso3": "VUT", "name": "Vanuatu", "continent": "Oceania", "region": "Melanesia", "income": "Lower middle income", "blocs": ["sids"]},
    {"iso3": "WSM", "name": "Samoa", "continent": "Oceania", "region": "Polynesia", "income": "Lower middle income", "blocs": ["sids"]},
    {"iso3": "TON", "name": "Tonga", "continent": "Oceania", "region": "Polynesia", "income": "Upper middle income", "blocs": ["sids"]},
    {"iso3": "FSM", "name": "Micronesia", "continent": "Oceania", "region": "Micronesia", "income": "Lower middle income", "blocs": ["sids"]},
    {"iso3": "KIR", "name": "Kiribati", "continent": "Oceania", "region": "Micronesia", "income": "Lower middle income", "blocs": ["sids"]},
    {"iso3": "MHL", "name": "Marshall Islands", "continent": "Oceania", "region": "Micronesia", "income": "Upper middle income", "blocs": ["sids"]},
    {"iso3": "PLW", "name": "Palau", "continent": "Oceania", "region": "Micronesia", "income": "High income", "blocs": ["sids"]},
    {"iso3": "NRU", "name": "Nauru", "continent": "Oceania", "region": "Micronesia", "income": "High income", "blocs": ["sids"]},
    {"iso3": "TUV", "name": "Tuvalu", "continent": "Oceania", "region": "Polynesia", "income": "Upper middle income", "blocs": ["sids"]}
]

bloc_labels = {
    "nordic": "Nordic Countries",
    "eu": "European Union",
    "oecd": "OECD Members",
    "g7": "G7 Nations",
    "g20": "G20 Economies",
    "brics": "BRICS+",
    "asean": "ASEAN",
    "latam": "Latin America & Caribbean",
    "ssa": "Sub-Saharan Africa",
    "mena": "Middle East & North Africa",
    "sids": "Small Island Developing States",
    "anglo": "Anglosphere",
    "east_asia": "East Asian Economies",
    "central_asia": "Central Asia",
    "south_asia": "South Asia",
    "caucasus": "Caucasus",
    "baltics": "Baltic States",
    "europe": "All Europe"
}

with open('src/data/countries.js', 'w', encoding='utf-8') as f:
    f.write('// Master Country Registry & Groupings\n')
    f.write('export const COUNTRIES = ' + json.dumps(countries_data, indent=2, ensure_ascii=False) + ';\n\n')
    f.write('export const BLOC_LABELS = ' + json.dumps(bloc_labels, indent=2, ensure_ascii=False) + ';\n\n')
    f.write('''export const COUNTRY_MAP = COUNTRIES.reduce((acc, c) => {
  acc[c.iso3] = c;
  return acc;
}, {});

export function getCountryName(iso3) {
  return COUNTRY_MAP[iso3]?.name || iso3;
}

export function getCountry(iso3) {
  return COUNTRY_MAP[iso3] || { iso3, name: iso3, continent: 'Unknown', region: 'Unknown', income: 'Unknown', blocs: [] };
}
''')

print(f'Successfully generated src/data/countries.js with {len(countries_data)} countries')
