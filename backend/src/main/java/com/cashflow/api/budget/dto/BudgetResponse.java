package com.cashflow.api.budget.dto;

import com.cashflow.api.category.dto.CategoryResponse;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Orçamento de uma categoria com o consumo apurado no mês.
 *
 * @param percentUsed percentual consumido (0–100+, pode passar de 100 quando estoura)
 */
public record BudgetResponse(
        UUID id,
        String month,
        CategoryResponse category,
        BigDecimal amount,
        BigDecimal spent,
        BigDecimal remaining,
        int percentUsed
) {
}
