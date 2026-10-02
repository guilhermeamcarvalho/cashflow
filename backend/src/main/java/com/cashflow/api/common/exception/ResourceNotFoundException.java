package com.cashflow.api.common.exception;

/** Recurso inexistente ou que não pertence ao usuário autenticado (HTTP 404). */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String resource) {
        super(resource + " não encontrado(a)");
    }
}
