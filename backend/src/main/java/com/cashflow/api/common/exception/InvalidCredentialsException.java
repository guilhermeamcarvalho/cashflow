package com.cashflow.api.common.exception;

/** E-mail ou senha inválidos (HTTP 401). */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException() {
        super("E-mail ou senha inválidos");
    }
}
