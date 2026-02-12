"""
Preprocess data and generate JSON files for the dashboard
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path
from datetime import datetime

# Paths
BASE_DIR = Path(__file__).parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
OUTPUT_DIR = BASE_DIR / "dashboard" / "public" / "data"

def load_sales_data():
    """Load processed sales data"""
    print("Loading processed sales data...")
    sales = pd.read_csv(PROCESSED_DIR / "sales_long.csv", parse_dates=['date'])
    return sales

def generate_aggregated_json(sales):
    """Generate aggregated KPIs and totals"""
    print("Generating aggregated.json...")

    # Overall KPIs
    total_qty = int(sales['qty'].sum())
    total_revenue = float(sales['revenue'].sum())
    total_items = int(sales['id'].nunique())
    total_stores = int(sales['store_code'].nunique())
    total_days = int(sales['date'].nunique())

    # Date range
    min_date = sales['date'].min().strftime('%Y-%m-%d')
    max_date = sales['date'].max().strftime('%Y-%m-%d')

    # Average daily sales
    avg_daily_qty = float(sales.groupby('date')['qty'].sum().mean())
    avg_daily_revenue = float(sales.groupby('date')['revenue'].sum().mean())

    # Top categories by revenue
    category_revenue = sales.groupby('category')['revenue'].sum().sort_values(ascending=False)
    top_category = category_revenue.index[0]

    # Year over year growth (last year vs previous)
    sales['year'] = sales['date'].dt.year
    yearly_revenue = sales.groupby('year')['revenue'].sum()
    if len(yearly_revenue) >= 2:
        last_year = yearly_revenue.index[-1]
        prev_year = yearly_revenue.index[-2]
        yoy_growth = float((yearly_revenue[last_year] - yearly_revenue[prev_year]) / yearly_revenue[prev_year] * 100)
    else:
        yoy_growth = 0.0

    aggregated = {
        'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'dateRange': {
            'start': min_date,
            'end': max_date
        },
        'kpis': {
            'totalQuantity': total_qty,
            'totalRevenue': round(total_revenue, 2),
            'totalItems': total_items,
            'totalStores': total_stores,
            'totalDays': total_days,
            'avgDailyQuantity': round(avg_daily_qty, 2),
            'avgDailyRevenue': round(avg_daily_revenue, 2),
            'topCategory': top_category,
            'yoyGrowth': round(yoy_growth, 2)
        }
    }

    return aggregated

def generate_timeseries_json(sales):
    """Generate time series data for charts"""
    print("Generating timeseries.json...")

    # Daily aggregation
    daily = sales.groupby('date').agg({
        'qty': 'sum',
        'revenue': 'sum',
        'id': 'nunique'
    }).reset_index()
    daily.columns = ['date', 'quantity', 'revenue', 'uniqueItems']
    daily['date'] = daily['date'].dt.strftime('%Y-%m-%d')

    # Weekly aggregation
    sales['year_week'] = sales['date'].dt.strftime('%Y-W%W')
    weekly = sales.groupby('year_week').agg({
        'qty': 'sum',
        'revenue': 'sum',
        'id': 'nunique'
    }).reset_index()
    weekly.columns = ['period', 'quantity', 'revenue', 'uniqueItems']

    # Monthly aggregation
    sales['year_month'] = sales['date'].dt.strftime('%Y-%m')
    monthly = sales.groupby('year_month').agg({
        'qty': 'sum',
        'revenue': 'sum',
        'id': 'nunique'
    }).reset_index()
    monthly.columns = ['period', 'quantity', 'revenue', 'uniqueItems']

    # Yearly aggregation
    yearly = sales.groupby('year').agg({
        'qty': 'sum',
        'revenue': 'sum',
        'id': 'nunique'
    }).reset_index()
    yearly.columns = ['year', 'quantity', 'revenue', 'uniqueItems']

    timeseries = {
        'daily': daily.to_dict('records'),
        'weekly': weekly.to_dict('records'),
        'monthly': monthly.to_dict('records'),
        'yearly': yearly.to_dict('records')
    }

    return timeseries

def generate_categories_json(sales):
    """Generate category breakdown data"""
    print("Generating categories.json...")

    # By category
    by_category = sales.groupby('category').agg({
        'qty': 'sum',
        'revenue': 'sum',
        'id': 'nunique',
        'date': 'nunique'
    }).reset_index()
    by_category.columns = ['category', 'quantity', 'revenue', 'uniqueItems', 'activeDays']
    by_category = by_category.sort_values('revenue', ascending=False)

    # By department
    by_department = sales.groupby('department').agg({
        'qty': 'sum',
        'revenue': 'sum',
        'id': 'nunique'
    }).reset_index()
    by_department.columns = ['department', 'quantity', 'revenue', 'uniqueItems']
    by_department = by_department.sort_values('revenue', ascending=False)

    # Category time series (monthly)
    category_monthly = sales.groupby(['year_month', 'category']).agg({
        'qty': 'sum',
        'revenue': 'sum'
    }).reset_index()
    category_monthly.columns = ['period', 'category', 'quantity', 'revenue']

    # Pivot for chart
    category_pivot = category_monthly.pivot(index='period', columns='category', values='revenue').fillna(0)
    category_evolution = []
    for period in category_pivot.index:
        row = {'period': period}
        for cat in category_pivot.columns:
            row[cat] = round(float(category_pivot.loc[period, cat]), 2)
        category_evolution.append(row)

    categories = {
        'byCategory': by_category.round(2).to_dict('records'),
        'byDepartment': by_department.round(2).to_dict('records'),
        'evolution': category_evolution
    }

    return categories

def generate_stores_json(sales):
    """Generate store breakdown data"""
    print("Generating stores.json...")

    # By store
    by_store = sales.groupby(['store_code', 'store', 'region']).agg({
        'qty': 'sum',
        'revenue': 'sum',
        'id': 'nunique'
    }).reset_index()
    by_store.columns = ['storeCode', 'storeName', 'region', 'quantity', 'revenue', 'uniqueItems']
    by_store = by_store.sort_values('revenue', ascending=False)

    # By region
    by_region = sales.groupby('region').agg({
        'qty': 'sum',
        'revenue': 'sum',
        'store_code': 'nunique',
        'id': 'nunique'
    }).reset_index()
    by_region.columns = ['region', 'quantity', 'revenue', 'storeCount', 'uniqueItems']
    by_region = by_region.sort_values('revenue', ascending=False)

    # Store time series (monthly)
    store_monthly = sales.groupby(['year_month', 'store_code']).agg({
        'qty': 'sum',
        'revenue': 'sum'
    }).reset_index()
    store_monthly.columns = ['period', 'storeCode', 'quantity', 'revenue']

    stores = {
        'byStore': by_store.round(2).to_dict('records'),
        'byRegion': by_region.round(2).to_dict('records'),
        'monthly': store_monthly.round(2).to_dict('records')
    }

    return stores

def generate_filters_json(sales):
    """Generate filter options"""
    print("Generating filters.json...")

    filters = {
        'years': sorted(sales['date'].dt.year.unique().tolist()),
        'categories': sorted(sales['category'].unique().tolist()),
        'departments': sorted(sales['department'].unique().tolist()),
        'stores': sorted(sales['store_code'].unique().tolist()),
        'regions': sorted(sales['region'].unique().tolist())
    }

    return filters

def generate_seasonal_json(sales):
    """Generate seasonal analysis data"""
    print("Generating seasonal.json...")

    # Day of week analysis
    dow_analysis = sales.groupby('weekday').agg({
        'qty': 'sum',
        'revenue': 'sum'
    }).reset_index()
    dow_analysis.columns = ['dayOfWeek', 'quantity', 'revenue']

    # Month analysis
    sales['month'] = sales['date'].dt.month
    month_analysis = sales.groupby('month').agg({
        'qty': 'sum',
        'revenue': 'sum'
    }).reset_index()
    month_analysis.columns = ['month', 'quantity', 'revenue']

    # Heatmap: day of week x month
    heatmap = sales.groupby(['weekday', 'month'])['qty'].mean().reset_index()
    heatmap.columns = ['dayOfWeek', 'month', 'avgQuantity']
    heatmap_pivot = heatmap.pivot(index='dayOfWeek', columns='month', values='avgQuantity').fillna(0)

    heatmap_data = []
    for dow in heatmap_pivot.index:
        for month in heatmap_pivot.columns:
            heatmap_data.append({
                'dayOfWeek': dow,
                'month': int(month),
                'value': round(float(heatmap_pivot.loc[dow, month]), 2)
            })

    # Event impact
    event_impact = sales.groupby('has_event').agg({
        'qty': 'mean',
        'revenue': 'mean'
    }).reset_index()
    event_impact.columns = ['hasEvent', 'avgQuantity', 'avgRevenue']

    seasonal = {
        'byDayOfWeek': dow_analysis.round(2).to_dict('records'),
        'byMonth': month_analysis.round(2).to_dict('records'),
        'heatmap': heatmap_data,
        'eventImpact': event_impact.round(2).to_dict('records')
    }

    return seasonal

def save_json(data, filename):
    """Save data as JSON"""
    output_path = OUTPUT_DIR / filename
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Saved {output_path}")

def main():
    """Main preprocessing pipeline"""
    print("=" * 50)
    print("DSMarket Data Preprocessing")
    print("=" * 50)

    # Create output directory
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Load data
    sales = load_sales_data()

    # Generate and save JSONs
    aggregated = generate_aggregated_json(sales)
    save_json(aggregated, 'aggregated.json')

    timeseries = generate_timeseries_json(sales)
    save_json(timeseries, 'timeseries.json')

    categories = generate_categories_json(sales)
    save_json(categories, 'categories.json')

    stores = generate_stores_json(sales)
    save_json(stores, 'stores.json')

    filters = generate_filters_json(sales)
    save_json(filters, 'filters.json')

    seasonal = generate_seasonal_json(sales)
    save_json(seasonal, 'seasonal.json')

    print("\n" + "=" * 50)
    print("Preprocessing Complete!")
    print("=" * 50)

if __name__ == "__main__":
    main()
