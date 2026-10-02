package com.cashflow.api.transaction.dto;

import com.cashflow.api.category.dto.CategoryResponse;
import com.cashflow.api.common.domain.PaymentMethod;
import com.cashflow.api.common.domain.TransactionType;
import com.cashflow.api.creditcard.dto.CreditCardRef;
import com.cashflow.api.transaction.Transaction;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * @param recurringId       lançamento fixo de origem, quando gerado automaticamente
 * @param invoiceMonth      fatura (mês de vencimento, yyyy-MM) de compras no crédito
 * @param installmentNumber parcela atual (1..N) de uma compra parcelada
 */
public record TransactionResponse(
        UUID id,
        TransactionType type,
        String description,
        BigDecimal amount,
        LocalDate date,
        String notes,
        CategoryResponse category,
        PaymentMethod paymentMethod,
        CreditCardRef creditCard,
        String invoiceMonth,
        UUID installmentGroupId,
        Integer installmentNumber,
        Integer installmentCount,
        UUID recurringId,
        Instant createdAt
) {

    public static TransactionResponse from(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getType(),
                transaction.getDescription(),
                transaction.getAmount(),
                transaction.getOccurredOn(),
                transaction.getNotes(),
                CategoryResponse.from(transaction.getCategory()),
                transaction.getPaymentMethod(),
                CreditCardRef.from(transaction.getCreditCard()),
                transaction.getInvoice() == null ? null : transaction.getInvoice().toString(),
                transaction.getInstallmentGroupId(),
                transaction.getInstallmentNumber(),
                transaction.getInstallmentCount(),
                transaction.getRecurringId(),
                transaction.getCreatedAt());
    }
}
