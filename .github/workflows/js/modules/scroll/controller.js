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
      // На мобильных используем smoothTouch но с меньшим множителем для предотвращения конфликтов
      smoothTouch: options.smoothTouch !== false,
      touchMultiplier: isMobile ? 1.0 : (options.touchMultiplier || 1.6),
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

    // Минимальная защита от соскакивания - только финальная проверка после touchend
    // Не блокируем нормальный скролл во время движения
    let touchStartScrollY = 0;
    let lastValidScrollY = window.scrollY || window.pageYOffset || 0;

    const handleDocumentTouchStart = (e) => {
      // Запоминаем начальную позицию скролла
      if (e.touches.length === 1) {
        const currentScroll = window.scrollY || window.pageYOffset || 0;
        touchStartScrollY = currentScroll;
        if (currentScroll > lastValidScrollY) {
          lastValidScrollY = currentScroll;
        }
      }
    };

    const handleDocumentTouchEnd = () => {
      // Только финальная проверка на соскакивание после завершения touch
      // Очень мягкая проверка - только явное соскакивание в самое начало
      setTimeout(() => {
        const finalScrollY = window.scrollY || window.pageYOffset || 0;
        // Проверяем только на очень резкое соскакивание в самое начало (менее 50px)
        // И только если пользователь был далеко от начала (более 600px)
        if (finalScrollY < 50 && touchStartScrollY > 600) {
          // Это явное соскакивание в начало - восстанавливаем позицию
          if (this.lenis) {
            this.lenis.scrollTo(Math.max(touchStartScrollY, lastValidScrollY), { immediate: true });
          } else {
            window.scrollTo({ top: Math.max(touchStartScrollY, lastValidScrollY), behavior: 'auto' });
          }
        } else if (finalScrollY > lastValidScrollY) {
          // Обновляем валидную позицию
          lastValidScrollY = finalScrollY;
        }
      }, 300);
    };

    // Используем passive: true для всех событий - не блокируем нормальный скролл
    document.addEventListener('touchstart', handleDocumentTouchStart, { passive: true });
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

