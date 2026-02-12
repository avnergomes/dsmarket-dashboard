/**
 * Formatting utilities for the dashboard
 */

// Chart color palette
export const CHART_COLORS = [
  '#6366f1', // Indigo (primary)
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#84cc16', // Lime
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#a855f7', // Purple
  '#3b82f6', // Blue
]

/**
 * Format number with compact notation (K, M, B)
 */
export function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined) return '-'

  const absValue = Math.abs(value)

  if (absValue >= 1e9) {
    return (value / 1e9).toFixed(decimals) + 'B'
  } else if (absValue >= 1e6) {
    return (value / 1e6).toFixed(decimals) + 'M'
  } else if (absValue >= 1e3) {
    return (value / 1e3).toFixed(decimals) + 'K'
  } else {
    return value.toFixed(decimals)
  }
}

/**
 * Format currency (USD)
 */
export function formatCurrency(value, compact = true) {
  if (value === null || value === undefined) return '-'

  if (compact) {
    const formatted = formatNumber(value, 1)
    return '$' + formatted
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

/**
 * Format percentage
 */
export function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined) return '-'
  return value.toFixed(decimals) + '%'
}

/**
 * Format date
 */
export function formatDate(dateStr, format = 'short') {
  if (!dateStr) return '-'

  const date = new Date(dateStr)

  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } else if (format === 'medium') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } else if (format === 'long') {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  return dateStr
}

/**
 * Get variation text and status
 */
export function formatVariation(value) {
  if (value === null || value === undefined) {
    return { text: '-', isPositive: false, isNegative: false }
  }

  const isPositive = value > 0
  const isNegative = value < 0
  const text = (isPositive ? '+' : '') + value.toFixed(1) + '%'

  return { text, isPositive, isNegative }
}

/**
 * Get color for chart based on index
 */
export function getChartColor(index) {
  return CHART_COLORS[index % CHART_COLORS.length]
}

/**
 * Truncate text
 */
export function truncate(text, maxLength = 20) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}
