package com.noirstudio.loja.service;

import com.noirstudio.loja.dto.ProductRequest;
import com.noirstudio.loja.model.Category;
import com.noirstudio.loja.model.Product;
import com.noirstudio.loja.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository repository;

    public List<Product> findAll(String category, String search) {
        if (search != null && !search.isBlank()) {
            return repository.findByNameContainingIgnoreCase(search.trim());
        }
        if (category != null && !category.isBlank()) {
            try {
                return repository.findByCategory(Category.valueOf(category.toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Categoria inválida: " + category);
            }
        }
        return repository.findAll();
    }

    public List<Product> findFeatured() {
        return repository.findByFeaturedTrue();
    }

    public Product findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Produto não encontrado"));
    }

    public Product create(ProductRequest req) {
        return repository.save(apply(new Product(), req));
    }

    public Product update(Long id, ProductRequest req) {
        Product product = findById(id);
        return repository.save(apply(product, req));
    }

    public void delete(Long id) {
        repository.delete(findById(id));
    }

    private Product apply(Product p, ProductRequest req) {
        p.setName(req.name());
        p.setDescription(req.description());
        p.setPrice(req.price());
        p.setCategory(req.category());
        p.setImageUrl(req.imageUrl());
        p.setStock(req.stock());
        p.setFeatured(req.featured());
        return p;
    }
}
