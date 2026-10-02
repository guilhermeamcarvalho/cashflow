package com.cashflow.api.transaction;

import com.cashflow.api.category.Category;
import com.cashflow.api.common.domain.PaymentMethod;
import com.cashflow.api.common.domain.TransactionType;
import com.cashflow.api.common.persistence.AuditableEntity;
import com.cashflow.api.creditcard.CreditCard;
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
import java.util.UUID;

/**
 * Lançamento financeiro (receita ou despesa). O tipo é sempre o da categoria;
 * ele é desnormalizado na tabela para acelerar as agregações mensais.
 *
 * <p>Compras no crédito guardam o cartão e a fatura (mês de vencimento). Uma
 * compra parcelada vira N lançamentos com o mesmo {@code installmentGroupId}.
 */
@Entity
@Table(name = "transactions")
public class Transaction extends AuditableEntity {

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

    @Column(name = "occurred_on", nullable = false)
    private LocalDate occurredOn;

    @Column(length = 500)
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 10)
    private PaymentMethod paymentMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "credit_card_id")
    private CreditCard creditCard;

    /** Primeiro dia do mês de vencimento da fatura (só para compras no crédito). */
    @Column(name = "invoice_month")
    private LocalDate invoiceMonth;

    /** Lançamento fixo que gerou este lançamento (se houver). */
    @Column(name = "recurring_id", updatable = false)
    private UUID recurringId;

    @Column(name = "installment_group_id", updatable = false)
    private UUID installmentGroupId;

    @Column(name = "installment_number", updatable = false)
    private Integer installmentNumber;

    @Column(name = "installment_count", updatable = false)
    private Integer installmentCount;

    protected Transaction() {
        // exigido pelo JPA
    }

    public Transaction(User user, Category category, String description, BigDecimal amount,
                       LocalDate occurredOn, String notes, Payment payment) {
        this.user = user;
        update(category, description, amount, occurredOn, notes, payment);
    }

    /** Lançamento gerado automaticamente a partir de um lançamento fixo. */
    public static Transaction generated(User user, Category category, String description, BigDecimal amount,
                                        LocalDate occurredOn, String notes, Payment payment, UUID recurringId) {
        Transaction transaction = new Transaction(user, category, description, amount, occurredOn, notes, payment);
        transaction.recurringId = recurringId;
        return transaction;
    }

    /** Parcela {@code number} de {@code count} de uma compra parcelada. */
    public static Transaction installment(User user, Category category, String description, BigDecimal amount,
                                          LocalDate occurredOn, String notes, Payment payment,
                                          UUID groupId, int number, int count) {
        Transaction transaction = new Transaction(user, category, description, amount, occurredOn, notes, payment);
        transaction.installmentGroupId = groupId;
        transaction.installmentNumber = number;
        transaction.installmentCount = count;
        return transaction;
    }

    public void update(Category category, String description, BigDecimal amount, LocalDate occurredOn, String notes,
                       Payment payment) {
        this.category = category;
        this.type = category.getType();
        this.description = description;
        this.amount = amount;
        this.occurredOn = occurredOn;
        this.notes = notes;
        this.paymentMethod = payment.method();
        this.creditCard = payment.card();
        this.invoiceMonth = payment.invoice() == null ? null : payment.invoice().atDay(1);
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

    public LocalDate getOccurredOn() {
        return occurredOn;
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

    public YearMonth getInvoice() {
        return invoiceMonth == null ? null : YearMonth.from(invoiceMonth);
    }

    public UUID getRecurringId() {
        return recurringId;
    }

    public UUID getInstallmentGroupId() {
        return installmentGroupId;
    }

    public Integer getInstallmentNumber() {
        return installmentNumber;
    }

    public Integer getInstallmentCount() {
        return installmentCount;
    }

    /**
     * Forma de pagamento de um lançamento.
     *
     * @param method  forma de pagamento (null = não informada)
     * @param card    cartão (somente no crédito)
     * @param invoice fatura em que a compra entra (somente no crédito)
     */
    public record Payment(PaymentMethod method, CreditCard card, YearMonth invoice) {

        public static final Payment NONE = new Payment(null, null, null);

        public static Payment of(PaymentMethod method) {
            return new Payment(method, null, null);
        }

        public static Payment credit(CreditCard card, YearMonth invoice) {
            return new Payment(PaymentMethod.CREDIT, card, invoice);
        }
    }
}
