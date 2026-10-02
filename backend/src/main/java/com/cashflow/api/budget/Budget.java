package com.cashflow.api.budget;

import com.cashflow.api.category.Category;
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

/** Limite de gasto mensal para uma categoria de despesa. */
@Entity
@Table(name = "budgets")
public class Budget extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false, updatable = false)
    private Category category;

    /** Sempre o primeiro dia do mês de referência. */
    @Column(name = "reference_month", nullable = false, updatable = false)
    private LocalDate referenceMonth;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    protected Budget() {
        // exigido pelo JPA
    }

    public Budget(User user, Category category, YearMonth month, BigDecimal amount) {
        this.user = user;
        this.category = category;
        this.referenceMonth = month.atDay(1);
        this.amount = amount;
    }

    public void changeAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Category getCategory() {
        return category;
    }

    public YearMonth getMonth() {
        return YearMonth.from(referenceMonth);
    }

    public BigDecimal getAmount() {
        return amount;
    }
}
