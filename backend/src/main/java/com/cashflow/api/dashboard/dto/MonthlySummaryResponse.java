package com.cashflow.api.dashboard.dto;

import com.cashflow.api.transaction.dto.TransactionResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** Resumo financeiro de um mês, consumido pela tela inicial. */
public record MonthlySummaryResponse(
        String month,
        Totals current,
        Totals previous,
        BigDecimal budgeted,
        BigDecimal budgetSpent,
        List<CategorySlice> expensesByCategory,
        List<TransactionResponse> recentTransactions
) {

    public record Totals(BigDecimal income, BigDecimal expenses, BigDecimal balance) {
    }

    public record CategorySlice(UUID categoryId, String name, String color, String icon,
                                BigDecimal total, long count, int percent) {
    }
}
