/**
 * Timezone utilities for consistent Eastern Time (America/New_York) display
 *
 * All timestamps in the system are stored in Eastern Time.
 * These utilities ensure consistent display across all components.
 */

/**
 * Format a date/timestamp in Eastern Time
 * @param date - Date object or ISO string
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted Eastern Time string
 */
export function formatEasternTime(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    ...options
  }

  return d.toLocaleString('en-US', defaultOptions)
}

/**
 * Get current time in Eastern Time
 * @returns Current Eastern Time as formatted string
 */
export function getCurrentEasternTime(): string {
  return formatEasternTime(new Date())
}

/**
 * Format date with timezone indicator
 * @param date - Date object or ISO string
 * @returns Formatted string with timezone abbreviation (EST/EDT)
 */
export function formatEasternTimeWithTZ(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short' // Shows EST or EDT
  })
}

/**
 * Format date for display (without seconds)
 * @param date - Date object or ISO string
 * @returns Formatted Eastern Time string (e.g., "Nov 1, 2025, 10:30 AM")
 */
export function formatEasternDisplay(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Format date as short string (for compact displays)
 * @param date - Date object or ISO string
 * @returns Short formatted string (e.g., "11/01/2025")
 */
export function formatEasternDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

/**
 * Format time only (no date)
 * @param date - Date object or ISO string
 * @returns Time string (e.g., "10:30:45 AM")
 */
export function formatEasternTimeOnly(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date

  return d.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  })
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param date - Date object or ISO string
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`

  return formatEasternDisplay(d)
}

/**
 * Check if date is today (in Eastern Time)
 * @param date - Date object or ISO string
 * @returns True if date is today in Eastern Time
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date
  const today = new Date()

  const dateStr = d.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  const todayStr = today.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  return dateStr === todayStr
}

/**
 * Format for export filenames (e.g., "2025-11-01")
 * @param date - Date object or ISO string
 * @returns ISO-style date string in Eastern Time
 */
export function formatForFilename(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : date

  const parts = d.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).split('/')

  // Convert MM/DD/YYYY to YYYY-MM-DD
  return `${parts[2]}-${parts[0]}-${parts[1]}`
}
