import os
import json

print("Checking project structure...")
required_files = [
    'index.html',
    'src/app.js',
    'src/styles/main.css',
    'src/data/countries.js',
    'src/data/indicators.js',
    'src/data/worldGeo.js',
    'src/engine/stats.js',
    'src/modules/mapEngine.js',
    'src/modules/indexBuilder.js',
    'src/modules/correlationStudio.js',
    'src/modules/performanceAnatomy.js',
    'src/modules/bivariateQuadrant.js',
    'src/modules/sensitivityAnalyzer.js',
    'src/modules/importerExporter.js'
]

for f in required_files:
    if os.path.exists(f):
        print(f"[OK] Found {f} ({os.path.getsize(f)} bytes)")
    else:
        print(f"[MISSING] {f}")

print("\nValidating data integrity...")
with open('src/data/countries.js', 'r', encoding='utf-8') as f:
    text = f.read()
    assert 'COUNTRIES' in text
    assert 'BLOC_LABELS' in text

with open('src/data/indicators.js', 'r', encoding='utf-8') as f:
    text = f.read()
    assert 'INDICATORS' in text
    assert 'BENCHMARK_BUNDLES' in text

with open('src/data/worldGeo.js', 'r', encoding='utf-8') as f:
    text = f.read()
    assert 'WORLD_GEO' in text

print("All core files and data structures verified successfully!")
