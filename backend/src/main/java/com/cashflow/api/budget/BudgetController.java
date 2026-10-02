package com.cashflow.api.budget;

import com.cashflow.api.budget.dto.BudgetOverviewResponse;
import com.cashflow.api.budget.dto.BudgetRequest;
import com.cashflow.api.budget.dto.BudgetResponse;
import com.cashflow.api.budget.dto.CopyBudgetsRequest;
import com.cashflow.api.common.security.CurrentUserId;
import com.cashflow.api.common.web.MonthRange;
import com.cashflow.api.recurring.RecurringTransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.Clock;
import java.time.YearMonth;
import java.util.UUID;

@Tag(name = "Orçamentos", description = "Limites mensais de gasto por categoria")
@RestController
@RequestMapping("/api/v1/budgets")
public class BudgetController {

    private final BudgetService service;
    private final RecurringTransactionService recurringService;
    private final Clock clock;

    public BudgetController(BudgetService service, RecurringTransactionService recurringService, Clock clock) {
        this.service = service;
        this.recurringService = recurringService;
        this.clock = clock;
    }

    @Operation(summary = "Orçamentos do mês com valores gastos")
    @GetMapping
    public BudgetOverviewResponse overview(
            @CurrentUserId UUID userId,
            @Parameter(description = "Mês no formato yyyy-MM (padrão: mês atual)", example = "2026-10")
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        recurringService.generateDue(userId);
        return service.overview(userId, MonthRange.ofOrCurrent(month, clock));
    }

    @Operation(summary = "Define o orçamento de uma categoria no mês (cria ou atualiza)")
    @PutMapping
    public BudgetResponse upsert(@CurrentUserId UUID userId, @Valid @RequestBody BudgetRequest request) {
        return service.upsert(userId, request);
    }

    @Operation(summary = "Copia os orçamentos de um mês para outro")
    @PostMapping("/copy")
    public BudgetOverviewResponse copy(@CurrentUserId UUID userId, @Valid @RequestBody CopyBudgetsRequest request) {
        return service.copy(userId, request);
    }

    @Operation(summary = "Remove um orçamento")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUserId UUID userId, @PathVariable UUID id) {
        service.delete(userId, id);
    }
}
