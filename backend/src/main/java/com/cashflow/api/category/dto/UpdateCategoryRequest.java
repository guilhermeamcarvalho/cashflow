package com.cashflow.api.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** O tipo da categoria é imutável, por isso não faz parte da atualização. */
public record UpdateCategoryRequest(
        @NotBlank(message = "Informe o nome")
        @Size(max = 60, message = "O nome deve ter no máximo 60 caracteres")
        String name,

        @NotBlank(message = "Informe a cor")
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Cor deve estar no formato #RRGGBB")
        String color,

        @NotBlank(message = "Informe o ícone")
        @Size(max = 40, message = "O ícone deve ter no máximo 40 caracteres")
        String icon
) {
}
