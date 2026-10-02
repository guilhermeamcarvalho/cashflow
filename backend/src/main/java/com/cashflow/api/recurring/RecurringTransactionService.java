package com.cashflow.api.recurring;

import com.cashflow.api.category.Category;
import com.cashflow.api.category.CategoryService;
import com.cashflow.api.common.exception.BusinessRuleException;
import com.cashflow.api.common.exception.ResourceNotFoundException;
import com.cashflow.api.creditcard.CreditCardService;
import com.cashflow.api.recurring.dto.RecurringTransactionRequest;
import com.cashflow.api.recurring.dto.RecurringTransactionResponse;
import com.cashflow.api.transaction.Transaction;
import com.cashflow.api.transaction.Transaction.Payment;
import com.cashflow.api.transaction.TransactionRepository;
import com.cashflow.api.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/**
 * Lançamentos fixos. Os lançamentos reais são gerados de forma preguiçosa: antes
 * das leituras de dados financeiros, {@link #generateDue(UUID)} lança tudo o que
 * venceu até o mês corrente. Assim não é preciso agendador e o resultado é o
 * mesmo para qualquer instância da API.
 */
@Service
@Transactional(readOnly = true)
public class RecurringTransactionService {

    private final RecurringTransactionRepository repository;
    private final TransactionRepository transactionRepository;
    private final CategoryService categoryService;
    private final CreditCardService creditCardService;
    private final UserRepository userRepository;
    private final Clock clock;

    public RecurringTransactionService(RecurringTransactionRepository repository,
                                       TransactionRepository transactionRepository,
                                       CategoryService categoryService, CreditCardService creditCardService,
                                       UserRepository userRepository, Clock clock) {
        this.repository = repository;
        this.transactionRepository = transactionRepository;
        this.categoryService = categoryService;
        this.creditCardService = creditCardService;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    public List<RecurringTransactionResponse> findAll(UUID userId) {
        return repository.findAllByUserIdOrderByDayOfMonthAscDescriptionAsc(userId).stream()
                .map(RecurringTransactionResponse::from)
                .toList();
    }

    /** Cria o lançamento fixo e já lança os meses vencidos (inclusive o atual). */
    @Transactional
    public RecurringTransactionResponse create(UUID userId, RecurringTransactionRequest request) {
        Category category = categoryService.getOwned(userId, request.categoryId());
        Payment payment = resolvePayment(userId, category, request);
        RecurringTransaction recurring = repository.save(new RecurringTransaction(
                userRepository.getReferenceById(userId),
                category,
                request.description().trim(),
                request.amount(),
                request.dayOfMonth(),
                request.startMonth(),
                blankToNull(request.notes()),
                payment));
        generate(recurring, YearMonth.now(clock));
        return RecurringTransactionResponse.from(recurring);
    }

    /** Altera o modelo; vale para os próximos meses (lançamentos já gerados não mudam). */
    @Transactional
    public RecurringTransactionResponse update(UUID userId, UUID id, RecurringTransactionRequest request) {
        RecurringTransaction recurring = getOwned(userId, id);
        Category category = categoryService.getOwned(userId, request.categoryId());
        if (category.getType() != recurring.getType()) {
            throw new BusinessRuleException("A categoria deve ser do mesmo tipo do lançamento fixo");
        }
        if (!request.startMonth().equals(recurring.getStartMonth())) {
            if (!recurring.canChangeStartMonth()) {
                throw new BusinessRuleException("O mês inicial não pode mudar depois do primeiro lançamento");
            }
            recurring.changeStartMonth(request.startMonth());
        }
        recurring.update(category, request.description().trim(), request.amount(), request.dayOfMonth(),
                blankToNull(request.notes()), resolvePayment(userId, category, request));
        generate(recurring, YearMonth.now(clock));
        return RecurringTransactionResponse.from(recurring);
    }

    /** Encerra o lançamento fixo. Os lançamentos já gerados permanecem no histórico. */
    @Transactional
    public void delete(UUID userId, UUID id) {
        repository.delete(getOwned(userId, id));
    }

    /** Gera os lançamentos vencidos até o mês corrente para todos os modelos do usuário. */
    @Transactional
    public void generateDue(UUID userId) {
        YearMonth current = YearMonth.now(clock);
        repository.findPendingForUpdate(userId, current.atDay(1))
                .forEach(recurring -> generate(recurring, current));
    }

    private void generate(RecurringTransaction recurring, YearMonth through) {
        List<YearMonth> months = recurring.pendingMonthsThrough(through);
        if (months.isEmpty()) {
            return;
        }
        List<Transaction> transactions = months.stream()
                .map(month -> Transaction.generated(
                        recurring.getUser(),
                        recurring.getCategory(),
                        recurring.getDescription(),
                        recurring.getAmount(),
                        recurring.dateIn(month),
                        recurring.getNotes(),
                        recurring.paymentOn(recurring.dateIn(month)),
                        recurring.getId()))
                .toList();
        transactionRepository.saveAll(transactions);
        recurring.markGeneratedThrough(months.getLast());
    }

    private Payment resolvePayment(UUID userId, Category category, RecurringTransactionRequest request) {
        return creditCardService.resolvePayment(userId, category.getType(), request.paymentMethod(),
                request.creditCardId(), request.startMonth().atDay(1));
    }

    private RecurringTransaction getOwned(UUID userId, UUID id) {
        return repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Lançamento fixo"));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
