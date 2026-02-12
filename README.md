# DSMarket Analytics Dashboard

End-to-end retail analytics platform with ML-powered forecasting and product clustering.

## Features

- **Sales Analysis**: Interactive dashboards with KPIs, time series, and category breakdowns
- **Product Clustering**: ML-based segmentation of products by sales behavior
- **Sales Forecasting**: 28-day predictions using Random Forest with confidence intervals
- **Store Replenishment**: Inventory optimization with safety stock calculations

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- Recharts

### Backend
- Python 3.11+
- Pandas, Scikit-learn, LightGBM
- GitHub Actions for CI/CD

## Project Structure

```
dsmarket-dashboard/
├── dashboard/          # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── hooks/      # Data loading hooks
│   │   └── utils/      # Formatting utilities
│   └── public/data/    # Pre-computed JSON data
├── scripts/            # Python data pipelines
│   ├── etl_process.py
│   ├── preprocess_data.py
│   ├── clustering.py
│   └── generate_forecasts.py
└── data/               # Raw and processed data
```

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+

### Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run data pipeline:
```bash
python scripts/etl_process.py
python scripts/preprocess_data.py
python scripts/clustering.py
python scripts/generate_forecasts.py
```

3. Install and run dashboard:
```bash
cd dashboard
npm install
npm run dev
```

### Build for Production

```bash
cd dashboard
npm run build
```

## Deployment

The dashboard is automatically deployed to GitHub Pages on push to `main` branch.

## License

MIT
