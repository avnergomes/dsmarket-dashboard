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
// Advanced D3 Charts
import RadarChart from './components/RadarChart'
import LollipopChart from './components/LollipopChart'
import TreemapChart from './components/TreemapChart'
import CircularBarChart from './components/CircularBarChart'
import RidgelineChart from './components/RidgelineChart'

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

      {/* Advanced D3 Charts */}
      <TreemapChart
        categories={data.categories?.byCategory}
        departments={data.categories?.byDepartment}
        title="Revenue Hierarchy: Category > Department"
        width={800}
        height={350}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RadarChart
          data={data.stores?.byStore}
          title="Store Performance Comparison"
          width={450}
          height={380}
        />
        <LollipopChart
          data={data.categories?.byDepartment}
          title="Department Revenue Ranking"
          valueKey="revenue"
          nameKey="department"
          width={450}
          height={350}
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

      {/* Advanced D3 Temporal Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CircularBarChart
          data={data.seasonal?.byMonth}
          title="Monthly Sales Pattern (Radial)"
          width={380}
          height={380}
        />
        <SeasonalHeatmap
          data={data.seasonal?.heatmap}
          title="Sales by Day of Week & Month"
        />
      </div>

      <RidgelineChart
        data={data.timeseries}
        title="Daily Sales Distribution by Year"
        width={800}
        height={350}
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
