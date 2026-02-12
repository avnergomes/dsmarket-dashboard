import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend
} from 'recharts'
import { formatNumber, CHART_COLORS } from '../utils/format'

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-slate-200">
      <p className="font-semibold text-slate-700 text-sm">{data.id}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-slate-600">
          Cluster: <span className="font-medium">{data.clusterName}</span>
        </p>
        <p className="text-slate-600">
          Avg Sales: <span className="font-mono">{formatNumber(data.mean)}</span>
        </p>
        <p className="text-slate-600">
          CV: <span className="font-mono">{data.cv?.toFixed(2)}</span>
        </p>
      </div>
    </div>
  )
}

function ClusterProfile({ cluster }) {
  const { characteristics, stats } = cluster

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 card-hover">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: CHART_COLORS[cluster.id % CHART_COLORS.length] }}
        />
        <h4 className="font-semibold text-slate-700">{cluster.name}</h4>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Items</span>
          <span className="font-mono font-medium">{formatNumber(cluster.nItems, 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Avg Daily Sales</span>
          <span className="font-mono font-medium">{stats.avgDailySales.toFixed(1)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Trend</span>
          <span className={`font-medium ${
            characteristics.trend === 'Growing' ? 'text-emerald-600' :
            characteristics.trend === 'Declining' ? 'text-red-600' : 'text-slate-600'
          }`}>
            {characteristics.trend}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Stability</span>
          <span className="font-medium text-slate-600">{characteristics.stability}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Zeros %</span>
          <span className="font-mono font-medium">{stats.avgZerosPct.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
}

export default function ClusterChart({ clusters, items }) {
  if (!clusters || !items) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">Product Clusters</h3>
        <div className="h-64 flex items-center justify-center text-slate-400">
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
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-700">Cluster Summary</h3>
          <div className="text-sm text-slate-500">
            Silhouette Score: <span className="font-mono font-medium">{clusters.summary.silhouetteScore.toFixed(3)}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {clusters.clusters.map((cluster) => (
            <ClusterProfile key={cluster.id} cluster={cluster} />
          ))}
        </div>
      </div>

      {/* Scatter Plot */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-4">t-SNE Visualization</h3>
        <ResponsiveContainer width="100%" height={450}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              dataKey="x"
              name="t-SNE 1"
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="t-SNE 2"
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
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
