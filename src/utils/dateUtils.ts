/**
 * Checks if a given date is today (ignoring time)
 */
export const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
}

/**
 * Returns a new date shifted by a number of days
 */
export const shiftDate = (date: Date, days: number): Date => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d
}

/**
 * Formats a date object to YYYY-MM-DD for input[type="date"]
 */
export const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Formats a date object to HH:mm for input[type="time"]
 */
export const formatTimeForInput = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
}

/**
 * Parses separate date (YYYY-MM-DD) and time (HH:mm) strings into a single Date object
 */
export const parseDateTime = (dateStr: string, timeStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hours, minutes] = timeStr.split(':').map(Number)
    return new Date(year, month - 1, day, hours, minutes)
}
/**
 * Returns YYYY-MM-DD in local time
 */
export const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Returns UTC YYYY-MM-DD HH:mm:ss.SSS for PocketBase filtering
 */
export const formatForPB = (date: Date): string => {
    return date.toISOString().replace('T', ' ').replace('Z', '')
}

/**
 * Normalizes a date string from PocketBase (which might have spaces) to a Date object
 */
export const parsePBDate = (dateStr: string): Date => {
    if (!dateStr) return new Date()
    // Ensure ISO format with T and ensure Z is present if not already
    let normalized = dateStr.replace(' ', 'T')
    if (!normalized.endsWith('Z') && !normalized.includes('+')) {
        normalized += 'Z'
    }
    return new Date(normalized)
}
/**
 * Checks if a given date is a weekend (Saturday or Sunday)
 */
export const isWeekend = (date: Date): boolean => {
    const day = date.getDay()
    return day === 0 || day === 6
}

/**
 * Parses HH:mm and returns minutes from start of day
 */
export const getMinutesFromTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
}

/**
 * Calculates milliseconds of overlap between [start, end] and a daily time range [rangeStart, rangeEnd]
 */
export const calculateTimeOverlap = (
    start: Date,
    end: Date,
    rangeStartStr: string,
    rangeEndStr: string
): number => {
    const s = start.getTime()
    const e = end.getTime()

    // Normalize range times to the start of the 'start' date
    const baseDate = new Date(start)
    baseDate.setHours(0, 0, 0, 0)
    const base = baseDate.getTime()

    const rStartMs = getMinutesFromTime(rangeStartStr) * 60 * 1000
    const rEndMs = getMinutesFromTime(rangeEndStr) * 60 * 1000

    let overlap = 0

    // Range might cross midnight (e.g., 22:00 to 05:00)
    if (rStartMs > rEndMs) {
        // Break into two ranges: [rStart, Midnight] and [Midnight, rEnd]
        const range1Start = base + rStartMs
        const range1End = base + 24 * 60 * 60 * 1000
        const range2Start = base + 24 * 60 * 60 * 1000
        const range2End = base + 24 * 60 * 60 * 1000 + rEndMs

        overlap += Math.max(0, Math.min(e, range1End) - Math.max(s, range1Start))
        overlap += Math.max(0, Math.min(e, range2End) - Math.max(s, range2Start))

        // Also check previous day if start is very early
        const prevBase = base - 24 * 60 * 60 * 1000
        const prevRange1Start = prevBase + rStartMs
        const prevRange1End = prevBase + 24 * 60 * 60 * 1000
        overlap += Math.max(0, Math.min(e, prevRange1End) - Math.max(s, prevRange1Start))
    } else {
        const rangeStart = base + rStartMs
        const rangeEnd = base + rEndMs
        overlap += Math.max(0, Math.min(e, rangeEnd) - Math.max(s, rangeStart))

        // Also check next day if block crosses midnight
        const nextBase = base + 24 * 60 * 60 * 1000
        const nextRangeStart = nextBase + rStartMs
        const nextRangeEnd = nextBase + rEndMs
        overlap += Math.max(0, Math.min(e, nextRangeEnd) - Math.max(s, nextRangeStart))
    }

    return overlap
}
