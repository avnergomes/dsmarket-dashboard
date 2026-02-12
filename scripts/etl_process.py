"""
ETL Process: Transform wide format sales data to long format
Merge with calendar and prices data
"""

import pandas as pd
import numpy as np
from pathlib import Path
from tqdm import tqdm

# Paths
BASE_DIR = Path(__file__).parent.parent
RAW_DIR = BASE_DIR / "data" / "raw"
PROCESSED_DIR = BASE_DIR / "data" / "processed"

def load_calendar():
    """Load and process calendar data"""
    print("Loading calendar data...")
    calendar = pd.read_csv(RAW_DIR / "daily_calendar_with_events.csv")
    calendar['date'] = pd.to_datetime(calendar['date'])
    calendar['year'] = calendar['date'].dt.year
    calendar['month'] = calendar['date'].dt.month
    calendar['week'] = calendar['date'].dt.isocalendar().week
    calendar['day_of_week'] = calendar['weekday_int']
    calendar['is_weekend'] = calendar['weekday_int'].isin([1, 2])  # Saturday=1, Sunday=2
    calendar['has_event'] = calendar['event'].notna()
    return calendar

def load_prices():
    """Load and process prices data"""
    print("Loading prices data...")
    prices = pd.read_csv(RAW_DIR / "item_prices.csv")
    # Convert yearweek to year and week
    prices['year'] = prices['yearweek'] // 100
    prices['week'] = prices['yearweek'] % 100
    return prices

def transform_sales_wide_to_long(chunk_size=1000):
    """Transform wide format sales to long format in chunks"""
    print("Loading sales data...")
    sales = pd.read_csv(RAW_DIR / "item_sales.csv")

    # Get day columns
    day_cols = [col for col in sales.columns if col.startswith('d_')]
    id_cols = ['id', 'item', 'category', 'department', 'store', 'store_code', 'region']

    print(f"Found {len(day_cols)} days and {len(sales)} items")
    print("Transforming to long format...")

    # Melt in chunks for memory efficiency
    all_chunks = []
    total_rows = len(sales)

    for start in tqdm(range(0, total_rows, chunk_size)):
        end = min(start + chunk_size, total_rows)
        chunk = sales.iloc[start:end]

        melted = chunk.melt(
            id_vars=id_cols,
            value_vars=day_cols,
            var_name='d',
            value_name='qty'
        )
        all_chunks.append(melted)

    sales_long = pd.concat(all_chunks, ignore_index=True)

    # Extract day number
    sales_long['day_num'] = sales_long['d'].str.replace('d_', '').astype(int)

    return sales_long

def merge_with_calendar(sales_long, calendar):
    """Merge sales with calendar to get actual dates"""
    print("Merging with calendar...")

    # Create day mapping from calendar
    calendar['day_num'] = range(1, len(calendar) + 1)
    day_mapping = calendar[['day_num', 'date', 'year', 'month', 'week',
                            'weekday', 'day_of_week', 'is_weekend',
                            'event', 'has_event']].copy()

    sales_long = sales_long.merge(day_mapping, on='day_num', how='left')

    return sales_long

def merge_with_prices(sales_long, prices):
    """Merge sales with prices"""
    print("Merging with prices...")

    # Get week from sales
    sales_long['price_year'] = sales_long['year']
    sales_long['price_week'] = sales_long['week']

    # Merge prices
    sales_long = sales_long.merge(
        prices[['item', 'store_code', 'year', 'week', 'sell_price']],
        left_on=['item', 'store_code', 'price_year', 'price_week'],
        right_on=['item', 'store_code', 'year', 'week'],
        how='left',
        suffixes=('', '_price')
    )

    # Calculate revenue
    sales_long['revenue'] = sales_long['qty'] * sales_long['sell_price'].fillna(0)

    # Drop duplicate columns
    sales_long = sales_long.drop(columns=['year_price', 'week_price', 'price_year', 'price_week'], errors='ignore')

    return sales_long

def save_processed_data(sales_long):
    """Save processed data"""
    print("Saving processed data...")
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

    # Save full dataset
    output_path = PROCESSED_DIR / "sales_long.csv"
    sales_long.to_csv(output_path, index=False)
    print(f"Saved to {output_path}")

    # Print summary
    print("\n=== Data Summary ===")
    print(f"Total records: {len(sales_long):,}")
    print(f"Date range: {sales_long['date'].min()} to {sales_long['date'].max()}")
    print(f"Unique items: {sales_long['id'].nunique():,}")
    print(f"Unique stores: {sales_long['store_code'].nunique()}")
    print(f"Categories: {sales_long['category'].nunique()}")
    print(f"Total quantity sold: {sales_long['qty'].sum():,.0f}")
    print(f"Total revenue: ${sales_long['revenue'].sum():,.2f}")

def main():
    """Main ETL pipeline"""
    print("=" * 50)
    print("DSMarket ETL Pipeline")
    print("=" * 50)

    # Load data
    calendar = load_calendar()
    prices = load_prices()

    # Transform sales
    sales_long = transform_sales_wide_to_long()

    # Merge with calendar and prices
    sales_long = merge_with_calendar(sales_long, calendar)
    sales_long = merge_with_prices(sales_long, prices)

    # Save
    save_processed_data(sales_long)

    print("\n" + "=" * 50)
    print("ETL Complete!")
    print("=" * 50)

    return sales_long

if __name__ == "__main__":
    main()
