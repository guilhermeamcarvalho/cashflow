package com.cashflow.api.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/** Configuração do JWT ({@code app.security.jwt.*}). Validada na inicialização. */
@Validated
@ConfigurationProperties(prefix = "app.security.jwt")
public record JwtProperties(
        @NotBlank @Size(min = 32, message = "JWT_SECRET deve ter ao menos 32 caracteres") String secret,
        @NotBlank String issuer,
        @NotNull Duration expiration
) {
}
