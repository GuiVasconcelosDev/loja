const API = window.NOIR_API_BASE || `${location.protocol}//${location.hostname}:8080/api`;

const grid = document.getElementById("productGrid");
const filters = document.getElementById("filters");
const cartDrawer = document.getElementById("cartDrawer");
const backdrop = document.getElementById("backdrop");
const cartItemsEl = document.getElementById("cartItems");
const cartTotalEl = document.getElementById("cartTotal");
const cartCountEl = document.getElementById("cartCount");
const cartMsg = document.getElementById("cartMsg");

let cart = JSON.parse(localStorage.getItem("noir_cart") || "[]");

const brl = (v) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
async function csrfToken() {
  const res = await fetch(`${API}/auth/csrf`, { credentials: "include" });
  if (!res.ok) throw new Error("Falha ao iniciar a proteção do pedido.");
  return (await res.json()).token;
}
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character]);

/* ---------- PRODUTOS ---------- */
async function loadProducts(category = "") {
  if (!grid) return;
  grid.innerHTML = `<p style="color:#8a8a90;font-size:13px">Carregando…</p>`;
  try {
    const url = category ? `${API}/products?category=${category}` : `${API}/products`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    renderProducts(await res.json());
  } catch {
    grid.innerHTML = `<p style="color:#8a8a90;font-size:13px">
      Não foi possível conectar à API (${API}). O backend está rodando?</p>`;
  }
}

function renderProducts(products) {
  if (!grid) return;
  if (!products.length) {
    grid.innerHTML = `<p style="color:#8a8a90;font-size:13px">Nenhum produto.</p>`;
    return;
  }
  grid.innerHTML = products
    .map(
      (p) => `
    <article class="card">
      <a href="product.html?id=${escapeHtml(p.id)}" class="card__link">
        <div class="card__img"><img src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.name)}" loading="lazy" /></div>
      </a>
      <div class="card__body">
        <span class="card__cat">${escapeHtml(p.category)}</span>
        <h3 class="card__name"><a href="product.html?id=${escapeHtml(p.id)}">${escapeHtml(p.name)}</a></h3>
        <p class="card__desc">${escapeHtml(p.description)}</p>
        <div class="card__foot">
          <span class="card__price">${brl(p.price)}</span>
          <button class="card__add" data-id="${escapeHtml(p.id)}" ${p.stock < 1 ? "disabled" : ""}>
            ${p.stock < 1 ? "Esgotado" : "Add +"}
          </button>
        </div>
      </div>
    </article>`
    )
    .join("");

  grid.querySelectorAll(".card__add").forEach((btn) =>
    btn.addEventListener("click", async () => {
      const res = await fetch(`${API}/products/${btn.dataset.id}`);
      addToCart(await res.json());
    })
  );
}

if (filters) {
  filters.addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;
    filters.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");
    loadProducts(e.target.dataset.cat);
  });
}

/* ---------- CARRINHO ---------- */
function addToCart(product) {
  const existing = cart.find((i) => i.id === product.id);
  if (existing) existing.qty += 1;
  else cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
  persist();
  openCart();
}

function changeQty(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter((i) => i.id !== id);
  persist();
}

function persist() {
  localStorage.setItem("noir_cart", JSON.stringify(cart));
  renderCart();
}

function renderCart() {
  if (!cartCountEl) return;
  cartCountEl.textContent = cart.reduce((s, i) => s + i.qty, 0);
  if (!cartItemsEl || !cartTotalEl) return;
  if (!cart.length) {
    cartItemsEl.innerHTML = `<p class="cart__empty">Carrinho vazio.</p>`;
    cartTotalEl.textContent = brl(0);
    return;
  }
  cartItemsEl.innerHTML = cart
    .map(
      (i) => `
    <div class="cart-item">
      <div>
        <div>${escapeHtml(i.name)}</div>
        <div style="color:#8a8a90">${brl(i.price)}</div>
      </div>
      <div class="cart-item__qty">
        <button data-id="${escapeHtml(i.id)}" data-d="-1">−</button>
        <span>${escapeHtml(i.qty)}</span>
        <button data-id="${escapeHtml(i.id)}" data-d="1">+</button>
      </div>
    </div>`
    )
    .join("");

  cartItemsEl.querySelectorAll("button").forEach((b) =>
    b.addEventListener("click", () => changeQty(Number(b.dataset.id), Number(b.dataset.d)))
  );

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  cartTotalEl.textContent = brl(total);
}

/* ---------- CHECKOUT ---------- */
const checkoutForm = document.getElementById("checkoutForm");
if (checkoutForm) {
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!cart.length) {
      cartMsg.textContent = "Adicione itens ao carrinho.";
      return;
    }
    cartMsg.textContent = "Enviando…";
    try {
      const csrf = await csrfToken();
      const res = await fetch(`${API}/orders`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": csrf },
        body: JSON.stringify({
          customerName: document.getElementById("fName").value,
          customerEmail: document.getElementById("fEmail").value,
          address: document.getElementById("fAddress").value,
          items: cart.map((i) => ({ productId: i.id, quantity: i.qty })),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erro no pedido");
      }
      const order = await res.json();
      cart = [];
      persist();
      cartMsg.textContent = `Pedido #${order.id} confirmado — ${brl(order.total)}. Obrigado!`;
      loadProducts();
    } catch (err) {
      cartMsg.textContent = err.message;
    }
  });
}

/* ---------- DRAWER ---------- */
const openCart = () => { cartDrawer?.classList.add("open"); backdrop?.classList.add("show"); };
const closeCart = () => { cartDrawer?.classList.remove("open"); backdrop?.classList.remove("show"); };

const cartToggleBtn = document.getElementById("cartToggle");
const cartCloseBtn = document.getElementById("cartClose");
if (cartToggleBtn) cartToggleBtn.addEventListener("click", openCart);
if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCart);
if (backdrop) backdrop.addEventListener("click", closeCart);

/* ---------- INIT ---------- */
if (grid) loadProducts();
renderCart();