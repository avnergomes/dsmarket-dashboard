import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts'
import { formatNumber, CHART_COLORS } from '../utils/format'

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-dark-800/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-dark-600">
      <p className="font-semibold text-dark-100 text-sm">{data.id}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-dark-300">
          Cluster: <span className="font-medium text-dark-100">{data.clusterName}</span>
        </p>
        <p className="text-dark-300">
          Avg Sales: <span className="font-mono text-dark-100">{formatNumber(data.mean)}</span>
        </p>
        <p className="text-dark-300">
          CV: <span className="font-mono text-dark-100">{data.cv?.toFixed(2)}</span>
        </p>
      </div>
    </div>
  )
}

function ClusterProfile({ cluster }) {
  const { characteristics, stats } = cluster

  return (
    <div className="bg-dark-700 rounded-xl shadow-lg p-5 card-hover border border-dark-600">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: CHART_COLORS[cluster.id % CHART_COLORS.length] }}
        />
        <h4 className="font-semibold text-dark-100">{cluster.name}</h4>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-dark-400">Items</span>
          <span className="font-mono font-medium text-dark-200">{formatNumber(cluster.nItems, 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-dark-400">Avg Daily Sales</span>
          <span className="font-mono font-medium text-dark-200">{stats.avgDailySales.toFixed(1)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-dark-400">Trend</span>
          <span className={`font-medium ${
            characteristics.trend === 'Growing' ? 'text-accent-teal' :
            characteristics.trend === 'Declining' ? 'text-secondary-500' : 'text-dark-300'
          }`}>
            {characteristics.trend}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-dark-400">Stability</span>
          <span className="font-medium text-dark-300">{characteristics.stability}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-dark-400">Zeros %</span>
          <span className="font-mono font-medium text-dark-200">{stats.avgZerosPct.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
}

export default function ClusterChart({ clusters, items }) {
  if (!clusters || !items) {
    return (
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">Product Clusters</h3>
        <div className="h-64 flex items-center justify-center text-dark-400">
          No clustering data available
        </div>
      </div>
    )
  }

  // Prepare scatter data (sample for performance)
  const itemEntries = Object.entries(items)
  const sampleSize = Math.min(2000, itemEntries.length)
  const sampledItems = itemEntries
    .sort(() => Math.random() - 0.5)
    .slice(0, sampleSize)
    .map(([id, data]) => ({
      id,
      x: data.coords[0],
      y: data.coords[1],
      cluster: data.cluster,
      clusterName: clusters.clusters.find(c => c.id === data.cluster)?.name || `Cluster ${data.cluster}`,
      mean: data.mean,
      cv: data.cv
    }))

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-dark-100">Cluster Summary</h3>
          <div className="text-sm text-dark-400">
            Silhouette Score: <span className="font-mono font-medium text-dark-200">{clusters.summary.silhouetteScore.toFixed(3)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {clusters.clusters.map((cluster) => (
            <ClusterProfile key={cluster.id} cluster={cluster} />
          ))}
        </div>
      </div>

      {/* Scatter Plot */}
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">t-SNE Visualization</h3>
        <ResponsiveContainer width="100%" height={450}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              type="number"
              dataKey="x"
              name="t-SNE 1"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="t-SNE 2"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#e2e8f0' }} />
            {clusters.clusters.map((cluster) => (
              <Scatter
                key={cluster.id}
                name={cluster.name}
                data={sampledItems.filter(item => item.cluster === cluster.id)}
                fill={CHART_COLORS[cluster.id % CHART_COLORS.length]}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
