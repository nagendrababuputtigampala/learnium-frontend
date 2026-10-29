import type { ExtractionStatus } from '../../lib/api'
import { extractionStatusInfo } from '../../lib/materials'

export default function ExtractionStatusChip({
  status,
}: {
  status: ExtractionStatus
}) {
  const info = extractionStatusInfo(status)
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${info.chipClassName}`}
    >
      {info.chipLabel}
    </span>
  )
}
