package com.cashflow.api.creditcard;

import com.cashflow.api.common.persistence.AuditableEntity;
import com.cashflow.api.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

/**
 * Cartão de crédito. As faturas são identificadas pelo mês de VENCIMENTO
 * ("fatura de novembro" = a que vence em novembro).
 *
 * <p>Regra de fechamento: uma compra feita antes do dia de fechamento entra na
 * fatura que fecha naquele mês; no dia do fechamento ou depois, na seguinte.
 * Se o vencimento cai depois do fechamento no calendário (fecha 3, vence 10),
 * a fatura vence no mesmo mês em que fecha; senão (fecha 25, vence 5), no mês
 * seguinte. Dias inexistentes (31 em abril) usam o último dia do mês.
 */
@Entity
@Table(name = "credit_cards")
public class CreditCard extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(nullable = false, length = 7)
    private String color;

    @Column(name = "closing_day", nullable = false)
    private int closingDay;

    @Column(name = "due_day", nullable = false)
    private int dueDay;

    @Column(name = "credit_limit", precision = 14, scale = 2)
    private BigDecimal creditLimit;

    protected CreditCard() {
        // exigido pelo JPA
    }

    public CreditCard(User user, String name, String color, int closingDay, int dueDay, BigDecimal creditLimit) {
        this.user = user;
        update(name, color, closingDay, dueDay, creditLimit);
    }

    public void update(String name, String color, int closingDay, int dueDay, BigDecimal creditLimit) {
        this.name = name;
        this.color = color;
        this.closingDay = closingDay;
        this.dueDay = dueDay;
        this.creditLimit = creditLimit;
    }

    /** Fatura (mês de vencimento) em que entra uma compra feita na data informada. */
    public YearMonth invoiceFor(LocalDate purchase) {
        YearMonth month = YearMonth.from(purchase);
        YearMonth closingMonth = purchase.isBefore(dayIn(month, closingDay)) ? month : month.plusMonths(1);
        return dueInClosingMonth() ? closingMonth : closingMonth.plusMonths(1);
    }

    /** Data de fechamento da fatura que vence em {@code invoice}. */
    public LocalDate closingDateOf(YearMonth invoice) {
        return dayIn(dueInClosingMonth() ? invoice : invoice.minusMonths(1), closingDay);
    }

    public LocalDate dueDateOf(YearMonth invoice) {
        return dayIn(invoice, dueDay);
    }

    private boolean dueInClosingMonth() {
        return dueDay > closingDay;
    }

    private static LocalDate dayIn(YearMonth month, int day) {
        return month.atDay(Math.min(day, month.lengthOfMonth()));
    }

    public String getName() {
        return name;
    }

    public String getColor() {
        return color;
    }

    public int getClosingDay() {
        return closingDay;
    }

    public int getDueDay() {
        return dueDay;
    }

    public BigDecimal getCreditLimit() {
        return creditLimit;
    }
}
