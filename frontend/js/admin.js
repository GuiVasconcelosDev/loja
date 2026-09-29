const API = "http://localhost:8080/api";

const loginView = document.getElementById("loginView");
const panelView = document.getElementById("panelView");
const loginMsg = document.getElementById("loginMsg");
const panelMsg = document.getElementById("panelMsg");
const productRows = document.getElementById("productRows");
const orderRows = document.getElementById("orderRows");
const saveBtn = document.getElementById("saveBtn");
const cancelEdit = document.getElementById("cancelEdit");

const brl = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const token = () => localStorage.getItem("noir_token");
const authHeaders = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token()}` });

/* ---------- AUTH ---------- */
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMsg.textContent = "Autenticando…";
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: document.getElementById("lUser").value,
        password: document.getElementById("lPass").value,
      }),
    });
    if (!res.ok) throw new Error("Usuário ou senha inválidos");
    const data = await res.json();
    localStorage.setItem("noir_token", data.token);
    showPanel();
  } catch (err) {
    loginMsg.textContent = err.message;
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("noir_token");
  panelView.hidden = true;
  loginView.hidden = false;
});

function showPanel() {
  loginView.hidden = true;
  panelView.hidden = false;
  loadProducts();
  loadOrders();
}

/** trata 401/403 globalmente */
async function guard(res) {
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("noir_token");
    panelView.hidden = true;
    loginView.hidden = false;
    loginMsg.textContent = "Sessão expirada. Entre novamente.";
    throw new Error("unauthorized");
  }
  return res;
}

/* ---------- PRODUTOS ---------- */
async function loadProducts() {
  const res = await fetch(`${API}/products`);
  const products = await res.json();
  productRows.innerHTML = products
    .map(
      (p) => `
    <tr>
      <td>${p.id}</td>
      <td>${p.name}</td>
      <td>${p.category}</td>
      <td>${brl(p.price)}</td>
      <td>${p.stock}</td>
      <td>${p.featured ? "★" : "—"}</td>
      <td>
        <button data-edit="${p.id}">Editar</button>
        <button data-del="${p.id}">Excluir</button>
      </td>
    </tr>`
    )
    .join("");

  productRows.querySelectorAll("[data-edit]").forEach((b) =>
    b.addEventListener("click", () => startEdit(products.find((p) => p.id == b.dataset.edit)))
  );
  productRows.querySelectorAll("[data-del]").forEach((b) =>
    b.addEventListener("click", () => deleteProduct(b.dataset.del))
  );
}

function startEdit(p) {
  document.getElementById("pId").value = p.id;
  document.getElementById("pName").value = p.name;
  document.getElementById("pPrice").value = p.price;
  document.getElementById("pCategory").value = p.category;
  document.getElementById("pImage").value = p.imageUrl ?? "";
  document.getElementById("pStock").value = p.stock;
  document.getElementById("pFeatured").checked = p.featured;
  document.getElementById("pDesc").value = p.description ?? "";
  showImagePreview(p.imageUrl);
  saveBtn.textContent = "Salvar alterações";
  cancelEdit.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- UPLOAD DE IMAGEM ---------- */
const pImage = document.getElementById("pImage");
const pImageFile = document.getElementById("pImageFile");
const pImagePreview = document.getElementById("pImagePreview");
const pImageStatus = document.getElementById("pImageStatus");
let uploadingImage = false;

function showImagePreview(url) {
  if (url) {
    pImagePreview.src = url;
    pImagePreview.hidden = false;
  } else {
    pImagePreview.hidden = true;
    pImagePreview.removeAttribute("src");
  }
}

pImageFile.addEventListener("change", async () => {
  const file = pImageFile.files[0];
  if (!file) return;

  uploadingImage = true;
  saveBtn.disabled = true;
  pImageStatus.textContent = "Enviando imagem…";

  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await guard(
      await fetch(`${API}/uploads`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      })
    );
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.message || "Falha ao enviar imagem");
    }
    const data = await res.json();
    pImage.value = data.url;
    showImagePreview(data.url);
    pImageStatus.textContent = "Imagem enviada.";
  } catch (err) {
    if (err.message !== "unauthorized") pImageStatus.textContent = err.message;
  } finally {
    uploadingImage = false;
    saveBtn.disabled = false;
  }
});

cancelEdit.addEventListener("click", resetForm);

function resetForm() {
  document.getElementById("productForm").reset();
  document.getElementById("pId").value = "";
  pImage.value = "";
  pImageStatus.textContent = "";
  showImagePreview(null);
  saveBtn.textContent = "Criar produto";
  cancelEdit.hidden = true;
}

document.getElementById("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (uploadingImage) {
    panelMsg.textContent = "Aguarde o envio da imagem terminar.";
    return;
  }
  const id = document.getElementById("pId").value;
  const body = JSON.stringify({
    name: document.getElementById("pName").value,
    description: document.getElementById("pDesc").value,
    price: Number(document.getElementById("pPrice").value),
    category: document.getElementById("pCategory").value,
    imageUrl: document.getElementById("pImage").value,
    stock: Number(document.getElementById("pStock").value),
    featured: document.getElementById("pFeatured").checked,
  });

  try {
    const res = await guard(
      await fetch(id ? `${API}/products/${id}` : `${API}/products`, {
        method: id ? "PUT" : "POST",
        headers: authHeaders(),
        body,
      })
    );
    if (!res.ok) throw new Error("Erro ao salvar produto");
    panelMsg.textContent = id ? "Produto atualizado." : "Produto criado.";
    resetForm();
    loadProducts();
  } catch (err) {
    if (err.message !== "unauthorized") panelMsg.textContent = err.message;
  }
});

async function deleteProduct(id) {
  if (!confirm(`Excluir produto #${id}?`)) return;
  try {
    const res = await guard(
      await fetch(`${API}/products/${id}`, { method: "DELETE", headers: authHeaders() })
    );
    if (!res.ok && res.status !== 204) throw new Error("Erro ao excluir");
    panelMsg.textContent = "Produto excluído.";
    loadProducts();
  } catch (err) {
    if (err.message !== "unauthorized") panelMsg.textContent = err.message;
  }
}

/* ---------- PEDIDOS ---------- */
async function loadOrders() {
  try {
    const res = await guard(await fetch(`${API}/orders`, { headers: authHeaders() }));
    const orders = await res.json();
    orderRows.innerHTML = orders.length
      ? orders
          .map(
            (o) => `
      <tr>
        <td>${o.id}</td>
        <td>${o.customerName}</td>
        <td>${o.customerEmail}</td>
        <td>${o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}</td>
        <td>${brl(o.total)}</td>
        <td>${new Date(o.createdAt).toLocaleString("pt-BR")}</td>
      </tr>`
          )
          .join("")
      : `<tr><td colspan="6" style="color:#8a8a90">Nenhum pedido ainda.</td></tr>`;
  } catch { /* guard já tratou */ }
}

/* ---------- INIT ---------- */
if (token()) showPanel();