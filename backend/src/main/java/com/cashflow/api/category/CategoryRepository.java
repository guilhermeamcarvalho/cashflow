package com.cashflow.api.category;

import com.cashflow.api.common.domain.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findAllByUserIdOrderByNameAsc(UUID userId);

    List<Category> findAllByUserIdAndTypeOrderByNameAsc(UUID userId, TransactionType type);

    Optional<Category> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndTypeAndNameIgnoreCase(UUID userId, TransactionType type, String name);

    boolean existsByUserIdAndTypeAndNameIgnoreCaseAndIdNot(UUID userId, TransactionType type, String name, UUID id);

    @Query("select count(t) > 0 from Transaction t where t.category.id = :categoryId")
    boolean isInUse(@Param("categoryId") UUID categoryId);

    @Query("select count(r) > 0 from RecurringTransaction r where r.category.id = :categoryId")
    boolean hasRecurring(@Param("categoryId") UUID categoryId);
}
