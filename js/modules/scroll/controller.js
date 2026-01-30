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
    let lastScrollY = window.scrollY || window.pageYOffset || 0;
    let touchStartY = 0;
    let touchStartScrollY = 0;
    let isTracking = false;
    let scrollDirection = 0; // 1 = down, -1 = up, 0 = unknown
    let lastValidScrollY = 0; // Последняя валидная позиция скролла

    // Инициализируем последнюю валидную позицию
    lastValidScrollY = lastScrollY;

    const handleDocumentTouchStart = (e) => {
      const target = e.target;
      const isInHorizontal = target.closest('.services-container, .alr-wrap, .category-nav');
      
      if (!isInHorizontal && e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
        const currentScroll = window.scrollY || window.pageYOffset || 0;
        touchStartScrollY = currentScroll;
        lastScrollY = currentScroll;
        lastValidScrollY = currentScroll; // Обновляем валидную позицию
        isTracking = true;
        scrollDirection = 0;
      }
    };

    const handleDocumentTouchMove = (e) => {
      if (isTracking && e.touches.length === 1) {
        const target = e.target;
        const isInHorizontal = target.closest('.services-container, .alr-wrap, .category-nav');
        
        // Не применяем защиту от соскакивания для горизонтальных контейнеров
        if (isInHorizontal) {
          return;
        }
        
        const currentY = e.touches[0].clientY;
        const currentScrollY = window.scrollY || window.pageYOffset || 0;
        const deltaY = currentY - touchStartY;
        const scrollDelta = currentScrollY - lastScrollY;
        
        // Определяем направление скролла
        if (Math.abs(deltaY) > 10) {
          scrollDirection = deltaY > 0 ? 1 : -1;
        }
        
        // Более агрессивная проверка на резкие скачки для touch устройств
        // Проверяем на неожиданные скачки вверх (соскакивание)
        const unexpectedJumpUp = scrollDelta < -150 && deltaY > -50; // Скролл прыгнул вверх, но палец не двигался так сильно
        const jumpToTop = currentScrollY < 150 && touchStartScrollY > 200 && Math.abs(deltaY) < 80;
        const jumpBack = currentScrollY < lastValidScrollY - 80 && Math.abs(deltaY) < 40;
        
        // Дополнительная проверка: если скролл ушел вверх, но палец двигался вниз или слабо
        const scrollMovedUpButFingerDown = scrollDelta < -100 && deltaY > 0;
        const scrollMovedUpButFingerWeak = scrollDelta < -100 && Math.abs(deltaY) < 30;
        
        if (unexpectedJumpUp || jumpToTop || jumpBack || scrollMovedUpButFingerDown || scrollMovedUpButFingerWeak) {
          // Возвращаем позицию немедленно
          const restoreY = Math.max(touchStartScrollY, lastValidScrollY);
          if (this.lenis) {
            this.lenis.scrollTo(restoreY, { immediate: true });
          } else {
            window.scrollTo({ top: restoreY, behavior: 'auto' });
          }
          lastScrollY = restoreY;
          // Предотвращаем дальнейшую обработку этого события только при обнаружении соскакивания
          e.preventDefault();
          return false;
        } else if (currentScrollY > lastValidScrollY) {
          // Обновляем валидную позицию только при нормальном скролле вниз
          lastValidScrollY = currentScrollY;
        }
        
        lastScrollY = currentScrollY;
      }
    };

    const handleDocumentTouchEnd = () => {
      // Финальная проверка на соскакивание после завершения touch
      setTimeout(() => {
        const finalScrollY = window.scrollY || window.pageYOffset || 0;
        // Более строгая проверка - если соскочило более чем на 150px вверх
        if (finalScrollY < touchStartScrollY - 150 && touchStartScrollY > 200) {
          const restoreY = Math.max(touchStartScrollY, lastValidScrollY);
          if (this.lenis) {
            this.lenis.scrollTo(restoreY, { immediate: true });
          } else {
            window.scrollTo({ top: restoreY, behavior: 'auto' });
          }
        } else if (finalScrollY > lastValidScrollY) {
          // Обновляем валидную позицию
          lastValidScrollY = finalScrollY;
        }
      }, 150);
      
      // Дополнительная проверка через больший интервал на случай задержанного соскакивания
      setTimeout(() => {
        const finalScrollY = window.scrollY || window.pageYOffset || 0;
        if (finalScrollY < lastValidScrollY - 100 && lastValidScrollY > 200) {
          if (this.lenis) {
            this.lenis.scrollTo(lastValidScrollY, { immediate: true });
          } else {
            window.scrollTo({ top: lastValidScrollY, behavior: 'auto' });
          }
        }
      }, 500);
      
      isTracking = false;
      scrollDirection = 0;
    };


    // Используем passive: false для touchmove чтобы иметь возможность preventDefault
    document.addEventListener('touchstart', handleDocumentTouchStart, { passive: true });
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
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

