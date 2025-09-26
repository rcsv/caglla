// Date utility functions
export const dateUtils = {
  // Check if a date is valid
  isValidDate: (date: any): boolean => {
    if (!date) return false
    const d = new Date(date)
    return !isNaN(d.getTime())
  },

  // Format date safely
  formatDate: (date: any, options?: Intl.DateTimeFormatOptions): string => {
    if (!dateUtils.isValidDate(date)) {
      return '日付が設定されていません'
    }
    
    const d = new Date(date)
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
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    return `${start.toLocaleDateString('ja-JP')} - ${end.toLocaleDateString('ja-JP')}`
  }
}
