// Простой контроллер прокрутки с Lenis
document.addEventListener('DOMContentLoaded', function() {
  if (typeof Lenis !== 'undefined') {
    const lenis = new Lenis({
      duration: 1.9, // медленнее общий скролл
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 0.75,
      smoothTouch: true,
      touchMultiplier: 1.6,
      infinite: false,
    });

    // Экспортируем Lenis глобально для управления скроллом из других модулей
    window.lenis = lenis;
    window.lockScroll = function lockScroll() {
      try { window.lenis && window.lenis.stop(); } catch (_) {}
    };
    window.unlockScroll = function unlockScroll() {
      try { window.lenis && window.lenis.start(); } catch (_) {}
    };

    // Синхронизация с GSAP ScrollTrigger
    if (typeof ScrollTrigger !== 'undefined') {
      lenis.on('scroll', ScrollTrigger.update);
    }

    // Синхронизация с GSAP ticker
    if (typeof gsap !== 'undefined') {
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }
  }
});
