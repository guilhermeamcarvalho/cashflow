package com.cashflow.api.budget.dto;

import java.math.BigDecimal;
import java.util.List;

/** Visão consolidada dos orçamentos de um mês. */
public record BudgetOverviewResponse(
        String month,
        BigDecimal totalBudgeted,
        BigDecimal totalSpent,
        List<BudgetResponse> items
) {
}
