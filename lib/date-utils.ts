/**
 * Utility functions for handling 7-day week instances and PT-BR date formatting
 */

export function getTodayFormatted(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Calculates inclusive 7-day end date from a start date (YYYY-MM-DD).
 * Example: 2026-08-10 + 6 days = 2026-08-16 (7 days total: 10, 11, 12, 13, 14, 15, 16)
 */
export function calculateInclusiveEndDate(startDateStr: string): string {
  if (!startDateStr) return ""
  const [year, month, day] = startDateStr.split("-").map(Number)
  if (!year || !month || !day) return ""

  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + 6) // +6 days for inclusive 7-day period

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Gets the next day after an end date (YYYY-MM-DD).
 */
export function getNextDayDate(dateStr: string): string {
  if (!dateStr) return getTodayFormatted()
  const [year, month, day] = dateStr.split("-").map(Number)
  if (!year || !month || !day) return getTodayFormatted()

  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + 1)

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * Format YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return ""
  const parts = dateStr.split("-")
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts
  return `${day}/${month}/${year}`
}

/**
 * Format range, e.g. "10/08 a 16/08/2026" or "10/08/2026 a 16/08/2026"
 */
export function formatDateRangeBR(startDateStr: string, endDateStr: string): string {
  if (!startDateStr || !endDateStr) return ""
  const [sy, sm, sd] = startDateStr.split("-")
  const [ey, em, ed] = endDateStr.split("-")

  if (!sy || !ey) return ""

  if (sy === ey) {
    if (sm === em) {
      return `${sd} a ${ed}/${sm}/${sy}`
    }
    return `${sd}/${sm} a ${ed}/${em}/${sy}`
  }
  return `${sd}/${sm}/${sy} a ${ed}/${em}/${ey}`
}

export type WeekDayInfo = {
  dayIndex: number
  dateStr: string
  dayName: string
  dayNumberLabel: string
  formattedShort: string
}

/**
 * Returns an array of 7 day objects for a week starting at startDateStr:
 * [{ dayIndex: 0, dateStr: "2026-08-10", dayName: "Seg", dayNumberLabel: "Dia 1", formattedShort: "Seg 10/08" }, ...]
 */
export function getWeekDays(startDateStr: string): WeekDayInfo[] {
  if (!startDateStr) return []
  const parts = startDateStr.split("-").map(Number)
  if (parts.length !== 3) return []
  const [year, month, day] = parts

  const dayNamesShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  const days: WeekDayInfo[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(year, month - 1, day + i)
    const yStr = d.getFullYear()
    const mStr = String(d.getMonth() + 1).padStart(2, "0")
    const dStr = String(d.getDate()).padStart(2, "0")
    const fullDate = `${yStr}-${mStr}-${dStr}`
    const name = dayNamesShort[d.getDay()]
    days.push({
      dayIndex: i,
      dateStr: fullDate,
      dayName: name,
      dayNumberLabel: `Dia ${i + 1}`,
      formattedShort: `${name} ${dStr}/${mStr}`,
    })
  }
  return days
}
