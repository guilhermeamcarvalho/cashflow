package com.cashflow.api.dashboard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Receitas e despesas dia a dia de um mês. Todos os dias do mês estão
 * presentes (dias sem lançamentos vêm zerados).
 *
 * @param categoryId categoria filtrada, ou {@code null} para todas
 */
public record DailyTotalsResponse(
        String month,
        UUID categoryId,
        List<DayPoint> days
) {

    public record DayPoint(LocalDate date, BigDecimal income, BigDecimal expenses, BigDecimal balance) {
    }
}
