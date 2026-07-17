package com.noirstudio.loja.service;

import com.noirstudio.loja.dto.AdminOrderResponse;
import com.noirstudio.loja.dto.OrderRequest;
import com.noirstudio.loja.dto.OrderResponse;
import com.noirstudio.loja.model.Order;
import com.noirstudio.loja.model.OrderItem;
import com.noirstudio.loja.model.Product;
import com.noirstudio.loja.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductService productService;

    @Transactional
    public OrderResponse create(OrderRequest request) {
        Order order = Order.builder()
                .customerName(request.customerName())
                .customerEmail(request.customerEmail())
                .address(request.address())
                .total(BigDecimal.ZERO)
                .build();

        BigDecimal total = BigDecimal.ZERO;

        for (OrderRequest.Item item : request.items()) {
            Product product = productService.findById(item.productId());

            if (product.getStock() < item.quantity()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Sem estoque suficiente para: " + product.getName());
            }
            product.setStock(product.getStock() - item.quantity());

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(item.quantity())
                    .unitPrice(product.getPrice())
                    .build();

            order.getItems().add(orderItem);
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(item.quantity())));
        }

        order.setTotal(total);
        Order saved = orderRepository.save(order);
        return new OrderResponse(saved.getId(), saved.getTotal(), saved.getCreatedAt());
    }

    @Transactional(readOnly = true)
    public List<AdminOrderResponse> findAll() {
        return orderRepository.findAll().stream()
                .map(o -> new AdminOrderResponse(
                        o.getId(), o.getCustomerName(), o.getCustomerEmail(),
                        o.getAddress(), o.getTotal(), o.getCreatedAt(),
                        o.getItems().stream()
                                .map(i -> new AdminOrderResponse.Item(
                                        i.getProduct().getName(), i.getQuantity(), i.getUnitPrice()))
                                .toList()))
                .toList();
    }
}