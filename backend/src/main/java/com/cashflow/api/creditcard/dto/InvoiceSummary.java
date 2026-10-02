package com.cashflow.api.creditcard.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Resumo de uma fatura.
 *
 * @param month  mês de vencimento (yyyy-MM)
 * @param status OPEN (recebendo compras), CLOSED (fechada, a pagar),
 *               OVERDUE (vencida sem pagamento) ou PAID
 * @param paidOn data do pagamento, quando marcada como paga
 */
public record InvoiceSummary(
        String month,
        BigDecimal total,
        LocalDate closingDate,
        LocalDate dueDate,
        InvoiceStatus status,
        LocalDate paidOn
) {

    public enum InvoiceStatus {
        OPEN,
        CLOSED,
        OVERDUE,
        PAID
    }
}
