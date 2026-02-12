"""
Sales Forecasting Pipeline
Generate forecasts for top items and aggregates
"""

import pandas as pd
import numpy as np
import json
from pathlib import Path
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
import warnings
from tqdm import tqdm

warnings.filterwarnings('ignore')

# Paths
BASE_DIR = Path(__file__).parent.parent
PROCESSED_DIR = BASE_DIR / "data" / "processed"
OUTPUT_DIR = BASE_DIR / "dashboard" / "public" / "data"
FORECASTS_DIR = OUTPUT_DIR / "forecasts"

# Forecast horizon
FORECAST_DAYS = 28
TRAIN_TEST_SPLIT_DAYS = 60  # Use last 60 days for testing

def load_sales_data():
    """Load processed sales data"""
    print("Loading sales data...")
    sales = pd.read_csv(PROCESSED_DIR / "sales_long.csv", parse_dates=['date'])
    return sales

def create_features(df, target_col='qty'):
    """Create time series features for ML models"""
    df = df.copy()

    # Date features
    df['dayofweek'] = df['date'].dt.dayofweek
    df['month'] = df['date'].dt.month
    df['day'] = df['date'].dt.day
    df['weekofyear'] = df['date'].dt.isocalendar().week.astype(int)
    df['is_weekend'] = df['dayofweek'].isin([5, 6]).astype(int)

    # Lag features
    for lag in [1, 7, 14, 28]:
        df[f'lag_{lag}'] = df[target_col].shift(lag)

    # Rolling features
    for window in [7, 14, 28]:
        df[f'rolling_mean_{window}'] = df[target_col].shift(1).rolling(window=window).mean()
        df[f'rolling_std_{window}'] = df[target_col].shift(1).rolling(window=window).std()

    return df

def train_forecast_model(series, test_days=TRAIN_TEST_SPLIT_DAYS):
    """Train a simple forecasting model on a time series"""

    # Prepare data
    df = series.reset_index()
    df.columns = ['date', 'qty']
    df = df.sort_values('date')

    # Create features
    df = create_features(df)

    # Remove NaN rows
    df = df.dropna()

    if len(df) < 60:
        return None, None, None

    # Feature columns
    feature_cols = [col for col in df.columns if col not in ['date', 'qty']]

    # Train/test split
    train = df.iloc[:-test_days]
    test = df.iloc[-test_days:]

    if len(train) < 30:
        return None, None, None

    X_train = train[feature_cols]
    y_train = train['qty']
    X_test = test[feature_cols]
    y_test = test['qty']

    # Train model (Random Forest for robustness)
    model = RandomForestRegressor(n_estimators=50, max_depth=10, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    # Predictions
    y_pred = model.predict(X_test)
    y_pred = np.maximum(y_pred, 0)  # No negative sales

    # Metrics
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    mape = np.mean(np.abs((y_test - y_pred) / (y_test + 1))) * 100  # +1 to avoid division by zero

    metrics = {
        'mae': round(mae, 2),
        'rmse': round(rmse, 2),
        'mape': round(mape, 2)
    }

    return model, df, metrics

def generate_forecast(model, df, forecast_days=FORECAST_DAYS):
    """Generate future forecasts"""

    if model is None or df is None:
        return None

    # Get last date
    last_date = df['date'].max()

    # Prepare forecast data
    forecast_dates = pd.date_range(start=last_date + timedelta(days=1), periods=forecast_days)
    forecast_df = pd.DataFrame({'date': forecast_dates})

    # Get last known values for lag features
    last_values = df['qty'].tail(28).tolist()

    forecasts = []
    feature_cols = [col for col in df.columns if col not in ['date', 'qty']]

    for i, date in enumerate(forecast_dates):
        row = {
            'date': date,
            'dayofweek': date.dayofweek,
            'month': date.month,
            'day': date.day,
            'weekofyear': date.isocalendar().week,
            'is_weekend': int(date.dayofweek in [5, 6])
        }

        # Lag features
        for lag in [1, 7, 14, 28]:
            if i >= lag:
                row[f'lag_{lag}'] = forecasts[i - lag]
            else:
                idx = len(last_values) - lag + i
                row[f'lag_{lag}'] = last_values[idx] if idx >= 0 else 0

        # Rolling features (approximate with recent values)
        recent = last_values[-28:] + forecasts[:i] if i > 0 else last_values[-28:]
        for window in [7, 14, 28]:
            if len(recent) >= window:
                row[f'rolling_mean_{window}'] = np.mean(recent[-window:])
                row[f'rolling_std_{window}'] = np.std(recent[-window:])
            else:
                row[f'rolling_mean_{window}'] = np.mean(recent)
                row[f'rolling_std_{window}'] = np.std(recent)

        # Predict
        X = pd.DataFrame([row])[feature_cols]
        pred = max(0, model.predict(X)[0])
        forecasts.append(pred)

    # Calculate confidence intervals (simple approach based on historical std)
    historical_std = df['qty'].std()
    z = 1.96  # 95% confidence

    forecast_data = []
    for i, (date, value) in enumerate(zip(forecast_dates, forecasts)):
        # Wider intervals for further forecasts
        interval_width = historical_std * z * (1 + i * 0.02)
        forecast_data.append({
            'date': date.strftime('%Y-%m-%d'),
            'value': round(value, 2),
            'lower': round(max(0, value - interval_width), 2),
            'upper': round(value + interval_width, 2)
        })

    return forecast_data

def get_top_items(sales, n=100):
    """Get top N items by total sales"""
    item_totals = sales.groupby('id')['qty'].sum().sort_values(ascending=False)
    return item_totals.head(n).index.tolist()

def get_aggregate_series(sales, group_by):
    """Get aggregated time series"""
    if group_by == 'total':
        return sales.groupby('date')['qty'].sum()
    else:
        return sales.groupby([group_by, 'date'])['qty'].sum()

def main():
    """Main forecasting pipeline"""
    print("=" * 50)
    print("DSMarket Sales Forecasting")
    print("=" * 50)

    # Create output directories
    FORECASTS_DIR.mkdir(parents=True, exist_ok=True)

    # Load data
    sales = load_sales_data()

    # Get date range
    max_date = sales['date'].max()
    print(f"Data up to: {max_date.strftime('%Y-%m-%d')}")

    # === 1. Aggregate Forecasts ===
    print("\n--- Generating Aggregate Forecasts ---")

    # Total sales forecast
    print("Forecasting total sales...")
    total_series = sales.groupby('date')['qty'].sum()
    model, df, metrics = train_forecast_model(total_series)

    if model:
        forecast = generate_forecast(model, df)
        total_forecast = {
            'id': 'total',
            'name': 'Total Sales',
            'lastUpdated': datetime.now().strftime('%Y-%m-%d'),
            'historical': [
                {'date': d.strftime('%Y-%m-%d'), 'value': float(v)}
                for d, v in total_series.tail(90).items()
            ],
            'forecast': forecast,
            'metrics': metrics
        }
        with open(FORECASTS_DIR / 'total.json', 'w') as f:
            json.dump(total_forecast, f, indent=2)
        print(f"  Total: MAE={metrics['mae']}, MAPE={metrics['mape']}%")

    # Category forecasts
    print("Forecasting by category...")
    category_forecasts = []
    for category in tqdm(sales['category'].unique()):
        cat_series = sales[sales['category'] == category].groupby('date')['qty'].sum()
        model, df, metrics = train_forecast_model(cat_series)

        if model and metrics:
            forecast = generate_forecast(model, df)
            cat_forecast = {
                'id': category,
                'name': category,
                'type': 'category',
                'metrics': metrics
            }
            category_forecasts.append(cat_forecast)

            # Save individual category forecast
            full_forecast = {
                'id': category,
                'name': category,
                'type': 'category',
                'lastUpdated': datetime.now().strftime('%Y-%m-%d'),
                'historical': [
                    {'date': d.strftime('%Y-%m-%d'), 'value': float(v)}
                    for d, v in cat_series.tail(90).items()
                ],
                'forecast': forecast,
                'metrics': metrics
            }
            safe_name = category.replace(' ', '_').replace('&', 'and')
            with open(FORECASTS_DIR / f'category_{safe_name}.json', 'w') as f:
                json.dump(full_forecast, f, indent=2)

    # Store forecasts
    print("Forecasting by store...")
    store_forecasts = []
    for store in tqdm(sales['store_code'].unique()):
        store_series = sales[sales['store_code'] == store].groupby('date')['qty'].sum()
        model, df, metrics = train_forecast_model(store_series)

        if model and metrics:
            forecast = generate_forecast(model, df)
            store_forecast = {
                'id': store,
                'name': store,
                'type': 'store',
                'metrics': metrics
            }
            store_forecasts.append(store_forecast)

            # Save individual store forecast
            full_forecast = {
                'id': store,
                'name': store,
                'type': 'store',
                'lastUpdated': datetime.now().strftime('%Y-%m-%d'),
                'historical': [
                    {'date': d.strftime('%Y-%m-%d'), 'value': float(v)}
                    for d, v in store_series.tail(90).items()
                ],
                'forecast': forecast,
                'metrics': metrics
            }
            with open(FORECASTS_DIR / f'store_{store}.json', 'w') as f:
                json.dump(full_forecast, f, indent=2)

    # === 2. Top Items Forecasts (sample) ===
    print("\n--- Generating Top Item Forecasts ---")
    top_items = get_top_items(sales, n=50)
    item_forecasts = []

    for item_id in tqdm(top_items):
        item_series = sales[sales['id'] == item_id].groupby('date')['qty'].sum()
        model, df, metrics = train_forecast_model(item_series)

        if model and metrics:
            forecast = generate_forecast(model, df)
            item_forecast = {
                'id': item_id,
                'type': 'item',
                'metrics': metrics
            }
            item_forecasts.append(item_forecast)

            # Save individual item forecast
            full_forecast = {
                'id': item_id,
                'type': 'item',
                'lastUpdated': datetime.now().strftime('%Y-%m-%d'),
                'historical': [
                    {'date': d.strftime('%Y-%m-%d'), 'value': float(v)}
                    for d, v in item_series.tail(90).items()
                ],
                'forecast': forecast,
                'metrics': metrics
            }
            safe_name = item_id.replace(' ', '_').replace('&', 'and')
            with open(FORECASTS_DIR / f'item_{safe_name}.json', 'w') as f:
                json.dump(full_forecast, f, indent=2)

    # === 3. Generate Summary ===
    print("\n--- Generating Forecast Summary ---")
    summary = {
        'lastUpdated': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'forecastHorizon': FORECAST_DAYS,
        'model': 'RandomForest',
        'total': {
            'available': True,
            'metrics': total_forecast['metrics'] if model else None
        },
        'categories': category_forecasts,
        'stores': store_forecasts,
        'items': item_forecasts
    }

    with open(FORECASTS_DIR / 'summary.json', 'w') as f:
        json.dump(summary, f, indent=2)

    print("\n=== Forecasting Summary ===")
    print(f"Total forecast: {'Generated' if model else 'Failed'}")
    print(f"Category forecasts: {len(category_forecasts)}")
    print(f"Store forecasts: {len(store_forecasts)}")
    print(f"Item forecasts: {len(item_forecasts)}")

    print("\n" + "=" * 50)
    print("Forecasting Complete!")
    print("=" * 50)

if __name__ == "__main__":
    main()
