/**
 * 時間フォーマットのバリデーションとフォーマット
 */
export function isValidTimeFormat(time: string): boolean {
  if (!time) return true
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return timeRegex.test(time)
}

export function formatTimeForDisplay(time: string): string {
  if (!time) return '--:--'
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  return `${hour}:${minutes}`
}

export function parseTimeInput(time: string): { hours: number; minutes: number } | null {
  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  return { hours: parseInt(match[1]), minutes: parseInt(match[2]) }
}

export function isTimeBefore(time1: string, time2: string): boolean {
  const p1 = parseTimeInput(time1)
  const p2 = parseTimeInput(time2)
  if (!p1 || !p2) return false
  return p1.hours * 60 + p1.minutes < p2.hours * 60 + p2.minutes
}
