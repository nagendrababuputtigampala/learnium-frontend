import type { QuestionTypeCode } from './api'

export type QuestionFieldErrors = Record<string, string>
export interface Criterion { id?: string; criterion: string; maxScore: number }

export function rubricTotal(rubric: Criterion[]): number {
  return Number(rubric.reduce((sum, entry) => sum + entry.maxScore, 0).toPrecision(15))
}

/** Mirrors the shared M3 validator; the server remains authoritative on every save. */
export function validateQuestionContent(type: QuestionTypeCode, content: Record<string, unknown>): QuestionFieldErrors {
  const errors: QuestionFieldErrors = {}
  const text = (field: string, limit: number) => {
    const value = content[field]
    if (typeof value !== 'string' || value.trim() === '') errors[`content.${field}`] = 'Enter text for this field.'
    else if (value.length > limit) errors[`content.${field}`] = `Use at most ${limit} characters.`
  }
  if (type === 'MCQ' || type === 'NUMERIC' || type === 'WRITTEN') text('stem', 500)
  if (type === 'MCQ') {
    const options = content.options as { text: string }[]
    if (options.length !== 4 || options.some(option => option.text.trim() === '' || option.text.length > 200)
        || new Set(options.map(option => option.text.trim().replace(/\s+/g, ' ').toLowerCase())).size !== 4) {
      errors['content.options'] = 'Use four distinct options, each 1–200 characters.'
    }
    if (!Number.isInteger(content.correctIndex) || Number(content.correctIndex) < 0 || Number(content.correctIndex) > 3) {
      errors['content.correctIndex'] = 'Choose the correct option.'
    }
  }
  if (type === 'FILL_BLANK') {
    text('stemWithBlank', 500); text('answer', 50)
    const normalized = String(content.stemWithBlank).replace(/_{5,}/g, '_____')
    if ((normalized.match(/_____/g) ?? []).length !== 1) errors['content.stemWithBlank'] = 'Include exactly one _____ blank.'
  }
  if (type === 'FLASHCARD') { text('front', 500); text('back', 2000) }
  if (type === 'NUMERIC') {
    if (typeof content.answerValue !== 'number' || !Number.isFinite(content.answerValue)) errors['content.answerValue'] = 'Enter a finite numeric answer.'
    if (typeof content.tolerance !== 'number' || !Number.isFinite(content.tolerance) || content.tolerance < 0) errors['content.tolerance'] = 'Enter a finite, non-negative tolerance.'
    text('workedSolution', 4000)
    if (String(content.unit).length > 20) errors['content.unit'] = 'Use at most 20 characters.'
  }
  if (type === 'WRITTEN') {
    text('modelAnswer', 4000)
    const rubric = content.rubric as Criterion[]
    const total = rubricTotal(rubric)
    if (rubric.length < 3 || rubric.length > 5 || rubric.some(entry => entry.criterion.trim() === '' || entry.criterion.length > 200
        || !Number.isFinite(entry.maxScore) || entry.maxScore <= 0 || entry.maxScore > 100) || total > 100) {
      errors['content.rubric'] = 'Use 3–5 criteria with text up to 200 characters and positive points totalling at most 100.'
    }
    if (content.maxScore !== undefined && content.maxScore !== total) errors['content.maxScore'] = 'The maximum score must equal the rubric total.'
  }
  return errors
}
