/**
 * Blog Page Main
 * Точка входа для страницы блога
 * Модульная архитектура аналогичная main.js
 */

import { waitForLibrary } from './core/utils.js';

// Состояние Lenis для доступа из других модулей
let lenisInstance = null;

/**
 * Получить экземпляр Lenis
 */
export function getLenis() {
  return lenisInstance;
}

/**
 * Инициализация страницы
 */
async function init() {
  try {
    // Ждем загрузки DOM
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    // Этап 1: Инициализируем прелоадер
    try {
      const { initPagePreloader } = await import('./modules/services-page/page-preloader.js');
      initPagePreloader();
    } catch (error) {
      console.warn('Page preloader not available');
    }

    // Этап 2: Инициализируем компоненты блога
    try {
      const { initBlogPage } = await import('./modules/blog-page/index.js');
      await initBlogPage();
      console.log('✅ Blog page modules loaded');
    } catch (error) {
      console.error('Blog page modules error:', error);
    }

    // Этап 3: Инициализируем Lenis для плавного скролла
    try {
      await waitForLibrary('Lenis', 5000);
      
      lenisInstance = new window.Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
      });

      function raf(time) {
        lenisInstance.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
      
      console.log('✅ Lenis smooth scroll initialized');
    } catch (error) {
      console.warn('Lenis not available, using native scroll');
    }

    // Этап 4: Ждем GSAP для header анимаций
    try {
      await waitForLibrary('gsap', 5000);
      if (window.gsap && window.ScrollTrigger) {
        window.gsap.registerPlugin(window.ScrollTrigger);
      }
    } catch (error) {
      console.warn('GSAP not available');
    }

    // Этап 5: Инициализируем меню header
    try {
      const { initHeaderMenu } = await import('./modules/header/index.js');
      initHeaderMenu();
      
      // Интеграция с Lenis
      setupMenuLenisIntegration();
      
      console.log('✅ Header menu initialized');
    } catch (error) {
      initSimpleMenu();
      console.warn('Header module not available, using simple menu');
    }

    // Этап 6: Инициализация мобильной подсказки
    initMobileHint();

    // Этап 7: Инициализация ScrollFlow для эффекта раскрытия футера
    try {
      const { initScrollFlow } = await import('./modules/scroll/flow.js');
      initScrollFlow();
      console.log('✅ ScrollFlow initialized');
    } catch (error) {
      console.warn('ScrollFlow not available:', error);
    }

    // Этап 8: Инициализация формы контактов
    try {
      const { initContactForm } = await import('./modules/contacts/index.js');
      initContactForm();
      console.log('✅ Contact form initialized');
    } catch (error) {
      console.warn('Contact form not available:', error);
    }

    console.log('✅ All blog page modules loaded');

  } catch (error) {
    console.error('Blog page initialization error:', error);
  }
}

/**
 * Интеграция меню с Lenis
 */
function setupMenuLenisIntegration() {
  const menu = document.querySelector('.navc-menu');
  
  if (!menu || !lenisInstance) return;
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        if (menu.classList.contains('active')) {
          lenisInstance.stop();
        } else {
          lenisInstance.start();
        }
      }
    });
  });
  
  observer.observe(menu, { attributes: true });
}

/**
 * Простая инициализация меню (fallback)
 */
function initSimpleMenu() {
  const burger = document.querySelector('.navc-burger');
  const menu = document.querySelector('.navc-menu');
  
  if (!burger || !menu) return;
  
  burger.addEventListener('click', () => {
    const isActive = burger.classList.toggle('active');
    menu.classList.toggle('active');
    document.body.classList.toggle('lock-scroll');
    
    if (lenisInstance) {
      isActive ? lenisInstance.stop() : lenisInstance.start();
    }
  });

  document.querySelectorAll('.navc-links a').forEach(link => {
    link.addEventListener('click', () => {
      burger.classList.remove('active');
      menu.classList.remove('active');
      document.body.classList.remove('lock-scroll');
      
      if (lenisInstance) {
        lenisInstance.start();
      }
    });
  });
}

/**
 * Инициализация мобильной подсказки
 */
function initMobileHint() {
  const hint = document.getElementById('mobileHint');
  if (!hint) return;

  let hasScrolled = false;
  
  const hideHint = () => {
    if (!hasScrolled) {
      hasScrolled = true;
      hint.classList.add('hidden');
      
      setTimeout(() => {
        hint.remove();
      }, 300);
    }
  };

  window.addEventListener('scroll', hideHint, { passive: true, once: true });
  window.addEventListener('touchstart', hideHint, { passive: true, once: true });
  
  setTimeout(() => {
    hideHint();
  }, 5000);
}

// Запускаем инициализацию
init();
