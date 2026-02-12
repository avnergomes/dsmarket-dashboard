import { useMemo } from 'react'
import * as d3 from 'd3'
import { formatNumber, CHART_COLORS } from '../utils/format'

const MARGIN = { top: 30, right: 30, bottom: 30, left: 60 }

export default function RidgelineChart({
  data,
  title = "Sales Distribution by Year",
  width = 600,
  height = 400
}) {
  const chartData = useMemo(() => {
    if (!data || !data.daily || data.daily.length === 0) return null

    // Group data by year
    const byYear = {}
    data.daily.forEach(d => {
      const year = d.date.substring(0, 4)
      if (!byYear[year]) byYear[year] = []
      if (d.quantity > 0) {
        byYear[year].push(d.quantity)
      }
    })

    const years = Object.keys(byYear).sort()

    // Calculate kernel density for each year
    const allValues = data.daily.map(d => d.quantity).filter(v => v > 0)
    const minVal = d3.min(allValues)
    const maxVal = d3.max(allValues)

    // Create density estimator
    const kde = kernelDensityEstimator(
      kernelEpanechnikov(3000),
      d3.range(minVal, maxVal, (maxVal - minVal) / 100)
    )

    const densities = years.map(year => ({
      year,
      density: kde(byYear[year]),
      count: byYear[year].length,
      mean: d3.mean(byYear[year]),
      median: d3.median(byYear[year])
    }))

    return { densities, minVal, maxVal, years }
  }, [data])

  if (!chartData) {
    return (
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-dark-400">
          No timeseries data available
        </div>
      </div>
    )
  }

  const innerWidth = width - MARGIN.left - MARGIN.right
  const innerHeight = height - MARGIN.top - MARGIN.bottom

  const { densities, minVal, maxVal, years } = chartData

  // Find max density for scaling
  const maxDensity = d3.max(densities.flatMap(d => d.density.map(p => p[1])))

  // Scales
  const xScale = d3.scaleLinear()
    .domain([minVal, maxVal])
    .range([0, innerWidth])

  const yScale = d3.scaleBand()
    .domain(years)
    .range([0, innerHeight])
    .paddingInner(0.1)

  // Height scale for density curves
  const heightScale = d3.scaleLinear()
    .domain([0, maxDensity])
    .range([0, yScale.bandwidth() * 1.5])

  // Area generator
  const areaGenerator = d3.area()
    .x(d => xScale(d[0]))
    .y0(0)
    .y1(d => -heightScale(d[1]))
    .curve(d3.curveBasis)

  return (
    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>

      <svg width={width} height={height}>
        <defs>
          {years.map((year, i) => (
            <linearGradient
              key={`gradient-${year}`}
              id={`ridge-gradient-${year}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.8} />
              <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.2} />
            </linearGradient>
          ))}
        </defs>

        <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
          {/* X-axis */}
          <g transform={`translate(0, ${innerHeight})`}>
            {xScale.ticks(6).map((tick, i) => (
              <g key={`x-tick-${i}`} transform={`translate(${xScale(tick)}, 0)`}>
                <line y1={0} y2={5} stroke="#64748b" />
                <text
                  y={18}
                  fill="#64748b"
                  fontSize={10}
                  textAnchor="middle"
                >
                  {formatNumber(tick / 1000, 0)}K
                </text>
              </g>
            ))}
            <text
              x={innerWidth / 2}
              y={28}
              fill="#94a3b8"
              fontSize={11}
              textAnchor="middle"
            >
              Daily Quantity
            </text>
          </g>

          {/* Ridge lines */}
          {densities.map((yearData, i) => {
            const yOffset = yScale(yearData.year) + yScale.bandwidth()
            const color = CHART_COLORS[i % CHART_COLORS.length]

            return (
              <g key={yearData.year} transform={`translate(0, ${yOffset})`} className="group">
                {/* Fill area */}
                <path
                  d={areaGenerator(yearData.density)}
                  fill={`url(#ridge-gradient-${yearData.year})`}
                  className="transition-opacity group-hover:opacity-100 opacity-70"
                />

                {/* Line */}
                <path
                  d={d3.line()
                    .x(d => xScale(d[0]))
                    .y(d => -heightScale(d[1]))
                    .curve(d3.curveBasis)(yearData.density)}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                />

                {/* Mean indicator */}
                <line
                  x1={xScale(yearData.mean)}
                  x2={xScale(yearData.mean)}
                  y1={0}
                  y2={-heightScale(maxDensity) * 0.8}
                  stroke={color}
                  strokeWidth={1}
                  strokeDasharray="3,3"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />

                {/* Year label */}
                <text
                  x={-8}
                  y={0}
                  fill="#94a3b8"
                  fontSize={12}
                  fontWeight="500"
                  textAnchor="end"
                  alignmentBaseline="middle"
                >
                  {yearData.year}
                </text>

                {/* Stats on hover */}
                <text
                  x={innerWidth - 5}
                  y={-5}
                  fill="#e2e8f0"
                  fontSize={10}
                  textAnchor="end"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  avg: {formatNumber(yearData.mean, 0)} | n={yearData.count}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
        {densities.map((yearData, i) => (
          <div key={yearData.year} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="text-xs text-dark-300">
              {yearData.year}: avg {formatNumber(yearData.mean, 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Kernel density estimator helper functions
function kernelDensityEstimator(kernel, X) {
  return function(V) {
    return X.map(x => [x, d3.mean(V, v => kernel(x - v))])
  }
}

function kernelEpanechnikov(k) {
  return function(v) {
    return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0
  }
}
