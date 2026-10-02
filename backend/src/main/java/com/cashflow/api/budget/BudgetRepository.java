package com.cashflow.api.budget;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface BudgetRepository extends JpaRepository<Budget, UUID> {

    @EntityGraph(attributePaths = "category")
    List<Budget> findAllByUserIdAndReferenceMonth(UUID userId, LocalDate referenceMonth);

    Optional<Budget> findByUserIdAndCategoryIdAndReferenceMonth(UUID userId, UUID categoryId, LocalDate referenceMonth);

    Optional<Budget> findByIdAndUserId(UUID id, UUID userId);

    @Query("""
            select b.category.id
              from Budget b
             where b.user.id = :userId
               and b.referenceMonth = :referenceMonth
            """)
    Set<UUID> findBudgetedCategoryIds(@Param("userId") UUID userId, @Param("referenceMonth") LocalDate referenceMonth);

    @Query("""
            select coalesce(sum(b.amount), 0)
              from Budget b
             where b.user.id = :userId
               and b.referenceMonth = :referenceMonth
            """)
    BigDecimal sumByMonth(@Param("userId") UUID userId, @Param("referenceMonth") LocalDate referenceMonth);
}
