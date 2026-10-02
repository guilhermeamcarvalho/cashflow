package com.cashflow.api.transaction.dto;

import com.cashflow.api.common.domain.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Criação/edição de lançamento. O tipo (receita/despesa) vem da categoria.
 *
 * @param paymentMethod forma de pagamento (despesas; opcional)
 * @param creditCardId  cartão, obrigatório quando a forma é CREDIT
 * @param installments  número de parcelas (só na criação, no crédito); {@code amount} é o valor total
 */
public record TransactionRequest(
        @NotNull(message = "Informe a categoria")
        UUID categoryId,

        @NotBlank(message = "Informe a descrição")
        @Size(max = 140, message = "A descrição deve ter no máximo 140 caracteres")
        String description,

        @NotNull(message = "Informe o valor")
        @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero")
        @Digits(integer = 12, fraction = 2, message = "Valor inválido")
        BigDecimal amount,

        @NotNull(message = "Informe a data")
        LocalDate date,

        @Size(max = 500, message = "As observações devem ter no máximo 500 caracteres")
        String notes,

        PaymentMethod paymentMethod,

        UUID creditCardId,

        @Min(value = 1, message = "O número de parcelas deve estar entre 1 e 48")
        @Max(value = 48, message = "O número de parcelas deve estar entre 1 e 48")
        Integer installments
) {
}
