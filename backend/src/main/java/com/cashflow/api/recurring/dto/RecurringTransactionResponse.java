package com.cashflow.api.recurring.dto;

import com.cashflow.api.category.dto.CategoryResponse;
import com.cashflow.api.common.domain.PaymentMethod;
import com.cashflow.api.common.domain.TransactionType;
import com.cashflow.api.creditcard.dto.CreditCardRef;
import com.cashflow.api.recurring.RecurringTransaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * @param nextDate data do próximo lançamento que ainda será gerado
 */
public record RecurringTransactionResponse(
        UUID id,
        TransactionType type,
        String description,
        BigDecimal amount,
        int dayOfMonth,
        String startMonth,
        LocalDate nextDate,
        String notes,
        CategoryResponse category,
        PaymentMethod paymentMethod,
        CreditCardRef creditCard
) {

    public static RecurringTransactionResponse from(RecurringTransaction recurring) {
        return new RecurringTransactionResponse(
                recurring.getId(),
                recurring.getType(),
                recurring.getDescription(),
                recurring.getAmount(),
                recurring.getDayOfMonth(),
                recurring.getStartMonth().toString(),
                recurring.dateIn(recurring.nextMonth()),
                recurring.getNotes(),
                CategoryResponse.from(recurring.getCategory()),
                recurring.getPaymentMethod(),
                CreditCardRef.from(recurring.getCreditCard()));
    }
}
