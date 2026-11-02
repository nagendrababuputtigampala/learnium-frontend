import type { ReactNode } from 'react'
import type { GeneratedQuestionDto } from '../../lib/api'
import { isQuestionTypeCode } from '../../lib/generation'
import QuestionTypeChip from './QuestionTypeChip'

/*
 * Draft payloads arrive as JSON written by the backend's draft
 * factory. The shapes below are the persisted contract:
 *   MCQ        { stem, options: [{ id: "a".."d", text }] },
 *              correctRef = the correct option's id
 *   FILL_BLANK { stemWithBlank, answer }, correctRef = the answer
 *   FLASHCARD  { front, back }
 *   NUMERIC    { stem, answerValue, tolerance, unit, workedSolution }
 *   WRITTEN    { stem, modelAnswer, rubric: [{ id, criterion, maxScore }] }
 * Every field is validated before use: anything unexpected renders
 * the generic fallback card instead of crashing the preview.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** A required, non-empty string field, or null when unusable. */
function textField(record: Record<string, unknown>, key: string): string | null {
  const value = record[key]
  return typeof value === 'string' && value !== '' ? value : null
}

/** A string field that may legitimately be empty (e.g. a unit). */
function stringField(
  record: Record<string, unknown>,
  key: string,
): string | null {
  const value = record[key]
  return typeof value === 'string' ? value : null
}

function numberField(
  record: Record<string, unknown>,
  key: string,
): number | null {
  const value = record[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function mcqBody(question: GeneratedQuestionDto): ReactNode | null {
  const payload = question.payload as Record<string, unknown>
  const stem = textField(payload, 'stem')
  const rawOptions = payload.options
  if (stem === null || !Array.isArray(rawOptions) || rawOptions.length === 0) {
    return null
  }
  const options: { id: string; text: string }[] = []
  for (const raw of rawOptions) {
    if (!isRecord(raw)) {
      return null
    }
    const id = textField(raw, 'id')
    const text = textField(raw, 'text')
    if (id === null || text === null) {
      return null
    }
    options.push({ id, text })
  }
  return (
    <>
      <p className="mt-2 text-sm font-medium">{stem}</p>
      <ul className="mt-2 space-y-1 text-sm">
        {options.map((option) => (
          <li
            key={option.id}
            className={
              option.id === question.correctRef
                ? 'font-semibold text-emerald-progress'
                : ''
            }
          >
            {option.id}. {option.text}
            {option.id === question.correctRef && (
              <span className="ml-2 text-xs font-semibold">
                ✓ Correct answer
              </span>
            )}
          </li>
        ))}
      </ul>
    </>
  )
}

function fillBlankBody(question: GeneratedQuestionDto): ReactNode | null {
  const payload = question.payload as Record<string, unknown>
  const stem = textField(payload, 'stemWithBlank')
  const answer = textField(payload, 'answer')
  if (stem === null || answer === null) {
    return null
  }
  return (
    <>
      <p className="mt-2 text-sm font-medium">{stem}</p>
      <p className="mt-2 text-sm">
        Answer: <span className="font-semibold">{answer}</span>
      </p>
    </>
  )
}

function flashcardBody(question: GeneratedQuestionDto): ReactNode | null {
  const payload = question.payload as Record<string, unknown>
  const front = textField(payload, 'front')
  const back = textField(payload, 'back')
  if (front === null || back === null) {
    return null
  }
  return (
    <div className="mt-2 space-y-2 text-sm">
      <p>
        <span className="font-semibold">Front: </span>
        {front}
      </p>
      <p>
        <span className="font-semibold">Back: </span>
        {back}
      </p>
    </div>
  )
}

function numericBody(question: GeneratedQuestionDto): ReactNode | null {
  const payload = question.payload as Record<string, unknown>
  const stem = textField(payload, 'stem')
  const value = numberField(payload, 'answerValue')
  const tolerance = numberField(payload, 'tolerance')
  const unit = stringField(payload, 'unit')
  const solution = textField(payload, 'workedSolution')
  if (
    stem === null ||
    value === null ||
    tolerance === null ||
    unit === null ||
    solution === null
  ) {
    return null
  }
  return (
    <>
      <p className="mt-2 text-sm font-medium">{stem}</p>
      <p className="mt-2 text-sm">
        Answer: <span className="font-semibold">{value}</span> ± {tolerance}
        {unit !== '' && <> {unit}</>}
      </p>
      <p className="mt-2 text-sm text-ink/80">
        <span className="font-semibold">Worked solution: </span>
        {solution}
      </p>
    </>
  )
}

function writtenBody(question: GeneratedQuestionDto): ReactNode | null {
  const payload = question.payload as Record<string, unknown>
  const stem = textField(payload, 'stem')
  const modelAnswer = textField(payload, 'modelAnswer')
  const rawRubric = payload.rubric
  if (stem === null || modelAnswer === null) {
    return null
  }
  if (!Array.isArray(rawRubric) || rawRubric.length === 0) {
    return null
  }
  const rubric: { id: string; criterion: string; maxScore: number }[] = []
  for (const raw of rawRubric) {
    if (!isRecord(raw)) {
      return null
    }
    const id = textField(raw, 'id')
    const criterion = textField(raw, 'criterion')
    const maxScore = numberField(raw, 'maxScore')
    if (id === null || criterion === null || maxScore === null) {
      return null
    }
    rubric.push({ id, criterion, maxScore })
  }
  return (
    <>
      <p className="mt-2 text-sm font-medium">{stem}</p>
      <p className="mt-2 text-sm">
        <span className="font-semibold">Model answer: </span>
        {modelAnswer}
      </p>
      <p className="mt-3 text-sm font-semibold">Marking rubric</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
        {rubric.map((entry) => (
          <li key={entry.id}>
            {entry.criterion} — up to {entry.maxScore}{' '}
            {entry.maxScore === 1 ? 'mark' : 'marks'}
          </li>
        ))}
      </ul>
    </>
  )
}

function renderBody(question: GeneratedQuestionDto): ReactNode | null {
  if (!isRecord(question.payload)) {
    return null
  }
  switch (question.type) {
    case 'MCQ':
      return mcqBody(question)
    case 'FILL_BLANK':
      return fillBlankBody(question)
    case 'FLASHCARD':
      return flashcardBody(question)
    case 'NUMERIC':
      return numericBody(question)
    case 'WRITTEN':
      return writtenBody(question)
    default:
      return null
  }
}

export default function DraftQuestionCard({
  question,
}: {
  question: GeneratedQuestionDto
}) {
  const body = renderBody(question)
  return (
    <article className="rounded-2xl border border-card-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        {isQuestionTypeCode(question.type) ? (
          <QuestionTypeChip type={question.type} />
        ) : (
          <span className="inline-block rounded-full bg-paper px-2 py-0.5 text-xs font-semibold text-ink/60">
            Question
          </span>
        )}
      </div>
      {body === null ? (
        <p className="mt-2 text-sm text-ink/60">
          This draft couldn’t be displayed in full — its saved content
          doesn’t match the expected format.
        </p>
      ) : (
        body
      )}
      <footer className="mt-3 border-t border-card-border pt-2 text-xs text-ink/60">
        {question.provider} · {question.model} · Prompt{' '}
        {question.promptVersion} · {question.createdAt.slice(0, 10)}
      </footer>
    </article>
  )
}
