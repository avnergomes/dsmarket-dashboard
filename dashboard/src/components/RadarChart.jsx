import { useMemo } from 'react'
import * as d3 from 'd3'
import { formatNumber, CHART_COLORS } from '../utils/format'

const MARGIN = { top: 40, right: 80, bottom: 40, left: 80 }

function polarToCartesian(angle, radius) {
  return {
    x: radius * Math.cos(angle - Math.PI / 2),
    y: radius * Math.sin(angle - Math.PI / 2)
  }
}

export default function RadarChart({ data, title = "Store Performance Comparison", width = 500, height = 400 }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    // Normalize data for radar chart
    const maxQuantity = Math.max(...data.map(d => d.quantity))
    const maxRevenue = Math.max(...data.map(d => d.revenue))
    const maxItems = Math.max(...data.map(d => d.uniqueItems))

    // Calculate derived metrics
    const withMetrics = data.map(d => ({
      ...d,
      avgTicket: d.revenue / d.quantity,
      revenuePerItem: d.revenue / d.uniqueItems
    }))

    const maxAvgTicket = Math.max(...withMetrics.map(d => d.avgTicket))
    const maxRevenuePerItem = Math.max(...withMetrics.map(d => d.revenuePerItem))

    const variables = [
      { key: 'quantity', label: 'Quantity', max: maxQuantity },
      { key: 'revenue', label: 'Revenue', max: maxRevenue },
      { key: 'uniqueItems', label: 'Products', max: maxItems },
      { key: 'avgTicket', label: 'Avg Ticket', max: maxAvgTicket },
      { key: 'revenuePerItem', label: 'Rev/Product', max: maxRevenuePerItem }
    ]

    const normalized = withMetrics.map(store => ({
      name: store.storeName?.replace(/_/g, ' ') || store.storeCode,
      code: store.storeCode,
      region: store.region,
      values: variables.map(v => ({
        axis: v.label,
        value: store[v.key] / v.max,
        rawValue: store[v.key]
      }))
    }))

    return { stores: normalized, variables }
  }, [data])

  if (!chartData) {
    return (
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-dark-400">
          No store data available
        </div>
      </div>
    )
  }

  const innerWidth = width - MARGIN.left - MARGIN.right
  const innerHeight = height - MARGIN.top - MARGIN.bottom
  const radius = Math.min(innerWidth, innerHeight) / 2
  const centerX = width / 2
  const centerY = height / 2

  const { stores, variables } = chartData
  const angleSlice = (2 * Math.PI) / variables.length

  // Create scales
  const radiusScale = d3.scaleLinear().domain([0, 1]).range([0, radius])

  // Grid levels
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0]

  // Create axis lines and labels
  const axes = variables.map((v, i) => {
    const angle = angleSlice * i
    const lineEnd = polarToCartesian(angle, radius)
    const labelPos = polarToCartesian(angle, radius + 20)
    return { ...v, angle, lineEnd, labelPos, index: i }
  })

  // Create path for each store
  const radarLine = d3.lineRadial()
    .radius(d => radiusScale(d.value))
    .angle((d, i) => i * angleSlice)
    .curve(d3.curveLinearClosed)

  // Only show top 5 stores for clarity
  const topStores = stores.slice(0, 5)

  return (
    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>

      <div className="flex flex-col lg:flex-row gap-6">
        <svg width={width} height={height} className="mx-auto">
          <g transform={`translate(${centerX}, ${centerY})`}>
            {/* Grid circles */}
            {levels.map((level, i) => (
              <circle
                key={`grid-${i}`}
                r={radiusScale(level)}
                fill="none"
                stroke="#334155"
                strokeDasharray="4,4"
                strokeOpacity={0.5}
              />
            ))}

            {/* Grid level labels */}
            {levels.map((level, i) => (
              <text
                key={`label-${i}`}
                x={4}
                y={-radiusScale(level)}
                fill="#64748b"
                fontSize={10}
                alignmentBaseline="middle"
              >
                {(level * 100).toFixed(0)}%
              </text>
            ))}

            {/* Axis lines */}
            {axes.map((axis, i) => (
              <line
                key={`axis-${i}`}
                x1={0}
                y1={0}
                x2={axis.lineEnd.x}
                y2={axis.lineEnd.y}
                stroke="#334155"
                strokeWidth={1}
              />
            ))}

            {/* Axis labels */}
            {axes.map((axis, i) => (
              <text
                key={`axis-label-${i}`}
                x={axis.labelPos.x}
                y={axis.labelPos.y}
                fill="#94a3b8"
                fontSize={11}
                textAnchor={
                  Math.abs(axis.labelPos.x) < 10 ? 'middle' :
                  axis.labelPos.x > 0 ? 'start' : 'end'
                }
                alignmentBaseline="middle"
              >
                {axis.label}
              </text>
            ))}

            {/* Store radar areas */}
            {topStores.map((store, storeIdx) => {
              const pathData = radarLine(store.values)
              const color = CHART_COLORS[storeIdx % CHART_COLORS.length]

              return (
                <g key={store.code}>
                  <path
                    d={pathData}
                    fill={color}
                    fillOpacity={0.15}
                    stroke={color}
                    strokeWidth={2}
                  />
                  {/* Data points */}
                  {store.values.map((val, i) => {
                    const pos = polarToCartesian(i * angleSlice, radiusScale(val.value))
                    return (
                      <circle
                        key={`${store.code}-point-${i}`}
                        cx={pos.x}
                        cy={pos.y}
                        r={4}
                        fill={color}
                        stroke="#1e293b"
                        strokeWidth={1}
                      >
                        <title>{`${store.name}: ${val.axis} = ${formatNumber(val.rawValue)}`}</title>
                      </circle>
                    )
                  })}
                </g>
              )
            })}
          </g>
        </svg>

        {/* Legend */}
        <div className="flex flex-col gap-2 min-w-[140px]">
          <h4 className="text-sm font-semibold text-dark-300 mb-2">Top 5 Stores</h4>
          {topStores.map((store, i) => (
            <div key={store.code} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <span className="text-xs text-dark-200 truncate">{store.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
