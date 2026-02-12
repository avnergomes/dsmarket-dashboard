import { TrendingUp, TrendingDown, ShoppingBag, DollarSign, Store, Package, Calendar, Award } from 'lucide-react'
import { formatNumber, formatCurrency, formatPercent } from '../utils/format'

function KpiCard({ title, value, subtitle, icon: Icon, trend, trendLabel, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600',
    secondary: 'bg-secondary-50 text-secondary-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1 font-mono">{value}</p>
          {subtitle && (
            <p className="text-slate-400 text-xs mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100">
          {trend > 0 ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : trend < 0 ? (
            <TrendingDown className="h-4 w-4 text-red-500" />
          ) : null}
          <span className={`text-sm font-medium ${
            trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-slate-500'
          }`}>
            {trend > 0 ? '+' : ''}{formatPercent(trend)}
          </span>
          {trendLabel && (
            <span className="text-slate-400 text-sm ml-1">{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default function KpiCards({ kpis }) {
  if (!kpis) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KpiCard
        title="Total Sales"
        value={formatNumber(kpis.totalQuantity)}
        subtitle="units sold"
        icon={ShoppingBag}
        color="primary"
      />
      <KpiCard
        title="Total Revenue"
        value={formatCurrency(kpis.totalRevenue)}
        subtitle="across all stores"
        icon={DollarSign}
        color="emerald"
        trend={kpis.yoyGrowth}
        trendLabel="YoY"
      />
      <KpiCard
        title="Active Items"
        value={formatNumber(kpis.totalItems, 0)}
        subtitle="unique products"
        icon={Package}
        color="secondary"
      />
      <KpiCard
        title="Top Category"
        value={kpis.topCategory}
        subtitle="by revenue"
        icon={Award}
        color="amber"
      />
    </div>
  )
}
