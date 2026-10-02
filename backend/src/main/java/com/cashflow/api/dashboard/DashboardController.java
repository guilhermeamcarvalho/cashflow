package com.cashflow.api.dashboard;

import com.cashflow.api.common.security.CurrentUserId;
import com.cashflow.api.common.web.MonthRange;
import com.cashflow.api.dashboard.dto.DailyTotalsResponse;
import com.cashflow.api.dashboard.dto.MonthlySummaryResponse;
import com.cashflow.api.dashboard.dto.MonthlyTotalsResponse;
import com.cashflow.api.recurring.RecurringTransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Clock;
import java.time.YearMonth;
import java.util.UUID;

@Tag(name = "Dashboard", description = "Indicadores consolidados do mês")
@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    private final DashboardService service;
    private final RecurringTransactionService recurringService;
    private final Clock clock;

    public DashboardController(DashboardService service, RecurringTransactionService recurringService,
                               Clock clock) {
        this.service = service;
        this.recurringService = recurringService;
        this.clock = clock;
    }

    @Operation(summary = "Resumo do mês: totais, comparação com o mês anterior, gastos por categoria e por dia")
    @GetMapping("/summary")
    public MonthlySummaryResponse summary(
            @CurrentUserId UUID userId,
            @Parameter(description = "Mês no formato yyyy-MM (padrão: mês atual)", example = "2026-10")
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month) {
        recurringService.generateDue(userId);
        return service.summary(userId, MonthRange.ofOrCurrent(month, clock));
    }

    @Operation(summary = "Receitas e despesas mês a mês, com filtro de período e categoria",
            description = "Padrão: os últimos 6 meses até o mês atual. Intervalo máximo de 24 meses.")
    @GetMapping("/monthly-totals")
    public MonthlyTotalsResponse monthlyTotals(
            @CurrentUserId UUID userId,
            @Parameter(description = "Mês inicial (yyyy-MM). Padrão: 5 meses antes de `to`", example = "2026-05")
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth from,
            @Parameter(description = "Mês final (yyyy-MM). Padrão: mês atual", example = "2026-10")
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth to,
            @Parameter(description = "Restringe a uma categoria")
            @RequestParam(required = false) UUID categoryId) {
        recurringService.generateDue(userId);
        YearMonth end = to != null ? to : YearMonth.now(clock);
        YearMonth start = from != null ? from : end.minusMonths(5);
        return service.monthlyTotals(userId, start, end, categoryId);
    }

    @Operation(summary = "Receitas e despesas dia a dia de um mês, com filtro de categoria")
    @GetMapping("/daily-totals")
    public DailyTotalsResponse dailyTotals(
            @CurrentUserId UUID userId,
            @Parameter(description = "Mês no formato yyyy-MM (padrão: mês atual)", example = "2026-10")
            @RequestParam(required = false) @DateTimeFormat(pattern = "yyyy-MM") YearMonth month,
            @Parameter(description = "Restringe a uma categoria")
            @RequestParam(required = false) UUID categoryId) {
        recurringService.generateDue(userId);
        return service.dailyTotals(userId, MonthRange.ofOrCurrent(month, clock), categoryId);
    }
}
