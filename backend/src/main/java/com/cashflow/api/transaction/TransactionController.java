package com.cashflow.api.transaction;

import com.cashflow.api.common.domain.PaymentMethod;
import com.cashflow.api.common.domain.TransactionType;
import com.cashflow.api.common.security.CurrentUserId;
import com.cashflow.api.common.web.MonthRange;
import com.cashflow.api.common.web.PageResponse;
import com.cashflow.api.recurring.RecurringTransactionService;
import com.cashflow.api.transaction.dto.TransactionFilter;
import com.cashflow.api.transaction.dto.TransactionRequest;
import com.cashflow.api.transaction.dto.TransactionResponse;
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

@Tag(name = "Lançamentos", description = "Receitas e despesas do usuário")
@RestController
@RequestMapping("/api/v1/transactions")
public class TransactionController {

    private final TransactionService service;
    private final RecurringTransactionService recurringService;
    private final Clock clock;

    public TransactionController(TransactionService service, RecurringTransactionService recurringService,
                                 Clock clock) {
        this.service = service;
        this.recurringService = recurringService;
        this.clock = clock;
    }

    @Operation(summary = "Lista lançamentos de um mês com filtros e paginação")
    @GetMapping
    public PageResponse<TransactionResponse> list(
            @CurrentUserId UUID userId,
            @Parameter(description = "Mês no formato yyyy-MM (padrão: mês atual)", example = "2026-10")
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) UUID categoryId,
            @Parameter(description = "Busca por trecho da descrição")
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PaymentMethod paymentMethod,
            @Parameter(description = "Restringe às compras de um cartão")
            @RequestParam(required = false) UUID creditCardId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        recurringService.generateDue(userId);
        TransactionFilter filter = new TransactionFilter(MonthRange.ofOrCurrent(month, clock), type, categoryId, search,
                paymentMethod, creditCardId);
        return service.search(userId, filter, page, size);
    }

    @Operation(summary = "Detalha um lançamento")
    @GetMapping("/{id}")
    public TransactionResponse get(@CurrentUserId UUID userId, @PathVariable UUID id) {
        return service.findById(userId, id);
    }

    @Operation(summary = "Cria um lançamento",
            description = "Com `installments` > 1 (só no crédito), cria uma parcela por fatura e devolve a primeira.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TransactionResponse create(@CurrentUserId UUID userId, @Valid @RequestBody TransactionRequest request) {
        return service.create(userId, request);
    }

    @Operation(summary = "Atualiza um lançamento")
    @PutMapping("/{id}")
    public TransactionResponse update(@CurrentUserId UUID userId, @PathVariable UUID id,
                                      @Valid @RequestBody TransactionRequest request) {
        return service.update(userId, id, request);
    }

    @Operation(summary = "Exclui um lançamento")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUserId UUID userId, @PathVariable UUID id,
                       @Parameter(description = "Em compras parceladas, exclui todas as parcelas")
                       @RequestParam(defaultValue = "false") boolean allInstallments) {
        service.delete(userId, id, allInstallments);
    }
}
