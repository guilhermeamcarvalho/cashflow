package com.cashflow.api.budget.dto;

import jakarta.validation.constraints.NotNull;

import java.time.YearMonth;

/** Copia os orçamentos de um mês para outro (sem sobrescrever os existentes). */
public record CopyBudgetsRequest(
        @NotNull(message = "Informe o mês de origem") YearMonth fromMonth,
        @NotNull(message = "Informe o mês de destino") YearMonth toMonth
) {
}
