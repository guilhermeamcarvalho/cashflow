package com.cashflow.api.creditcard;

import com.cashflow.api.common.security.CurrentUserId;
import com.cashflow.api.creditcard.dto.CreditCardRequest;
import com.cashflow.api.creditcard.dto.CreditCardResponse;
import com.cashflow.api.creditcard.dto.InvoiceResponse;
import com.cashflow.api.creditcard.dto.InvoiceSummary;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Tag(name = "Cartões de crédito", description = "Cartões, faturas e pagamento de faturas")
@RestController
@RequestMapping("/api/v1/credit-cards")
public class CreditCardController {

    private final CreditCardService service;
    private final RecurringTransactionService recurringService;

    public CreditCardController(CreditCardService service, RecurringTransactionService recurringService) {
        this.service = service;
        this.recurringService = recurringService;
    }

    @Operation(summary = "Lista os cartões com a fatura atual, a anterior e o limite disponível")
    @GetMapping
    public List<CreditCardResponse> list(@CurrentUserId UUID userId) {
        recurringService.generateDue(userId);
        return service.findAll(userId);
    }

    @Operation(summary = "Cadastra um cartão")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreditCardResponse create(@CurrentUserId UUID userId, @Valid @RequestBody CreditCardRequest request) {
        return service.create(userId, request);
    }

    @Operation(summary = "Atualiza um cartão (fechamento/vencimento valem para as próximas compras)")
    @PutMapping("/{id}")
    public CreditCardResponse update(@CurrentUserId UUID userId, @PathVariable UUID id,
                                     @Valid @RequestBody CreditCardRequest request) {
        return service.update(userId, id, request);
    }

    @Operation(summary = "Exclui um cartão sem lançamentos")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUserId UUID userId, @PathVariable UUID id) {
        service.delete(userId, id);
    }

    @Operation(summary = "Fatura de um mês (mês de vencimento) com as compras")
    @GetMapping("/{id}/invoices/{month}")
    public InvoiceResponse invoice(
            @CurrentUserId UUID userId, @PathVariable UUID id,
            @Parameter(description = "Mês de vencimento (yyyy-MM)", example = "2026-11")
            @PathVariable @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        recurringService.generateDue(userId);
        return service.invoice(userId, id, month);
    }

    @Operation(summary = "Marca a fatura como paga")
    @PutMapping("/{id}/invoices/{month}/payment")
    public InvoiceSummary pay(@CurrentUserId UUID userId, @PathVariable UUID id,
                              @PathVariable @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return service.markPaid(userId, id, month);
    }

    @Operation(summary = "Desfaz o pagamento da fatura")
    @DeleteMapping("/{id}/invoices/{month}/payment")
    public InvoiceSummary unpay(@CurrentUserId UUID userId, @PathVariable UUID id,
                                @PathVariable @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        return service.unmarkPaid(userId, id, month);
    }
}
