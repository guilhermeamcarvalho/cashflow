package com.cashflow.api.common.web;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;

/** Intervalo fechado [primeiro dia, último dia] de um mês de referência. */
public record MonthRange(YearMonth month, LocalDate start, LocalDate end) {

    public static MonthRange of(YearMonth month) {
        return new MonthRange(month, month.atDay(1), month.atEndOfMonth());
    }

    /** Usa o mês informado ou, se ausente, o mês corrente segundo o relógio. */
    public static MonthRange ofOrCurrent(YearMonth month, Clock clock) {
        return of(month != null ? month : YearMonth.now(clock));
    }

    public MonthRange previous() {
        return of(month.minusMonths(1));
    }
}
