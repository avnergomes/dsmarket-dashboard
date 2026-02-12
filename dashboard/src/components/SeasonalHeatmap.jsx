import { formatNumber } from '../utils/format'

const DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function getHeatColor(value, min, max) {
  const normalized = (value - min) / (max - min || 1)

  // Colorblind-friendly teal gradient (dark theme)
  if (normalized < 0.2) return '#134e4a'
  if (normalized < 0.4) return '#115e59'
  if (normalized < 0.6) return '#0d7377'
  if (normalized < 0.8) return '#0a8a8f'
  return '#009988'
}

export default function SeasonalHeatmap({ data, title = 'Seasonal Pattern' }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-dark-400">
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
    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-dark-300">Day</th>
              {MONTHS.map((month, i) => (
                <th key={month} className="p-2 text-center text-sm font-medium text-dark-300">
                  {month}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, dayIdx) => (
              <tr key={day}>
                <td className="p-2 text-sm text-dark-200 font-medium">{day}</td>
                {MONTHS.map((_, monthIdx) => {
                  const key = `${day}-${monthIdx + 1}`
                  const value = matrix[key] || 0

                  return (
                    <td key={monthIdx} className="p-1">
                      <div
                        className="w-full h-10 rounded flex items-center justify-center text-xs font-mono"
                        style={{
                          backgroundColor: getHeatColor(value, minValue, maxValue),
                          color: '#e2e8f0'
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
        <span className="text-xs text-dark-400">Low</span>
        <div className="flex">
          {['#134e4a', '#115e59', '#0d7377', '#0a8a8f', '#009988'].map((color) => (
            <div
              key={color}
              className="w-8 h-4"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <span className="text-xs text-dark-400">High</span>
      </div>
    </div>
  )
}
