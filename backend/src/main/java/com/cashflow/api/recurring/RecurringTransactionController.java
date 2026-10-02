package com.cashflow.api.recurring;

import com.cashflow.api.common.security.CurrentUserId;
import com.cashflow.api.recurring.dto.RecurringTransactionRequest;
import com.cashflow.api.recurring.dto.RecurringTransactionResponse;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@Tag(name = "Lançamentos fixos", description = "Despesas e receitas que se repetem todo mês")
@RestController
@RequestMapping("/api/v1/recurring-transactions")
public class RecurringTransactionController {

    private final RecurringTransactionService service;

    public RecurringTransactionController(RecurringTransactionService service) {
        this.service = service;
    }

    @Operation(summary = "Lista os lançamentos fixos")
    @GetMapping
    public List<RecurringTransactionResponse> list(@CurrentUserId UUID userId) {
        service.generateDue(userId);
        return service.findAll(userId);
    }

    @Operation(summary = "Cria um lançamento fixo e lança os meses já vencidos")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecurringTransactionResponse create(@CurrentUserId UUID userId,
                                               @Valid @RequestBody RecurringTransactionRequest request) {
        return service.create(userId, request);
    }

    @Operation(summary = "Atualiza um lançamento fixo (vale para os próximos meses)")
    @PutMapping("/{id}")
    public RecurringTransactionResponse update(@CurrentUserId UUID userId, @PathVariable UUID id,
                                               @Valid @RequestBody RecurringTransactionRequest request) {
        return service.update(userId, id, request);
    }

    @Operation(summary = "Encerra um lançamento fixo (o histórico já lançado é mantido)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUserId UUID userId, @PathVariable UUID id) {
        service.delete(userId, id);
    }
}
