package com.cashflow.api.category;

import com.cashflow.api.category.dto.CategoryResponse;
import com.cashflow.api.category.dto.CreateCategoryRequest;
import com.cashflow.api.category.dto.UpdateCategoryRequest;
import com.cashflow.api.common.domain.TransactionType;
import com.cashflow.api.common.security.CurrentUserId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Tag(name = "Categorias", description = "Categorias de receitas e despesas")
@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

    private final CategoryService service;

    public CategoryController(CategoryService service) {
        this.service = service;
    }

    @Operation(summary = "Lista as categorias do usuário, opcionalmente filtrando por tipo")
    @GetMapping
    public List<CategoryResponse> list(@CurrentUserId UUID userId,
                                       @RequestParam(required = false) TransactionType type) {
        return service.findAll(userId, type);
    }

    @Operation(summary = "Cria uma categoria")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@CurrentUserId UUID userId, @Valid @RequestBody CreateCategoryRequest request) {
        return service.create(userId, request);
    }

    @Operation(summary = "Atualiza nome, cor e ícone de uma categoria")
    @PutMapping("/{id}")
    public CategoryResponse update(@CurrentUserId UUID userId, @PathVariable UUID id,
                                   @Valid @RequestBody UpdateCategoryRequest request) {
        return service.update(userId, id, request);
    }

    @Operation(summary = "Exclui uma categoria sem lançamentos")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUserId UUID userId, @PathVariable UUID id) {
        service.delete(userId, id);
    }
}
