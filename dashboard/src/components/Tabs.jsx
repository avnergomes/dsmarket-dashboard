import { BarChart3, Boxes, TrendingUp, Package, Calendar } from 'lucide-react'

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'temporal', label: 'Temporal', icon: Calendar },
  { id: 'clustering', label: 'Clustering', icon: Boxes },
  { id: 'forecasts', label: 'Forecasts', icon: TrendingUp },
  { id: 'replenishment', label: 'Replenishment', icon: Package },
]

export default function Tabs({ activeTab, onTabChange }) {
  return (
    <div className="bg-dark-800 rounded-xl shadow-sm p-1.5 mb-6 border border-dark-700">
      <div className="flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
                transition-all duration-200
                ${isActive
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-dark-200 hover:bg-dark-700'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
