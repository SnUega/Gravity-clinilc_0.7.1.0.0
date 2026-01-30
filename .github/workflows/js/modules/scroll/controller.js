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
    // Определяем, является ли устройство мобильным
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                          (typeof window !== 'undefined' && 'ontouchstart' in window) ||
                          (typeof window !== 'undefined' && navigator.maxTouchPoints > 0);
    
    this.options = {
      duration: options.duration || 1.9,
      easing: options.easing || ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      direction: options.direction || 'vertical',
      gestureDirection: options.gestureDirection || 'vertical',
      smooth: options.smooth !== false,
      mouseMultiplier: options.mouseMultiplier || 0.75,
      // Отключаем smoothTouch для мобильных устройств, чтобы избежать конфликтов с нативным скроллом
      smoothTouch: isMobileDevice ? false : (options.smoothTouch !== false),
      touchMultiplier: isMobileDevice ? 1.0 : (options.touchMultiplier || 1.6),
      infinite: options.infinite || false,
      ...options
    };
    
    this.lenis = null;
    this.isInitialized = false;
  }

  /**
   * Инициализация контроллера скролла
   */
  async init() {
    if (this.isInitialized) {
      return this.lenis;
    }

    // Определяем, является ли устройство мобильным (повторяем проверку для init)
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                          (typeof window !== 'undefined' && 'ontouchstart' in window) ||
                          (typeof window !== 'undefined' && navigator.maxTouchPoints > 0);

    // Для мобильных устройств полностью отключаем Lenis, используем нативный скролл
    if (isMobileDevice) {
      console.log('Mobile device detected, using native scroll instead of Lenis');
      this.isInitialized = true;
      window.lenis = null; // Убеждаемся, что lenis не установлен
      
      // Для мобильных устройств синхронизируем ScrollTrigger с нативным скроллом
      if (typeof ScrollTrigger !== 'undefined') {
        // Отключаем авто-рефреш ScrollTrigger на resize для мобильных устройств
        // чтобы предотвратить множественные вызовы refresh() при изменении размера окна
        ScrollTrigger.config({ 
          autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load' 
        });
        
        // Обработчик нативного скролла для обновления ScrollTrigger
        const nativeScrollHandler = () => {
          ScrollTrigger.update();
        };
        
        // Используем throttling для производительности
        let ticking = false;
        const optimizedScrollHandler = () => {
          if (!ticking) {
            window.requestAnimationFrame(() => {
              nativeScrollHandler();
              ticking = false;
            });
            ticking = true;
          }
        };
        
        window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
        
        // Throttled resize handler для мобильных устройств
        let resizeTimeout = null;
        const handleResize = () => {
          if (resizeTimeout) {
            clearTimeout(resizeTimeout);
          }
          resizeTimeout = setTimeout(() => {
            // Сохраняем позицию перед refresh
            const savedPosition = window.pageYOffset || document.documentElement.scrollTop || 0;
            ScrollTrigger.refresh();
            // Восстанавливаем позицию после refresh
            if (savedPosition > 0) {
              requestAnimationFrame(() => {
                window.scrollTo(0, savedPosition);
              });
            }
          }, 300); // Задержка 300ms для предотвращения множественных вызовов
        };
        
        window.addEventListener('resize', handleResize, { passive: true });
        
        // Сохраняем обработчики для возможного удаления в будущем
        this._nativeScrollHandler = optimizedScrollHandler;
        this._resizeHandler = handleResize;
      }
      
      return null;
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

