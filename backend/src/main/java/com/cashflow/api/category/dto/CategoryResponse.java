package com.cashflow.api.category.dto;

import com.cashflow.api.category.Category;
import com.cashflow.api.common.domain.TransactionType;

import java.util.UUID;

public record CategoryResponse(UUID id, String name, TransactionType type, String color, String icon) {

    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(), category.getName(), category.getType(), category.getColor(), category.getIcon());
    }
}
