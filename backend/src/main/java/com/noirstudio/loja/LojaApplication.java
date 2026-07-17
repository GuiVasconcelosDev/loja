package com.noirstudio.loja;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class LojaApplication {

	static void main(String[] args) {
		SpringApplication.run(LojaApplication.class, args);
		System.out.println("****** Backend rodando... ******");
	}

}
