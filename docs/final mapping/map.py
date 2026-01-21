import pandas as pd
import matplotlib.pyplot as plt
import geopandas as gpd # Requires: pip install geopandas

# 1. Load the structured data
df_assets = pd.read_csv('structured_saudi_assets.csv')
df_regional = pd.read_csv('regional_aggregates.csv')

# 2. Setup the Plot
fig, ax = plt.subplots(figsize=(12, 10))

# --- OPTIONAL: Add Map Background (Run this locally) ---
# world = gpd.read_file(gpd.datasets.get_path('naturalearth_lowres'))
# ksa = world[world.name == "Saudi Arabia"]
# ksa.plot(ax=ax, color='#f2f2f2', edgecolor='black', alpha=0.5)
# -------------------------------------------------------

# 3. Layer 1: Heatmap Data (Regional Aggregates)
# Plotting bubbles sized by Hospital Count
ax.scatter(
    df_regional['Centroid_Lon'], 
    df_regional['Centroid_Lat'], 
    s=df_regional['Total Hospitals (2023)'] * 20, 
    color='red', 
    alpha=0.3, 
    label='Healthcare Volume (Bubble Size)'
)

# 4. Layer 2: Asset Pins (Specific Projects)
categories = df_assets['Category'].unique()
for cat in categories:
    subset = df_assets[df_assets['Category'] == cat]
    ax.scatter(
        subset['Longitude'], 
        subset['Latitude'], 
        label=cat, 
        marker='x', 
        s=50
    )

# Formatting
ax.set_title('Saudi Arabia: Strategic Assets & Healthcare Density')
ax.legend()
plt.show()