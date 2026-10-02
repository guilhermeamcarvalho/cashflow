package com.cashflow.api.budget;

import com.cashflow.api.budget.dto.BudgetOverviewResponse;
import com.cashflow.api.budget.dto.BudgetRequest;
import com.cashflow.api.budget.dto.BudgetResponse;
import com.cashflow.api.budget.dto.CopyBudgetsRequest;
import com.cashflow.api.category.Category;
import com.cashflow.api.category.CategoryService;
import com.cashflow.api.category.dto.CategoryResponse;
import com.cashflow.api.common.domain.TransactionType;
import com.cashflow.api.common.exception.BusinessRuleException;
import com.cashflow.api.common.exception.ResourceNotFoundException;
import com.cashflow.api.common.web.MonthRange;
import com.cashflow.api.transaction.TransactionAggregates.CategoryTotal;
import com.cashflow.api.transaction.TransactionRepository;
import com.cashflow.api.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class BudgetService {

    private final BudgetRepository repository;
    private final TransactionRepository transactionRepository;
    private final CategoryService categoryService;
    private final UserRepository userRepository;

    public BudgetService(BudgetRepository repository, TransactionRepository transactionRepository,
                         CategoryService categoryService, UserRepository userRepository) {
        this.repository = repository;
        this.transactionRepository = transactionRepository;
        this.categoryService = categoryService;
        this.userRepository = userRepository;
    }

    /** Lista os orçamentos do mês com o valor gasto em cada categoria. */
    public BudgetOverviewResponse overview(UUID userId, MonthRange range) {
        Map<UUID, BigDecimal> spentByCategory = transactionRepository
                .sumByCategory(userId, TransactionType.EXPENSE, range.start(), range.end()).stream()
                .collect(Collectors.toMap(CategoryTotal::getCategoryId, CategoryTotal::getTotal));

        List<BudgetResponse> items = repository.findAllByUserIdAndReferenceMonth(userId, range.start()).stream()
                .map(budget -> toResponse(budget,
                        spentByCategory.getOrDefault(budget.getCategory().getId(), BigDecimal.ZERO)))
                .sorted(Comparator.comparingInt(BudgetResponse::percentUsed).reversed())
                .toList();

        BigDecimal totalBudgeted = items.stream().map(BudgetResponse::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSpent = items.stream().map(BudgetResponse::spent).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new BudgetOverviewResponse(range.month().toString(), totalBudgeted, totalSpent, items);
    }

    /** Cria o orçamento da categoria no mês ou atualiza o valor, se já existir. */
    @Transactional
    public BudgetResponse upsert(UUID userId, BudgetRequest request) {
        Category category = categoryService.getOwned(userId, request.categoryId());
        if (category.getType() != TransactionType.EXPENSE) {
            throw new BusinessRuleException("Orçamentos só podem ser definidos para categorias de despesa");
        }
        MonthRange range = MonthRange.of(request.month());
        Budget budget = repository
                .findByUserIdAndCategoryIdAndReferenceMonth(userId, category.getId(), range.start())
                .map(existing -> {
                    existing.changeAmount(request.amount());
                    return existing;
                })
                .orElseGet(() -> repository.save(new Budget(
                        userRepository.getReferenceById(userId), category, request.month(), request.amount())));

        return toResponse(budget, spentIn(userId, category.getId(), range));
    }

    @Transactional
    public void delete(UUID userId, UUID budgetId) {
        Budget budget = repository.findByIdAndUserId(budgetId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Orçamento"));
        repository.delete(budget);
    }

    /** Replica os orçamentos de um mês para outro, mantendo os que já existem no destino. */
    @Transactional
    public BudgetOverviewResponse copy(UUID userId, CopyBudgetsRequest request) {
        if (request.fromMonth().equals(request.toMonth())) {
            throw new BusinessRuleException("Os meses de origem e destino devem ser diferentes");
        }
        YearMonth target = request.toMonth();
        Set<UUID> alreadyDefined = repository.findAllByUserIdAndReferenceMonth(userId, target.atDay(1)).stream()
                .map(budget -> budget.getCategory().getId())
                .collect(Collectors.toSet());

        List<Budget> copies = repository.findAllByUserIdAndReferenceMonth(userId, request.fromMonth().atDay(1))
                .stream()
                .filter(source -> !alreadyDefined.contains(source.getCategory().getId()))
                .map(source -> new Budget(userRepository.getReferenceById(userId), source.getCategory(), target,
                        source.getAmount()))
                .toList();
        repository.saveAll(copies);
        repository.flush();
        return overview(userId, MonthRange.of(target));
    }

    private BigDecimal spentIn(UUID userId, UUID categoryId, MonthRange range) {
        return transactionRepository
                .sumByCategory(userId, TransactionType.EXPENSE, range.start(), range.end()).stream()
                .filter(total -> total.getCategoryId().equals(categoryId))
                .map(CategoryTotal::getTotal)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

    private static BudgetResponse toResponse(Budget budget, BigDecimal spent) {
        BigDecimal amount = budget.getAmount();
        int percent = spent.multiply(BigDecimal.valueOf(100))
                .divide(amount, 0, RoundingMode.HALF_UP)
                .intValue();
        return new BudgetResponse(
                budget.getId(),
                budget.getMonth().toString(),
                CategoryResponse.from(budget.getCategory()),
                amount,
                spent,
                amount.subtract(spent),
                percent);
    }
}
