/* Efeito de inclinação 3D na hero conforme o scroll */
const heroImg = document.querySelector(".hero__img");
const heroBottom = document.querySelector(".hero__bottom");
const heroSide = document.querySelector(".hero__side");
const hero = document.querySelector(".hero");

let ticking = false;

function updateHeroTilt() {
  if (!hero) { ticking = false; return; }

  const scrollY = window.scrollY;
  const heroHeight = hero.offsetHeight || window.innerHeight;
  const progress = Math.min(scrollY / heroHeight, 1);

  if (heroImg) {
    const rotateX = progress * 25;
    const scale = 1 - progress * 0.12;
    const translateZ = progress * -150;
    heroImg.style.transform = `perspective(1200px) rotateX(${rotateX}deg) scale(${scale}) translateZ(${translateZ}px)`;
  }

  if (heroBottom) {
    heroBottom.style.transform = `translateY(${progress * -40}px) translateZ(${progress * 60}px)`;
    heroBottom.style.opacity = String(1 - progress * 1.3);
  }

  if (heroSide) {
    heroSide.style.transform = `translateY(${progress * -60}px)`;
    heroSide.style.opacity = String(1 - progress * 1.5);
  }

  ticking = false;
}

window.addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(updateHeroTilt);
    ticking = true;
  }
}, { passive: true });

updateHeroTilt();

/* Cards e texto do manifesto giram em 3D ao entrar na tela */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
);

function observeRevealTargets() {
  document.querySelectorAll(".card:not(.in-view)").forEach((el) => revealObserver.observe(el));
  document.querySelectorAll(".about p:not(.in-view)").forEach((el) => revealObserver.observe(el));
}

if (typeof grid !== "undefined" && grid) {
  const gridObserver = new MutationObserver(() => observeRevealTargets());
  gridObserver.observe(grid, { childList: true });
}

observeRevealTargets();