"""
Store Replenishment Pipeline
Calculate optimal reorder points and safety stock levels
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
FORECAST_DIR = BASE_DIR / "dashboard" / "public" / "data" / "forecasts"
OUTPUT_DIR = BASE_DIR / "dashboard" / "public" / "data"

# Parameters
LEAD_TIME_DAYS = 7  # Average delivery lead time
SERVICE_LEVEL = 0.95  # 95% service level
Z_SCORE = 1.65  # Z-score for 95% service level

def load_data():
    """Load sales data and forecasts"""
    print("Loading data...")
    sales = pd.read_csv(PROCESSED_DIR / "sales_long.csv", parse_dates=['date'], low_memory=False)

    # Load forecast summary
    with open(FORECAST_DIR / "summary.json", 'r') as f:
        forecast_summary = json.load(f)

    return sales, forecast_summary

def calculate_store_metrics(sales):
    """Calculate replenishment metrics by store"""
    print("Calculating store metrics...")

    # Get daily sales by store
    store_daily = sales.groupby(['store_code', 'date'])['qty'].sum().reset_index()

    store_metrics = []
    for store in sales['store_code'].unique():
        store_data = store_daily[store_daily['store_code'] == store]['qty']

        avg_daily_demand = store_data.mean()
        std_daily_demand = store_data.std()

        # Safety stock = Z * σ * √LT
        safety_stock = Z_SCORE * std_daily_demand * np.sqrt(LEAD_TIME_DAYS)

        # Reorder point = (Average daily demand * Lead time) + Safety stock
        reorder_point = (avg_daily_demand * LEAD_TIME_DAYS) + safety_stock

        # Economic Order Quantity (simplified - assuming holding cost = 20% of item value)
        # EOQ = √(2DS/H) where D=annual demand, S=ordering cost, H=holding cost
        annual_demand = avg_daily_demand * 365
        ordering_cost = 50  # Assumed fixed ordering cost
        holding_cost = 0.20 * (sales[sales['store_code'] == store]['revenue'].sum() /
                               sales[sales['store_code'] == store]['qty'].sum())
        if holding_cost > 0:
            eoq = np.sqrt((2 * annual_demand * ordering_cost) / holding_cost)
        else:
            eoq = avg_daily_demand * 14  # Default to 2 weeks supply

        # Days of supply
        current_stock_estimate = avg_daily_demand * 10  # Assume 10 days of stock
        days_of_supply = current_stock_estimate / avg_daily_demand if avg_daily_demand > 0 else 0

        # Fill rate estimation (simplified)
        cv = std_daily_demand / avg_daily_demand if avg_daily_demand > 0 else 0
        estimated_fill_rate = min(0.99, 1 - (cv * 0.1))  # Simplified estimation

        store_metrics.append({
            'store': store,
            'avgDailyDemand': round(float(avg_daily_demand), 1),
            'stdDailyDemand': round(float(std_daily_demand), 1),
            'safetyStock': round(float(safety_stock), 0),
            'reorderPoint': round(float(reorder_point), 0),
            'eoq': round(float(eoq), 0),
            'daysOfSupply': round(float(days_of_supply), 1),
            'estimatedFillRate': round(float(estimated_fill_rate) * 100, 1),
            'cv': round(float(cv), 2)
        })

    return sorted(store_metrics, key=lambda x: x['avgDailyDemand'], reverse=True)

def calculate_category_metrics(sales):
    """Calculate replenishment metrics by category"""
    print("Calculating category metrics...")

    cat_daily = sales.groupby(['category', 'date'])['qty'].sum().reset_index()

    category_metrics = []
    for cat in sales['category'].unique():
        cat_data = cat_daily[cat_daily['category'] == cat]['qty']

        avg_daily = cat_data.mean()
        std_daily = cat_data.std()

        safety_stock = Z_SCORE * std_daily * np.sqrt(LEAD_TIME_DAYS)
        reorder_point = (avg_daily * LEAD_TIME_DAYS) + safety_stock

        cv = std_daily / avg_daily if avg_daily > 0 else 0

        category_metrics.append({
            'category': cat,
            'avgDailyDemand': round(float(avg_daily), 1),
            'stdDailyDemand': round(float(std_daily), 1),
            'safetyStock': round(float(safety_stock), 0),
            'reorderPoint': round(float(reorder_point), 0),
            'cv': round(float(cv), 2)
        })

    return sorted(category_metrics, key=lambda x: x['avgDailyDemand'], reverse=True)

def identify_critical_items(sales):
    """Identify items that need immediate attention"""
    print("Identifying critical items...")

    # Get recent sales (last 28 days)
    max_date = sales['date'].max()
    recent_sales = sales[sales['date'] >= max_date - pd.Timedelta(days=28)]

    # Calculate metrics by item
    item_metrics = recent_sales.groupby('id').agg({
        'qty': ['sum', 'mean', 'std'],
        'store_code': 'first',
        'category': 'first',
        'department': 'first'
    }).reset_index()

    item_metrics.columns = ['id', 'total_qty', 'avg_daily', 'std_daily', 'store', 'category', 'department']

    # Calculate CV
    item_metrics['cv'] = item_metrics['std_daily'] / item_metrics['avg_daily']
    item_metrics['cv'] = item_metrics['cv'].fillna(0)

    # Identify high-risk items (high demand + high variability)
    high_demand_threshold = item_metrics['total_qty'].quantile(0.9)
    high_cv_threshold = 1.5

    critical_items = item_metrics[
        (item_metrics['total_qty'] >= high_demand_threshold) |
        (item_metrics['cv'] >= high_cv_threshold)
    ].head(20)

    critical_list = []
    for _, row in critical_items.iterrows():
        safety_stock = Z_SCORE * row['std_daily'] * np.sqrt(LEAD_TIME_DAYS) if row['std_daily'] > 0 else 0
        reorder_point = (row['avg_daily'] * LEAD_TIME_DAYS) + safety_stock

        # Determine risk level
        if row['cv'] >= 2.0:
            risk = 'High'
        elif row['cv'] >= 1.0:
            risk = 'Medium'
        else:
            risk = 'Low'

        critical_list.append({
            'id': row['id'],
            'store': row['store'],
            'category': row['category'],
            'department': row['department'],
            'totalQty28d': int(row['total_qty']),
            'avgDaily': round(float(row['avg_daily']), 2),
            'cv': round(float(row['cv']), 2),
            'safetyStock': round(float(safety_stock), 0),
            'reorderPoint': round(float(reorder_point), 0),
            'riskLevel': risk
        })

    return critical_list

def calculate_summary_kpis(store_metrics, category_metrics, sales):
    """Calculate summary KPIs"""
    print("Calculating summary KPIs...")

    # Overall metrics
    daily_sales = sales.groupby('date')['qty'].sum()

    total_avg_daily = daily_sales.mean()
    total_std_daily = daily_sales.std()

    # Aggregate safety stock and reorder points
    total_safety_stock = sum(s['safetyStock'] for s in store_metrics)
    total_reorder_point = sum(s['reorderPoint'] for s in store_metrics)

    # Average fill rate
    avg_fill_rate = np.mean([s['estimatedFillRate'] for s in store_metrics])

    # Average CV across stores
    avg_cv = np.mean([s['cv'] for s in store_metrics])

    return {
        'totalAvgDailyDemand': round(float(total_avg_daily), 0),
        'totalSafetyStock': round(float(total_safety_stock), 0),
        'totalReorderPoint': round(float(total_reorder_point), 0),
        'avgFillRate': round(float(avg_fill_rate), 1),
        'avgCV': round(float(avg_cv), 2),
        'leadTimeDays': LEAD_TIME_DAYS,
        'serviceLevel': SERVICE_LEVEL * 100,
        'nStores': len(store_metrics),
        'nCategories': len(category_metrics)
    }

def generate_replenishment_json(summary, store_metrics, category_metrics, critical_items):
    """Generate final replenishment JSON"""
    print("Generating replenishment.json...")

    replenishment_data = {
        'lastUpdated': pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S'),
        'parameters': {
            'leadTimeDays': LEAD_TIME_DAYS,
            'serviceLevel': SERVICE_LEVEL * 100,
            'zScore': Z_SCORE
        },
        'summary': summary,
        'byStore': store_metrics,
        'byCategory': category_metrics,
        'criticalItems': critical_items
    }

    return replenishment_data

def save_json(data, filename):
    """Save data as JSON"""
    output_path = OUTPUT_DIR / filename
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {output_path}")

def main():
    """Main replenishment pipeline"""
    print("=" * 50)
    print("DSMarket Store Replenishment Analysis")
    print("=" * 50)

    # Load data
    sales, forecast_summary = load_data()

    # Calculate metrics
    store_metrics = calculate_store_metrics(sales)
    category_metrics = calculate_category_metrics(sales)
    critical_items = identify_critical_items(sales)

    # Calculate summary KPIs
    summary = calculate_summary_kpis(store_metrics, category_metrics, sales)

    # Generate JSON
    replenishment_data = generate_replenishment_json(
        summary, store_metrics, category_metrics, critical_items
    )
    save_json(replenishment_data, 'replenishment.json')

    # Print summary
    print("\n=== Replenishment Summary ===")
    print(f"Total Daily Demand: {summary['totalAvgDailyDemand']:,.0f} units")
    print(f"Total Safety Stock: {summary['totalSafetyStock']:,.0f} units")
    print(f"Total Reorder Point: {summary['totalReorderPoint']:,.0f} units")
    print(f"Average Fill Rate: {summary['avgFillRate']:.1f}%")
    print(f"Critical Items Identified: {len(critical_items)}")

    print("\n" + "=" * 50)
    print("Replenishment Analysis Complete!")
    print("=" * 50)

if __name__ == "__main__":
    main()
