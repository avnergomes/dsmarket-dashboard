import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'
import { Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { formatNumber, formatPercent, CHART_COLORS } from '../utils/format'

// US Holiday definitions for East Coast (NYC, Boston, Philadelphia)
const HOLIDAY_DEFINITIONS = [
  { name: 'Super Bowl', getDate: (year) => getSuperBowlDate(year), icon: '🏈' },
  { name: "Valentine's Day", getDate: (year) => new Date(year, 1, 14), icon: '❤️' },
  { name: "St. Patrick's Day", getDate: (year) => new Date(year, 2, 17), icon: '☘️' },
  { name: 'Easter', getDate: (year) => getEasterDate(year), icon: '🐰' },
  { name: "Mother's Day", getDate: (year) => getNthWeekdayOfMonth(year, 4, 0, 2), icon: '💐' },
  { name: 'Memorial Day', getDate: (year) => getLastWeekdayOfMonth(year, 4, 1), icon: '🇺🇸' },
  { name: "Father's Day", getDate: (year) => getNthWeekdayOfMonth(year, 5, 0, 3), icon: '👔' },
  { name: 'Independence Day', getDate: (year) => new Date(year, 6, 4), icon: '🎆' },
  { name: 'Labor Day', getDate: (year) => getNthWeekdayOfMonth(year, 8, 1, 1), icon: '⚒️' },
  { name: 'Halloween', getDate: (year) => new Date(year, 9, 31), icon: '🎃' },
  { name: 'Thanksgiving', getDate: (year) => getNthWeekdayOfMonth(year, 10, 4, 4), icon: '🦃' },
  { name: 'Black Friday', getDate: (year) => {
    const thanksgiving = getNthWeekdayOfMonth(year, 10, 4, 4)
    return new Date(thanksgiving.getTime() + 24 * 60 * 60 * 1000)
  }, icon: '🛒' },
  { name: 'Christmas Eve', getDate: (year) => new Date(year, 11, 24), icon: '🎄' },
  { name: 'Christmas', getDate: (year) => new Date(year, 11, 25), icon: '🎁' },
  { name: "New Year's Eve", getDate: (year) => new Date(year, 11, 31), icon: '🎉' },
  { name: "New Year's Day", getDate: (year) => new Date(year, 0, 1), icon: '🎊' },
]

// Helper: Get Easter date (Computus algorithm)
function getEasterDate(year) {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

// Helper: Get Super Bowl date (First Sunday of February)
function getSuperBowlDate(year) {
  return getNthWeekdayOfMonth(year, 1, 0, 1)
}

// Helper: Get nth weekday of month (0=Sunday, 1=Monday, etc.)
function getNthWeekdayOfMonth(year, month, weekday, n) {
  const firstDay = new Date(year, month, 1)
  const firstWeekday = firstDay.getDay()
  let dayOffset = weekday - firstWeekday
  if (dayOffset < 0) dayOffset += 7
  const nthDay = 1 + dayOffset + (n - 1) * 7
  return new Date(year, month, nthDay)
}

// Helper: Get last weekday of month
function getLastWeekdayOfMonth(year, month, weekday) {
  const lastDay = new Date(year, month + 1, 0)
  const lastWeekday = lastDay.getDay()
  let dayOffset = lastWeekday - weekday
  if (dayOffset < 0) dayOffset += 7
  return new Date(year, month + 1, -dayOffset)
}

// Format date to YYYY-MM-DD
function formatDateStr(date) {
  return date.toISOString().split('T')[0]
}

// Calculate holiday impact from timeseries data
function calculateHolidayImpact(timeseries, holidayDef, years) {
  if (!timeseries || !timeseries.daily) return null

  const dailyMap = new Map()
  timeseries.daily.forEach(d => {
    dailyMap.set(d.date, d)
  })

  // Calculate overall baseline (average)
  const validDays = timeseries.daily.filter(d => d.revenue > 0)
  const baselineQty = validDays.reduce((sum, d) => sum + d.quantity, 0) / validDays.length
  const baselineRev = validDays.reduce((sum, d) => sum + d.revenue, 0) / validDays.length

  const holidayMetrics = []
  const holidayDates = []

  years.forEach(year => {
    const holidayDate = holidayDef.getDate(year)
    const dateStr = formatDateStr(holidayDate)
    holidayDates.push(dateStr)

    // Look at holiday and surrounding days (-1 to +1)
    for (let offset = -1; offset <= 1; offset++) {
      const checkDate = new Date(holidayDate)
      checkDate.setDate(checkDate.getDate() + offset)
      const checkStr = formatDateStr(checkDate)
      const dayData = dailyMap.get(checkStr)

      if (dayData && dayData.revenue > 0) {
        holidayMetrics.push({
          quantity: dayData.quantity,
          revenue: dayData.revenue,
          date: checkStr
        })
      }
    }
  })

  if (holidayMetrics.length === 0) return null

  const avgQty = holidayMetrics.reduce((sum, d) => sum + d.quantity, 0) / holidayMetrics.length
  const avgRev = holidayMetrics.reduce((sum, d) => sum + d.revenue, 0) / holidayMetrics.length

  return {
    name: holidayDef.name,
    icon: holidayDef.icon,
    avgQuantity: avgQty,
    avgRevenue: avgRev,
    quantityLift: ((avgQty - baselineQty) / baselineQty) * 100,
    revenueLift: ((avgRev - baselineRev) / baselineRev) * 100,
    sampleSize: holidayMetrics.length,
    dates: holidayDates
  }
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null

  const data = payload[0].payload

  return (
    <div className="bg-dark-800/95 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-dark-600">
      <p className="font-semibold text-dark-100 flex items-center gap-2">
        <span>{data.icon}</span>
        {data.name}
      </p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-dark-300">
          Qty Lift: <span className={`font-mono font-medium ${data.quantityLift >= 0 ? 'text-accent-teal' : 'text-secondary-400'}`}>
            {data.quantityLift >= 0 ? '+' : ''}{formatPercent(data.quantityLift / 100)}
          </span>
        </p>
        <p className="text-dark-300">
          Rev Lift: <span className={`font-mono font-medium ${data.revenueLift >= 0 ? 'text-accent-teal' : 'text-secondary-400'}`}>
            {data.revenueLift >= 0 ? '+' : ''}{formatPercent(data.revenueLift / 100)}
          </span>
        </p>
        <p className="text-dark-400 text-xs">
          Avg Daily Qty: {formatNumber(data.avgQuantity, 0)}
        </p>
        <p className="text-dark-400 text-xs">
          Avg Daily Rev: ${formatNumber(data.avgRevenue, 0)}
        </p>
      </div>
    </div>
  )
}

function ImpactBar({ holiday, maxLift }) {
  const liftPercent = Math.abs(holiday.quantityLift)
  const barWidth = (liftPercent / maxLift) * 100
  const isPositive = holiday.quantityLift >= 0

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 text-center text-lg">{holiday.icon}</div>
      <div className="w-32 text-sm text-dark-200 truncate">{holiday.name}</div>
      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-6 bg-dark-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isPositive ? 'bg-accent-teal' : 'bg-secondary-500'
            }`}
            style={{ width: `${Math.min(barWidth, 100)}%` }}
          />
        </div>
        <div className={`w-16 text-right font-mono text-sm ${
          isPositive ? 'text-accent-teal' : 'text-secondary-400'
        }`}>
          {isPositive ? '+' : ''}{holiday.quantityLift.toFixed(1)}%
        </div>
      </div>
    </div>
  )
}

export default function HolidayImpactChart({ timeseries }) {
  const holidayData = useMemo(() => {
    if (!timeseries || !timeseries.daily || timeseries.daily.length === 0) {
      return []
    }

    // Determine years in data
    const dates = timeseries.daily.map(d => d.date)
    const startYear = parseInt(dates[0].substring(0, 4))
    const endYear = parseInt(dates[dates.length - 1].substring(0, 4))
    const years = []
    for (let y = startYear; y <= endYear; y++) {
      years.push(y)
    }

    // Calculate impact for each holiday
    const impacts = HOLIDAY_DEFINITIONS
      .map(def => calculateHolidayImpact(timeseries, def, years))
      .filter(h => h !== null)
      .sort((a, b) => b.quantityLift - a.quantityLift)

    return impacts
  }, [timeseries])

  if (!timeseries || holidayData.length === 0) {
    return (
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary-400" />
          Holiday Impact Analysis
        </h3>
        <div className="h-64 flex items-center justify-center text-dark-400">
          No timeseries data available for holiday analysis
        </div>
      </div>
    )
  }

  const maxLift = Math.max(...holidayData.map(h => Math.abs(h.quantityLift)), 1)
  const topHolidays = holidayData.slice(0, 8)
  const positiveImpact = holidayData.filter(h => h.quantityLift > 5)
  const negativeImpact = holidayData.filter(h => h.quantityLift < -5)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
          <div className="flex items-center gap-2 text-accent-teal mb-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Top Positive Impact</span>
          </div>
          <div className="text-2xl font-bold text-dark-100">
            {positiveImpact.length > 0 ? positiveImpact[0].icon : '-'} {positiveImpact.length > 0 ? positiveImpact[0].name : 'N/A'}
          </div>
          <div className="text-sm text-dark-400 mt-1">
            {positiveImpact.length > 0 ? `+${positiveImpact[0].quantityLift.toFixed(1)}% sales lift` : 'No significant positive impact'}
          </div>
        </div>

        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
          <div className="flex items-center gap-2 text-secondary-400 mb-2">
            <TrendingDown className="h-4 w-4" />
            <span className="text-sm font-medium">Lowest Impact</span>
          </div>
          <div className="text-2xl font-bold text-dark-100">
            {negativeImpact.length > 0 ? negativeImpact[negativeImpact.length - 1].icon : '-'} {negativeImpact.length > 0 ? negativeImpact[negativeImpact.length - 1].name : 'N/A'}
          </div>
          <div className="text-sm text-dark-400 mt-1">
            {negativeImpact.length > 0 ? `${negativeImpact[negativeImpact.length - 1].quantityLift.toFixed(1)}% sales drop` : 'No significant negative impact'}
          </div>
        </div>

        <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
          <div className="flex items-center gap-2 text-primary-400 mb-2">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Holidays Analyzed</span>
          </div>
          <div className="text-2xl font-bold text-dark-100">
            {holidayData.length}
          </div>
          <div className="text-sm text-dark-400 mt-1">
            US East Coast holidays (NYC, BOS, PHI)
          </div>
        </div>
      </div>

      {/* Impact Chart */}
      <div className="bg-dark-800 rounded-xl shadow-lg p-6 border border-dark-700">
        <h3 className="text-lg font-semibold text-dark-100 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary-400" />
          Holiday Sales Impact (vs. Baseline)
        </h3>

        <div className="mb-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={topHolidays}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                tickFormatter={(v) => `${v > 0 ? '+' : ''}${v.toFixed(0)}%`}
                domain={['dataMin - 5', 'dataMax + 5']}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                width={90}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={0} stroke="#64748b" strokeWidth={2} />
              <Bar dataKey="quantityLift" name="Quantity Lift %" radius={[0, 4, 4, 0]}>
                {topHolidays.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.quantityLift >= 0 ? '#009988' : '#EE7733'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Detailed List */}
        <div className="border-t border-dark-700 pt-4">
          <h4 className="text-sm font-semibold text-dark-300 mb-3">All Holidays Ranked by Impact</h4>
          <div className="space-y-1">
            {holidayData.map((holiday, idx) => (
              <ImpactBar key={holiday.name} holiday={holiday} maxLift={maxLift} />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-dark-700 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-accent-teal" />
            <span className="text-dark-400">Positive Impact</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-secondary-500" />
            <span className="text-dark-400">Negative Impact</span>
          </div>
        </div>
      </div>
    </div>
  )
}
