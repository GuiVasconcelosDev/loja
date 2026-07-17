package com.noirstudio.loja.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record AdminOrderResponse(
        Long id, String customerName, String customerEmail,
        String address, BigDecimal total, Instant createdAt,
        List<Item> items
) {
    public record Item(String productName, Integer quantity, BigDecimal unitPrice) {}
}
