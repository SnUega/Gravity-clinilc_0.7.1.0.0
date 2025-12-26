/**
 * Главный файл - точка входа для модульной архитектуры
 * Динамически загружает модули после загрузки DOM
 */

// Импортируем утилиты для использования в модулях
import { waitForLibrary } from './core/utils.js';
import { initErrorHandler } from './core/errors.js';

export { $, $$, debounce, throttle, waitForLibrary, isMobile, isTablet, isDesktop } from './core/utils.js';
export { getComputedStyleValue, setStyles, scrollToElement, createElement } from './core/dom.js';
export { CONFIG } from './core/config.js';
export { DIMENSIONS, TIMING, CLASSES, EVENTS } from './core/constants.js';
export { eventManager, delegate } from './core/events.js';

/**
 * Инициализация модулей
 * Загружает модули после готовности DOM и необходимых библиотек
 */
async function init() {
  // Инициализируем обработчик ошибок ПЕРВЫМ
  const errorHandler = initErrorHandler({
    enableConsoleLog: true,
    enableServerLog: false, // Включим при создании админ-панели
    showToUser: false, // Включим для критических ошибок в продакшене
    environment: window.location.hostname === 'localhost' ? 'development' : 'production'
  });

  try {
    // Ждем загрузки DOM
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      });
    }

    // Ждем загрузки GSAP (если используется)
    const usesGSAP = document.querySelector('[data-uses-gsap]');
    if (usesGSAP) {
      try {
        await waitForLibrary('gsap', 10000);
        if (window.gsap && window.ScrollTrigger) {
          window.gsap.registerPlugin(window.ScrollTrigger);
        }
      } catch (error) {
        errorHandler.handle(error, {
          module: 'main',
          severity: 'medium',
          context: { feature: 'GSAP' },
          userMessage: null
        });
      }
    }

    // Ждем загрузки Lenis (если используется)
    const usesLenis = document.querySelector('[data-uses-lenis]');
    if (usesLenis) {
      try {
        await waitForLibrary('Lenis', 10000);
      } catch (error) {
        errorHandler.handle(error, {
          module: 'main',
          severity: 'low',
          context: { feature: 'Lenis' },
          fallback: () => {
            // Используем обычный скролл
            console.log('Using native scroll instead of Lenis');
          },
          userMessage: null
        });
      }
    }

    // Динамически импортируем модули
    // Этап 2: Простые модули скролла и услуг
    try {
      // Импортируем модули скролла
      const { initScrollController, initCustomScrollbar, initScrollFlow } = await import('./modules/scroll/index.js');
      
      // Инициализируем контроллер скролла (Lenis)
      await initScrollController();
      
      // Инициализируем кастомный скроллбар
      initCustomScrollbar();
      
      // Инициализируем анимацию футера (с улучшенной поддержкой параллакса)
      initScrollFlow();
      
      // Импортируем модули услуг
      const { initServicesParallax } = await import('./modules/services/index.js');
      
      // Инициализируем параллакс эффект
      initServicesParallax();
      
      console.log('✅ Scroll and services modules loaded');
    } catch (error) {
      errorHandler.handle(error, {
        module: 'main',
        severity: 'high',
        context: { stage: 'scroll-and-services' },
        userMessage: null
      });
    }

    // Этап 3: Средние модули
    try {
      // Импортируем прелоадер (уже инициализирован автоматически, но импортируем для доступа)
      await import('./modules/preloader/index.js');
      
      // Импортируем форму контактов
      const { initContactForm } = await import('./modules/contacts/index.js');
      initContactForm();
      
      // Импортируем менеджер карточек (с исправлениями)
      const { initCardsManager } = await import('./modules/cards/index.js');
      initCardsManager();
      
      // Импортируем менеджер блога (с поддержкой админ-панели)
      const { initBlogManager } = await import('./modules/blog/index.js');
      initBlogManager();
      
      // Импортируем менеджер модальных окон
      const { initModalManager } = await import('./modules/modal/index.js');
      initModalManager();
      
      // Импортируем галерею
      const { initGallery } = await import('./modules/gallery/index.js');
      initGallery();
      
      // Импортируем меню хедера
      const { initHeaderMenu } = await import('./modules/header/index.js');
      initHeaderMenu();
      
      // Импортируем ALR интерактивные карточки
      const { initALRInteractive } = await import('./modules/alr/index.js');
      initALRInteractive();
      
      console.log('✅ Medium modules loaded');
    } catch (error) {
      errorHandler.handle(error, {
        module: 'main',
        severity: 'high',
        context: { stage: 'medium-modules' },
        userMessage: null
      });
    }
    
    console.log('✅ Core modules loaded');
    
  } catch (error) {
    errorHandler.handle(error, {
      module: 'main',
      severity: 'critical',
      context: { stage: 'initialization' },
      userMessage: 'Произошла ошибка при загрузке сайта. Пожалуйста, обновите страницу.',
      showToUser: true
    });
  }
}

// Запускаем инициализацию
init();

