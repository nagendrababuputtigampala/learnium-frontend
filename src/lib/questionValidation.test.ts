import { describe, expect, it } from 'vitest'
import { rubricTotal, validateQuestionContent } from './questionValidation'
import type { QuestionTypeCode } from './api'

const rubric = [1, 2, 3].map(i => ({ criterion: `Criterion ${i}`, maxScore: 1 }))
const valid: Record<QuestionTypeCode, Record<string, unknown>> = {
  MCQ: { stem: 'Question', options: ['A', 'B', 'C', 'D'].map(text => ({ text })), correctIndex: 0 },
  FILL_BLANK: { stemWithBlank: 'One _____ blank', answer: 'Answer' },
  FLASHCARD: { front: 'Front', back: 'Back' },
  NUMERIC: { stem: 'Question', answerValue: 2, tolerance: 0, unit: '', workedSolution: 'Solution' },
  WRITTEN: { stem: 'Question', modelAnswer: 'Answer', rubric },
}

describe('review validation', () => {
  it.each(Object.keys(valid) as QuestionTypeCode[])('accepts valid %s content', type => {
    expect(validateQuestionContent(type, valid[type])).toEqual({})
  })

  it.each([
    ['MCQ', 'stem', 500], ['FILL_BLANK', 'answer', 50], ['FLASHCARD', 'front', 500],
    ['FLASHCARD', 'back', 2000], ['NUMERIC', 'workedSolution', 4000], ['WRITTEN', 'modelAnswer', 4000],
  ] as const)('bounds %s %s and requires text', (type, field, limit) => {
    for (const value of [undefined, 42, '', ' ', 'x'.repeat(limit + 1)]) {
      expect(validateQuestionContent(type, { ...valid[type], [field]: value })[`content.${field}`]).toBeTruthy()
    }
    expect(validateQuestionContent(type, { ...valid[type], [field]: 'x'.repeat(limit) })[`content.${field}`]).toBeUndefined()
  })

  it('requires four distinct MCQ options and an integer answer index in range', () => {
    for (const options of [[], [{ text: '' }, { text: 'B' }, { text: 'C' }, { text: 'D' }], ['a', ' A ', 'C', 'D'].map(text => ({ text })), ['x'.repeat(201), 'B', 'C', 'D'].map(text => ({ text }))]) {
      expect(validateQuestionContent('MCQ', { ...valid.MCQ, options })['content.options']).toBeTruthy()
    }
    for (const correctIndex of [-1, 4, 1.5, null]) expect(validateQuestionContent('MCQ', { ...valid.MCQ, correctIndex })['content.correctIndex']).toBeTruthy()
  })

  it('requires exactly one normalized blank and bounds its text', () => {
    for (const stemWithBlank of ['', 'Short ____ blank', 'Two _____ _____ blanks', '_____ ' + 'x'.repeat(500)]) {
      expect(validateQuestionContent('FILL_BLANK', { ...valid.FILL_BLANK, stemWithBlank })['content.stemWithBlank']).toBeTruthy()
    }
    expect(validateQuestionContent('FILL_BLANK', { ...valid.FILL_BLANK, stemWithBlank: 'One _________ blank' })).toEqual({})
  })

  it('requires finite numbers, a non-negative tolerance, and a short unit', () => {
    for (const answerValue of [null, '2', Infinity]) expect(validateQuestionContent('NUMERIC', { ...valid.NUMERIC, answerValue })['content.answerValue']).toBeTruthy()
    for (const tolerance of [null, '0', Infinity, -1]) expect(validateQuestionContent('NUMERIC', { ...valid.NUMERIC, tolerance })['content.tolerance']).toBeTruthy()
    expect(validateQuestionContent('NUMERIC', { ...valid.NUMERIC, unit: 'x'.repeat(21) })['content.unit']).toBeTruthy()
  })

  it('validates rubric shape, criterion lengths, finite positive scores, and totals', () => {
    for (const bad of [[], [...rubric, ...rubric], ...[
      { criterion: '', maxScore: 1 }, { criterion: 'x'.repeat(201), maxScore: 1 },
      { criterion: 'A', maxScore: Infinity }, { criterion: 'A', maxScore: 0 },
      { criterion: 'A', maxScore: 101 }, { criterion: 'A', maxScore: 99 },
    ].map(first => [first, ...rubric.slice(1)])]) {
      expect(validateQuestionContent('WRITTEN', { ...valid.WRITTEN, rubric: bad })['content.rubric']).toBeTruthy()
    }
    expect(validateQuestionContent('WRITTEN', { ...valid.WRITTEN, maxScore: 3 })).toEqual({})
    expect(validateQuestionContent('WRITTEN', { ...valid.WRITTEN, maxScore: 4 })['content.maxScore']).toBeTruthy()
    expect(rubricTotal([{ criterion: 'A', maxScore: 0.1 }, { criterion: 'B', maxScore: 0.2 }])).toBe(0.3)
  })
})
