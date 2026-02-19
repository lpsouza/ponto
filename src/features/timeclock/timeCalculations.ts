import { Database } from '../../types/database.types'

export type TimeRecord = Database['public']['Tables']['time_records']['Row']
export type TimeRecordType = TimeRecord['type']

/**
 * Represents a work segment with a defined start and optional end.
 */
export interface WorkSegment {
    start: Date
    end: Date | null
}

/**
 * Determines the current tracker state based on the latest record.
 * Returns the allowed next action and the current status label.
 *
 * - idle: No records, or the last record is an 'exit'. Next action: 'entry'.
 * - working: The last record is an 'entry'. Next action: 'exit'.
 */
export function getTrackerState(records: TimeRecord[]): {
    status: 'idle' | 'working'
    allowedActions: TimeRecordType[]
} {
    if (records.length === 0) {
        return { status: 'idle', allowedActions: ['start'] }
    }

    const sorted = [...records].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    const lastRecord = sorted[sorted.length - 1]

    if (lastRecord.type === 'start' || lastRecord.type === 'resume') {
        return { status: 'working', allowedActions: ['finish', 'pause'] }
    }

    return { status: 'idle', allowedActions: ['start'] }
}

/**
 * Extracts completed and active work segments from a list of records.
 * Segments are pairs of (entry -> exit).
 * An active segment (entry without matching exit) has no end time.
 */
export function getWorkSegments(records: TimeRecord[]): WorkSegment[] {
    const sorted = [...records].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    const segments: WorkSegment[] = []
    let currentStart: Date | null = null

    for (const record of sorted) {
        if (record.type === 'start') {
            currentStart = new Date(record.timestamp)
        } else if (record.type === 'finish' && currentStart) {
            segments.push({
                start: currentStart,
                end: new Date(record.timestamp),
            })
            currentStart = null
        }
    }

    // If there is an open segment (currently working), add it without end
    if (currentStart) {
        segments.push({ start: currentStart, end: null })
    }

    return segments
}

/**
 * Calculates total worked milliseconds from a list of records.
 * For active segments (no end), uses `now` as the end time.
 */
export function calculateTotalWorkedMs(records: TimeRecord[], now: Date = new Date()): number {
    const segments = getWorkSegments(records)

    return segments.reduce((total, segment) => {
        const end = segment.end ?? now
        return total + (end.getTime() - segment.start.getTime())
    }, 0)
}

/**
 * Formats milliseconds into HH:MM:SS string.
 */
export function formatDuration(ms: number): string {
    if (ms < 0) ms = 0

    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0'),
    ].join(':')
}

/**
 * Formats a Date to a locale time string (HH:MM).
 */
export function formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

/**
 * Formats a Date to an input-compatible datetime-local string (YYYY-MM-DDTHH:MM).
 */
export function toDatetimeLocalString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
