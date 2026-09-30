# NOIR® — Performance Apparel

E-commerce full-stack de uma marca de streetwear/technical apparel fictícia, com loja, galeria 3D de produtos e painel administrativo. Backend em **Spring Boot** servindo uma API REST, consumida por um frontend em **HTML, CSS e JavaScript puro**.

> Projeto pessoal de portfólio, focado em praticar arquitetura backend com Spring (JWT, Spring Security, JPA) integrada a um frontend customizado sem frameworks.

---

## ✨ Funcionalidades

- **Catálogo de produtos** com filtro por categoria (`OUTERWEAR`, `TOPS`, `BOTTOMS`, `ACCESSORIES`) e busca
- **Página de produto** individual
- **Galeria 3D** dos produtos em destaque (anel giratório em CSS)
- **Carrinho de compras** persistido em `localStorage`
- **Checkout** que gera um pedido via API (sem gateway de pagamento)
- **Painel admin** protegido por login: CRUD de produtos e listagem de pedidos
- **Autenticação JWT** com rota pública de login e rotas protegidas por papel (`ROLE_ADMIN`)
- **Seed automático** do banco com produtos de exemplo e usuário admin na primeira execução

---

## 🧱 Stack

**Backend**
- Java 25
- Spring Boot 4.1 (Web MVC, Data JPA, Security, Validation)
- Banco H2 em memória (console administrativo desabilitado)
- JJWT (`io.jsonwebtoken`) para geração/validação de tokens
- Lombok

**Frontend**
- HTML, CSS e JavaScript vanilla (sem build step, sem frameworks)
- `fetch` para consumir a API REST
- CSS puro para efeitos visuais e a galeria 3D

---

## 📂 Estrutura do projeto

```
loja/
├── backend/
│   ├── pom.xml
│   └── src/main/java/com/noirstudio/loja/
│       ├── LojaApplication.java
│       ├── config/DataSeeder.java        # popula produtos + admin no start
│       ├── controller/                   # AuthController, ProductController, OrderController
│       ├── dto/                          # requests/responses
│       ├── model/                        # Product, Category, Order, OrderItem, AppUser
│       ├── repository/                   # Spring Data JPA
│       ├── security/                     # JWT + SecurityConfig
│       └── service/                      # ProductService, OrderService
│
└── frontend/
    ├── index.html      # vitrine / catálogo
    ├── product.html    # detalhe do produto
    ├── gallery.html     # galeria 3D
    ├── admin.html      # login + CRUD de produtos + pedidos
    ├── css/
    └── js/
```

---

## ▶️ Como rodar

### Pré-requisitos
- JDK 25+
- Maven
- Um servidor estático simples para o frontend (ex.: extensão *Live Server* do VS Code) — o frontend não tem build

### 1. Backend

```bash
cd backend

# segredos obrigatórios; gere valores novos para cada ambiente
export APP_JWT_SECRET="$(openssl rand -base64 48)"
export APP_ADMIN_PASSWORD="$(openssl rand -base64 24)"

mvn spring-boot:run
```

A API sobe em `http://localhost:8080`. O H2 em memória é recriado a cada start e populado automaticamente com produtos de exemplo e o usuário `admin`.

O console web do H2 não é incluído nem exposto pela aplicação.

### 2. Frontend

O frontend espera a API em `http://localhost:8080/api` (constante `API` no topo de cada arquivo JS). Sirva a pasta `frontend/` com qualquer servidor estático, por exemplo:

```bash
cd frontend
npx serve -l 5500
# ou abra com a extensão Live Server do VS Code na porta 5500
```

O CORS do backend já libera `http://localhost:5500`, `http://127.0.0.1:5500` e `http://localhost:3000` — ajuste em `SecurityConfig` caso use outra porta.

Acesse:
- `index.html` — loja
- `gallery.html` — galeria 3D
- `admin.html` — login com `admin` / senha definida em `APP_ADMIN_PASSWORD`

---

## 🔐 Autenticação e permissões

| Rota                     | Acesso        |
|---------------------------|---------------|
| `POST /api/auth/**`       | Público       |
| `GET /api/products/**`    | Público       |
| `POST /api/orders`        | Público       |
| Demais rotas (CRUD admin, listagem de pedidos) | `ROLE_ADMIN` (JWT) |

O login (`POST /api/auth/login`) retorna um token JWT que deve ser enviado no header `Authorization` nas rotas administrativas.

---

## 🔧 Variáveis de ambiente

| Variável                 | Descrição                              | Padrão |
|---------------------------|-----------------------------------------|--------|
| `APP_JWT_SECRET`          | Chave JWT; obrigatória, use valor aleatório com pelo menos 32 bytes | Sem padrão |
| `APP_JWT_EXPIRATION_MS`   | Validade do token em ms                | `86400000` (24h) |
| `APP_ADMIN_PASSWORD`      | Senha inicial do admin; obrigatória e com pelo menos 12 caracteres | Sem padrão |

> Não reutilize segredos entre ambientes. A aplicação não inicia sem a chave JWT e a senha administrativa configuradas.

---

## 🗺️ Possíveis próximos passos

- Trocar H2 por um banco persistente (PostgreSQL/MySQL) em produção
- Testes de integração para os controllers
- Deploy do backend e hospedagem do frontend estático

---

## 👤 Autor

Desenvolvido por **Guilherme Vasconcelos** ([@GuiVasconcelosDev](https://github.com/GuiVasconcelosDev)).