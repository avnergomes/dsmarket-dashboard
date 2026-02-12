import { useState, useEffect } from 'react'

const BASE_PATH = import.meta.env.BASE_URL || '/'

/**
 * Hook to load dashboard data
 */
export function useData() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Load all data files in parallel
        const [
          aggregatedRes,
          timeseriesRes,
          categoriesRes,
          storesRes,
          filtersRes,
          seasonalRes,
          clustersRes,
          forecastSummaryRes,
          replenishmentRes
        ] = await Promise.all([
          fetch(`${BASE_PATH}data/aggregated.json`),
          fetch(`${BASE_PATH}data/timeseries.json`),
          fetch(`${BASE_PATH}data/categories.json`),
          fetch(`${BASE_PATH}data/stores.json`),
          fetch(`${BASE_PATH}data/filters.json`),
          fetch(`${BASE_PATH}data/seasonal.json`),
          fetch(`${BASE_PATH}data/clusters.json`),
          fetch(`${BASE_PATH}data/forecasts/summary.json`),
          fetch(`${BASE_PATH}data/replenishment.json`).catch(() => ({ ok: false }))
        ])

        // Check for errors (replenishment is optional)
        const requiredResponses = [
          aggregatedRes, timeseriesRes, categoriesRes, storesRes,
          filtersRes, seasonalRes, clustersRes, forecastSummaryRes
        ]

        for (const res of requiredResponses) {
          if (!res.ok) {
            throw new Error(`Failed to load data: ${res.status}`)
          }
        }

        // Parse JSON
        const [
          aggregated,
          timeseries,
          categories,
          stores,
          filters,
          seasonal,
          clusters,
          forecastSummary
        ] = await Promise.all([
          aggregatedRes.json(),
          timeseriesRes.json(),
          categoriesRes.json(),
          storesRes.json(),
          filtersRes.json(),
          seasonalRes.json(),
          clustersRes.json(),
          forecastSummaryRes.json()
        ])

        // Replenishment is optional
        const replenishment = replenishmentRes.ok
          ? await replenishmentRes.json()
          : null

        setData({
          aggregated,
          timeseries,
          categories,
          stores,
          filters,
          seasonal,
          clusters,
          forecastSummary,
          replenishment
        })
      } catch (err) {
        console.error('Error loading data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return { data, loading, error }
}

/**
 * Hook to load a specific forecast
 */
export function useForecast(forecastId, type = 'item') {
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!forecastId) {
      setForecast(null)
      return
    }

    async function loadForecast() {
      try {
        setLoading(true)
        setError(null)

        const safeName = forecastId.replace(/ /g, '_').replace(/&/g, 'and')
        const filename = type === 'total'
          ? 'total.json'
          : `${type}_${safeName}.json`

        const res = await fetch(`${BASE_PATH}data/forecasts/${filename}`)

        if (!res.ok) {
          throw new Error(`Forecast not found: ${forecastId}`)
        }

        const data = await res.json()
        setForecast(data)
      } catch (err) {
        console.error('Error loading forecast:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadForecast()
  }, [forecastId, type])

  return { forecast, loading, error }
}

export default useData
