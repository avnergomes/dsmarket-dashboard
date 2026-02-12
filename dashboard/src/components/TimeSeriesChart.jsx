import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'
import { formatNumber, formatCurrency } from '../utils/format'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-slate-200">
      <p className="font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-mono font-medium text-slate-800">
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
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-slate-400">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatNumber(v)}
          />
          {secondaryKey && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => formatNumber(v)}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Area
            yAxisId="left"
            type="monotone"
            dataKey={dataKey}
            name="Quantity"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#colorPrimary)"
          />
          {secondaryKey && (
            <Area
              yAxisId="right"
              type="monotone"
              dataKey={secondaryKey}
              name="Revenue"
              stroke="#ec4899"
              strokeWidth={2}
              fill="url(#colorSecondary)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
