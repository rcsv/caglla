// Date utility functions
export const dateUtils = {
  // Check if a date is valid
  isValidDate: (date: any): boolean => {
    if (!date) return false
    
    // Handle Firestore Timestamp objects
    if (date && typeof date === 'object' && date.toDate && typeof date.toDate === 'function') {
      const d = date.toDate()
      return !isNaN(d.getTime())
    }
    
    const d = new Date(date)
    return !isNaN(d.getTime())
  },

  // Format date safely
  formatDate: (date: any, options?: Intl.DateTimeFormatOptions): string => {
    if (!dateUtils.isValidDate(date)) {
      return '日付が設定されていません'
    }
    
    // Handle Firestore Timestamp objects
    let d: Date
    if (date && typeof date === 'object' && date.toDate && typeof date.toDate === 'function') {
      d = date.toDate()
    } else {
      d = new Date(date)
    }
    
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      ...options
    })
  },

  // Format date range safely
  formatDateRange: (startDate: any, endDate: any): string => {
    if (!dateUtils.isValidDate(startDate) || !dateUtils.isValidDate(endDate)) {
      return '日付が設定されていません'
    }
    
    // Handle Firestore Timestamp objects
    let start: Date, end: Date
    if (startDate && typeof startDate === 'object' && startDate.toDate && typeof startDate.toDate === 'function') {
      start = startDate.toDate()
    } else {
      start = new Date(startDate)
    }
    
    if (endDate && typeof endDate === 'object' && endDate.toDate && typeof endDate.toDate === 'function') {
      end = endDate.toDate()
    } else {
      end = new Date(endDate)
    }
    
    return `${start.toLocaleDateString('ja-JP')} - ${end.toLocaleDateString('ja-JP')}`
  },

  // Get today's date (start of day)
  getToday: (): Date => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  },

  // Check if a trip is in the future (start date is today or later)
  isFutureTrip: (startDate: any): boolean => {
    if (!dateUtils.isValidDate(startDate)) return false
    
    // Handle Firestore Timestamp objects
    let tripStart: Date
    if (startDate && typeof startDate === 'object' && startDate.toDate && typeof startDate.toDate === 'function') {
      tripStart = startDate.toDate()
    } else {
      tripStart = new Date(startDate)
    }
    
    tripStart.setHours(0, 0, 0, 0)
    const today = dateUtils.getToday()
    return tripStart >= today
  },

  // Check if a trip is in the past (start date is before today)
  isPastTrip: (startDate: any): boolean => {
    if (!dateUtils.isValidDate(startDate)) return false
    
    // Handle Firestore Timestamp objects
    let tripStart: Date
    if (startDate && typeof startDate === 'object' && startDate.toDate && typeof startDate.toDate === 'function') {
      tripStart = startDate.toDate()
    } else {
      tripStart = new Date(startDate)
    }
    
    tripStart.setHours(0, 0, 0, 0)
    const today = dateUtils.getToday()
    return tripStart < today
  },

  // Sort trips by date (future trips ascending, past trips descending)
  sortTripsByDate: (trips: any[]): { futureTrips: any[], pastTrips: any[] } => {
    const today = dateUtils.getToday()
    
    const futureTrips = trips
      .filter(trip => dateUtils.isFutureTrip(trip.start_date))
      .sort((a, b) => {
        if (!a.start_date || !b.start_date) return 0
        
        // Handle Firestore Timestamp objects
        let dateA: Date, dateB: Date
        if (a.start_date && typeof a.start_date === 'object' && a.start_date.toDate && typeof a.start_date.toDate === 'function') {
          dateA = a.start_date.toDate()
        } else {
          dateA = new Date(a.start_date)
        }
        
        if (b.start_date && typeof b.start_date === 'object' && b.start_date.toDate && typeof b.start_date.toDate === 'function') {
          dateB = b.start_date.toDate()
        } else {
          dateB = new Date(b.start_date)
        }
        
        return dateA.getTime() - dateB.getTime()
      })
    
    const pastTrips = trips
      .filter(trip => dateUtils.isPastTrip(trip.start_date))
      .sort((a, b) => {
        if (!a.start_date || !b.start_date) return 0
        
        // Handle Firestore Timestamp objects
        let dateA: Date, dateB: Date
        if (a.start_date && typeof a.start_date === 'object' && a.start_date.toDate && typeof a.start_date.toDate === 'function') {
          dateA = a.start_date.toDate()
        } else {
          dateA = new Date(a.start_date)
        }
        
        if (b.start_date && typeof b.start_date === 'object' && b.start_date.toDate && typeof b.start_date.toDate === 'function') {
          dateB = b.start_date.toDate()
        } else {
          dateB = new Date(b.start_date)
        }
        
        return dateB.getTime() - dateA.getTime()
      })
    
    return { futureTrips, pastTrips }
  },

  // Format future trip date range with days until and duration
  formatFutureTripDate: (startDate: any, endDate: any): string => {
    if (!dateUtils.isValidDate(startDate) || !dateUtils.isValidDate(endDate)) {
      return '日付が設定されていません'
    }
    
    // Handle Firestore Timestamp objects
    let start: Date, end: Date
    if (startDate && typeof startDate === 'object' && startDate.toDate && typeof startDate.toDate === 'function') {
      start = startDate.toDate()
    } else {
      start = new Date(startDate)
    }
    
    if (endDate && typeof endDate === 'object' && endDate.toDate && typeof endDate.toDate === 'function') {
      end = endDate.toDate()
    } else {
      end = new Date(endDate)
    }
    
    const today = dateUtils.getToday()
    
    // Calculate days until trip
    const daysUntil = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    // Calculate trip duration
    const tripDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // Format dates (M/D format)
    const startFormatted = `${start.getMonth() + 1}/${start.getDate()}`
    const endFormatted = `${end.getMonth() + 1}/${end.getDate()}`
    
    return `${startFormatted} - ${endFormatted} (${daysUntil}日後、${tripDuration}日間)`
  },

  // Format past trip date range with relative time
  formatPastTripDate: (startDate: any, endDate: any): string => {
    if (!dateUtils.isValidDate(startDate) || !dateUtils.isValidDate(endDate)) {
      return '日付が設定されていません'
    }
    
    // Handle Firestore Timestamp objects
    let start: Date
    if (startDate && typeof startDate === 'object' && startDate.toDate && typeof startDate.toDate === 'function') {
      start = startDate.toDate()
    } else {
      start = new Date(startDate)
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
  formatTripDateRange: (startDate: any, endDate: any): string => {
    if (!dateUtils.isValidDate(startDate) || !dateUtils.isValidDate(endDate)) {
      return '日付が設定されていません'
    }
    
    // Handle Firestore Timestamp objects
    let start: Date, end: Date
    if (startDate && typeof startDate === 'object' && startDate.toDate && typeof startDate.toDate === 'function') {
      start = startDate.toDate()
    } else {
      start = new Date(startDate)
    }
    
    if (endDate && typeof endDate === 'object' && endDate.toDate && typeof endDate.toDate === 'function') {
      end = endDate.toDate()
    } else {
      end = new Date(endDate)
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
  }
}
