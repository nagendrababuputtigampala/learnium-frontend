import { describe, expect, it } from 'vitest'
import { itemRequest, kindLabel, localDateTime, selectedItems, totalMarks, validMarks, validPublishLimits, validPublishWindow, type SelectedItem, type TestItem } from './tests'

describe('test publishing contracts', () => {
  it('formats selected question previews for every payload shape', () => {
    const items = [{ payload: { stem: 'Question' } }, { payload: { stemWithBlank: 'One _____ blank' } }, { payload: { front: 'Front' } }, { payload: {} }].map((item, index) => ({ ...item, questionId: String(index), type: 'MCQ', marks: .75 })) as TestItem[]
    expect(selectedItems(items).map(item => item.preview)).toEqual(['Question', 'One _____ blank', 'Front', ''])
    expect(selectedItems(items)[0].marks).toBe('0.75')
    expect(kindLabel('SCORED_TEST')).toBe('Scored test'); expect(kindLabel('FLASHCARD_PRACTICE')).toBe('Flashcard practice')
  })
  it('round-trips marks and totals in cents without accepting mixed scoring modes', () => {
    for (const value of ['', '1.234', '-1', '0', '10000', 'text']) expect(validMarks(value, 'SCORED_TEST')).toBe(false)
    expect(validMarks('2.50', 'SCORED_TEST')).toBe(true); expect(validMarks('0.75', 'SCORED_TEST')).toBe(true)
    expect(validMarks('0.00', 'FLASHCARD_PRACTICE')).toBe(true); expect(validMarks('1', 'FLASHCARD_PRACTICE')).toBe(false)
    const items = [{ questionId: 'q1', marks: '0.10' }, { questionId: 'q2', marks: '0.20' }] as SelectedItem[]
    expect(totalMarks(items)).toBe(.3); expect(itemRequest(items)).toEqual([{ questionId: 'q1', marks: .1 }, { questionId: 'q2', marks: .2 }])
  })
  it('validates UTC-convertible windows and positive finite publish settings', () => {
    expect(validPublishWindow('', '2026-11-10T11:00')).toBe(false)
    expect(validPublishWindow('2026-11-10T10:00', '')).toBe(false)
    expect(validPublishWindow('2026-11-10T10:00', '2026-11-10T09:00')).toBe(false)
    expect(validPublishWindow('2026-11-10T10:00', '2026-11-10T11:00')).toBe(true)
    for (const attempts of ['0', '-1', '1.5', 'text']) expect(validPublishLimits('', attempts)).toBe(false)
    for (const minutes of ['0', '-1', 'Infinity', 'text', '0.001']) expect(validPublishLimits(minutes, '1')).toBe(false)
    expect(validPublishLimits('', '1')).toBe(true); expect(validPublishLimits('0.5', '2')).toBe(true)
    const date = new Date('2026-11-10T10:14:52Z')
    const pad = (part: number) => String(part).padStart(2, '0')
    expect(localDateTime(date)).toBe(`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`)
  })
})
