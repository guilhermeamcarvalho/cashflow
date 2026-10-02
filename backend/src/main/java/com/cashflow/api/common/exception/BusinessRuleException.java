package com.cashflow.api.common.exception;

/** Requisição sintaticamente válida, mas que viola uma regra de negócio (HTTP 422). */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}
