package com.cashflow.api.budget.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.UUID;

/** Define (cria ou substitui) o limite de uma categoria em um mês. */
public record BudgetRequest(
        @NotNull(message = "Informe a categoria")
        UUID categoryId,

        @NotNull(message = "Informe o mês (yyyy-MM)")
        YearMonth month,

        @NotNull(message = "Informe o valor")
        @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero")
        @Digits(integer = 12, fraction = 2, message = "Valor inválido")
        BigDecimal amount
) {
}
