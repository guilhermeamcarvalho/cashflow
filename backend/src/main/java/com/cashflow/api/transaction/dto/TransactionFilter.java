package com.cashflow.api.transaction.dto;

import com.cashflow.api.common.domain.PaymentMethod;
import com.cashflow.api.common.domain.TransactionType;
import com.cashflow.api.common.web.MonthRange;

import java.util.UUID;

/** Critérios da listagem de lançamentos. Apenas {@code range} é obrigatório. */
public record TransactionFilter(MonthRange range, TransactionType type, UUID categoryId, String search,
                                PaymentMethod paymentMethod, UUID creditCardId) {
}
