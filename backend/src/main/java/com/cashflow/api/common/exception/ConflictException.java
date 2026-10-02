package com.cashflow.api.common.exception;

/** Operação conflita com o estado atual dos dados (HTTP 409). */
public class ConflictException extends RuntimeException {

    public ConflictException(String message) {
        super(message);
    }
}
