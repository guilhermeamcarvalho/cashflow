package com.cashflow.api.dashboard;

import com.cashflow.api.budget.BudgetRepository;
import com.cashflow.api.category.CategoryService;
import com.cashflow.api.common.domain.TransactionType;
import com.cashflow.api.common.exception.BusinessRuleException;
import com.cashflow.api.common.web.MonthRange;
import com.cashflow.api.dashboard.dto.DailyTotalsResponse;
import com.cashflow.api.dashboard.dto.DailyTotalsResponse.DayPoint;
import com.cashflow.api.dashboard.dto.MonthlySummaryResponse;
import com.cashflow.api.dashboard.dto.MonthlyTotalsResponse;
import com.cashflow.api.dashboard.dto.MonthlyTotalsResponse.MonthPoint;
import com.cashflow.api.dashboard.dto.MonthlySummaryResponse.CategorySlice;
import com.cashflow.api.dashboard.dto.MonthlySummaryResponse.Totals;
import com.cashflow.api.transaction.TransactionAggregates.CategoryTotal;
import com.cashflow.api.transaction.TransactionAggregates.DayTypeTotal;
import com.cashflow.api.transaction.TransactionAggregates.MonthTotal;
import com.cashflow.api.transaction.TransactionAggregates.TypeTotal;
import com.cashflow.api.transaction.TransactionRepository;
import com.cashflow.api.transaction.dto.TransactionResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/** Consolida os números do mês para a tela inicial (somente leitura). */
@Service
@Transactional(readOnly = true)
public class DashboardService {

    /** Limite do intervalo da série mensal (protege o banco de consultas enormes). */
    static final int MAX_MONTHS = 24;

    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final CategoryService categoryService;

    public DashboardService(TransactionRepository transactionRepository, BudgetRepository budgetRepository,
                            CategoryService categoryService) {
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
        this.categoryService = categoryService;
    }

    public MonthlySummaryResponse summary(UUID userId, MonthRange range) {
        Totals current = totals(userId, range);
        Totals previous = totals(userId, range.previous());

        List<CategoryTotal> byCategory = transactionRepository
                .sumByCategory(userId, TransactionType.EXPENSE, range.start(), range.end());
        List<CategorySlice> slices = byCategory.stream()
                .map(c -> new CategorySlice(c.getCategoryId(), c.getName(), c.getColor(), c.getIcon(),
                        c.getTotal(), c.getCount(), percentOf(c.getTotal(), current.expenses())))
                .toList();


        List<TransactionResponse> recent = transactionRepository
                .findTop5ByUserIdAndOccurredOnBetweenOrderByOccurredOnDescCreatedAtDesc(
                        userId, range.start(), range.end()).stream()
                .map(TransactionResponse::from)
                .toList();

        BigDecimal budgeted = budgetRepository.sumByMonth(userId, range.start());
        Set<UUID> budgetedCategories = budgetRepository.findBudgetedCategoryIds(userId, range.start());
        BigDecimal budgetSpent = byCategory.stream()
                .filter(c -> budgetedCategories.contains(c.getCategoryId()))
                .map(CategoryTotal::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new MonthlySummaryResponse(
                range.month().toString(), current, previous, budgeted, budgetSpent, slices, recent);
    }

    /**
     * Série mês a mês de receitas e despesas no intervalo [from, to],
     * opcionalmente restrita a uma categoria do usuário.
     */
    public MonthlyTotalsResponse monthlyTotals(UUID userId, YearMonth from, YearMonth to, UUID categoryId) {
        if (from.isAfter(to)) {
            throw new BusinessRuleException("O mês inicial deve ser anterior ou igual ao mês final");
        }
        long months = ChronoUnit.MONTHS.between(from, to) + 1;
        if (months > MAX_MONTHS) {
            throw new BusinessRuleException("O intervalo pode ter no máximo " + MAX_MONTHS + " meses");
        }

        List<MonthTotal> totals;
        if (categoryId == null) {
            totals = transactionRepository.sumByMonth(userId, from.atDay(1), to.atEndOfMonth());
        } else {
            categoryService.getOwned(userId, categoryId); // 404 se a categoria não for do usuário
            totals = transactionRepository.sumByMonthAndCategory(
                    userId, categoryId, from.atDay(1), to.atEndOfMonth());
        }

        Map<YearMonth, BigDecimal[]> byMonth = new HashMap<>();
        for (MonthTotal total : totals) {
            BigDecimal[] values = byMonth.computeIfAbsent(
                    YearMonth.of(total.getRefYear(), total.getRefMonth()),
                    key -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            values[total.getType() == TransactionType.INCOME ? 0 : 1] = total.getTotal();
        }

        List<MonthPoint> points = new ArrayList<>();
        for (YearMonth month = from; !month.isAfter(to); month = month.plusMonths(1)) {
            BigDecimal[] values = byMonth.getOrDefault(month, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            points.add(new MonthPoint(month.toString(), values[0], values[1], values[0].subtract(values[1])));
        }
        return new MonthlyTotalsResponse(from.toString(), to.toString(), categoryId, points);
    }

    /** Série dia a dia de receitas e despesas de um mês, opcionalmente de uma categoria. */
    public DailyTotalsResponse dailyTotals(UUID userId, MonthRange range, UUID categoryId) {
        List<DayTypeTotal> totals;
        if (categoryId == null) {
            totals = transactionRepository.sumByDayAndType(userId, range.start(), range.end());
        } else {
            categoryService.getOwned(userId, categoryId); // 404 se a categoria não for do usuário
            totals = transactionRepository.sumByDayAndTypeForCategory(userId, categoryId, range.start(), range.end());
        }

        Map<LocalDate, BigDecimal[]> byDay = new HashMap<>();
        for (DayTypeTotal total : totals) {
            BigDecimal[] values = byDay.computeIfAbsent(
                    total.getDate(), key -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            values[total.getType() == TransactionType.INCOME ? 0 : 1] = total.getTotal();
        }

        List<DayPoint> days = new ArrayList<>();
        for (LocalDate day = range.start(); !day.isAfter(range.end()); day = day.plusDays(1)) {
            BigDecimal[] values = byDay.getOrDefault(day, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            days.add(new DayPoint(day, values[0], values[1], values[0].subtract(values[1])));
        }
        return new DailyTotalsResponse(range.month().toString(), categoryId, days);
    }

    private Totals totals(UUID userId, MonthRange range) {
        BigDecimal income = BigDecimal.ZERO;
        BigDecimal expenses = BigDecimal.ZERO;
        for (TypeTotal total : transactionRepository.sumByType(userId, range.start(), range.end())) {
            if (total.getType() == TransactionType.INCOME) {
                income = total.getTotal();
            } else {
                expenses = total.getTotal();
            }
        }
        return new Totals(income, expenses, income.subtract(expenses));
    }

    static int percentOf(BigDecimal part, BigDecimal whole) {
        if (whole.signum() == 0) {
            return 0;
        }
        return part.multiply(BigDecimal.valueOf(100)).divide(whole, 0, RoundingMode.HALF_UP).intValue();
    }
}
