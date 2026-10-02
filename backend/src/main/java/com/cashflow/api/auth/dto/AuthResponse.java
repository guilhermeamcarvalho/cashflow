package com.cashflow.api.auth.dto;

import com.cashflow.api.user.dto.UserResponse;

import java.time.Instant;

public record AuthResponse(String token, Instant expiresAt, UserResponse user) {
}
