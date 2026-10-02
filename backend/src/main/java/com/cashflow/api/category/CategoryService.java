package com.cashflow.api.category;

import com.cashflow.api.category.dto.CategoryResponse;
import com.cashflow.api.category.dto.CreateCategoryRequest;
import com.cashflow.api.category.dto.UpdateCategoryRequest;
import com.cashflow.api.common.domain.TransactionType;
import com.cashflow.api.common.exception.ConflictException;
import com.cashflow.api.common.exception.ResourceNotFoundException;
import com.cashflow.api.user.User;
import com.cashflow.api.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository repository;
    private final UserRepository userRepository;

    public CategoryService(CategoryRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    public List<CategoryResponse> findAll(UUID userId, TransactionType type) {
        List<Category> categories = type == null
                ? repository.findAllByUserIdOrderByNameAsc(userId)
                : repository.findAllByUserIdAndTypeOrderByNameAsc(userId, type);
        return categories.stream().map(CategoryResponse::from).toList();
    }

    /** Busca uma categoria garantindo que ela pertence ao usuário (uso interno entre serviços). */
    public Category getOwned(UUID userId, UUID categoryId) {
        return repository.findByIdAndUserId(categoryId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Categoria"));
    }

    @Transactional
    public CategoryResponse create(UUID userId, CreateCategoryRequest request) {
        String name = request.name().trim();
        if (repository.existsByUserIdAndTypeAndNameIgnoreCase(userId, request.type(), name)) {
            throw new ConflictException("Já existe uma categoria com este nome");
        }
        User user = userRepository.getReferenceById(userId);
        Category category = repository.save(
                new Category(user, name, request.type(), request.color().toUpperCase(), request.icon()));
        return CategoryResponse.from(category);
    }

    @Transactional
    public CategoryResponse update(UUID userId, UUID categoryId, UpdateCategoryRequest request) {
        Category category = getOwned(userId, categoryId);
        String name = request.name().trim();
        if (repository.existsByUserIdAndTypeAndNameIgnoreCaseAndIdNot(userId, category.getType(), name, categoryId)) {
            throw new ConflictException("Já existe uma categoria com este nome");
        }
        category.update(name, request.color().toUpperCase(), request.icon());
        return CategoryResponse.from(category);
    }

    @Transactional
    public void delete(UUID userId, UUID categoryId) {
        Category category = getOwned(userId, categoryId);
        if (repository.isInUse(categoryId)) {
            throw new ConflictException("Categoria possui lançamentos e não pode ser excluída");
        }
        if (repository.hasRecurring(categoryId)) {
            throw new ConflictException("Categoria possui lançamentos fixos e não pode ser excluída");
        }
        repository.delete(category);
    }

    /** Cria o conjunto padrão de categorias para um novo usuário. */
    @Transactional
    public void createDefaults(User user) {
        List<Category> defaults = DefaultCategories.ALL.stream()
                .map(t -> new Category(user, t.name(), t.type(), t.color(), t.icon()))
                .toList();
        repository.saveAll(defaults);
    }
}
