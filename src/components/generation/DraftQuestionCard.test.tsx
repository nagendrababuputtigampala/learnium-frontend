import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { GeneratedQuestionDto } from '../../lib/api'
import {
  questionFillBlank,
  questionFlashcard,
  questionMalformed,
  questionMcq,
  questionNumeric,
  questionWritten,
} from '../../test/fixtures'
import { renderWithProviders } from '../../test/renderWithProviders'
import DraftQuestionCard from './DraftQuestionCard'

function renderCard(question: GeneratedQuestionDto) {
  return renderWithProviders(<DraftQuestionCard question={question} />)
}

function variant(
  base: GeneratedQuestionDto,
  payload: unknown,
): GeneratedQuestionDto {
  return { ...base, payload }
}

function expectFallback(question: GeneratedQuestionDto) {
  const view = renderCard(question)
  expect(screen.getByText(/displayed in full/)).toBeTruthy()
  // The provenance footer survives even when the body cannot render.
  expect(screen.getByText(/Prompt v3/)).toBeTruthy()
  view.unmount()
}

const mcqOptions = [
  { id: 'a', text: 'One' },
  { id: 'b', text: 'Two' },
]

const numericPayload = {
  stem: 'Compute 2 + 3.',
  answerValue: 5,
  tolerance: 0.5,
  unit: 'cm',
  workedSolution: 'Add them.',
}

const writtenPayload = {
  stem: 'Explain.',
  modelAnswer: 'Because.',
  rubric: [{ id: 'crit-1', criterion: 'Gives a reason', maxScore: 2 }],
}

describe('DraftQuestionCard — valid payloads', () => {
  it('renders an MCQ with the correct option marked and provenance', () => {
    const view = renderCard(questionMcq)
    expect(screen.getByText('Multiple choice')).toBeTruthy()
    expect(screen.getByText('What is 1/2 + 1/4?')).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    expect(view.container.textContent).toContain('b. 3/4')
    expect(screen.getByText(/Correct answer/)).toBeTruthy()
    expect(
      screen.getByText('gemini · gemini-test · Prompt v3 · 2026-10-22'),
    ).toBeTruthy()
  })

  it('renders an MCQ whose correctRef matches no option without a marker', () => {
    renderCard({ ...questionMcq, correctRef: 'z' })
    expect(screen.getByText('What is 1/2 + 1/4?')).toBeTruthy()
    expect(screen.queryByText(/Correct answer/)).toBeNull()
  })

  it('renders a fill-in-the-blank with its answer', () => {
    renderCard(questionFillBlank)
    expect(screen.getByText('Fill in the blank')).toBeTruthy()
    expect(
      screen.getByText('The fraction _____ is equal to 0.5.'),
    ).toBeTruthy()
    expect(screen.getByText('1/2')).toBeTruthy()
  })

  it('renders a flashcard front and back', () => {
    renderCard(questionFlashcard)
    expect(screen.getByText('Flashcard')).toBeTruthy()
    expect(screen.getByText('What is a numerator?')).toBeTruthy()
    expect(
      screen.getByText(/The top number of a fraction/),
    ).toBeTruthy()
  })

  it('renders a numeric answer with tolerance, unit and worked solution', () => {
    const view = renderCard(questionNumeric)
    expect(screen.getByText('Numeric answer')).toBeTruthy()
    expect(screen.getByText('Compute 3/4 of 20.')).toBeTruthy()
    expect(view.container.textContent).toContain('± 0.01')
    expect(
      screen.getByText('20 ÷ 4 = 5, then 5 × 3 = 15.'),
    ).toBeTruthy()
  })

  it('renders a numeric answer with a unit and zero tolerance', () => {
    const view = renderCard(variant(questionNumeric, numericPayload))
    expect(view.container.textContent).toContain('± 0.5 cm')
  })

  it('renders a written answer with its rubric and mark wording', () => {
    renderCard(questionWritten)
    expect(screen.getByText('Written answer')).toBeTruthy()
    expect(
      screen.getByText('Explain why 2/4 and 1/2 represent the same amount.'),
    ).toBeTruthy()
    expect(screen.getByText(/Both fractions describe half/)).toBeTruthy()
    expect(
      screen.getByText(/States the fractions are equal — up to 1 mark$/),
    ).toBeTruthy()
    expect(
      screen.getByText(/Refers to the same whole — up to 2 marks/),
    ).toBeTruthy()
  })
})

describe('DraftQuestionCard — malformed payloads fall back', () => {
  it('falls back for a non-object payload', () => {
    expectFallback(variant(questionMcq, null))
    expectFallback(variant(questionMcq, []))
    expectFallback(variant(questionMcq, 'a string'))
    expectFallback(questionMalformed)
  })

  it('falls back for an unknown question type with a neutral chip', () => {
    const rogue = {
      ...questionMcq,
      type: 'ESSAY',
    } as unknown as GeneratedQuestionDto
    const view = renderCard(rogue)
    expect(screen.getByText('Question')).toBeTruthy()
    expect(screen.queryByText('Multiple choice')).toBeNull()
    expect(screen.getByText(/displayed in full/)).toBeTruthy()
    view.unmount()
  })

  it('falls back for each broken MCQ shape', () => {
    expectFallback(variant(questionMcq, { options: mcqOptions }))
    expectFallback(variant(questionMcq, { stem: 'S', options: 'nope' }))
    expectFallback(variant(questionMcq, { stem: 'S', options: [] }))
    expectFallback(variant(questionMcq, { stem: 'S', options: ['x'] }))
    expectFallback(
      variant(questionMcq, { stem: 'S', options: [{ text: 'x' }] }),
    )
    expectFallback(
      variant(questionMcq, { stem: 'S', options: [{ id: 'a' }] }),
    )
    expectFallback(variant(questionMcq, { stem: '', options: mcqOptions }))
  })

  it('falls back for each broken fill-in-the-blank shape', () => {
    expectFallback(variant(questionFillBlank, { answer: '1/2' }))
    expectFallback(
      variant(questionFillBlank, { stemWithBlank: 'S _____ is 0.5.' }),
    )
  })

  it('falls back for each broken flashcard shape', () => {
    expectFallback(variant(questionFlashcard, { back: 'B' }))
    expectFallback(variant(questionFlashcard, { front: 'F' }))
  })

  it('falls back for each broken numeric shape', () => {
    const { stem, ...noStem } = numericPayload
    void stem
    expectFallback(variant(questionNumeric, noStem))
    expectFallback(
      variant(questionNumeric, { ...numericPayload, answerValue: '5' }),
    )
    expectFallback(
      variant(questionNumeric, {
        ...numericPayload,
        answerValue: Number.POSITIVE_INFINITY,
      }),
    )
    const { tolerance, ...noTolerance } = numericPayload
    void tolerance
    expectFallback(variant(questionNumeric, noTolerance))
    const { unit, ...noUnit } = numericPayload
    void unit
    expectFallback(variant(questionNumeric, noUnit))
    expectFallback(
      variant(questionNumeric, { ...numericPayload, unit: 7 }),
    )
    const { workedSolution, ...noSolution } = numericPayload
    void workedSolution
    expectFallback(variant(questionNumeric, noSolution))
  })

  it('falls back for each broken written shape', () => {
    const { stem, ...noStem } = writtenPayload
    void stem
    expectFallback(variant(questionWritten, noStem))
    const { modelAnswer, ...noModel } = writtenPayload
    void modelAnswer
    expectFallback(variant(questionWritten, noModel))
    expectFallback(
      variant(questionWritten, { ...writtenPayload, rubric: 'nope' }),
    )
    expectFallback(variant(questionWritten, { ...writtenPayload, rubric: [] }))
    expectFallback(
      variant(questionWritten, { ...writtenPayload, rubric: ['x'] }),
    )
    expectFallback(
      variant(questionWritten, {
        ...writtenPayload,
        rubric: [{ criterion: 'C', maxScore: 2 }],
      }),
    )
    expectFallback(
      variant(questionWritten, {
        ...writtenPayload,
        rubric: [{ id: 'crit-1', maxScore: 2 }],
      }),
    )
    expectFallback(
      variant(questionWritten, {
        ...writtenPayload,
        rubric: [{ id: 'crit-1', criterion: 'C' }],
      }),
    )
  })
})
