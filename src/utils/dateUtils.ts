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
    return date.toISOString().split('T')[0]
}

/**
 * Formats a date object to HH:mm for input[type="time"]
 */
export const formatTimeForInput = (date: Date): string => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Parses separate date (YYYY-MM-DD) and time (HH:mm) strings into a single Date object
 */
export const parseDateTime = (dateStr: string, timeStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const [hours, minutes] = timeStr.split(':').map(Number)
    return new Date(year, month - 1, day, hours, minutes)
}
