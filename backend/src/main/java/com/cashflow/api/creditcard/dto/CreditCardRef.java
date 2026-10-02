package com.cashflow.api.creditcard.dto;

import com.cashflow.api.creditcard.CreditCard;

import java.util.UUID;

/** Identificação resumida de um cartão (usada dentro de lançamentos). */
public record CreditCardRef(UUID id, String name, String color) {

    public static CreditCardRef from(CreditCard card) {
        return card == null ? null : new CreditCardRef(card.getId(), card.getName(), card.getColor());
    }
}
