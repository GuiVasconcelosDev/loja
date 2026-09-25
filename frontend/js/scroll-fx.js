/* ---------- HERO 3D SCROLL ---------- */

const heroImg = document.querySelector(".hero__img");
const heroBottom = document.querySelector(".hero__bottom");
const heroSide = document.querySelector(".hero__side");
const hero = document.querySelector(".hero");

let heroTicking = false;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function updateHeroTilt() {
  if (!hero) {
    heroTicking = false;
    return;
  }

  const heroRect = hero.getBoundingClientRect();
  const heroHeight = hero.offsetHeight || window.innerHeight;

  /*
   * Calcula o progresso somente dentro da hero.
   * O valor sempre permanece entre 0 e 1.
   */
  const progress = clamp(-heroRect.top / heroHeight, 0, 1);

  if (heroImg) {
    const rotateX = progress * 25;
    const scale = 1 - progress * 0.12;
    const translateZ = progress * -150;

    heroImg.style.transform = `
      perspective(1200px)
      rotateX(${rotateX}deg)
      scale(${scale})
      translateZ(${translateZ}px)
    `;
  }

  if (heroBottom) {
    heroBottom.style.transform = `
      translateY(${progress * -40}px)
      translateZ(${progress * 60}px)
    `;

    // Permanece visível durante toda a rolagem
    heroBottom.style.opacity = "1";
  }

  if (heroSide) {
    heroSide.style.transform = `
      translateY(${progress * -60}px)
    `;

    // Permanece visível durante toda a rolagem
    heroSide.style.opacity = "1";
  }

  heroTicking = false;
}

function requestHeroUpdate() {
  if (heroTicking) return;

  heroTicking = true;
  requestAnimationFrame(updateHeroTilt);
}

window.addEventListener("scroll", requestHeroUpdate, {
  passive: true,
});

window.addEventListener("resize", requestHeroUpdate);

updateHeroTilt();

/* ---------- REVEAL DOS CARDS E MANIFESTO ---------- */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("in-view");

      /*
       * Para de observar após a primeira entrada.
       * Dessa forma, a classe nunca é removida.
       */
      revealObserver.unobserve(entry.target);
    });
  },
  {
    threshold: 0.15,
    rootMargin: "0px 0px -60px 0px",
  }
);

function observeRevealTargets() {
  document
    .querySelectorAll(".card:not(.in-view)")
    .forEach((element) => {
      revealObserver.observe(element);
    });

  document
    .querySelectorAll(".about p:not(.in-view)")
    .forEach((element) => {
      revealObserver.observe(element);
    });
}

/*
 * Observa produtos inseridos dinamicamente pela API.
 */
const revealMutationObserver = new MutationObserver(() => {
  observeRevealTargets();
});

if (document.body) {
  revealMutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

observeRevealTargets();