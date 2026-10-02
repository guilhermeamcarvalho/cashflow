package com.cashflow.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Ponto de entrada da API Cashflow.
 *
 * <p>A aplicação é organizada por <b>funcionalidade</b> (auth, user, category,
 * transaction, budget, dashboard) e, dentro de cada uma, em camadas
 * Controller → Service → Repository. Componentes transversais ficam em
 * {@code common} e {@code config}.</p>
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class CashflowApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(CashflowApiApplication.class, args);
    }
}
