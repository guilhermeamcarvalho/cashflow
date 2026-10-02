package com.cashflow.api.user;

import com.cashflow.api.common.security.CurrentUserId;
import com.cashflow.api.user.dto.ChangePasswordRequest;
import com.cashflow.api.user.dto.UpdateProfileRequest;
import com.cashflow.api.user.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@Tag(name = "Usuário", description = "Perfil do usuário autenticado")
@RestController
@RequestMapping("/api/v1/users/me")
public class UserController {

    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @Operation(summary = "Retorna o perfil do usuário autenticado")
    @GetMapping
    public UserResponse me(@CurrentUserId UUID userId) {
        return service.findById(userId);
    }

    @Operation(summary = "Atualiza o nome do usuário")
    @PutMapping
    public UserResponse update(@CurrentUserId UUID userId, @Valid @RequestBody UpdateProfileRequest request) {
        return service.updateProfile(userId, request);
    }

    @Operation(summary = "Altera a senha do usuário")
    @PutMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@CurrentUserId UUID userId, @Valid @RequestBody ChangePasswordRequest request) {
        service.changePassword(userId, request);
    }
}
