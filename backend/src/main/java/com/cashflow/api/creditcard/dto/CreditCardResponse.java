package com.cashflow.api.creditcard.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Cartão com a situação atual.
 *
 * @param availableLimit limite menos as compras em faturas não pagas (null sem limite)
 * @param currentInvoice fatura que recebe as compras de hoje
 * @param previousInvoice fatura anterior (normalmente fechada, aguardando pagamento)
 */
public record CreditCardResponse(
        UUID id,
        String name,
        String color,
        int closingDay,
        int dueDay,
        BigDecimal creditLimit,
        BigDecimal availableLimit,
        InvoiceSummary currentInvoice,
        InvoiceSummary previousInvoice
) {
}
