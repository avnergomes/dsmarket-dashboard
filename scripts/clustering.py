"""
Product Clustering Pipeline - Optimized Version
Cluster products based on time series behavior using vectorized operations
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.manifold import TSNE
from sklearn.metrics import silhouette_score
from scipy import stats
import warnings

warnings.filterwarnings('ignore')

# Paths
BASE_DIR = Path(__file__).parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
OUTPUT_DIR = BASE_DIR / "dashboard" / "public" / "data"

def load_sales_data():
    """Load processed sales data"""
    print("Loading sales data...")
    sales = pd.read_csv(PROCESSED_DIR / "sales_long.csv", parse_dates=['date'], low_memory=False)
    return sales

def extract_time_series_features_vectorized(sales):
    """Extract features from each item's time series using vectorized operations"""
    print("Extracting time series features (vectorized)...")

    # Pivot to get item x date matrix
    print("  Creating pivot table...")
    item_daily = sales.groupby(['id', 'date'])['qty'].sum().reset_index()
    pivot = item_daily.pivot(index='id', columns='date', values='qty').fillna(0)

    print(f"  Processing {len(pivot)} items...")

    # Convert to numpy for faster operations
    data = pivot.values
    item_ids = pivot.index.tolist()

    # Basic statistics (vectorized)
    print("  Computing statistics...")
    mean_sales = np.mean(data, axis=1)
    std_sales = np.std(data, axis=1)
    cv = np.divide(std_sales, mean_sales, out=np.zeros_like(std_sales), where=mean_sales != 0)
    max_sales = np.max(data, axis=1)
    min_sales = np.min(data, axis=1)

    # Zeros percentage
    zeros_pct = np.mean(data == 0, axis=1)

    # Trend (simplified - difference between last and first quarter means)
    n_cols = data.shape[1]
    q1_end = n_cols // 4
    q4_start = 3 * n_cols // 4
    first_q_mean = np.mean(data[:, :q1_end], axis=1)
    last_q_mean = np.mean(data[:, q4_start:], axis=1)
    trend = last_q_mean - first_q_mean

    # Skewness and kurtosis
    print("  Computing skewness and kurtosis...")
    skewness = stats.skew(data, axis=1)
    kurtosis = stats.kurtosis(data, axis=1)

    # Handle NaN/inf
    skewness = np.nan_to_num(skewness, 0)
    kurtosis = np.nan_to_num(kurtosis, 0)

    # Create features dataframe
    features_df = pd.DataFrame({
        'id': item_ids,
        'mean': mean_sales,
        'std': std_sales,
        'cv': cv,
        'max': max_sales,
        'min': min_sales,
        'trend': trend,
        'zeros_pct': zeros_pct,
        'skewness': skewness,
        'kurtosis': kurtosis
    })

    # Filter out items with very low activity
    min_activity = features_df['mean'] > 0.01
    features_df = features_df[min_activity].reset_index(drop=True)

    print(f"  Kept {len(features_df)} items after filtering")
    return features_df

def perform_clustering(features_df, n_clusters=5):
    """Perform K-Means clustering"""
    print(f"Performing clustering with {n_clusters} clusters...")

    # Feature columns
    feature_cols = ['mean', 'std', 'cv', 'trend', 'zeros_pct', 'skewness', 'kurtosis']

    # Handle any remaining NaN/inf
    X = features_df[feature_cols].copy()
    X = X.replace([np.inf, -np.inf], np.nan)
    X = X.fillna(0)

    # Standardize
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Perform clustering
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)
    silhouette = silhouette_score(X_scaled, labels)
    print(f"  Silhouette score: {silhouette:.4f}")

    # Add labels to features
    features_df = features_df.copy()
    features_df['cluster'] = labels

    # t-SNE for visualization (sample for performance)
    print("Computing t-SNE visualization...")
    sample_size = min(3000, len(X_scaled))
    if len(X_scaled) > sample_size:
        sample_idx = np.random.choice(len(X_scaled), sample_size, replace=False)
        X_sample = X_scaled[sample_idx]
        ids_sample = features_df['id'].iloc[sample_idx].values
    else:
        X_sample = X_scaled
        ids_sample = features_df['id'].values
        sample_idx = np.arange(len(X_scaled))

    tsne = TSNE(n_components=2, random_state=42, perplexity=min(30, len(X_sample) - 1))
    coords = tsne.fit_transform(X_sample)

    # Create coordinate mapping
    coord_dict = {}
    for i, idx in enumerate(sample_idx):
        item_id = features_df['id'].iloc[idx]
        coord_dict[item_id] = [float(coords[i, 0]), float(coords[i, 1])]

    return features_df, kmeans, silhouette, coord_dict

def create_cluster_profiles(features_df, sales):
    """Create descriptive profiles for each cluster"""
    print("Creating cluster profiles...")

    # Get item metadata
    item_meta = sales[['id', 'category', 'department', 'store_code', 'region']].drop_duplicates()
    features_with_meta = features_df.merge(item_meta, on='id', how='left')

    profiles = []
    for cluster_id in sorted(features_df['cluster'].unique()):
        cluster_data = features_with_meta[features_with_meta['cluster'] == cluster_id]

        # Statistics
        avg_mean = cluster_data['mean'].mean()
        avg_cv = cluster_data['cv'].mean()
        avg_trend = cluster_data['trend'].mean()
        avg_zeros = cluster_data['zeros_pct'].mean()
        n_items = len(cluster_data)

        # Top categories
        top_categories = cluster_data['category'].value_counts().head(3).to_dict()

        # Determine cluster characteristics
        if avg_mean > features_df['mean'].median():
            demand_level = "High"
        elif avg_mean < features_df['mean'].quantile(0.25):
            demand_level = "Low"
        else:
            demand_level = "Medium"

        if avg_cv < 0.5:
            stability = "Stable"
        elif avg_cv < 1.0:
            stability = "Moderate"
        else:
            stability = "Volatile"

        if avg_trend > 0.01:
            trend = "Growing"
        elif avg_trend < -0.01:
            trend = "Declining"
        else:
            trend = "Stable"

        if avg_zeros > 0.7:
            intermittent = "High"
        elif avg_zeros > 0.3:
            intermittent = "Moderate"
        else:
            intermittent = "Low"

        # Generate cluster name
        name = f"{demand_level} Demand, {stability}"

        profiles.append({
            'id': int(cluster_id),
            'name': name,
            'nItems': n_items,
            'characteristics': {
                'demandLevel': demand_level,
                'stability': stability,
                'trend': trend,
                'intermittent': intermittent
            },
            'stats': {
                'avgDailySales': round(float(avg_mean), 2),
                'avgCV': round(float(avg_cv), 2),
                'avgTrend': round(float(avg_trend), 4),
                'avgZerosPct': round(float(avg_zeros) * 100, 1)
            },
            'topCategories': {k: int(v) for k, v in top_categories.items()}
        })

    return profiles

def generate_clusters_json(features_df, profiles, silhouette, coord_dict):
    """Generate final clusters JSON"""
    print("Generating clusters.json...")

    # Items with cluster assignment (only those with coordinates)
    items = {}
    for _, row in features_df.iterrows():
        item_id = row['id']
        items[item_id] = {
            'cluster': int(row['cluster']),
            'coords': coord_dict.get(item_id, [0, 0]),
            'mean': round(float(row['mean']), 2),
            'cv': round(float(row['cv']), 2)
        }

    clusters_data = {
        'summary': {
            'nClusters': len(profiles),
            'silhouetteScore': round(float(silhouette), 4),
            'totalItems': len(features_df)
        },
        'clusters': profiles,
        'items': items
    }

    return clusters_data

def save_json(data, filename):
    """Save data as JSON"""
    output_path = OUTPUT_DIR / filename
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {output_path}")

def main():
    """Main clustering pipeline"""
    print("=" * 50)
    print("DSMarket Product Clustering (Optimized)")
    print("=" * 50)

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load data
    sales = load_sales_data()

    # Extract features (vectorized)
    features_df = extract_time_series_features_vectorized(sales)
    print(f"Extracted features for {len(features_df)} items")

    # Perform clustering
    features_df, kmeans, silhouette, coord_dict = perform_clustering(features_df, n_clusters=5)

    # Create profiles
    profiles = create_cluster_profiles(features_df, sales)

    # Generate JSON
    clusters_data = generate_clusters_json(features_df, profiles, silhouette, coord_dict)
    save_json(clusters_data, 'clusters.json')

    # Print summary
    print("\n=== Clustering Summary ===")
    print(f"Total items clustered: {len(features_df)}")
    print(f"Number of clusters: {len(profiles)}")
    print(f"Silhouette score: {silhouette:.4f}")
    for profile in profiles:
        print(f"  Cluster {profile['id']} ({profile['name']}): {profile['nItems']} items")

    print("\n" + "=" * 50)
    print("Clustering Complete!")
    print("=" * 50)

if __name__ == "__main__":
    main()
