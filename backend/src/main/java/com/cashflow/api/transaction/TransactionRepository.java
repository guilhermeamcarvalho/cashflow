package com.cashflow.api.transaction;

import com.cashflow.api.common.domain.TransactionType;
import com.cashflow.api.transaction.TransactionAggregates.CategoryTotal;
import com.cashflow.api.transaction.TransactionAggregates.DayTypeTotal;
import com.cashflow.api.transaction.TransactionAggregates.MonthTotal;
import com.cashflow.api.transaction.TransactionAggregates.TypeTotal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID>, JpaSpecificationExecutor<Transaction> {

    /** Listagem paginada já trazendo a categoria (evita N+1). */
    @Override
    @EntityGraph(attributePaths = {"category", "creditCard"})
    Page<Transaction> findAll(Specification<Transaction> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"category", "creditCard"})
    Optional<Transaction> findByIdAndUserId(UUID id, UUID userId);

    List<Transaction> findAllByUserIdAndInstallmentGroupId(UUID userId, UUID installmentGroupId);

    /** Compras de uma fatura (mês de vencimento, 1º dia). */
    @EntityGraph(attributePaths = {"category", "creditCard"})
    List<Transaction> findAllByCreditCardIdAndInvoiceMonthOrderByOccurredOnDescCreatedAtDesc(
            UUID creditCardId, LocalDate invoiceMonth);

    @Query("""
            select coalesce(sum(t.amount), 0)
              from Transaction t
             where t.creditCard.id = :cardId
               and t.invoiceMonth = :invoiceMonth
            """)
    BigDecimal sumInvoice(@Param("cardId") UUID cardId, @Param("invoiceMonth") LocalDate invoiceMonth);

    @EntityGraph(attributePaths = {"category", "creditCard"})
    List<Transaction> findTop5ByUserIdAndOccurredOnBetweenOrderByOccurredOnDescCreatedAtDesc(
            UUID userId, LocalDate start, LocalDate end);

    @Query("""
            select t.type as type, sum(t.amount) as total
              from Transaction t
             where t.user.id = :userId
               and t.occurredOn between :start and :end
             group by t.type
            """)
    List<TypeTotal> sumByType(@Param("userId") UUID userId,
                              @Param("start") LocalDate start,
                              @Param("end") LocalDate end);

    @Query("""
            select c.id as categoryId, c.name as name, c.color as color, c.icon as icon,
                   sum(t.amount) as total, count(t) as count
              from Transaction t
              join t.category c
             where t.user.id = :userId
               and t.type = :type
               and t.occurredOn between :start and :end
             group by c.id, c.name, c.color, c.icon
             order by sum(t.amount) desc
            """)
    List<CategoryTotal> sumByCategory(@Param("userId") UUID userId,
                                      @Param("type") TransactionType type,
                                      @Param("start") LocalDate start,
                                      @Param("end") LocalDate end);


    @Query("""
            select year(t.occurredOn) as refYear, month(t.occurredOn) as refMonth, t.type as type,
                   sum(t.amount) as total
              from Transaction t
             where t.user.id = :userId
               and t.occurredOn between :start and :end
             group by year(t.occurredOn), month(t.occurredOn), t.type
            """)
    List<MonthTotal> sumByMonth(@Param("userId") UUID userId,
                                @Param("start") LocalDate start,
                                @Param("end") LocalDate end);

    @Query("""
            select year(t.occurredOn) as refYear, month(t.occurredOn) as refMonth, t.type as type,
                   sum(t.amount) as total
              from Transaction t
             where t.user.id = :userId
               and t.category.id = :categoryId
               and t.occurredOn between :start and :end
             group by year(t.occurredOn), month(t.occurredOn), t.type
            """)
    List<MonthTotal> sumByMonthAndCategory(@Param("userId") UUID userId,
                                           @Param("categoryId") UUID categoryId,
                                           @Param("start") LocalDate start,
                                           @Param("end") LocalDate end);

    @Query("""
            select t.occurredOn as date, t.type as type, sum(t.amount) as total
              from Transaction t
             where t.user.id = :userId
               and t.occurredOn between :start and :end
             group by t.occurredOn, t.type
            """)
    List<DayTypeTotal> sumByDayAndType(@Param("userId") UUID userId,
                                       @Param("start") LocalDate start,
                                       @Param("end") LocalDate end);

    @Query("""
            select t.occurredOn as date, t.type as type, sum(t.amount) as total
              from Transaction t
             where t.user.id = :userId
               and t.category.id = :categoryId
               and t.occurredOn between :start and :end
             group by t.occurredOn, t.type
            """)
    List<DayTypeTotal> sumByDayAndTypeForCategory(@Param("userId") UUID userId,
                                                  @Param("categoryId") UUID categoryId,
                                                  @Param("start") LocalDate start,
                                                  @Param("end") LocalDate end);
}
