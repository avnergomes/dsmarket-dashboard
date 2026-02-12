import { formatNumber } from '../utils/format'

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getHeatColor(value, min, max) {
  const normalized = (value - min) / (max - min || 1)

  // Indigo gradient
  if (normalized < 0.2) return '#e0e7ff'
  if (normalized < 0.4) return '#c7d2fe'
  if (normalized < 0.6) return '#a5b4fc'
  if (normalized < 0.8) return '#818cf8'
  return '#6366f1'
}

export default function SeasonalHeatmap({ data, title = 'Seasonal Pattern' }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-slate-400">
          No seasonal data available
        </div>
      </div>
    )
  }

  // Convert to matrix format
  const matrix = {}
  let minValue = Infinity
  let maxValue = -Infinity

  data.forEach(({ dayOfWeek, month, value }) => {
    const key = `${dayOfWeek}-${month}`
    matrix[key] = value
    minValue = Math.min(minValue, value)
    maxValue = Math.max(maxValue, value)
  })

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">{title}</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-slate-500">Day</th>
              {MONTHS.map((month, i) => (
                <th key={month} className="p-2 text-center text-sm font-medium text-slate-500">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, dayIdx) => (
              <tr key={day}>
                <td className="p-2 text-sm text-slate-600 font-medium">{day}</td>
                {MONTHS.map((_, monthIdx) => {
                  const key = `${day}-${monthIdx + 1}`
                  const value = matrix[key] || 0

                  return (
                    <td key={monthIdx} className="p-1">
                      <div
                        className="w-full h-10 rounded flex items-center justify-center text-xs font-mono"
                        style={{
                          backgroundColor: getHeatColor(value, minValue, maxValue),
                          color: value > (minValue + maxValue) / 2 ? 'white' : '#334155'
                        }}
                        title={`${day}, ${MONTHS[monthIdx]}: ${formatNumber(value)}`}
                      >
                        {formatNumber(value)}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="text-xs text-slate-500">Low</span>
        <div className="flex">
          {['#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1'].map((color) => (
            <div
              key={color}
              className="w-8 h-4"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span className="text-xs text-slate-500">High</span>
      </div>
    </div>
  )
}
