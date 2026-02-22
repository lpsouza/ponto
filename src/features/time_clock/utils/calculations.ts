import type { TimeRecord } from '../../../types/pocketbase-types'
import { parsePBDate, isToday } from '../../../utils/dateUtils'

export interface WorkBlock {
    start: TimeRecord
    finish?: TimeRecord
    duration: number // in milliseconds
}

/**
 * Calculates work blocks from a list of time records.
 */
export const calculateWorkBlocks = (records: TimeRecord[]): WorkBlock[] => {
    const sorted = [...records].sort((a, b) =>
        parsePBDate(a.timestamp).getTime() - parsePBDate(b.timestamp).getTime()
    )

    const blocks: WorkBlock[] = []
    let activeStart: TimeRecord | null = null

    for (const record of sorted) {
        if (record.type === 'start') {
            if (activeStart) {
                // Should not happen with clean data, but handle it
                const startTs = parsePBDate(activeStart.timestamp)
                let duration = 0
                if (isToday(startTs)) {
                    duration = Math.max(0, Date.now() - startTs.getTime())
                }
                blocks.push({ start: activeStart, duration })
            }
            activeStart = record
        } else if (record.type === 'finish') {
            if (activeStart) {
                const startTs = parsePBDate(activeStart.timestamp).getTime()
                const finishTs = parsePBDate(record.timestamp).getTime()
                blocks.push({
                    start: activeStart,
                    finish: record,
                    duration: Math.max(0, finishTs - startTs)
                })
                activeStart = null
            }
        }
    }

    if (activeStart) {
        const startTs = parsePBDate(activeStart.timestamp)
        let duration = 0
        if (isToday(startTs)) {
            duration = Math.max(0, Date.now() - startTs.getTime())
        }
        blocks.push({ start: activeStart, duration })
    }

    return blocks
}

/**
 * Calculates the total duration for a set of records.
 * Sums all completed blocks and any active block.
 */
export const calculateTotalDuration = (records: TimeRecord[]): number => {
    const blocks = calculateWorkBlocks(records)
    return blocks.reduce((sum, block) => sum + block.duration, 0)
}

/**
 * Formats milliseconds into HH:mm:ss
 */
export const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':')
}

/**
 * Formats balance milliseconds into +HH:mm or -HH:mm
 */
export const formatBalance = (ms: number): string => {
    const isNegative = ms < 1000 && ms < 0; // ms < 1000 because -0.001 is basically 0
    const absoluteMs = Math.abs(ms)
    const totalSeconds = Math.floor(absoluteMs / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)

    const sign = isNegative ? '-' : '+'
    return `${sign}${hours.toString().padStart(1, '0')}:${minutes.toString().padStart(2, '0')}h`
}
