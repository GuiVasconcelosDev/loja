package com.noirstudio.loja.dto;

import com.noirstudio.loja.model.Category;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank String name,
        String description,
        @NotNull @DecimalMin("0.01")BigDecimal price,
        @NotNull Category category,
        String imageUrl,
        @NotNull @Min(0) Integer stock,
        boolean featured
        ) {
}
