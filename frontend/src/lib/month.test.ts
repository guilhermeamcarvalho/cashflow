import { addMonths, compareMonths, daysInMonth, defaultDateFor, maxMonth, minMonth, monthsBetween, toYearMonth } from './month'
import { formatDayHeading, formatMonth, percentChange } from './format'

describe('month utils', () => {
  it('soma e subtrai meses atravessando o ano', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(addMonths('2026-10', 0)).toBe('2026-10')
  })

  it('conhece a quantidade de dias, inclusive bissextos', () => {
    expect(daysInMonth('2028-02')).toBe(29)
    expect(daysInMonth('2026-02')).toBe(28)
    expect(daysInMonth('2026-10')).toBe(31)
  })

  it('sugere hoje no mês corrente e dia 1 nos demais', () => {
    const now = new Date(2026, 9, 15)
    expect(toYearMonth(now)).toBe('2026-10')
    expect(defaultDateFor('2026-10', now)).toBe('2026-10-15')
    expect(defaultDateFor('2026-08', now)).toBe('2026-08-01')
  })
})

describe('intervalos de meses', () => {
  it('conta meses inclusive atravessando o ano', () => {
    expect(monthsBetween('2026-05', '2026-10')).toBe(6)
    expect(monthsBetween('2025-11', '2026-02')).toBe(4)
    expect(monthsBetween('2026-10', '2026-10')).toBe(1)
  })

  it('ordena meses', () => {
    expect(compareMonths('2025-12', '2026-01')).toBeLessThan(0)
    expect(minMonth('2026-03', '2025-09')).toBe('2025-09')
    expect(maxMonth('2026-03', '2025-09')).toBe('2026-03')
  })
})

describe('format utils', () => {
  it('formata o mês por extenso', () => {
    expect(formatMonth('2026-10')).toBe('Outubro de 2026')
  })

  it('usa rótulos relativos para hoje e ontem', () => {
    const now = new Date(2026, 9, 15)
    expect(formatDayHeading('2026-10-15', now)).toBe('Hoje')
    expect(formatDayHeading('2026-10-14', now)).toBe('Ontem')
  })

  it('calcula variação percentual sem dividir por zero', () => {
    expect(percentChange(150, 100)).toBe(50)
    expect(percentChange(50, 100)).toBe(-50)
    expect(percentChange(10, 0)).toBeNull()
  })
})
