import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { formatNumber, formatCurrency } from '../utils/format'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-dark-800/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-dark-600">
      <p className="font-semibold text-dark-100 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-dark-300">{entry.name}:</span>
          <span className="font-mono font-medium text-dark-100">
            {entry.name.toLowerCase().includes('revenue')
              ? formatCurrency(entry.value, false)
              : formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function TimeSeriesChart({
  data,
  title,
  dataKey = 'quantity',
  secondaryKey = null,
  xAxisKey = 'date',
  height = 350,
  showLegend = true
}) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-dark-400">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0077BB" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0077BB" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EE7733" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#EE7733" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#334155' }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatNumber(v)}
          />
          {secondaryKey && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatNumber(v)}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend wrapperStyle={{ color: '#e2e8f0' }} />}
          <Area
            yAxisId="left"
            type="monotone"
            dataKey={dataKey}
            name="Quantity"
            stroke="#0077BB"
            strokeWidth={2}
            fill="url(#colorPrimary)"
          />
          {secondaryKey && (
            <Area
              yAxisId="right"
              type="monotone"
              dataKey={secondaryKey}
              name="Revenue"
              stroke="#EE7733"
              strokeWidth={2}
              fill="url(#colorSecondary)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
