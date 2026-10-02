package com.cashflow.api.transaction;

import com.cashflow.api.transaction.dto.TransactionFilter;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** Monta dinamicamente os filtros da listagem de lançamentos. */
final class TransactionSpecifications {

    private TransactionSpecifications() {
    }

    static Specification<Transaction> matching(UUID userId, TransactionFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("user").get("id"), userId));
            predicates.add(cb.between(root.get("occurredOn"), filter.range().start(), filter.range().end()));

            if (filter.type() != null) {
                predicates.add(cb.equal(root.get("type"), filter.type()));
            }
            if (filter.categoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), filter.categoryId()));
            }
            if (filter.paymentMethod() != null) {
                predicates.add(cb.equal(root.get("paymentMethod"), filter.paymentMethod()));
            }
            if (filter.creditCardId() != null) {
                predicates.add(cb.equal(root.get("creditCard").get("id"), filter.creditCardId()));
            }
            if (filter.search() != null && !filter.search().isBlank()) {
                String pattern = "%" + filter.search().trim().toLowerCase(Locale.ROOT) + "%";
                predicates.add(cb.like(cb.lower(root.get("description")), pattern));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
