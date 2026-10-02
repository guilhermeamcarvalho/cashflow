package com.cashflow.api.category;

import com.cashflow.api.common.domain.TransactionType;

import java.util.List;

import static com.cashflow.api.common.domain.TransactionType.EXPENSE;
import static com.cashflow.api.common.domain.TransactionType.INCOME;

/**
 * Categorias criadas automaticamente no cadastro de um usuário.
 * Os ícones são nomes do conjunto <a href="https://lucide.dev">Lucide</a>,
 * mapeados no front-end.
 */
final class DefaultCategories {

    record Template(String name, TransactionType type, String color, String icon) {
    }

    static final List<Template> ALL = List.of(
            new Template("Moradia", EXPENSE, "#6366F1", "home"),
            new Template("Alimentação", EXPENSE, "#F97316", "utensils"),
            new Template("Transporte", EXPENSE, "#0EA5E9", "car"),
            new Template("Saúde", EXPENSE, "#10B981", "heart-pulse"),
            new Template("Lazer", EXPENSE, "#EC4899", "party-popper"),
            new Template("Educação", EXPENSE, "#8B5CF6", "graduation-cap"),
            new Template("Compras", EXPENSE, "#F59E0B", "shopping-bag"),
            new Template("Contas", EXPENSE, "#EF4444", "receipt"),
            new Template("Outros", EXPENSE, "#64748B", "ellipsis"),
            new Template("Salário", INCOME, "#22C55E", "wallet"),
            new Template("Freelance", INCOME, "#14B8A6", "briefcase"),
            new Template("Investimentos", INCOME, "#3B82F6", "trending-up"),
            new Template("Outras receitas", INCOME, "#84CC16", "circle-plus")
    );

    private DefaultCategories() {
    }
}
