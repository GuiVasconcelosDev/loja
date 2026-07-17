package com.noirstudio.loja.repository;

import com.noirstudio.loja.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}
