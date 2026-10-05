import { describe, expect, it } from 'vitest'
import { closingDateOf, dueDateOf, invoiceFor } from './creditCard'

// Mesmos casos do CreditCardTest da antiga API.
describe('invoiceFor', () => {
  it('vence no mesmo mês quando o vencimento é depois do fechamento', () => {
    const card = { closingDay: 3, dueDay: 10 }
    expect(invoiceFor(card, '2026-10-02')).toBe('2026-10')
    expect(invoiceFor(card, '2026-10-03')).toBe('2026-11')
    expect(closingDateOf(card, '2026-10')).toBe('2026-10-03')
    expect(dueDateOf(card, '2026-10')).toBe('2026-10-10')
  })

  it('vence no mês seguinte quando o vencimento é antes do fechamento', () => {
    const card = { closingDay: 25, dueDay: 5 }
    expect(invoiceFor(card, '2026-10-24')).toBe('2026-11')
    expect(invoiceFor(card, '2026-10-25')).toBe('2026-12')
    expect(closingDateOf(card, '2026-11')).toBe('2026-10-25')
    expect(dueDateOf(card, '2026-11')).toBe('2026-11-05')
  })

  it('usa o último dia em meses mais curtos', () => {
    const card = { closingDay: 31, dueDay: 10 }
    expect(invoiceFor(card, '2026-02-27')).toBe('2026-03')
    expect(closingDateOf(card, '2026-03')).toBe('2026-02-28')
    expect(invoiceFor(card, '2026-02-28')).toBe('2026-04')
    expect(dueDateOf({ dueDay: 31 }, '2026-04')).toBe('2026-04-30')
  })
})
