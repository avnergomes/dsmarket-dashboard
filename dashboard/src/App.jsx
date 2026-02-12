import { useState } from 'react'
import { useData } from './hooks/useData'

// Components
import Header from './components/Header'
import Footer from './components/Footer'
import Tabs from './components/Tabs'
import KpiCards from './components/KpiCards'
import TimeSeriesChart from './components/TimeSeriesChart'
import { CategoryPieChart, CategoryBarChart } from './components/CategoryChart'
import StoreChart from './components/StoreChart'
import SeasonalHeatmap from './components/SeasonalHeatmap'
import HolidayImpactChart from './components/HolidayImpactChart'
import ClusterChart from './components/ClusterChart'
import ForecastChart from './components/ForecastChart'
import ReplenishmentChart from './components/ReplenishmentChart'
import Loading from './components/Loading'

// Tab content components
function OverviewTab({ data }) {
  return (
    <div className="space-y-6">
      <KpiCards kpis={data.aggregated?.kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TimeSeriesChart
          data={data.timeseries?.monthly}
          title="Monthly Sales Trend"
          dataKey="quantity"
          secondaryKey="revenue"
          xAxisKey="period"
        />
        <CategoryPieChart
          data={data.categories?.byCategory}
          title="Revenue by Category"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StoreChart
          data={data.stores?.byStore}
          title="Revenue by Store"
        />
        <CategoryBarChart
          data={data.categories?.byDepartment}
          title="Revenue by Department"
          nameKey="department"
        />
      </div>
    </div>
  )
}

function TemporalTab({ data }) {
  return (
    <div className="space-y-6">
      <TimeSeriesChart
        data={data.timeseries?.weekly}
        title="Weekly Sales Evolution"
        dataKey="quantity"
        secondaryKey="revenue"
        xAxisKey="period"
        height={400}
      />

      <SeasonalHeatmap
        data={data.seasonal?.heatmap}
        title="Average Sales by Day of Week & Month"
      />

      <HolidayImpactChart timeseries={data.timeseries} />

      <TimeSeriesChart
        data={data.timeseries?.yearly}
        title="Yearly Comparison"
        dataKey="quantity"
        secondaryKey="revenue"
        xAxisKey="year"
        height={300}
      />
    </div>
  )
}

function ClusteringTab({ data }) {
  return (
    <ClusterChart
      clusters={data.clusters}
      items={data.clusters?.items}
    />
  )
}

function ForecastsTab({ data }) {
  return (
    <ForecastChart
      forecastSummary={data.forecastSummary}
    />
  )
}

function ReplenishmentTab({ data }) {
  return (
    <ReplenishmentChart replenishment={data.replenishment} />
  )
}

export default function App() {
  const { data, loading, error } = useData()
  const [activeTab, setActiveTab] = useState('overview')

  if (loading) {
    return <Loading />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 font-medium">Error loading data</p>
          <p className="text-dark-300 text-sm mt-2">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'overview' && <OverviewTab data={data} />}
        {activeTab === 'temporal' && <TemporalTab data={data} />}
        {activeTab === 'clustering' && <ClusteringTab data={data} />}
        {activeTab === 'forecasts' && <ForecastsTab data={data} />}
        {activeTab === 'replenishment' && <ReplenishmentTab data={data} />}
      </main>

      <Footer lastUpdated={data.aggregated?.lastUpdated} />
    </div>
  )
}
