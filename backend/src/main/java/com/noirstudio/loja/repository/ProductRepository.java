package com.noirstudio.loja.repository;

import com.noirstudio.loja.model.Category;
import com.noirstudio.loja.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategory(Category category);
    List<Product> findByFeaturedTrue();
    List<Product> findByNameContainingIgnoreCase(String name);
}
