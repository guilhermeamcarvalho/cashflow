package com.cashflow.api.recurring;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecurringTransactionRepository extends JpaRepository<RecurringTransaction, UUID> {

    @EntityGraph(attributePaths = "category")
    List<RecurringTransaction> findAllByUserIdOrderByDayOfMonthAscDescriptionAsc(UUID userId);

    @EntityGraph(attributePaths = "category")
    Optional<RecurringTransaction> findByIdAndUserId(UUID id, UUID userId);

    /**
     * Modelos com meses pendentes até {@code month}. O bloqueio de escrita impede
     * que duas requisições simultâneas gerem o mesmo mês duas vezes.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select r
              from RecurringTransaction r
             where r.user.id = :userId
               and r.startMonth <= :month
               and (r.generatedThrough is null or r.generatedThrough < :month)
            """)
    List<RecurringTransaction> findPendingForUpdate(@Param("userId") UUID userId, @Param("month") LocalDate month);
}
