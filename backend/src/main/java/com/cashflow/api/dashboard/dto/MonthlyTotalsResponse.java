package com.cashflow.api.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * Receitas e despesas mês a mês num intervalo. Todos os meses do intervalo
 * estão presentes (meses sem lançamentos vêm zerados).
 *
 * @param categoryId categoria filtrada, ou {@code null} para todas
 */
public record MonthlyTotalsResponse(
        String from,
        String to,
        UUID categoryId,
        List<MonthPoint> months
) {

    public record MonthPoint(String month, BigDecimal income, BigDecimal expenses, BigDecimal balance) {
    }
}
