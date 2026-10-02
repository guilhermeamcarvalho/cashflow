package com.cashflow.api.creditcard;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.YearMonth;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CreditCardTest {

    private static CreditCard card(int closingDay, int dueDay) {
        return new CreditCard(null, "Cartão", "#000000", closingDay, dueDay, null);
    }

    @Test
    void dueAfterClosingInSameMonth() {
        CreditCard card = card(3, 10); // fecha dia 3, vence dia 10 do mesmo mês

        assertEquals(YearMonth.of(2026, 10), card.invoiceFor(LocalDate.of(2026, 10, 2)));
        // no dia do fechamento a compra já vai para a próxima fatura
        assertEquals(YearMonth.of(2026, 11), card.invoiceFor(LocalDate.of(2026, 10, 3)));
        assertEquals(LocalDate.of(2026, 10, 3), card.closingDateOf(YearMonth.of(2026, 10)));
        assertEquals(LocalDate.of(2026, 10, 10), card.dueDateOf(YearMonth.of(2026, 10)));
    }

    @Test
    void dueBeforeClosingFallsInNextMonth() {
        CreditCard card = card(25, 5); // fecha dia 25, vence dia 5 do mês seguinte

        assertEquals(YearMonth.of(2026, 11), card.invoiceFor(LocalDate.of(2026, 10, 24)));
        assertEquals(YearMonth.of(2026, 12), card.invoiceFor(LocalDate.of(2026, 10, 25)));
        assertEquals(LocalDate.of(2026, 10, 25), card.closingDateOf(YearMonth.of(2026, 11)));
        assertEquals(LocalDate.of(2026, 11, 5), card.dueDateOf(YearMonth.of(2026, 11)));
    }

    @Test
    void daysBeyondMonthLengthUseLastDay() {
        CreditCard card = card(31, 10);

        // fevereiro fecha no dia 28: compra no dia 28 já vai para a fatura seguinte
        assertEquals(LocalDate.of(2026, 2, 28), card.closingDateOf(YearMonth.of(2026, 3)));
        assertEquals(YearMonth.of(2026, 3), card.invoiceFor(LocalDate.of(2026, 2, 27)));
        assertEquals(YearMonth.of(2026, 4), card.invoiceFor(LocalDate.of(2026, 2, 28)));
        assertEquals(LocalDate.of(2026, 4, 30), card(5, 31).dueDateOf(YearMonth.of(2026, 4)));
    }
}
