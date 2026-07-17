package com.noirstudio.loja.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record OrderResponse(Long id, BigDecimal total, Instant createdAt) {
}
