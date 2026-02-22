import type { WorkBlock } from '../../time_clock/utils/calculations'
import { parsePBDate } from '../../../utils/dateUtils'
import styles from './DailyTimeline.module.css'

interface DailyTimelineProps {
    blocks: WorkBlock[]
}

export const DailyTimeline = ({ blocks }: DailyTimelineProps) => {
    // We show 24 hours
    const DAY_MS = 24 * 60 * 60 * 1000

    const getPosition = (timestamp: string) => {
        const date = parsePBDate(timestamp)
        const dayStart = new Date(date)
        dayStart.setHours(0, 0, 0, 0)

        const msFromStart = date.getTime() - dayStart.getTime()
        return (msFromStart / DAY_MS) * 100
    }

    return (
        <div className={styles.timelineContainer}>
            <span className={styles.title}>Linha do Tempo (Hoje)</span>
            <div className={styles.bar}>
                {blocks.map((block, index) => {
                    const startPos = getPosition(block.start.timestamp)
                    const endTs = block.finish?.timestamp || new Date().toISOString()
                    const endPos = getPosition(endTs)
                    const width = Math.max(0.5, endPos - startPos) // Min width for visibility

                    return (
                        <div
                            key={index}
                            className={styles.workSegment}
                            style={{
                                left: `${startPos}%`,
                                width: `${width}%`
                            }}
                            title={`Trabalho: ${parsePBDate(block.start.timestamp).toLocaleTimeString()} - ${block.finish ? parsePBDate(block.finish.timestamp).toLocaleTimeString() : 'Em aberto'}`}
                        />
                    )
                })}
            </div>
            <div className={styles.timeMarkers}>
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
            </div>
        </div>
    )
}
