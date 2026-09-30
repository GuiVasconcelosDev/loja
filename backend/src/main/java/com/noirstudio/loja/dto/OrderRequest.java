package com.noirstudio.loja.dto;


import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public record OrderRequest(
        @NotBlank @Size(max = 120) String customerName,
        @NotBlank @Email @Size(max = 254) String customerEmail,
        @NotBlank @Size(max = 500) String address,
        @NotEmpty @Size(max = 50) @Valid List<Item> items
) {
    public record Item(
            @NotNull Long productId,
            @NotNull @Min(1) @Max(100) Integer quantity
    ) {}
}
