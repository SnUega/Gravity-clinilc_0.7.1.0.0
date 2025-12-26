gsap.registerPlugin(ScrollTrigger);

    const cards = gsap.utils.toArray(".card");

    // About timeline controls pin + cards to align build exactly within pin
    const buildDuration = () => Math.max(window.innerHeight * 1.1, 900); // время на сборку
    const pauseAfter = 120; // короткая пауза в пикселях прокрутки
    const timeline = gsap.timeline({
  scrollTrigger: {
    trigger: "#about",
    start: "top top",
    end: () => "+=" + (buildDuration() + pauseAfter),
    scrub: true,
    pin: true,
    pinSpacing: true,
    anticipatePin: 1,
    fastScrollEnd: true
  }
});

const delayBetween = 0.38;
const animationDuration = 0.95;
const holdBeforeReveal = 0.22; // небольшая задержка после фиксации

// пауза перед началом сборки после фиксации
timeline.to({}, { duration: holdBeforeReveal });

cards.forEach((card, i) => {
  const startTime = holdBeforeReveal + i * (animationDuration + delayBetween);

  timeline.fromTo(card, 
    {
      opacity: 0,
      y: i % 2 === 0 ? 140 : -140
    },
    {
      opacity: 1,
      y: 0,
      duration: animationDuration,
      ease: "power3.out"
    },
    startTime
  );
});

    document.querySelectorAll(".card").forEach(card => {
  const openBtn = card.querySelector(".open");
  const closeBtn = card.querySelector(".close");
  const overlay = card.querySelector(".overlay");

  openBtn.addEventListener("click", () => {
    // Обновляем ARIA атрибуты
    openBtn.setAttribute("aria-expanded", "true");
    overlay.setAttribute("aria-hidden", "false");
    overlay.style.pointerEvents = "auto";
    
    gsap.to(overlay, {
      y: "0%",
      opacity: 1,
      duration: 0.6,
      ease: "power2.out"
    });
  });

  closeBtn.addEventListener("click", () => {
    // Обновляем ARIA атрибуты
    openBtn.setAttribute("aria-expanded", "false");
    overlay.setAttribute("aria-hidden", "true");
    
    gsap.to(overlay, {
      y: "100%",
      opacity: 0,
      duration: 0.6,
      ease: "power2.in",
      onComplete: () => {
        overlay.style.pointerEvents = "none";
      }
    });
  });
});