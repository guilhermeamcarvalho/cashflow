package com.cashflow.api.creditcard;

import com.cashflow.api.common.domain.PaymentMethod;
import com.cashflow.api.common.domain.TransactionType;
import com.cashflow.api.common.exception.BusinessRuleException;
import com.cashflow.api.common.exception.ConflictException;
import com.cashflow.api.common.exception.ResourceNotFoundException;
import com.cashflow.api.creditcard.dto.CreditCardRef;
import com.cashflow.api.creditcard.dto.CreditCardRequest;
import com.cashflow.api.creditcard.dto.CreditCardResponse;
import com.cashflow.api.creditcard.dto.InvoiceResponse;
import com.cashflow.api.creditcard.dto.InvoiceSummary;
import com.cashflow.api.creditcard.dto.InvoiceSummary.InvoiceStatus;
import com.cashflow.api.transaction.Transaction.Payment;
import com.cashflow.api.transaction.TransactionRepository;
import com.cashflow.api.transaction.dto.TransactionResponse;
import com.cashflow.api.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class CreditCardService {

    private final CreditCardRepository repository;
    private final InvoicePaymentRepository paymentRepository;
    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public CreditCardService(CreditCardRepository repository, InvoicePaymentRepository paymentRepository,
                             TransactionRepository transactionRepository, UserRepository userRepository,
                             Clock clock) {
        this.repository = repository;
        this.paymentRepository = paymentRepository;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    public List<CreditCardResponse> findAll(UUID userId) {
        return repository.findAllByUserIdOrderByNameAsc(userId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public CreditCardResponse create(UUID userId, CreditCardRequest request) {
        String name = request.name().trim();
        if (repository.existsByUserIdAndNameIgnoreCase(userId, name)) {
            throw new ConflictException("Já existe um cartão com este nome");
        }
        CreditCard card = repository.save(new CreditCard(userRepository.getReferenceById(userId), name,
                request.color().toUpperCase(), request.closingDay(), request.dueDay(), request.creditLimit()));
        return toResponse(card);
    }

    /** Alterar fechamento/vencimento vale para as próximas compras; as já lançadas mantêm a fatura. */
    @Transactional
    public CreditCardResponse update(UUID userId, UUID cardId, CreditCardRequest request) {
        CreditCard card = getOwned(userId, cardId);
        String name = request.name().trim();
        if (repository.existsByUserIdAndNameIgnoreCaseAndIdNot(userId, name, cardId)) {
            throw new ConflictException("Já existe um cartão com este nome");
        }
        card.update(name, request.color().toUpperCase(), request.closingDay(), request.dueDay(), request.creditLimit());
        return toResponse(card);
    }

    @Transactional
    public void delete(UUID userId, UUID cardId) {
        CreditCard card = getOwned(userId, cardId);
        if (repository.hasTransactions(cardId) || repository.hasRecurring(cardId)) {
            throw new ConflictException("Cartão possui lançamentos e não pode ser excluído");
        }
        repository.delete(card);
    }

    public InvoiceResponse invoice(UUID userId, UUID cardId, YearMonth month) {
        CreditCard card = getOwned(userId, cardId);
        List<TransactionResponse> transactions = transactionRepository
                .findAllByCreditCardIdAndInvoiceMonthOrderByOccurredOnDescCreatedAtDesc(cardId, month.atDay(1))
                .stream()
                .map(TransactionResponse::from)
                .toList();
        return new InvoiceResponse(CreditCardRef.from(card), summary(card, month), transactions);
    }

    @Transactional
    public InvoiceSummary markPaid(UUID userId, UUID cardId, YearMonth month) {
        CreditCard card = getOwned(userId, cardId);
        if (LocalDate.now(clock).isBefore(card.closingDateOf(month))) {
            throw new BusinessRuleException("A fatura ainda está aberta e não pode ser marcada como paga");
        }
        if (paymentRepository.findByCreditCardIdAndInvoiceMonth(cardId, month.atDay(1)).isEmpty()) {
            paymentRepository.save(new InvoicePayment(card, month, LocalDate.now(clock)));
        }
        return summary(card, month);
    }

    @Transactional
    public InvoiceSummary unmarkPaid(UUID userId, UUID cardId, YearMonth month) {
        CreditCard card = getOwned(userId, cardId);
        paymentRepository.findByCreditCardIdAndInvoiceMonth(cardId, month.atDay(1))
                .ifPresent(paymentRepository::delete);
        paymentRepository.flush();
        return summary(card, month);
    }

    /**
     * Valida e monta a forma de pagamento de um lançamento. Receitas não têm
     * forma de pagamento; compras no crédito exigem um cartão do usuário e
     * entram na fatura calculada a partir da data.
     */
    public Payment resolvePayment(UUID userId, TransactionType type, PaymentMethod method, UUID cardId,
                                  LocalDate date) {
        if (type == TransactionType.INCOME) {
            return Payment.NONE;
        }
        if (method == PaymentMethod.CREDIT) {
            if (cardId == null) {
                throw new BusinessRuleException("Escolha o cartão de crédito");
            }
            CreditCard card = getOwned(userId, cardId);
            return Payment.credit(card, card.invoiceFor(date));
        }
        if (cardId != null) {
            throw new BusinessRuleException("Cartão só pode ser informado em compras no crédito");
        }
        return Payment.of(method);
    }

    public CreditCard getOwned(UUID userId, UUID cardId) {
        return repository.findByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Cartão"));
    }

    private CreditCardResponse toResponse(CreditCard card) {
        YearMonth current = card.invoiceFor(LocalDate.now(clock));
        BigDecimal available = card.getCreditLimit() == null
                ? null
                : card.getCreditLimit().subtract(repository.sumUnpaid(card.getId()));
        return new CreditCardResponse(
                card.getId(),
                card.getName(),
                card.getColor(),
                card.getClosingDay(),
                card.getDueDay(),
                card.getCreditLimit(),
                available,
                summary(card, current),
                summary(card, current.minusMonths(1)));
    }

    private InvoiceSummary summary(CreditCard card, YearMonth month) {
        BigDecimal total = transactionRepository.sumInvoice(card.getId(), month.atDay(1));
        LocalDate closing = card.closingDateOf(month);
        LocalDate due = card.dueDateOf(month);
        LocalDate paidOn = paymentRepository.findByCreditCardIdAndInvoiceMonth(card.getId(), month.atDay(1))
                .map(InvoicePayment::getPaidOn)
                .orElse(null);
        return new InvoiceSummary(month.toString(), total, closing, due, status(total, closing, due, paidOn), paidOn);
    }

    private InvoiceStatus status(BigDecimal total, LocalDate closing, LocalDate due, LocalDate paidOn) {
        LocalDate today = LocalDate.now(clock);
        if (paidOn != null) {
            return InvoiceStatus.PAID;
        }
        if (today.isBefore(closing)) {
            return InvoiceStatus.OPEN;
        }
        if (total.signum() == 0) {
            return InvoiceStatus.PAID; // fechada sem compras: nada a pagar
        }
        return today.isAfter(due) ? InvoiceStatus.OVERDUE : InvoiceStatus.CLOSED;
    }
}
