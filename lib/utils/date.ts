// Date utility functions
import { isValidDate as isValidTimestamp, toDateOrNull } from '@/lib/firebase/timestamp-utils'
import type { FirestoreDate } from '@/lib/core/types'

export const dateUtils = {
  // Check if a date is valid (delegated to timestamp-utils)
  isValidDate: (date: FirestoreDate | null | undefined): boolean => {
    return isValidTimestamp(date)
  },

  // Format date safely
  formatDate: (date: FirestoreDate, options?: Intl.DateTimeFormatOptions): string => {
    if (!dateUtils.isValidDate(date)) {
      return '日付が設定されていません'
    }
    
    const d = toDateOrNull(date)
    if (!d) {
      return '日付が設定されていません'
    }
    
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      ...options
    })
  },

  // Format date range safely with unified rules
  formatDateRange: (startDate: FirestoreDate, endDate: FirestoreDate): string => {
    if (!dateUtils.isValidDate(startDate) || !dateUtils.isValidDate(endDate)) {
      return '日付が設定されていません'
    }
    
    const start = toDateOrNull(startDate)
    const end = toDateOrNull(endDate)
    
    if (!start || !end) {
      return '日付が設定されていません'
    }
    
    // Calculate trip duration (more accurate calculation)
    const tripDuration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // Apply unified date range formatting rules (without relative time)
    return dateUtils.formatUnifiedDateRangeWithoutRelativeTime(start, end, tripDuration)
  },

  // Unified date range formatting without relative time information
  formatUnifiedDateRangeWithoutRelativeTime: (start: Date, end: Date, tripDuration: number): string => {
    const startYear = start.getFullYear()
    const startMonth = start.getMonth() + 1
    const startDay = start.getDate()
    
    const endYear = end.getFullYear()
    const endMonth = end.getMonth() + 1
    const endDay = end.getDate()
    
    // Rule 1: Single day - don't show end date
    if (startYear === endYear && startMonth === endMonth && startDay === endDay) {
      return `${startMonth}/${startDay}`
    }
    
    // Rule 2: Same month - omit end month
    if (startYear === endYear && startMonth === endMonth) {
      return `${startMonth}/${startDay} - ${endDay}`
    }
    
    // Rule 3: Same year - omit end year
    if (startYear === endYear) {
      return `${startMonth}/${startDay} - ${endMonth}/${endDay}`
    }
    
    // Rule 4: Different years - show both years
    return `${startYear}/${startMonth}/${startDay} - ${endYear}/${endMonth}/${endDay}`
  },

  // Get today's date (start of day)
  getToday: (): Date => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  },

  // Check if a trip is in the future (start date is today or later)
  isFutureTrip: (startDate: FirestoreDate | null | undefined): boolean => {
    if (!dateUtils.isValidDate(startDate)) return false
    
    const tripStart = toDateOrNull(startDate)
    if (!tripStart) return false
    
    tripStart.setHours(0, 0, 0, 0)
    const today = dateUtils.getToday()
    return tripStart >= today
  },

  // Check if a trip is in the past (start date is before today)
  isPastTrip: (startDate: FirestoreDate | null | undefined): boolean => {
    if (!dateUtils.isValidDate(startDate)) return false
    
    const tripStart = toDateOrNull(startDate)
    if (!tripStart) return false
    
    tripStart.setHours(0, 0, 0, 0)
    const today = dateUtils.getToday()
    return tripStart < today
  },

  // Sort trips by date (future trips ascending, past trips descending)
  sortTripsByDate: <T extends { start_date?: FirestoreDate }>(trips: T[]): { futureTrips: T[], pastTrips: T[] } => {
    const today = dateUtils.getToday()
    
    const futureTrips: T[] = trips
      .filter(trip => dateUtils.isFutureTrip(trip.start_date))
      .sort((a, b) => {
        if (!a.start_date || !b.start_date) return 0
        
        const dateA = toDateOrNull(a.start_date)
        const dateB = toDateOrNull(b.start_date)
        
        if (!dateA || !dateB) return 0
        return dateA.getTime() - dateB.getTime()
      })
    
    const pastTrips: T[] = trips
      .filter(trip => dateUtils.isPastTrip(trip.start_date))
      .sort((a, b) => {
        if (!a.start_date || !b.start_date) return 0
        
        const dateA = toDateOrNull(a.start_date)
        const dateB = toDateOrNull(b.start_date)
        
        if (!dateA || !dateB) return 0
        return dateB.getTime() - dateA.getTime()
      })
    
    return { futureTrips, pastTrips }
  },

  // Format future trip date range with unified rules
  formatFutureTripDate: (startDate: FirestoreDate, endDate: FirestoreDate): string => {
    if (!dateUtils.isValidDate(startDate) || !dateUtils.isValidDate(endDate)) {
      return '日付が設定されていません'
    }
    
    const start = toDateOrNull(startDate)
    const end = toDateOrNull(endDate)
    
    if (!start || !end) {
      return '日付が設定されていません'
    }
    
    const today = dateUtils.getToday()
    
    // Calculate days until trip
    const daysUntil = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    // Calculate trip duration (more accurate calculation)
    const tripDuration = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // Apply unified date range formatting rules
    return dateUtils.formatUnifiedDateRange(start, end, daysUntil, tripDuration)
  },

  // Unified date range formatting with consistent rules
  formatUnifiedDateRange: (start: Date, end: Date, daysUntil: number, tripDuration: number): string => {
    const startYear = start.getFullYear()
    const startMonth = start.getMonth() + 1
    const startDay = start.getDate()
    
    const endYear = end.getFullYear()
    const endMonth = end.getMonth() + 1
    const endDay = end.getDate()
    
    // Rule 1: Single day - don't show end date
    if (startYear === endYear && startMonth === endMonth && startDay === endDay) {
      const durationText = tripDuration === 1 ? '日帰り' : `${tripDuration}日間`
      return `${startMonth}/${startDay} (${daysUntil}日後、${durationText})`
    }
    
    // Rule 2: Same month - omit end month
    if (startYear === endYear && startMonth === endMonth) {
      return `${startMonth}/${startDay} - ${endDay} (${daysUntil}日後、${tripDuration}日間)`
    }
    
    // Rule 3: Same year - omit end year
    if (startYear === endYear) {
      return `${startMonth}/${startDay} - ${endMonth}/${endDay} (${daysUntil}日後、${tripDuration}日間)`
    }
    
    // Rule 4: Different years - show both years
    return `${startYear}/${startMonth}/${startDay} - ${endYear}/${endMonth}/${endDay} (${daysUntil}日後、${tripDuration}日間)`
  },

  // Format past trip date range with relative time
  formatPastTripDate: (startDate: FirestoreDate, endDate: FirestoreDate): string => {
    if (!dateUtils.isValidDate(startDate) || !dateUtils.isValidDate(endDate)) {
      return '日付が設定されていません'
    }
    
    const start = toDateOrNull(startDate)
    if (!start) {
      return '日付が設定されていません'
    }
    
    const today = dateUtils.getToday()
    
    // Calculate years and months difference
    const startYear = start.getFullYear()
    const startMonth = start.getMonth()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    
    const yearDiff = currentYear - startYear
    const monthDiff = currentMonth - startMonth
    const totalMonths = yearDiff * 12 + monthDiff
    
    let timeAgo: string
    if (totalMonths < 12) {
      // Less than 1 year
      if (totalMonths === 0) {
        timeAgo = '今月'
      } else {
        timeAgo = `${totalMonths}ヶ月前`
      }
      const monthName = start.toLocaleDateString('ja-JP', { month: 'long' })
      return `${timeAgo} (${monthName})`
    } else if (yearDiff < 5) {
      // 1-4 years ago
      const yearName = start.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })
      return `${yearDiff}年前 (${yearName})`
    } else {
      // 5+ years ago
      const yearName = start.toLocaleDateString('ja-JP', { year: 'numeric' })
      return `${yearDiff}年前 (${yearName})`
    }
  },

  // Format trip date range in compact format
  formatTripDateRange: (startDate: FirestoreDate, endDate: FirestoreDate): string => {
    if (!dateUtils.isValidDate(startDate) || !dateUtils.isValidDate(endDate)) {
      return '日付が設定されていません'
    }
    
    const start = toDateOrNull(startDate)
    const end = toDateOrNull(endDate)
    
    if (!start || !end) {
      return '日付が設定されていません'
    }
    
    const startYear = start.getFullYear()
    const startMonth = start.getMonth() + 1
    const startDay = start.getDate()
    const startWeekday = start.toLocaleDateString('ja-JP', { weekday: 'short' })
    
    const endYear = end.getFullYear()
    const endMonth = end.getMonth() + 1
    const endDay = end.getDate()
    const endWeekday = end.toLocaleDateString('ja-JP', { weekday: 'short' })
    
    // Same year
    if (startYear === endYear) {
      // Same month
      if (startMonth === endMonth) {
        return `${startYear}年${startMonth}月${startDay}日 (${startWeekday}) - ${endDay} (${endWeekday})`
      } else {
        // Different months
        return `${startYear}年${startMonth}月${startDay}日 (${startWeekday}) - ${endMonth}月${endDay}日(${endWeekday})`
      }
    } else {
      // Different years
      return `${startYear}年${startMonth}月${startDay}日 (${startWeekday}) - ${endYear}年${endMonth}月${endDay}日 (${endWeekday})`
    }
  },

  // Format duration in a compact way (e.g., 32h32m -> 32.5h)
  formatDurationCompact: (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    
    // Round minutes to nearest 15-minute interval
    const roundedMinutes = Math.round(minutes / 15) * 15
    
    // Convert to decimal hours
    const decimalHours = hours + (roundedMinutes / 60)
    
    // Format with appropriate decimal places
    if (roundedMinutes === 0) {
      return `${hours}h`
    } else if (roundedMinutes === 60) {
      return `${hours + 1}h`
    } else {
      return `${decimalHours}h`
    }
  },

  // Convert date to yyyy-mm-dd format for URL parameters
  toUrlDateString: (date: FirestoreDate): string => {
    if (!dateUtils.isValidDate(date)) {
      throw new Error('Invalid date provided')
    }
    
    const d = toDateOrNull(date)
    if (!d) {
      throw new Error('Invalid date provided')
    }
    
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  },

  // Parse yyyy-mm-dd format from URL parameters
  fromUrlDateString: (dateString: string): Date => {
    if (!dateString || typeof dateString !== 'string') {
      throw new Error('Invalid date string provided')
    }
    
    // Validate format (yyyy-mm-dd)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateString)) {
      throw new Error('Date string must be in yyyy-mm-dd format')
    }
    
    const date = new Date(dateString + 'T00:00:00.000Z')
    
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date string provided')
    }
    
    return date
  },

  // Check if two dates are the same day (ignoring time)
  isSameDay: (date1: FirestoreDate, date2: FirestoreDate): boolean => {
    if (!dateUtils.isValidDate(date1) || !dateUtils.isValidDate(date2)) {
      return false
    }
    
    const d1 = toDateOrNull(date1)
    const d2 = toDateOrNull(date2)
    
    if (!d1 || !d2) {
      return false
    }
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate()
  },

  // Convert any date format to Date object (returns null if invalid)
  toDate: (date: FirestoreDate | null | undefined): Date | null => {
    return toDateOrNull(date)
  }
}
