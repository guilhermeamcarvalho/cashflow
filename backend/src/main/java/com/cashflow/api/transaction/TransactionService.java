package com.cashflow.api.transaction;

import com.cashflow.api.category.Category;
import com.cashflow.api.category.CategoryService;
import com.cashflow.api.common.exception.BusinessRuleException;
import com.cashflow.api.common.exception.ResourceNotFoundException;
import com.cashflow.api.common.web.PageResponse;
import com.cashflow.api.creditcard.CreditCardService;
import com.cashflow.api.transaction.Transaction.Payment;
import com.cashflow.api.transaction.dto.TransactionFilter;
import com.cashflow.api.transaction.dto.TransactionRequest;
import com.cashflow.api.transaction.dto.TransactionResponse;
import com.cashflow.api.user.User;
import com.cashflow.api.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class TransactionService {

    static final int MAX_PAGE_SIZE = 100;
    private static final Sort DEFAULT_SORT = Sort.by(Sort.Order.desc("occurredOn"), Sort.Order.desc("createdAt"));

    private final TransactionRepository repository;
    private final CategoryService categoryService;
    private final CreditCardService creditCardService;
    private final UserRepository userRepository;

    public TransactionService(TransactionRepository repository, CategoryService categoryService,
                              CreditCardService creditCardService, UserRepository userRepository) {
        this.repository = repository;
        this.categoryService = categoryService;
        this.creditCardService = creditCardService;
        this.userRepository = userRepository;
    }

    public PageResponse<TransactionResponse> search(UUID userId, TransactionFilter filter, int page, int size) {
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE), DEFAULT_SORT);
        return PageResponse.of(
                repository.findAll(TransactionSpecifications.matching(userId, filter), pageable),
                TransactionResponse::from);
    }

    public TransactionResponse findById(UUID userId, UUID id) {
        return TransactionResponse.from(getOwned(userId, id));
    }

    /** Cria o lançamento; compras parceladas viram uma parcela por fatura (devolve a primeira). */
    @Transactional
    public TransactionResponse create(UUID userId, TransactionRequest request) {
        Category category = categoryService.getOwned(userId, request.categoryId());
        Payment payment = creditCardService.resolvePayment(
                userId, category.getType(), request.paymentMethod(), request.creditCardId(), request.date());
        int installments = request.installments() == null ? 1 : request.installments();
        User user = userRepository.getReferenceById(userId);

        if (installments > 1) {
            if (payment.card() == null) {
                throw new BusinessRuleException("Parcelamento só é possível em compras no cartão de crédito");
            }
            return TransactionResponse.from(createInstallments(user, category, request, payment, installments));
        }
        Transaction transaction = new Transaction(user, category, request.description().trim(), request.amount(),
                request.date(), blankToNull(request.notes()), payment);
        return TransactionResponse.from(repository.save(transaction));
    }

    /**
     * Divide o valor total em parcelas iguais (os centavos que sobram vão na
     * primeira). A parcela k entra na fatura k meses depois da primeira e é
     * datada k meses depois da compra.
     */
    private Transaction createInstallments(User user, Category category, TransactionRequest request,
                                           Payment payment, int count) {
        BigDecimal total = request.amount();
        BigDecimal installment = total.divide(BigDecimal.valueOf(count), 2, RoundingMode.DOWN);
        if (installment.signum() <= 0) {
            throw new BusinessRuleException("Cada parcela deve ser de pelo menos R$ 0,01");
        }
        BigDecimal remainder = total.subtract(installment.multiply(BigDecimal.valueOf(count)));

        UUID groupId = UUID.randomUUID();
        List<Transaction> installments = new ArrayList<>(count);
        for (int k = 0; k < count; k++) {
            installments.add(Transaction.installment(
                    user,
                    category,
                    request.description().trim(),
                    k == 0 ? installment.add(remainder) : installment,
                    request.date().plusMonths(k),
                    blankToNull(request.notes()),
                    Payment.credit(payment.card(), payment.invoice().plusMonths(k)),
                    groupId, k + 1, count));
        }
        return repository.saveAll(installments).getFirst();
    }

    /** Edita somente este lançamento (em compras parceladas, só esta parcela). */
    @Transactional
    public TransactionResponse update(UUID userId, UUID id, TransactionRequest request) {
        Transaction transaction = getOwned(userId, id);
        Category category = categoryService.getOwned(userId, request.categoryId());
        Payment payment = creditCardService.resolvePayment(
                userId, category.getType(), request.paymentMethod(), request.creditCardId(), request.date());

        // Parcela com mesmo cartão e data: mantém a fatura original (k meses após a primeira).
        boolean sameInstallmentPlacement = transaction.getInstallmentGroupId() != null
                && payment.card() != null
                && transaction.getCreditCard() != null
                && Objects.equals(payment.card().getId(), transaction.getCreditCard().getId())
                && request.date().equals(transaction.getOccurredOn());
        if (sameInstallmentPlacement) {
            payment = Payment.credit(payment.card(), transaction.getInvoice());
        }

        transaction.update(category, request.description().trim(), request.amount(), request.date(),
                blankToNull(request.notes()), payment);
        return TransactionResponse.from(transaction);
    }

    @Transactional
    public void delete(UUID userId, UUID id, boolean allInstallments) {
        Transaction transaction = getOwned(userId, id);
        if (allInstallments && transaction.getInstallmentGroupId() != null) {
            repository.deleteAll(
                    repository.findAllByUserIdAndInstallmentGroupId(userId, transaction.getInstallmentGroupId()));
        } else {
            repository.delete(transaction);
        }
    }

    private Transaction getOwned(UUID userId, UUID id) {
        return repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Lançamento"));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
