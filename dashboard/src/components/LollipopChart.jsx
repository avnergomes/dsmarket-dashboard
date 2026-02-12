import { useMemo } from 'react'
import * as d3 from 'd3'
import { formatNumber, CHART_COLORS } from '../utils/format'

const MARGIN = { top: 20, right: 30, bottom: 20, left: 120 }

export default function LollipopChart({
  data,
  title = "Department Rankings",
  valueKey = "revenue",
  nameKey = "department",
  width = 500,
  height = 350
}) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    const sorted = [...data].sort((a, b) => b[valueKey] - a[valueKey])
    const maxValue = Math.max(...sorted.map(d => d[valueKey]))

    return { items: sorted, maxValue }
  }, [data, valueKey])

  if (!chartData) {
    return (
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-dark-400">
          No data available
        </div>
      </div>
    )
  }

  const innerWidth = width - MARGIN.left - MARGIN.right
  const innerHeight = height - MARGIN.top - MARGIN.bottom

  const { items, maxValue } = chartData

  // Scales
  const xScale = d3.scaleLinear()
    .domain([0, maxValue])
    .range([0, innerWidth])

  const yScale = d3.scaleBand()
    .domain(items.map(d => d[nameKey]))
    .range([0, innerHeight])
    .padding(0.4)

  // Format department names
  const formatName = (name) => {
    return name
      .replace(/_/g, ' ')
      .replace(/&/g, '&')
      .split(' ')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>

      <svg width={width} height={height}>
        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {/* Grid lines */}
          {xScale.ticks(5).map((tick, i) => (
            <line
              key={`grid-${i}`}
              x1={xScale(tick)}
              x2={xScale(tick)}
              y1={0}
              y2={innerHeight}
              stroke="#334155"
              strokeDasharray="4,4"
              strokeOpacity={0.5}
            />
          ))}

          {/* X-axis labels */}
          {xScale.ticks(5).map((tick, i) => (
            <text
              key={`x-label-${i}`}
              x={xScale(tick)}
              y={innerHeight + 15}
              fill="#64748b"
              fontSize={10}
              textAnchor="middle"
            >
              ${formatNumber(tick / 1000000, 1)}M
            </text>
          ))}

          {/* Lollipops */}
          {items.map((item, i) => {
            const y = yScale(item[nameKey]) + yScale.bandwidth() / 2
            const xEnd = xScale(item[valueKey])
            const color = CHART_COLORS[i % CHART_COLORS.length]

            return (
              <g key={item[nameKey]} className="group">
                {/* Hover background */}
                <rect
                  x={-MARGIN.left}
                  y={yScale(item[nameKey]) - 2}
                  width={innerWidth + MARGIN.left + MARGIN.right}
                  height={yScale.bandwidth() + 4}
                  fill="#334155"
                  fillOpacity={0}
                  className="transition-all group-hover:fill-opacity-30"
                />

                {/* Line */}
                <line
                  x1={0}
                  x2={xEnd}
                  y1={y}
                  y2={y}
                  stroke={color}
                  strokeWidth={2}
                  className="transition-all group-hover:stroke-width-3"
                />

                {/* Circle */}
                <circle
                  cx={xEnd}
                  cy={y}
                  r={8}
                  fill={color}
                  stroke="#1e293b"
                  strokeWidth={2}
                  className="transition-all group-hover:r-10"
                >
                  <title>{`${formatName(item[nameKey])}: $${formatNumber(item[valueKey])}`}</title>
                </circle>

                {/* Value label */}
                <text
                  x={xEnd + 15}
                  y={y}
                  fill="#e2e8f0"
                  fontSize={11}
                  fontFamily="monospace"
                  alignmentBaseline="middle"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ${formatNumber(item[valueKey] / 1000000, 2)}M
                </text>

                {/* Y-axis label */}
                <text
                  x={-8}
                  y={y}
                  fill="#94a3b8"
                  fontSize={11}
                  textAnchor="end"
                  alignmentBaseline="middle"
                >
                  {formatName(item[nameKey])}
                </text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}
