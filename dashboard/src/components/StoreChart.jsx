import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { formatNumber, formatCurrency, CHART_COLORS } from '../utils/format'

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-dark-800/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-dark-600">
      <p className="font-semibold text-dark-100">{data.storeName || data.storeCode}</p>
      <p className="text-dark-400 text-sm">{data.region}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-dark-300">
          Revenue: <span className="font-mono font-medium text-dark-100">{formatCurrency(data.revenue)}</span>
        </p>
        <p className="text-dark-300">
          Quantity: <span className="font-mono font-medium text-dark-100">{formatNumber(data.quantity)}</span>
        </p>
      </div>
    </div>
  )
}

export default function StoreChart({ data, title, onClick }) {
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
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="storeCode"
            tick={{ fontSize: 12, fill: '#94a3b8' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            tickFormatter={(v) => formatNumber(v)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="revenue"
            radius={[4, 4, 0, 0]}
            onClick={onClick}
            cursor={onClick ? 'pointer' : 'default'}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.storeCode}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
