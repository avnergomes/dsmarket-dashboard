import { useMemo } from 'react'
import * as d3 from 'd3'
import { formatNumber, CHART_COLORS } from '../utils/format'

const CATEGORY_COLORS = {
  'SUPERMARKET': '#0077BB',
  'HOME_&_GARDEN': '#009988',
  'ACCESORIES': '#EE7733'
}

export default function TreemapChart({
  categories,
  departments,
  title = "Revenue by Category & Department",
  width = 700,
  height = 400
}) {
  const treeData = useMemo(() => {
    if (!categories || !departments) return null

    // Build hierarchical structure
    const hierarchy = {
      name: 'Total',
      children: categories.map(cat => ({
        name: cat.category,
        children: departments
          .filter(dept => dept.department.startsWith(cat.category.split('_')[0]))
          .map(dept => ({
            name: dept.department,
            value: dept.revenue,
            quantity: dept.quantity,
            uniqueItems: dept.uniqueItems,
            category: cat.category
          }))
      }))
    }

    return hierarchy
  }, [categories, departments])

  if (!treeData) {
    return (
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-dark-400">
          No data available
        </div>
      </div>
    )
  }

  // Create D3 treemap
  const root = d3.hierarchy(treeData)
    .sum(d => d.value || 0)
    .sort((a, b) => b.value - a.value)

  const treemapLayout = d3.treemap()
    .size([width, height])
    .paddingOuter(4)
    .paddingTop(22)
    .paddingInner(2)
    .round(true)

  treemapLayout(root)

  // Format department name
  const formatName = (name) => {
    return name
      .replace(/_/g, ' ')
      .replace(/&/g, '&')
      .split(' ')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Get color for a node
  const getColor = (node) => {
    if (node.depth === 1) {
      return CATEGORY_COLORS[node.data.name] || CHART_COLORS[0]
    }
    if (node.depth === 2 && node.data.category) {
      const baseColor = CATEGORY_COLORS[node.data.category] || CHART_COLORS[0]
      return d3.color(baseColor).brighter(0.3).toString()
    }
    return '#334155'
  }

  return (
    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-dark-100 mb-4">{title}</h3>

      <svg width={width} height={height} className="mx-auto">
        {/* Category groups (depth 1) */}
        {root.children?.map((category, catIdx) => (
          <g key={category.data.name}>
            {/* Category background */}
            <rect
              x={category.x0}
              y={category.y0}
              width={category.x1 - category.x0}
              height={category.y1 - category.y0}
              fill={getColor(category)}
              fillOpacity={0.2}
              stroke={getColor(category)}
              strokeWidth={2}
              rx={4}
            />

            {/* Category label */}
            <text
              x={category.x0 + 6}
              y={category.y0 + 15}
              fill="#e2e8f0"
              fontSize={12}
              fontWeight="bold"
            >
              {formatName(category.data.name)}
            </text>

            {/* Department leaves */}
            {category.children?.map((dept, deptIdx) => {
              const deptWidth = dept.x1 - dept.x0
              const deptHeight = dept.y1 - dept.y0
              const showLabel = deptWidth > 50 && deptHeight > 30

              return (
                <g key={dept.data.name} className="group cursor-pointer">
                  <rect
                    x={dept.x0}
                    y={dept.y0}
                    width={deptWidth}
                    height={deptHeight}
                    fill={getColor(dept)}
                    fillOpacity={0.7}
                    stroke="#1e293b"
                    strokeWidth={1}
                    rx={2}
                    className="transition-all group-hover:fill-opacity-100"
                  >
                    <title>
                      {`${formatName(dept.data.name)}\nRevenue: $${formatNumber(dept.value)}\nQuantity: ${formatNumber(dept.data.quantity)}\nProducts: ${formatNumber(dept.data.uniqueItems)}`}
                    </title>
                  </rect>

                  {showLabel && (
                    <>
                      <text
                        x={dept.x0 + 4}
                        y={dept.y0 + 14}
                        fill="#1e293b"
                        fontSize={10}
                        fontWeight="500"
                        className="pointer-events-none"
                      >
                        {dept.data.name.split('_').pop()}
                      </text>
                      <text
                        x={dept.x0 + 4}
                        y={dept.y0 + 26}
                        fill="#1e293b"
                        fontSize={9}
                        fontFamily="monospace"
                        className="pointer-events-none"
                      >
                        ${formatNumber(dept.value / 1000000, 1)}M
                      </text>
                    </>
                  )}
                </g>
              )
            })}
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6">
        {Object.entries(CATEGORY_COLORS).map(([name, color]) => (
          <div key={name} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
            <span className="text-xs text-dark-400">{formatName(name)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
