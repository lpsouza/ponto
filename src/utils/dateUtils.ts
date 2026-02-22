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
