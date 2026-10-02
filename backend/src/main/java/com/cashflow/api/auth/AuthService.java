package com.cashflow.api.auth;

import com.cashflow.api.auth.dto.AuthResponse;
import com.cashflow.api.auth.dto.LoginRequest;
import com.cashflow.api.auth.dto.RegisterRequest;
import com.cashflow.api.category.CategoryService;
import com.cashflow.api.common.exception.ConflictException;
import com.cashflow.api.common.exception.InvalidCredentialsException;
import com.cashflow.api.common.security.TokenService;
import com.cashflow.api.user.User;
import com.cashflow.api.user.UserRepository;
import com.cashflow.api.user.dto.UserResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/** Cadastro e login. Ambos retornam um JWT pronto para uso. */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CategoryService categoryService;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthService(UserRepository userRepository, CategoryService categoryService,
                       PasswordEncoder passwordEncoder, TokenService tokenService) {
        this.userRepository = userRepository;
        this.categoryService = categoryService;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("Já existe uma conta com este e-mail");
        }
        User user = userRepository.save(
                new User(request.name().trim(), email, passwordEncoder.encode(request.password())));
        categoryService.createDefaults(user);
        return authenticated(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .filter(found -> passwordEncoder.matches(request.password(), found.getPasswordHash()))
                .orElseThrow(InvalidCredentialsException::new);
        return authenticated(user);
    }

    private AuthResponse authenticated(User user) {
        TokenService.IssuedToken token = tokenService.issue(user);
        return new AuthResponse(token.value(), token.expiresAt(), UserResponse.from(user));
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
