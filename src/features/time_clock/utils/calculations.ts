import type { TimeRecord, CompanySettings } from '../../../types/pocketbase-types'
import { parsePBDate, isToday, calculateTimeOverlap, isWeekend } from '../../../utils/dateUtils'

export interface WorkBlock {
    start: TimeRecord
    finish?: TimeRecord
    duration: number // in milliseconds
    baseDuration: number // without multipliers
}

/**
 * Calculates work blocks from a list of time records, applying multipliers if settings are provided.
 */
export const calculateWorkBlocks = (
    records: TimeRecord[],
    settings?: CompanySettings
): WorkBlock[] => {
    // Separate standard work records from special day markers
    const workRecords = records.filter(r => ['start', 'finish'].includes(r.type))

    const sorted = [...workRecords].sort((a, b) =>
        parsePBDate(a.timestamp).getTime() - parsePBDate(b.timestamp).getTime()
    )

    const blocks: WorkBlock[] = []
    let activeStart: TimeRecord | null = null

    const calculateBlockDuration = (start: TimeRecord, finish?: TimeRecord) => {
        const startTs = parsePBDate(start.timestamp)
        const endTs = finish ? parsePBDate(finish.timestamp) : (isToday(startTs) ? new Date() : startTs)
        const baseDuration = Math.max(0, endTs.getTime() - startTs.getTime())

        if (!settings) return { duration: baseDuration, baseDuration }

        let multiplier = 1.0

        // 1. Weekend multiplier
        if (settings.multipliers.weekend && isWeekend(startTs)) {
            multiplier = settings.multipliers.weekend
        }

        let totalDuration = baseDuration * multiplier

        // 2. Night shift multiplier (only applies to the overlap)
        if (settings.multipliers.night) {
            const nightOverlap = calculateTimeOverlap(
                startTs,
                endTs,
                settings.multipliers.night.start,
                settings.multipliers.night.end
            )
            // The night multiplier is applied ON TOP of the base/weekend duration for that overlap
            // Example: Overlap is 1h. Base multiplier is 1. Night multiplier is 1.14. 
            // We add (1.14 - 1.0) * overlap to the total.
            totalDuration += nightOverlap * (settings.multipliers.night.value - 1)
        }

        return { duration: totalDuration, baseDuration }
    }

    for (const record of sorted) {
        if (record.type === 'start') {
            if (activeStart) {
                const { duration, baseDuration } = calculateBlockDuration(activeStart)
                blocks.push({ start: activeStart, duration, baseDuration })
            }
            activeStart = record
        } else if (record.type === 'finish') {
            if (activeStart) {
                const { duration, baseDuration } = calculateBlockDuration(activeStart, record)
                blocks.push({
                    start: activeStart,
                    finish: record,
                    duration,
                    baseDuration
                })
                activeStart = null
            }
        }
    }

    if (activeStart) {
        const { duration, baseDuration } = calculateBlockDuration(activeStart)
        blocks.push({ start: activeStart, duration, baseDuration })
    }

    return blocks
}

/**
 * Calculates the total duration for a set of records, including special types.
 */
export const calculateTotalDuration = (
    records: TimeRecord[],
    settings?: CompanySettings
): number => {
    // 1. Calculate duration from work blocks (start/finish)
    const blocks = calculateWorkBlocks(records, settings)
    const workDuration = blocks.reduce((sum, block) => sum + block.duration, 0)

    // 2. Add duration from 'leave' (Abonada)
    // If it's a 'leave' record, it "pays" for the daily target
    const hasLeave = records.some(r => r.type === 'leave')
    if (hasLeave && settings) {
        // Find if there's already work duration. 
        // If leave + work > target, we just ensure it's at least target? 
        // User said: "Folga (abonada): Horas trabalhadas extras nesse dia contam como 100% positivo."
        // This means the DAY is paid. So totalDuration = daily_target + any work.
        return settings.daily_target_ms + workDuration
    }

    return workDuration
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
