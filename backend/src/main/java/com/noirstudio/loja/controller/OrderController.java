package com.noirstudio.loja.controller;

import com.noirstudio.loja.dto.AdminOrderResponse;
import com.noirstudio.loja.dto.OrderRequest;
import com.noirstudio.loja.dto.OrderResponse;
import com.noirstudio.loja.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@Valid @RequestBody OrderRequest request) {

        return service.create(request);
    }

    @GetMapping
    public List<AdminOrderResponse> list() {
        return service.findAll();
    }
}
