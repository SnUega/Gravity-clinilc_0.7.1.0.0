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
      const { initScrollController, initCustomScrollbar, initScrollFlow, initScrollProtection } = await import('./modules/scroll/index.js');
      
      // Инициализируем защиту от сброса скролла (для мобильных устройств)
      initScrollProtection();
      
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
    
    // Инициализация кликов по мини-статьям блога
    initBlogArticleClicks();
    
    // Обработка якорных ссылок при загрузке страницы
    if (window.location.hash) {
      const hash = window.location.hash;
      const target = document.querySelector(hash);
      if (target) {
        // Ждем завершения прелоадера перед переходом на секцию
        const scrollToHash = async () => {
          // Ждем события завершения прелоадера
          if (document.getElementById('preloader')) {
            await new Promise(resolve => {
              window.addEventListener('preloaderComplete', resolve, { once: true });
            });
            // Дополнительная небольшая задержка для завершения анимации прелоадера
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          try {
            const { smoothScrollToTarget } = await import('./modules/header/helpers.js');
            // Ждем инициализации Lenis если используется
            if (usesLenis && window.lenis) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            smoothScrollToTarget(target, -80);
          } catch (error) {
            // Fallback: используем scrollToElement
            const { scrollToElement } = await import('./core/dom.js');
            scrollToElement(target, -80);
          }
        };
        
        // Запускаем сразу, но переход произойдет после прелоадера
        scrollToHash();
      }
    }
    
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

/**
 * Инициализация кликов по мини-статьям блога в меню
 * Переход на страницу статьи или показ toast для заглушек
 */
function initBlogArticleClicks() {
  const articles = document.querySelectorAll('.blog-article, .blog-stub');
  
  articles.forEach(article => {
    article.addEventListener('click', (e) => {
      e.preventDefault();
      
      const slug = article.dataset.slug;
      const isStub = article.classList.contains('blog-stub') || 
                     article.querySelector('.stub-placeholder-icon') ||
                     !slug || slug.startsWith('coming-soon');
      
      if (isStub) {
        showComingSoonToast();
      } else {
        // Переход на страницу статьи (когда будут созданы реальные статьи)
        showComingSoonToast();
        // window.location.href = `html/article-${slug}.html`;
      }
    });
  });
}

/**
 * Показать toast уведомление "Скоро"
 */
function showComingSoonToast() {
  // Удаляем существующий toast
  const existingToast = document.querySelector('.coming-soon-toast');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Создаем toast
  const toast = document.createElement('div');
  toast.className = 'coming-soon-toast';
  toast.textContent = '📝 Статья скоро будет доступна';
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: linear-gradient(135deg, #7a00c7 0%, #45c4f9 100%);
    color: #fff;
    padding: 1rem 2rem;
    border-radius: 12px;
    font-weight: 500;
    box-shadow: 0 10px 30px rgba(122, 0, 199, 0.3);
    z-index: 1000;
    opacity: 0;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease;
  `;
  document.body.appendChild(toast);
  
  // Анимация появления
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(-50%) translateY(0)';
    toast.style.opacity = '1';
  });
  
  // Автоматическое скрытие
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(100px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

// Запускаем инициализацию
init();
