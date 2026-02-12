import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { formatNumber, formatCurrency, CHART_COLORS } from '../utils/format'

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-slate-200">
      <p className="font-semibold text-slate-700">{data.category || data.department || data.name}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-slate-600">
          Revenue: <span className="font-mono font-medium">{formatCurrency(data.revenue)}</span>
        </p>
        <p className="text-slate-600">
          Quantity: <span className="font-mono font-medium">{formatNumber(data.quantity)}</span>
        </p>
        {data.uniqueItems && (
          <p className="text-slate-600">
            Items: <span className="font-mono font-medium">{formatNumber(data.uniqueItems, 0)}</span>
          </p>
        )}
      </div>
    </div>
  )
}

export function CategoryPieChart({ data, title, onClick }) {
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

  // Take top 8 for pie chart
  const topData = data.slice(0, 8)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={topData}
            dataKey="revenue"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            onClick={onClick}
            cursor={onClick ? 'pointer' : 'default'}
          >
            {topData.map((entry, index) => (
              <Cell
                key={entry.category}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            formatter={(value) => (
              <span className="text-sm text-slate-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CategoryBarChart({ data, title, onClick, nameKey = 'category' }) {
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

  // Take top 10 for bar chart
  const topData = data.slice(0, 10)

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={topData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#64748b' }}
            tickFormatter={(v) => formatNumber(v)}
          />
          <YAxis
            type="category"
            dataKey={nameKey}
            tick={{ fontSize: 11, fill: '#64748b' }}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="revenue"
            fill="#6366f1"
            radius={[0, 4, 4, 0]}
            onClick={onClick}
            cursor={onClick ? 'pointer' : 'default'}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default CategoryPieChart
