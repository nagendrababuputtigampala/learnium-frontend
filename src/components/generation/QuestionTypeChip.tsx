import type { QuestionTypeCode } from '../../lib/api'
import { questionTypeInfo } from '../../lib/generation'

export default function QuestionTypeChip({
  type,
}: {
  type: QuestionTypeCode
}) {
  const info = questionTypeInfo(type)
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${info.chipClassName}`}
    >
      {info.label}
    </span>
  )
}
