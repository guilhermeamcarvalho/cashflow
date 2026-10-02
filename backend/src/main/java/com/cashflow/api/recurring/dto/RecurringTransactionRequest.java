package com.cashflow.api.recurring.dto;

import com.cashflow.api.common.domain.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.UUID;

/**
 * Criação/edição de lançamento fixo. O tipo (receita/despesa) vem da categoria.
 *
 * @param dayOfMonth dia do mês do lançamento (1–31; em meses curtos usa o último dia)
 * @param startMonth primeiro mês a ser lançado (só pode mudar enquanto nada foi gerado)
 * @param paymentMethod forma de pagamento (despesas; opcional)
 * @param creditCardId  cartão, obrigatório quando a forma é CREDIT
 */
public record RecurringTransactionRequest(
        @NotNull(message = "Informe a categoria")
        UUID categoryId,

        @NotBlank(message = "Informe a descrição")
        @Size(max = 140, message = "A descrição deve ter no máximo 140 caracteres")
        String description,

        @NotNull(message = "Informe o valor")
        @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero")
        @Digits(integer = 12, fraction = 2, message = "Valor inválido")
        BigDecimal amount,

        @NotNull(message = "Informe o dia do mês")
        @Min(value = 1, message = "O dia deve estar entre 1 e 31")
        @Max(value = 31, message = "O dia deve estar entre 1 e 31")
        Integer dayOfMonth,

        @NotNull(message = "Informe o mês inicial (yyyy-MM)")
        YearMonth startMonth,

        @Size(max = 500, message = "As observações devem ter no máximo 500 caracteres")
        String notes,

        PaymentMethod paymentMethod,

        UUID creditCardId
) {
}
