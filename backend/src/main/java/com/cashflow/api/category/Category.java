package com.cashflow.api.category;

import com.cashflow.api.common.domain.TransactionType;
import com.cashflow.api.common.persistence.AuditableEntity;
import com.cashflow.api.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Categoria de lançamentos de um usuário. O {@link TransactionType tipo} é
 * definido na criação e não muda, pois os lançamentos herdam o tipo dela.
 */
@Entity
@Table(name = "categories")
public class Category extends AuditableEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @Column(nullable = false, length = 60)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10, updatable = false)
    private TransactionType type;

    @Column(nullable = false, length = 7)
    private String color;

    @Column(nullable = false, length = 40)
    private String icon;

    protected Category() {
        // exigido pelo JPA
    }

    public Category(User user, String name, TransactionType type, String color, String icon) {
        this.user = user;
        this.name = name;
        this.type = type;
        this.color = color;
        this.icon = icon;
    }

    public void update(String name, String color, String icon) {
        this.name = name;
        this.color = color;
        this.icon = icon;
    }

    public User getUser() {
        return user;
    }

    public String getName() {
        return name;
    }

    public TransactionType getType() {
        return type;
    }

    public String getColor() {
        return color;
    }

    public String getIcon() {
        return icon;
    }
}
