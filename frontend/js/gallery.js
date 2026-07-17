const G3D_API = "http://localhost:8080/api";

function g3dBrl(v) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function g3dLoad() {
  const stage = document.getElementById("g3dStage");
  try {
    const res = await fetch(`${G3D_API}/products`);
    if (!res.ok) throw new Error();
    const products = await res.json();
    if (!products.length) {
      stage.innerHTML = `<p class="g3d-loading">Nenhum produto cadastrado ainda.</p>`;
      return;
    }
    g3dBuild(products);
  } catch {
    stage.innerHTML = `<p class="g3d-loading">Não foi possível conectar à API (${G3D_API}). O backend está rodando?</p>`;
  }
}

function g3dBuild(products) {
  const wrap = document.getElementById("g3dWrap");
  const stage = document.getElementById("g3dStage");
  const progressBar = document.getElementById("g3dProgressBar");
  const n = products.length;

  const cardWidth = window.innerWidth <= 760 ? 190 : 260;
  const radius = Math.max(320, (cardWidth / 2) / Math.tan(Math.PI / n) * 1.4);

  stage.innerHTML = products
    .map(
      (p, i) => `
    <a class="g3d-card" href="product.html?id=${p.id}" data-angle="${(360 / n) * i}" data-price="${p.price}">
      <img src="${p.imageUrl}" alt="${p.name}" loading="lazy" />
      <div class="g3d-info">
        <span class="g3d-cat">${p.category}</span>
        <h3>${p.name}</h3>
        <span class="g3d-price">${g3dBrl(p.price)}</span>
      </div>
    </a>`
    )
    .join("");

  const cards = Array.from(stage.querySelectorAll(".g3d-card"));

  // Clique no card centralizado adiciona ao carrinho em vez de navegar,
  // mantendo o clique normal (navegar) para os cards fora do centro.
  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      if (card.dataset.centered !== "true") {
        e.preventDefault();
      }
    });
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    wrap.style.height = "auto";
    return;
  }

  function setHeight() {
    wrap.style.height = `${Math.round(window.innerHeight + n * window.innerHeight * 0.55)}px`;
  }
  setHeight();

  let ticking = false;

  function update() {
    const rect = wrap.getBoundingClientRect();
    const total = wrap.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
    const progress = total > 0 ? scrolled / total : 0;
    const stageAngle = progress * 360;

    let closestDiff = 999;
    let closestCard = null;

    cards.forEach((card) => {
      const cardAngle = parseFloat(card.dataset.angle);
      let diff = ((cardAngle - stageAngle) % 360 + 540) % 360 - 180;
      const absDiff = Math.abs(diff);
      const scale = Math.max(0.55, 1 - (absDiff / 180) * 0.6);
      const opacity = Math.max(0.2, 1 - (absDiff / 180) * 0.95);
      const blur = Math.min(4, (absDiff / 180) * 5);
      const gray = Math.min(85, (absDiff / 180) * 90);

      card.style.transform = `translate(-50%, -50%) rotateY(${cardAngle}deg) translateZ(${radius}px) scale(${scale})`;
      card.style.opacity = String(opacity);
      card.style.filter = `grayscale(${gray}%) blur(${blur}px)`;
      card.style.zIndex = String(1000 - Math.round(absDiff));
      card.dataset.centered = absDiff < 12 ? "true" : "false";

      if (absDiff < closestDiff) {
        closestDiff = absDiff;
        closestCard = card;
      }
    });

    stage.style.transform = `rotateY(${-stageAngle}deg)`;
    if (progressBar) progressBar.style.width = `${progress * 100}%`;

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    setHeight();
    update();
  });

  update();
}

g3dLoad();

/* renderCart() e o comportamento do drawer já vêm de app.js,
   que é carregado antes deste arquivo em gallery.html */
if (typeof renderCart === "function") renderCart();