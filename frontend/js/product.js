const pdp = document.getElementById("pdp");
const productId = new URLSearchParams(location.search).get("id");
const productEscapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character]);

(async function loadProduct() {
  if (!productId) { pdp.innerHTML = "<p class='pdp__error'>Produto não informado.</p>"; return; }
  try {
    const res = await fetch(`${API}/products/${productId}`);
    if (!res.ok) throw new Error();
    render(await res.json());
  } catch {
    pdp.innerHTML = "<p class='pdp__error'>Produto não encontrado.</p>";
  }
})();

function render(p) {
  document.title = `NOIR® — ${p.name}`;
  pdp.innerHTML = `
    <div class="pdp__media"><img src="${productEscapeHtml(p.imageUrl)}" alt="${productEscapeHtml(p.name)}" /></div>
    <div class="pdp__info">
      <span class="card__cat">${productEscapeHtml(p.category)}</span>
      <h1>${productEscapeHtml(p.name)}</h1>
      <p class="pdp__price">${brl(p.price)}</p>
      <p class="pdp__desc">${productEscapeHtml(p.description)}</p>
      <p class="pdp__stock">${productEscapeHtml(p.stock > 0 ? p.stock + " em estoque" : "Esgotado")}</p>
      <button class="pdp__add" id="pdpAdd" ${p.stock < 1 ? "disabled" : ""}>
        ${p.stock < 1 ? "Esgotado" : "Adicionar ao carrinho"}
      </button>
      <ul class="pdp__specs">
        <li>Precision engineered</li>
        <li>Tested for durability</li>
        <li>Built for excellence</li>
      </ul>
    </div>`;
  const btn = document.getElementById("pdpAdd");
  if (btn && !btn.disabled) btn.addEventListener("click", () => addToCart(p));
}