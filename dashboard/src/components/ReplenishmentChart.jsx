import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line
} from 'recharts'
import { AlertTriangle, Package, TrendingUp, Shield, Store } from 'lucide-react'
import { formatNumber, CHART_COLORS } from '../utils/format'

function KpiCard({ icon: Icon, label, value, unit, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary-900/50 text-primary-400',
    success: 'bg-teal-900/50 text-accent-teal',
    warning: 'bg-yellow-900/50 text-accent-yellow',
    danger: 'bg-secondary-900/50 text-secondary-400'
  }

  return (
    <div className="bg-dark-800 rounded-xl shadow-lg p-5 border border-dark-700">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-dark-400">{label}</p>
          <p className="text-xl font-bold text-dark-100 font-mono">
            {formatNumber(value, 0)} <span className="text-sm font-normal text-dark-400">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function StoreMetricsTable({ data }) {
  if (!data || data.length === 0) return null

  return (
    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
        <Store className="w-5 h-5 text-primary-400" />
        Store Replenishment Metrics
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-600">
              <th className="text-left py-3 px-2 font-semibold text-dark-300">Store</th>
              <th className="text-right py-3 px-2 font-semibold text-dark-300">Avg Daily</th>
              <th className="text-right py-3 px-2 font-semibold text-dark-300">Safety Stock</th>
              <th className="text-right py-3 px-2 font-semibold text-dark-300">Reorder Point</th>
              <th className="text-right py-3 px-2 font-semibold text-dark-300">EOQ</th>
              <th className="text-right py-3 px-2 font-semibold text-dark-300">Fill Rate</th>
              <th className="text-right py-3 px-2 font-semibold text-dark-300">CV</th>
            </tr>
          </thead>
          <tbody>
            {data.map((store, idx) => (
              <tr key={store.store} className={idx % 2 === 0 ? 'bg-dark-700/50' : ''}>
                <td className="py-3 px-2 font-medium text-dark-100">{store.store}</td>
                <td className="py-3 px-2 text-right font-mono text-dark-200">{formatNumber(store.avgDailyDemand, 0)}</td>
                <td className="py-3 px-2 text-right font-mono text-dark-200">{formatNumber(store.safetyStock, 0)}</td>
                <td className="py-3 px-2 text-right font-mono text-dark-200">{formatNumber(store.reorderPoint, 0)}</td>
                <td className="py-3 px-2 text-right font-mono text-dark-200">{formatNumber(store.eoq, 0)}</td>
                <td className="py-3 px-2 text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    store.estimatedFillRate >= 95 ? 'bg-teal-900/50 text-accent-teal' :
                    store.estimatedFillRate >= 90 ? 'bg-yellow-900/50 text-accent-yellow' :
                    'bg-secondary-900/50 text-secondary-400'
                  }`}>
                    {store.estimatedFillRate}%
                  </span>
                </td>
                <td className="py-3 px-2 text-right font-mono text-dark-400">{store.cv}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CriticalItemsTable({ data }) {
  if (!data || data.length === 0) return null

  const riskColors = {
    High: 'bg-secondary-900/50 text-secondary-400',
    Medium: 'bg-yellow-900/50 text-accent-yellow',
    Low: 'bg-teal-900/50 text-accent-teal'
  }

  return (
    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-accent-yellow" />
        Critical Items Requiring Attention
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-600">
              <th className="text-left py-3 px-2 font-semibold text-dark-300">Item ID</th>
              <th className="text-left py-3 px-2 font-semibold text-dark-300">Store</th>
              <th className="text-left py-3 px-2 font-semibold text-dark-300">Category</th>
              <th className="text-right py-3 px-2 font-semibold text-dark-300">28d Sales</th>
              <th className="text-right py-3 px-2 font-semibold text-dark-300">Avg Daily</th>
              <th className="text-right py-3 px-2 font-semibold text-dark-300">Safety Stock</th>
              <th className="text-right py-3 px-2 font-semibold text-dark-300">Reorder Pt</th>
              <th className="text-center py-3 px-2 font-semibold text-dark-300">Risk</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 15).map((item, idx) => (
              <tr key={item.id} className={idx % 2 === 0 ? 'bg-dark-700/50' : ''}>
                <td className="py-3 px-2 font-mono text-xs text-dark-200">{item.id}</td>
                <td className="py-3 px-2 text-dark-300">{item.store}</td>
                <td className="py-3 px-2 text-dark-300">{item.category}</td>
                <td className="py-3 px-2 text-right font-mono text-dark-200">{formatNumber(item.totalQty28d, 0)}</td>
                <td className="py-3 px-2 text-right font-mono text-dark-200">{item.avgDaily}</td>
                <td className="py-3 px-2 text-right font-mono text-dark-200">{formatNumber(item.safetyStock, 0)}</td>
                <td className="py-3 px-2 text-right font-mono text-dark-200">{formatNumber(item.reorderPoint, 0)}</td>
                <td className="py-3 px-2 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskColors[item.riskLevel]}`}>
                    {item.riskLevel}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StoreComparisonChart({ data }) {
  if (!data || data.length === 0) return null

  return (
    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-dark-100 mb-4">Safety Stock vs Reorder Point by Store</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="store" tick={{ fontSize: 12, fill: '#94a3b8' }} />
          <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => formatNumber(v)} />
          <Tooltip
            formatter={(value, name) => [formatNumber(value, 0), name]}
            contentStyle={{
              backgroundColor: 'rgba(15,23,42,0.95)',
              borderRadius: '12px',
              border: '1px solid #334155',
              color: '#e2e8f0'
            }}
          />
          <Legend wrapperStyle={{ color: '#e2e8f0' }} />
          <Bar dataKey="safetyStock" name="Safety Stock" fill="#0077BB" radius={[4, 4, 0, 0]} />
          <Bar dataKey="reorderPoint" name="Reorder Point" fill="#EE7733" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="avgDailyDemand" name="Avg Daily Demand" stroke="#009988" strokeWidth={2} dot={{ r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function CategoryMetricsChart({ data }) {
  if (!data || data.length === 0) return null

  return (
    <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
      <h3 className="text-lg font-semibold text-dark-100 mb-4">Replenishment by Category</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => formatNumber(v)} />
          <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: '#94a3b8' }} width={90} />
          <Tooltip
            formatter={(value, name) => [formatNumber(value, 0), name]}
            contentStyle={{
              backgroundColor: 'rgba(15,23,42,0.95)',
              borderRadius: '12px',
              border: '1px solid #334155',
              color: '#e2e8f0'
            }}
          />
          <Legend wrapperStyle={{ color: '#e2e8f0' }} />
          <Bar dataKey="safetyStock" name="Safety Stock" fill="#33BBEE" radius={[0, 4, 4, 0]} />
          <Bar dataKey="reorderPoint" name="Reorder Point" fill="#EE3377" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function ReplenishmentChart({ replenishment }) {
  if (!replenishment || !replenishment.summary) {
    return (
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-dark-100 mb-4">Store Replenishment</h3>
        <div className="text-dark-400 text-center py-12">
          <p>Replenishment analysis will be available after running the forecasting pipeline.</p>
          <p className="text-sm mt-2 text-dark-500">This module calculates optimal reorder points and safety stock levels.</p>
        </div>
      </div>
    )
  }

  const { summary, byStore, byCategory, criticalItems, parameters } = replenishment

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={TrendingUp}
          label="Total Daily Demand"
          value={summary.totalAvgDailyDemand}
          unit="units"
          color="primary"
        />
        <KpiCard
          icon={Shield}
          label="Total Safety Stock"
          value={summary.totalSafetyStock}
          unit="units"
          color="success"
        />
        <KpiCard
          icon={Package}
          label="Total Reorder Point"
          value={summary.totalReorderPoint}
          unit="units"
          color="warning"
        />
        <KpiCard
          icon={Store}
          label="Avg Fill Rate"
          value={summary.avgFillRate}
          unit="%"
          color={summary.avgFillRate >= 95 ? 'success' : summary.avgFillRate >= 90 ? 'warning' : 'danger'}
        />
      </div>

      {/* Parameters info */}
      <div className="bg-dark-700 rounded-lg p-4 text-sm text-dark-300 border border-dark-600">
        <span className="font-medium text-dark-200">Parameters:</span> Lead Time = {parameters.leadTimeDays} days | Service Level = {parameters.serviceLevel}% | Z-Score = {parameters.zScore}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StoreComparisonChart data={byStore} />
        <CategoryMetricsChart data={byCategory} />
      </div>

      {/* Tables */}
      <StoreMetricsTable data={byStore} />
      <CriticalItemsTable data={criticalItems} />
    </div>
  )
}
