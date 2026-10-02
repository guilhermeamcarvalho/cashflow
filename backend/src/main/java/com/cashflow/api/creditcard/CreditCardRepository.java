package com.cashflow.api.creditcard;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CreditCardRepository extends JpaRepository<CreditCard, UUID> {

    List<CreditCard> findAllByUserIdOrderByNameAsc(UUID userId);

    Optional<CreditCard> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndNameIgnoreCase(UUID userId, String name);

    boolean existsByUserIdAndNameIgnoreCaseAndIdNot(UUID userId, String name, UUID id);

    @Query("""
            select count(t) > 0 from Transaction t where t.creditCard.id = :cardId
            """)
    boolean hasTransactions(@Param("cardId") UUID cardId);

    @Query("""
            select count(r) > 0 from RecurringTransaction r where r.creditCard.id = :cardId
            """)
    boolean hasRecurring(@Param("cardId") UUID cardId);

    /** Total das compras em faturas ainda não pagas (consome o limite). */
    @Query("""
            select coalesce(sum(t.amount), 0)
              from Transaction t
             where t.creditCard.id = :cardId
               and not exists (select p.id from InvoicePayment p
                                where p.creditCard.id = :cardId
                                  and p.invoiceMonth = t.invoiceMonth)
            """)
    BigDecimal sumUnpaid(@Param("cardId") UUID cardId);
}
