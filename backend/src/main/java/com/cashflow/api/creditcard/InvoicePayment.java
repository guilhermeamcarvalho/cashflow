package com.cashflow.api.creditcard;

import com.cashflow.api.common.persistence.AuditableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.YearMonth;

/** Registro de que uma fatura foi paga. */
@Entity
@Table(name = "credit_card_invoice_payments")
public class InvoicePayment extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "credit_card_id", nullable = false, updatable = false)
    private CreditCard creditCard;

    /** Primeiro dia do mês de vencimento da fatura. */
    @Column(name = "invoice_month", nullable = false, updatable = false)
    private LocalDate invoiceMonth;

    @Column(name = "paid_on", nullable = false)
    private LocalDate paidOn;

    protected InvoicePayment() {
        // exigido pelo JPA
    }

    public InvoicePayment(CreditCard creditCard, YearMonth invoice, LocalDate paidOn) {
        this.creditCard = creditCard;
        this.invoiceMonth = invoice.atDay(1);
        this.paidOn = paidOn;
    }

    public YearMonth getInvoice() {
        return YearMonth.from(invoiceMonth);
    }

    public LocalDate getPaidOn() {
        return paidOn;
    }
}
