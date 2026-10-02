package com.cashflow.api.creditcard.dto;

import com.cashflow.api.transaction.dto.TransactionResponse;

import java.util.List;

/** Fatura de um cartão com as compras que a compõem. */
public record InvoiceResponse(
        CreditCardRef card,
        InvoiceSummary summary,
        List<TransactionResponse> transactions
) {
}
