import type { TimeRecord } from '../../../types/pocketbase-types'

export interface WorkBlock {
    start: TimeRecord
    finish?: TimeRecord
    duration: number // in milliseconds
}

/**
 * Calculates work blocks from a list of time records.
 * Records should be for a single day usually, but works for any list.
 * 
 * Logic:
 * - Records are sorted chronologically.
 * - A 'start' begins a block.
 * - The NEXT 'finish' closes that block.
 * - If another 'start' appears before a 'finish', the previous 'start' is treated as an "active/open" block (but usually we only expect one open block at the end).
 * - A 'finish' without a preceding 'start' is currently ignored in duration sums.
 */
export const calculateWorkBlocks = (records: TimeRecord[]): WorkBlock[] => {
    const sorted = [...records].sort((a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    const blocks: WorkBlock[] = []
    let activeStart: TimeRecord | null = null

    for (const record of sorted) {
        if (record.type === 'start') {
            if (activeStart) {
                // We have a start followed by another start.
                // The first one is a block that never finished (active).
                blocks.push({
                    start: activeStart,
                    duration: Date.now() - new Date(activeStart.timestamp).getTime()
                })
            }
            activeStart = record
        } else if (record.type === 'finish') {
            if (activeStart) {
                const startTs = new Date(activeStart.timestamp).getTime()
                const finishTs = new Date(record.timestamp).getTime()
                blocks.push({
                    start: activeStart,
                    finish: record,
                    duration: Math.max(0, finishTs - startTs)
                })
                activeStart = null
            } else {
                // Finish without start - ignore for duration
            }
        }
    }

    if (activeStart) {
        blocks.push({
            start: activeStart,
            duration: Date.now() - new Date(activeStart.timestamp).getTime()
        })
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
