package com.cashflow.api.category.dto;

import com.cashflow.api.common.domain.TransactionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateCategoryRequest(
        @NotBlank(message = "Informe o nome")
        @Size(max = 60, message = "O nome deve ter no máximo 60 caracteres")
        String name,

        @NotNull(message = "Informe o tipo")
        TransactionType type,

        @NotBlank(message = "Informe a cor")
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor deve estar no formato #RRGGBB")
        String color,

        @NotBlank(message = "Informe o ícone")
        @Size(max = 40, message = "O ícone deve ter no máximo 40 caracteres")
        String icon
) {
}
