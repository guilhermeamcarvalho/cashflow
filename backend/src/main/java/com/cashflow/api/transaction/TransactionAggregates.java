package com.cashflow.api.transaction;

import com.cashflow.api.common.domain.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Projeções das consultas agregadas de {@link TransactionRepository}. */
public final class TransactionAggregates {

    private TransactionAggregates() {
    }

    public interface TypeTotal {
        TransactionType getType();

        BigDecimal getTotal();
    }

    public interface CategoryTotal {
        UUID getCategoryId();

        String getName();

        String getColor();

        String getIcon();

        BigDecimal getTotal();

        long getCount();
    }

    public interface MonthTotal {
        Integer getRefYear();

        Integer getRefMonth();

        TransactionType getType();

        BigDecimal getTotal();
    }

    public interface DayTypeTotal {
        LocalDate getDate();

        TransactionType getType();

        BigDecimal getTotal();
    }
}
