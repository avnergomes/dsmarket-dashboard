import { useMemo } from 'react'
import * as d3 from 'd3'
import { formatNumber, CHART_COLORS } from '../utils/format'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function CircularBarChart({
  data,
  title = "Monthly Sales Pattern",
  width = 400,
  height = 400
}) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    // Map month numbers to names
    const mapped = data.map(d => ({
      month: MONTHS[d.month - 1],
      monthNum: d.month,
      quantity: d.quantity,
      revenue: d.revenue
    }))

    return mapped
  }, [data])

  if (!chartData) {
    return (
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-dark-400">
          No seasonal data available
        </div>
      </div>
    )
  }

  const centerX = width / 2
  const centerY = height / 2
  const innerRadius = 60
  const outerRadius = Math.min(width, height) / 2 - 40

  const maxValue = Math.max(...chartData.map(d => d.quantity))

  // Create scales
  const xScale = d3.scaleBand()
    .domain(chartData.map(d => d.month))
    .range([0, 2 * Math.PI])
    .padding(0.1)

  const yScale = d3.scaleRadial()
    .domain([0, maxValue])
    .range([innerRadius, outerRadius])

  // Arc generator
  const arcGenerator = d3.arc()

  // Create grid circles
  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  return (
    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>

      <svg width={width} height={height} className="mx-auto">
        <g transform={`translate(${centerX}, ${centerY})`}>
          {/* Grid circles */}
          {gridLevels.map((level, i) => (
            <circle
              key={`grid-${i}`}
              r={innerRadius + (outerRadius - innerRadius) * level}
              fill="none"
              stroke="#334155"
              strokeDasharray="4,4"
              strokeOpacity={0.5}
            />
          ))}

          {/* Inner circle */}
          <circle
            r={innerRadius}
            fill="#0f172a"
            stroke="#334155"
            strokeWidth={1}
          />

          {/* Grid labels */}
          {gridLevels.map((level, i) => (
            <text
              key={`grid-label-${i}`}
              x={4}
              y={-(innerRadius + (outerRadius - innerRadius) * level)}
              fill="#64748b"
              fontSize={9}
              alignmentBaseline="middle"
            >
              {formatNumber(maxValue * level / 1000000, 1)}M
            </text>
          ))}

          {/* Bars */}
          {chartData.map((d, i) => {
            const arcPath = arcGenerator({
              innerRadius: innerRadius,
              outerRadius: yScale(d.quantity),
              startAngle: xScale(d.month),
              endAngle: xScale(d.month) + xScale.bandwidth()
            })

            // Calculate label position
            const midAngle = xScale(d.month) + xScale.bandwidth() / 2 - Math.PI / 2
            const labelRadius = outerRadius + 20
            const labelX = labelRadius * Math.cos(midAngle)
            const labelY = labelRadius * Math.sin(midAngle)

            // Determine text anchor based on angle
            const textAnchor = midAngle > Math.PI / 2 && midAngle < 3 * Math.PI / 2 ? 'end' : 'start'
            const adjustedAnchor = Math.abs(Math.cos(midAngle)) < 0.1 ? 'middle' : textAnchor

            return (
              <g key={d.month} className="group cursor-pointer">
                <path
                  d={arcPath}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                  fillOpacity={0.8}
                  stroke="#1e293b"
                  strokeWidth={1}
                  className="transition-all group-hover:fill-opacity-100"
                >
                  <title>
                    {`${d.month}\nQuantity: ${formatNumber(d.quantity)}\nRevenue: $${formatNumber(d.revenue)}`}
                  </title>
                </path>

                {/* Month label */}
                <text
                  x={labelX}
                  y={labelY}
                  fill="#94a3b8"
                  fontSize={11}
                  fontWeight="500"
                  textAnchor={adjustedAnchor}
                  alignmentBaseline="middle"
                  transform={`rotate(${(midAngle * 180) / Math.PI > 90 && (midAngle * 180) / Math.PI < 270 ? 180 : 0}, ${labelX}, ${labelY})`}
                >
                  {d.month}
                </text>
              </g>
            )
          })}

          {/* Center text */}
          <text
            x={0}
            y={-8}
            fill="#e2e8f0"
            fontSize={12}
            fontWeight="bold"
            textAnchor="middle"
          >
            Total
          </text>
          <text
            x={0}
            y={10}
            fill="#94a3b8"
            fontSize={11}
            fontFamily="monospace"
            textAnchor="middle"
          >
            {formatNumber(chartData.reduce((sum, d) => sum + d.quantity, 0) / 1000000, 1)}M
          </text>
        </g>
      </svg>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-dark-400">Peak Month</p>
          <p className="text-sm font-semibold text-dark-100">
            {chartData.reduce((max, d) => d.quantity > max.quantity ? d : max, chartData[0]).month}
          </p>
        </div>
        <div>
          <p className="text-xs text-dark-400">Avg Monthly</p>
          <p className="text-sm font-semibold text-dark-100 font-mono">
            {formatNumber(chartData.reduce((sum, d) => sum + d.quantity, 0) / 12 / 1000000, 2)}M
          </p>
        </div>
        <div>
          <p className="text-xs text-dark-400">Lowest Month</p>
          <p className="text-sm font-semibold text-dark-100">
            {chartData.reduce((min, d) => d.quantity < min.quantity ? d : min, chartData[0]).month}
          </p>
        </div>
      </div>
    </div>
  )
}
