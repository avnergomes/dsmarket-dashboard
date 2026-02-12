import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { formatNumber, formatCurrency, CHART_COLORS } from '../utils/format'

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-dark-800/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-dark-600">
      <p className="font-semibold text-dark-100">{data.category || data.department || data.name}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-dark-300">
          Revenue: <span className="font-mono font-medium text-dark-100">{formatCurrency(data.revenue)}</span>
        </p>
        <p className="text-dark-300">
          Quantity: <span className="font-mono font-medium text-dark-100">{formatNumber(data.quantity)}</span>
        </p>
        {data.uniqueItems && (
          <p className="text-dark-300">
            Items: <span className="font-mono font-medium text-dark-100">{formatNumber(data.uniqueItems, 0)}</span>
          </p>
        )}
      </div>
    </div>
  )
}

export function CategoryPieChart({ data, title, onClick }) {
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

  // Take top 8 for pie chart
  const topData = data.slice(0, 8)

  return (
    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>
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
              <span className="text-sm text-dark-200">{value}</span>
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
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-dark-400">
          No data available
        </div>
      </div>
    )
  }

  // Take top 10 for bar chart
  const topData = data.slice(0, 10)

  return (
    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={topData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            type="number"
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            tickFormatter={(v) => formatNumber(v)}
          />
          <YAxis
            type="category"
            dataKey={nameKey}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="revenue"
            fill="#0077BB"
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
