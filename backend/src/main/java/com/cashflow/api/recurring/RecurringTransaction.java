package com.cashflow.api.recurring;

import com.cashflow.api.category.Category;
import com.cashflow.api.common.domain.PaymentMethod;
import com.cashflow.api.common.domain.TransactionType;
import com.cashflow.api.common.persistence.AuditableEntity;
import com.cashflow.api.creditcard.CreditCard;
import com.cashflow.api.transaction.Transaction.Payment;
import com.cashflow.api.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

/**
 * Lançamento fixo: modelo que gera um lançamento real por mês, a partir de
 * {@code startMonth}, sempre no mesmo dia (ajustado ao último dia em meses curtos).
 */
@Entity
@Table(name = "recurring_transactions")
public class RecurringTransaction extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TransactionType type;

    @Column(nullable = false, length = 140)
    private String description;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "day_of_month", nullable = false)
    private int dayOfMonth;

    /** Sempre o primeiro dia do mês do primeiro lançamento. */
    @Column(name = "start_month", nullable = false)
    private LocalDate startMonth;

    /** Primeiro dia do último mês já gerado; {@code null} enquanto nenhum foi gerado. */
    @Column(name = "generated_through")
    private LocalDate generatedThrough;

    @Column(length = 500)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 10)
    private PaymentMethod paymentMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_card_id")
    private CreditCard creditCard;

    protected RecurringTransaction() {
        // exigido pelo JPA
    }

    public RecurringTransaction(User user, Category category, String description, BigDecimal amount,
                                int dayOfMonth, YearMonth startMonth, String notes, Payment payment) {
        this.user = user;
        this.startMonth = startMonth.atDay(1);
        update(category, description, amount, dayOfMonth, notes, payment);
    }

    /** Usa apenas a forma e o cartão de {@code payment}; a fatura é calculada a cada mês gerado. */
    public void update(Category category, String description, BigDecimal amount, int dayOfMonth, String notes,
                       Payment payment) {
        this.category = category;
        this.type = category.getType();
        this.description = description;
        this.amount = amount;
        this.dayOfMonth = dayOfMonth;
        this.notes = notes;
        this.paymentMethod = payment.method();
        this.creditCard = payment.card();
    }

    /** Forma de pagamento do lançamento gerado na data informada (fatura recalculada no crédito). */
    public Payment paymentOn(LocalDate date) {
        return creditCard != null ? Payment.credit(creditCard, creditCard.invoiceFor(date)) : Payment.of(paymentMethod);
    }

    /** O mês inicial só pode mudar enquanto nada foi gerado. */
    public boolean canChangeStartMonth() {
        return generatedThrough == null;
    }

    public void changeStartMonth(YearMonth month) {
        this.startMonth = month.atDay(1);
    }

    /** Meses ainda não gerados até {@code limit} (inclusive), em ordem. */
    public List<YearMonth> pendingMonthsThrough(YearMonth limit) {
        List<YearMonth> months = new ArrayList<>();
        for (YearMonth month = nextMonth(); !month.isAfter(limit); month = month.plusMonths(1)) {
            months.add(month);
        }
        return months;
    }

    public void markGeneratedThrough(YearMonth month) {
        this.generatedThrough = month.atDay(1);
    }

    /** Próximo mês a ser gerado. */
    public YearMonth nextMonth() {
        return generatedThrough == null ? getStartMonth() : YearMonth.from(generatedThrough).plusMonths(1);
    }

    /** Data do lançamento no mês informado (dia 31 vira o último dia em meses curtos). */
    public LocalDate dateIn(YearMonth month) {
        return month.atDay(Math.min(dayOfMonth, month.lengthOfMonth()));
    }

    public User getUser() {
        return user;
    }

    public Category getCategory() {
        return category;
    }

    public TransactionType getType() {
        return type;
    }

    public String getDescription() {
        return description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public int getDayOfMonth() {
        return dayOfMonth;
    }

    public YearMonth getStartMonth() {
        return YearMonth.from(startMonth);
    }

    public String getNotes() {
        return notes;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public CreditCard getCreditCard() {
        return creditCard;
    }
}
