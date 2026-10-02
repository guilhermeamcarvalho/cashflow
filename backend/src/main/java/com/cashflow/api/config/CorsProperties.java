package com.cashflow.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Origens autorizadas a consumir a API ({@code app.cors.allowed-origins}).
 * Aceita padrões, por exemplo {@code https://*.vercel.app}.
 */
@ConfigurationProperties(prefix = "app.cors")
public record CorsProperties(List<String> allowedOrigins) {

    public CorsProperties {
        allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
    }
}
