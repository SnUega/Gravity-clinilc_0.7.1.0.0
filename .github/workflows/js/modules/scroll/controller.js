/**
 * Контроллер плавного скролла с Lenis
 * Инициализирует и настраивает Lenis для плавной прокрутки
 */

import { waitForLibrary } from '../../core/utils.js';
import { CONFIG } from '../../core/config.js';
import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';

/**
 * Класс контроллера скролла
 */
export class ScrollController {
  constructor(options = {}) {
    // Определяем мобильное устройство
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    this.options = {
      duration: options.duration || 1.9,
      easing: options.easing || ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      direction: options.direction || 'vertical',
      gestureDirection: options.gestureDirection || 'vertical',
      smooth: options.smooth !== false,
      mouseMultiplier: options.mouseMultiplier || 0.75,
      // На мобильных отключаем smoothTouch для предотвращения конфликтов
      smoothTouch: isMobile ? false : (options.smoothTouch !== false),
      touchMultiplier: isMobile ? 0.3 : (options.touchMultiplier || 1.6),
      infinite: options.infinite || false,
      ...options
    };
    
    this.lenis = null;
    this.isInitialized = false;
    this.isMobile = isMobile;
  }

  /**
   * Инициализация контроллера скролла
   */
  async init() {
    if (this.isInitialized) {
      return this.lenis;
    }

    try {
      // Ждем загрузки Lenis
      const Lenis = await waitForLibrary('Lenis', 10000);
      
      // Создаем экземпляр Lenis
      this.lenis = new Lenis(this.options);

      // Экспортируем Lenis глобально для использования в других модулях
      window.lenis = this.lenis;

      // Создаем глобальные функции для блокировки/разблокировки скролла
      window.lockScroll = () => {
        try {
          if (this.lenis) {
            this.lenis.stop();
          }
        } catch (error) {
          const errorHandler = getErrorHandler();
          errorHandler.handle(error, {
            module: 'scroll-controller',
            severity: ERROR_SEVERITY.LOW,
            context: { action: 'lockScroll' },
            userMessage: null
          });
        }
      };

      window.unlockScroll = () => {
        try {
          if (this.lenis) {
            this.lenis.start();
          }
        } catch (error) {
          const errorHandler = getErrorHandler();
          errorHandler.handle(error, {
            module: 'scroll-controller',
            severity: ERROR_SEVERITY.LOW,
            context: { action: 'unlockScroll' },
            userMessage: null
          });
        }
      };

      // Синхронизация с GSAP ScrollTrigger
      if (typeof ScrollTrigger !== 'undefined') {
        this.lenis.on('scroll', ScrollTrigger.update);
      }

      // Синхронизация с GSAP ticker
      if (typeof gsap !== 'undefined') {
        gsap.ticker.add((time) => {
          this.lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
      }

      // Настройка обработки для мобильных устройств
      if (this.isMobile) {
        this.setupMobileScrollHandling();
      }

      this.isInitialized = true;
      
      // ScrollController initialized
      
      return this.lenis;
    } catch (error) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(error, {
        module: 'scroll-controller',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'init', library: 'Lenis' },
        fallback: () => {
          this.isInitialized = false;
        },
        userMessage: null
      });
      this.isInitialized = false;
      return null;
    }
  }

  /**
   * Получить экземпляр Lenis
   * @returns {Object|null} - Экземпляр Lenis или null
   */
  getLenis() {
    return this.lenis;
  }

  /**
   * Прокрутка к элементу
   * @param {Element|string} target - Целевой элемент или селектор
   * @param {Object} options - Опции прокрутки
   */
  scrollTo(target, options = {}) {
    if (!this.lenis) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('Lenis not initialized'), {
        module: 'scroll-controller',
        severity: ERROR_SEVERITY.LOW,
        context: { action: 'scrollTo' },
        userMessage: null
      });
      return;
    }

    try {
      this.lenis.scrollTo(target, options);
    } catch (error) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(error, {
        module: 'scroll-controller',
        severity: ERROR_SEVERITY.LOW,
        context: { action: 'scrollTo', target },
        userMessage: null
      });
    }
  }

  /**
   * Прокрутка на определенное значение
   * @param {number} value - Значение прокрутки
   * @param {Object} options - Опции прокрутки
   */
  scrollToValue(value, options = {}) {
    if (!this.lenis) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('Lenis not initialized'), {
        module: 'scroll-controller',
        severity: ERROR_SEVERITY.LOW,
        context: { action: 'scrollToValue' },
        userMessage: null
      });
      return;
    }

    try {
      this.lenis.scrollTo(value, options);
    } catch (error) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(error, {
        module: 'scroll-controller',
        severity: ERROR_SEVERITY.LOW,
        context: { action: 'scrollToValue', value },
        userMessage: null
      });
    }
  }

  /**
   * Остановка прокрутки
   */
  stop() {
    if (this.lenis) {
      this.lenis.stop();
    }
  }

  /**
   * Возобновление прокрутки
   */
  start() {
    if (this.lenis) {
      this.lenis.start();
    }
  }

  /**
   * Настройка обработки скролла для мобильных устройств
   * Предотвращает конфликты между Lenis и нативным скроллом
   */
  setupMobileScrollHandling() {
    if (!this.lenis) return;

    // Горизонтальные контейнеры
    const horizontalSelectors = ['.services-container', '.alr-wrap', '.category-nav'];
    const horizontalContainers = [];
    
    horizontalSelectors.forEach(selector => {
      const containers = document.querySelectorAll(selector);
      containers.forEach(container => {
        if (container.scrollWidth > container.clientWidth) {
          horizontalContainers.push(container);
        }
      });
    });

    // Обработка горизонтальных контейнеров
    horizontalContainers.forEach(container => {
      let touchStartX = 0;
      let touchStartY = 0;
      let isHorizontal = false;
      let lenisStopped = false;

      const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          isHorizontal = false;
          lenisStopped = false;
          
          // Останавливаем Lenis сразу при touch на горизонтальном контейнере
          if (this.lenis && !lenisStopped) {
            this.lenis.stop();
            lenisStopped = true;
          }
        }
      };

      const handleTouchMove = (e) => {
        if (e.touches.length === 1 && !isHorizontal) {
          const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
          const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
          
          // Определяем горизонтальное движение раньше
          if (deltaX > 5 && (deltaX > deltaY || deltaX > 3)) {
            isHorizontal = true;
            if (this.lenis && !lenisStopped) {
              this.lenis.stop();
              lenisStopped = true;
            }
          }
        }
      };

      const handleTouchEnd = () => {
        if (lenisStopped) {
          setTimeout(() => {
            if (this.lenis) {
              this.lenis.start();
            }
          }, 200);
        }
        isHorizontal = false;
        lenisStopped = false;
      };

      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
      container.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    });

    // Защита от соскакивания в начало при изменении направления скролла
    let lastScrollY = window.scrollY || 0;
    let touchStartY = 0;
    let touchStartScrollY = 0;
    let isTracking = false;
    let scrollDirection = 0; // 1 = down, -1 = up, 0 = unknown

    const handleDocumentTouchStart = (e) => {
      const target = e.target;
      const isInHorizontal = target.closest('.services-container, .alr-wrap, .category-nav');
      
      if (!isInHorizontal && e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        touchStartScrollY = window.scrollY || window.pageYOffset || 0;
        lastScrollY = touchStartScrollY;
        isTracking = true;
        scrollDirection = 0;
      }
    };

    const handleDocumentTouchMove = (e) => {
      if (isTracking && e.touches.length === 1) {
        const currentY = e.touches[0].clientY;
        const currentScrollY = window.scrollY || window.pageYOffset || 0;
        const deltaY = currentY - touchStartY;
        const scrollDelta = currentScrollY - lastScrollY;
        
        // Определяем направление скролла
        if (Math.abs(deltaY) > 10) {
          scrollDirection = deltaY > 0 ? 1 : -1;
        }
        
        // Проверяем на резкие скачки
        const unexpectedJump = Math.abs(scrollDelta) > 300 && Math.abs(deltaY) < 50;
        const jumpToTop = currentScrollY < 100 && touchStartScrollY > 500 && Math.abs(deltaY) < 30;
        
        if (unexpectedJump || jumpToTop) {
          // Возвращаем позицию
          if (this.lenis) {
            this.lenis.scrollTo(touchStartScrollY, { immediate: true });
          } else {
            window.scrollTo({ top: touchStartScrollY, behavior: 'auto' });
          }
        }
        
        lastScrollY = currentScrollY;
      }
    };

    const handleDocumentTouchEnd = () => {
      // Финальная проверка на соскакивание
      setTimeout(() => {
        const finalScrollY = window.scrollY || window.pageYOffset || 0;
        if (finalScrollY < 100 && touchStartScrollY > 500) {
          if (this.lenis) {
            this.lenis.scrollTo(touchStartScrollY, { immediate: true });
          } else {
            window.scrollTo({ top: touchStartScrollY, behavior: 'auto' });
          }
        }
      }, 150);
      
      isTracking = false;
      scrollDirection = 0;
    };

    document.addEventListener('touchstart', handleDocumentTouchStart, { passive: true });
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: true });
    document.addEventListener('touchend', handleDocumentTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleDocumentTouchEnd, { passive: true });
  }

  /**
   * Уничтожение контроллера
   */
  destroy() {
    if (this.lenis) {
      try {
        this.lenis.destroy();
      } catch (error) {
        const errorHandler = getErrorHandler();
        errorHandler.handle(error, {
          module: 'scroll-controller',
          severity: ERROR_SEVERITY.LOW,
          context: { action: 'destroy' },
          userMessage: null
        });
      }
      this.lenis = null;
    }
    
    window.lenis = null;
    window.lockScroll = null;
    window.unlockScroll = null;
    
    this.isInitialized = false;
  }
}

/**
 * Инициализация контроллера скролла при загрузке DOM
 */
let scrollControllerInstance = null;

export async function initScrollController(options) {
  if (scrollControllerInstance) {
    return scrollControllerInstance;
  }

  scrollControllerInstance = new ScrollController(options);
  
  // Ждем загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scrollControllerInstance.init();
    });
  } else {
    await scrollControllerInstance.init();
  }

  return scrollControllerInstance;
}

// Автоматическая инициализация если модуль загружен напрямую
if (typeof window !== 'undefined') {
  // Проверяем, нужно ли автоматически инициализировать
  const shouldAutoInit = document.querySelector('[data-uses-lenis]') !== null || 
                         document.querySelector('script[src*="lenis"]') !== null;
  
  if (shouldAutoInit) {
    initScrollController();
  }
}

