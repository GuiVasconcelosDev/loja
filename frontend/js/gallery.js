/* ---------- 3D RING GALLERY ---------- */

const G3D_API = window.NOIR_API_BASE || `${location.protocol}//${location.hostname}:8080/api`;
const g3dEscapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character]);

function g3dBrl(value) {
  const numericValue = Number(value);

  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function g3dClamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

async function g3dLoad() {
  const stage = document.getElementById("g3dStage");

  if (!stage) return;

  try {
    const response = await fetch(`${G3D_API}/products`);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const products = await response.json();

    if (!Array.isArray(products) || products.length === 0) {
      stage.innerHTML = `
        <p class="g3d-loading">
          Nenhum produto cadastrado ainda.
        </p>
      `;

      return;
    }

    g3dBuild(products);
  } catch (error) {
    console.error("Erro ao carregar a galeria:", error);

    stage.innerHTML = `
      <p class="g3d-loading">
        Não foi possível conectar à API (${G3D_API}).
        O backend está rodando?
      </p>
    `;
  }
}

function g3dBuild(products) {
  const wrap = document.getElementById("g3dWrap");
  const stage = document.getElementById("g3dStage");
  const progressBar = document.getElementById(
    "g3dProgressBar"
  );

  if (!wrap || !stage) return;

  const numberOfProducts = products.length;

  stage.innerHTML = products
    .map((product, index) => {
      const angle = (360 / numberOfProducts) * index;

      return `
        <a
          class="g3d-card"
          href="product.html?id=${g3dEscapeHtml(product.id)}"
          data-angle="${g3dEscapeHtml(angle)}"
          data-price="${g3dEscapeHtml(product.price)}"
          data-centered="false"
        >
          <img
            src="${g3dEscapeHtml(product.imageUrl)}"
            alt="${g3dEscapeHtml(product.name)}"
            loading="lazy"
          />

          <div class="g3d-info">
            <span class="g3d-cat">
              ${g3dEscapeHtml(product.category)}
            </span>

            <h3>${g3dEscapeHtml(product.name)}</h3>

            <span class="g3d-price">
              ${g3dBrl(product.price)}
            </span>
          </div>
        </a>
      `;
    })
    .join("");

  const cards = Array.from(
    stage.querySelectorAll(".g3d-card")
  );

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reduceMotion) {
    wrap.style.height = "auto";
    return;
  }

  let radius = calculateRadius();
  let ticking = false;

  function calculateRadius() {
    const cardWidth =
      window.innerWidth <= 760 ? 190 : 260;

    /*
     * Evita cálculo inválido quando existem somente
     * um ou dois produtos.
     */
    const geometryCount = Math.max(numberOfProducts, 3);

    const calculatedRadius =
      (cardWidth / 2) /
      Math.tan(Math.PI / geometryCount) *
      1.4;

    return Math.max(320, calculatedRadius);
  }

  function setHeight() {
    const scrollDistance =
      numberOfProducts * window.innerHeight * 0.55;

    wrap.style.height = `${
      Math.round(window.innerHeight + scrollDistance)
    }px`;
  }

  function updateGallery() {
    const rect = wrap.getBoundingClientRect();
    const total =
      wrap.offsetHeight - window.innerHeight;

    const scrolled = g3dClamp(
      -rect.top,
      0,
      Math.max(total, 1)
    );

    const progress =
      total > 0 ? scrolled / total : 0;

    const stageAngle = progress * 360;

    cards.forEach((card) => {
      const cardAngle = Number(card.dataset.angle);

      const difference =
        ((cardAngle - stageAngle) % 360 + 540) %
          360 -
        180;

      const absoluteDifference = Math.abs(difference);

      /*
       * Os valores mínimos impedem que os cards
       * desapareçam ou fiquem pequenos demais.
       */
      const scale = Math.max(
        0.75,
        1 - (absoluteDifference / 180) * 0.25
      );

      const opacity = Math.max(
        0.65,
        1 - (absoluteDifference / 180) * 0.35
      );

      const blur = Math.min(
        1.5,
        (absoluteDifference / 180) * 1.5
      );

      const grayscale = Math.min(
        45,
        (absoluteDifference / 180) * 45
      );

      /*
       * Mantém o card virado para a câmera enquanto
       * sua posição acompanha o anel 3D.
       */
      const facingCorrection =
        stageAngle - cardAngle;

      card.style.transform = `
        translate(-50%, -50%)
        rotateY(${cardAngle}deg)
        translateZ(${radius}px)
        rotateY(${facingCorrection}deg)
        scale(${scale})
      `;

      card.style.opacity = String(opacity);

      card.style.filter = `
        grayscale(${grayscale}%)
        blur(${blur}px)
      `;

      card.style.zIndex = String(
        1000 - Math.round(absoluteDifference)
      );

      card.dataset.centered =
        absoluteDifference < 12
          ? "true"
          : "false";
    });

    stage.style.transform = `
      rotateY(${-stageAngle}deg)
    `;

    if (progressBar) {
      progressBar.style.width = `${progress * 100}%`;
    }

    ticking = false;
  }

  function requestGalleryUpdate() {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(updateGallery);
  }

  function handleGalleryResize() {
    radius = calculateRadius();
    setHeight();
    requestGalleryUpdate();
  }

  setHeight();
  updateGallery();

  window.addEventListener(
    "scroll",
    requestGalleryUpdate,
    { passive: true }
  );

  window.addEventListener(
    "resize",
    handleGalleryResize
  );
}

g3dLoad();

/*
 * O comportamento do carrinho vem de app.js,
 * carregado antes deste arquivo.
 */
if (typeof renderCart === "function") {
  renderCart();
}