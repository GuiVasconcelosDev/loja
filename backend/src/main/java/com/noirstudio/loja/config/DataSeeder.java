package com.noirstudio.loja.config;

import com.noirstudio.loja.model.Category;
import com.noirstudio.loja.model.Product;
import com.noirstudio.loja.repository.ProductRepository;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ProductRepository repository;
    private final com.noirstudio.loja.repository.AppUserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;


    @Value("${APP_ADMIN_PASSWORD}")
    private String adminPassword;

    @Override
    public void run(String...args) {
       
        if(userRepository.count() == 0) {
            if (adminPassword.length() < 12) {
                throw new IllegalStateException("APP_ADMIN_PASSWORD must contain at least 12 characters");
            }
            userRepository.save(com.noirstudio.loja.model.AppUser.builder()
            .username("admin")
            .password(passwordEncoder.encode(adminPassword))
            .role("ADMIN")
            .build());
        }

        if (repository.count() > 0) return;


        repository.save(p("Technical Puffer 01", "Jaqueta técnica oversized em nylon fosco. Costura selada, capuz estruturado.", "899.90", Category.OUTERWEAR, "assets/oculos.png", 12, true));
        repository.save(p("Shell Jacket Mono", "Corta-vento minimalista, preto absoluto, zíper invisível.", "649.90", Category.OUTERWEAR, "assets/jaqueta.png", 20, true));
        repository.save(p("Compression Top", "Top de compressão de manga longa, tecido de alta performance.", "289.90", Category.TOPS, "assets/jaqueta.png", 30, true));
        repository.save(p("Boxy Tee Carbon", "Camiseta boxy em algodão pesado 240g, tingimento carvão.", "179.90", Category.TOPS, "assets/calcas.png", 50, true));
        repository.save(p("Cargo Wide 04", "Calça cargo wide-leg com bolsos 3D, ripstop preto.", "479.90", Category.BOTTOMS, "assets/calcas.png", 18, false));
        repository.save(p("Tailored Jogger", "Jogger alfaiataria com corte reto e barra ajustável.", "389.90", Category.BOTTOMS, "assets/luvas.png", 25, false));
        repository.save(p("Gloves Sculpt", "Luvas esculturais em couro sintético fosco.", "199.90", Category.ACCESSORIES, "assets/luvas.png", 40, false));
        repository.save(p("Utility Belt Bag", "Bolsa utilitária de cintura, fecho magnético.", "259.90", Category.ACCESSORIES, "assets/bolsa.png", 35, false));

    }

    private Product p(String name, String desc, String price, Category cat, String img, int stock, boolean featured) {

       

        return Product.builder()
                .name(name).description(desc)
                .price(new BigDecimal(price))
                .category(cat).imageUrl(img)
                .stock(stock).featured(featured)
                .build();
    }
}
