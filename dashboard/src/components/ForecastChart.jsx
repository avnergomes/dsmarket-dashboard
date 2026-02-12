import { useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import { TrendingUp, AlertCircle } from 'lucide-react'
import { formatNumber, formatPercent } from '../utils/format'
import { useForecast } from '../hooks/useData'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-dark-800/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-dark-600">
      <p className="font-semibold text-dark-100">{label}</p>
      <div className="mt-2 space-y-1 text-sm">
        {data.value !== undefined && (
          <p className="text-dark-300">
            Value: <span className="font-mono font-medium text-dark-100">{formatNumber(data.value)}</span>
          </p>
        )}
        {data.lower !== undefined && data.upper !== undefined && (
          <p className="text-dark-400 text-xs">
            95% CI: [{formatNumber(data.lower)} - {formatNumber(data.upper)}]
          </p>
        )}
      </div>
    </div>
  )
}

function ForecastSelector({ options, selectedId, selectedType, onSelect }) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-dark-300 mb-1">Type</label>
        <select
          value={selectedType}
          onChange={(e) => onSelect(null, e.target.value)}
          className="px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="total">Total Sales</option>
          <option value="category">By Category</option>
          <option value="store">By Store</option>
          <option value="item">Top Items</option>
        </select>
      </div>

      {selectedType !== 'total' && options && (
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-dark-300 mb-1">
            Select {selectedType}
          </label>
          <select
            value={selectedId || ''}
            onChange={(e) => onSelect(e.target.value, selectedType)}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select...</option>
            {options.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name || opt.id}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

function MetricsCard({ metrics }) {
  if (!metrics) return null

  return (
    <div className="bg-dark-700 rounded-xl p-4 border border-dark-600">
      <h4 className="text-sm font-semibold text-dark-200 mb-3">Model Performance</h4>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-dark-400">MAPE</p>
          <p className="font-mono font-semibold text-lg text-dark-100">
            {formatPercent(metrics.mape)}
          </p>
        </div>
        <div>
          <p className="text-xs text-dark-400">MAE</p>
          <p className="font-mono font-semibold text-lg text-dark-100">
            {formatNumber(metrics.mae)}
          </p>
        </div>
        <div>
          <p className="text-xs text-dark-400">RMSE</p>
          <p className="font-mono font-semibold text-lg text-dark-100">
            {formatNumber(metrics.rmse)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ForecastChart({ forecastSummary }) {
  const [selectedType, setSelectedType] = useState('total')
  const [selectedId, setSelectedId] = useState(null)

  // Get options based on type
  const getOptions = () => {
    if (!forecastSummary) return []
    switch (selectedType) {
      case 'category':
        return forecastSummary.categories || []
      case 'store':
        return forecastSummary.stores || []
      case 'item':
        return forecastSummary.items || []
      default:
        return []
    }
  }

  // Load forecast data
  const forecastId = selectedType === 'total' ? 'total' : selectedId
  const { forecast, loading, error } = useForecast(forecastId, selectedType)

  const handleSelect = (id, type) => {
    setSelectedType(type)
    setSelectedId(type === 'total' ? null : id)
  }

  // Combine historical and forecast data
  const chartData = forecast ? [
    ...(forecast.historical || []).map(d => ({ ...d, type: 'historical' })),
    ...(forecast.forecast || []).map(d => ({ ...d, type: 'forecast' }))
  ] : []

  // Find the split point
  const splitDate = forecast?.historical?.[forecast.historical.length - 1]?.date

  return (
    <div className="space-y-6">
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary-400" />
          <h3 className="text-lg font-semibold text-dark-100">Sales Forecast</h3>
        </div>

        <ForecastSelector
          options={getOptions()}
          selectedId={selectedId}
          selectedType={selectedType}
          onSelect={handleSelect}
        />

        {loading && (
          <div className="h-64 flex items-center justify-center text-dark-400">
            Loading forecast...
          </div>
        )}

        {error && (
          <div className="h-64 flex items-center justify-center text-secondary-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {!loading && !error && chartData.length > 0 && (
          <>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHistorical" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0077BB" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0077BB" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EE7733" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EE7733" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickFormatter={(v) => formatNumber(v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: '#e2e8f0' }} />

                {splitDate && (
                  <ReferenceLine x={splitDate} stroke="#64748b" strokeDasharray="5 5" />
                )}

                {/* Confidence interval */}
                <Area
                  type="monotone"
                  dataKey="upper"
                  stroke="transparent"
                  fill="#EE7733"
                  fillOpacity={0.15}
                  name="Upper CI"
                />
                <Area
                  type="monotone"
                  dataKey="lower"
                  stroke="transparent"
                  fill="#0f172a"
                  name="Lower CI"
                />

                {/* Main line */}
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#0077BB"
                  strokeWidth={2}
                  fill="url(#colorHistorical)"
                  name="Value"
                />
              </AreaChart>
            </ResponsiveContainer>

            {forecast?.metrics && (
              <div className="mt-4">
                <MetricsCard metrics={forecast.metrics} />
              </div>
            )}
          </>
        )}

        {!loading && !error && chartData.length === 0 && selectedType !== 'total' && !selectedId && (
          <div className="h-64 flex items-center justify-center text-dark-400">
            Select a {selectedType} to view its forecast
          </div>
        )}
      </div>
    </div>
  )
}
