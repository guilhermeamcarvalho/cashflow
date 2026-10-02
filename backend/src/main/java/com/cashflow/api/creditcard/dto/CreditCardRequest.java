package com.cashflow.api.creditcard.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Criação/edição de cartão de crédito.
 *
 * @param creditLimit limite total (opcional)
 */
public record CreditCardRequest(
        @NotBlank(message = "Informe o nome")
        @Size(max = 60, message = "O nome deve ter no máximo 60 caracteres")
        String name,

        @NotBlank(message = "Informe a cor")
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor deve estar no formato #RRGGBB")
        String color,

        @NotNull(message = "Informe o dia de fechamento")
        @Min(value = 1, message = "O dia deve estar entre 1 e 31")
        @Max(value = 31, message = "O dia deve estar entre 1 e 31")
        Integer closingDay,

        @NotNull(message = "Informe o dia de vencimento")
        @Min(value = 1, message = "O dia deve estar entre 1 e 31")
        @Max(value = 31, message = "O dia deve estar entre 1 e 31")
        Integer dueDay,

        @DecimalMin(value = "0.01", message = "O limite deve ser maior que zero")
        @Digits(integer = 12, fraction = 2, message = "Valor inválido")
        BigDecimal creditLimit
) {
}
