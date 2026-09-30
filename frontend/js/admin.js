const API = window.NOIR_API_BASE || `${location.protocol}//${location.hostname}:8080/api`;

const loginView = document.getElementById("loginView");
const panelView = document.getElementById("panelView");
const loginMsg = document.getElementById("loginMsg");
const panelMsg = document.getElementById("panelMsg");
const productRows = document.getElementById("productRows");
const orderRows = document.getElementById("orderRows");
const saveBtn = document.getElementById("saveBtn");
const cancelEdit = document.getElementById("cancelEdit");

const brl = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character]);

async function csrfToken() {
  const res = await fetch(`${API}/auth/csrf`, { credentials: "include" });
  if (!res.ok) throw new Error("Falha ao iniciar a proteção da sessão.");
  return (await res.json()).token;
}

const mutationHeaders = async () => ({
  "Content-Type": "application/json",
  "X-XSRF-TOKEN": await csrfToken(),
});

/* ---------- AUTH ---------- */
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  loginMsg.textContent = "Autenticando…";
  try {
    const csrf = await csrfToken();
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", "X-XSRF-TOKEN": csrf },
      body: JSON.stringify({
        username: document.getElementById("lUser").value,
        password: document.getElementById("lPass").value,
      }),
    });
    if (res.status === 429) throw new Error("Muitas tentativas. Aguarde antes de tentar novamente.");
    if (!res.ok) throw new Error("Usuário ou senha inválidos");
    showPanel();
  } catch (err) {
    loginMsg.textContent = err.message;
  }
});

document.getElementById("logoutBtn").addEventListener("click", async (e) => {
  const logoutButton = e.currentTarget;
  logoutButton.disabled = true;
  try {
    const res = await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "X-XSRF-TOKEN": await csrfToken() },
    });
    if (!res.ok) throw new Error();
    panelView.hidden = true;
    loginView.hidden = false;
  } catch {
    panelMsg.textContent = "Não foi possível encerrar a sessão.";
  } finally {
    logoutButton.disabled = false;
  }
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
      <td>${escapeHtml(p.id)}</td>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category)}</td>
      <td>${escapeHtml(brl(p.price))}</td>
      <td>${escapeHtml(p.stock)}</td>
      <td>${p.featured ? "★" : "—"}</td>
      <td>
        <button data-edit="${escapeHtml(p.id)}">Editar</button>
        <button data-del="${escapeHtml(p.id)}">Excluir</button>
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
        credentials: "include",
        headers: { "X-XSRF-TOKEN": await csrfToken() },
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
        credentials: "include",
        headers: await mutationHeaders(),
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
      await fetch(`${API}/products/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: await mutationHeaders(),
      })
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
    const res = await guard(await fetch(`${API}/orders`, { credentials: "include" }));
    const orders = await res.json();
    const rows = orders.map((order) => {
      const row = document.createElement("tr");
      const values = [
        order.id,
        order.customerName,
        order.customerEmail,
        order.items.map((item) => `${item.quantity}× ${item.productName}`).join(", "),
        brl(order.total),
        new Date(order.createdAt).toLocaleString("pt-BR"),
      ];
      values.forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = String(value ?? "");
        row.append(cell);
      });
      return row;
    });

    if (rows.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 6;
      cell.style.color = "#8a8a90";
      cell.textContent = "Nenhum pedido ainda.";
      row.append(cell);
      rows.push(row);
    }
    orderRows.replaceChildren(...rows);
  } catch { /* guard já tratou */ }
}

/* ---------- INIT ---------- */
async function restoreSession() {
  try {
    const res = await fetch(`${API}/orders`, { credentials: "include" });
    if (res.ok) showPanel();
  } catch { /* mantém a tela de login */ }
}

restoreSession();