package com.cashflow.api.common.domain;

/** Forma de pagamento de uma despesa. Compras em {@link #CREDIT} exigem um cartão. */
public enum PaymentMethod {
    PIX,
    DEBIT,
    CREDIT,
    CASH,
    BOLETO
}
