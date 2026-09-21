/**
 * Utility functions for handling 7-day week instances and localized date formatting
 */

export type Locale = "pt-BR" | "en-US"

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
 * Format YYYY-MM-DD to localized date string
 */
export function formatDateLocale(dateStr: string, locale: Locale = "pt-BR"): string {
  if (!dateStr) return ""
  const parts = dateStr.split("-").map(Number)
  if (parts.length !== 3) return dateStr
  const [year, month, day] = parts
  const d = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "2-digit", year: "numeric" }).format(d)
}

export function formatDateBR(dateStr: string): string {
  return formatDateLocale(dateStr, "pt-BR")
}

/**
 * Format range, e.g.:
 * pt-BR: "10 a 16/08/2026" or "10 a 16 de agosto de 2026"
 * en-US: "August 10–16, 2026"
 */
export function formatDateRangeLocale(startDateStr: string, endDateStr: string, locale: Locale = "pt-BR"): string {
  if (!startDateStr || !endDateStr) return ""
  const [sy, sm, sd] = startDateStr.split("-").map(Number)
  const [ey, em, ed] = endDateStr.split("-").map(Number)

  if (!sy || !ey) return ""

  const start = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)

  if (locale === "en-US") {
    const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" })
    const startMonth = monthFormatter.format(start)
    const endMonth = monthFormatter.format(end)

    if (sy === ey) {
      if (sm === em) {
        return `${startMonth} ${sd}–${ed}, ${sy}`
      }
      return `${startMonth} ${sd} – ${endMonth} ${ed}, ${sy}`
    }
    return `${startMonth} ${sd}, ${sy} – ${endMonth} ${ed}, ${ey}`
  }

  // pt-BR
  if (sy === ey) {
    if (sm === em) {
      const smStr = String(sm).padStart(2, "0")
      return `${String(sd).padStart(2, "0")} a ${String(ed).padStart(2, "0")}/${smStr}/${sy}`
    }
    const smStr = String(sm).padStart(2, "0")
    const emStr = String(em).padStart(2, "0")
    return `${String(sd).padStart(2, "0")}/${smStr} a ${String(ed).padStart(2, "0")}/${emStr}/${sy}`
  }
  const smStr = String(sm).padStart(2, "0")
  const emStr = String(em).padStart(2, "0")
  return `${String(sd).padStart(2, "0")}/${smStr}/${sy} a ${String(ed).padStart(2, "0")}/${emStr}/${ey}`
}

export function formatDateRangeBR(startDateStr: string, endDateStr: string): string {
  return formatDateRangeLocale(startDateStr, endDateStr, "pt-BR")
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
export function getWeekDays(startDateStr: string, locale: Locale = "pt-BR"): WeekDayInfo[] {
  if (!startDateStr) return []
  const parts = startDateStr.split("-").map(Number)
  if (parts.length !== 3) return []
  const [year, month, day] = parts

  const dayFormatter = new Intl.DateTimeFormat(locale, { weekday: "short" })

  const days: WeekDayInfo[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(year, month - 1, day + i)
    const yStr = d.getFullYear()
    const mStr = String(d.getMonth() + 1).padStart(2, "0")
    const dStr = String(d.getDate()).padStart(2, "0")
    const fullDate = `${yStr}-${mStr}-${dStr}`
    
    // Capitalize short weekday name
    const rawName = dayFormatter.format(d).replace(".", "")
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1)

    const dayNumberLabel = locale === "en-US" ? `Day ${i + 1}` : `Dia ${i + 1}`
    const formattedShort = locale === "en-US" ? `${name} ${mStr}/${dStr}` : `${name} ${dStr}/${mStr}`

    days.push({
      dayIndex: i,
      dateStr: fullDate,
      dayName: name,
      dayNumberLabel,
      formattedShort,
    })
  }
  return days
}
