package com.cashflow.api.user;

import com.cashflow.api.common.exception.BusinessRuleException;
import com.cashflow.api.common.exception.ResourceNotFoundException;
import com.cashflow.api.user.dto.ChangePasswordRequest;
import com.cashflow.api.user.dto.UpdateProfileRequest;
import com.cashflow.api.user.dto.UserResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    public User getEntity(UUID userId) {
        return repository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Usuário"));
    }

    public UserResponse findById(UUID userId) {
        return UserResponse.from(getEntity(userId));
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = getEntity(userId);
        user.rename(request.name().trim());
        return UserResponse.from(user);
    }

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = getEntity(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("A senha atual está incorreta");
        }
        user.changePassword(passwordEncoder.encode(request.newPassword()));
    }
}
