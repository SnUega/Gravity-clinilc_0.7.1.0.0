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
    // Определяем, мобильное ли устройство
    const isMobileDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    this.options = {
      duration: options.duration || 1.9,
      easing: options.easing || ((t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))),
      direction: options.direction || 'vertical',
      gestureDirection: options.gestureDirection || 'vertical',
      smooth: options.smooth !== false,
      mouseMultiplier: options.mouseMultiplier || 0.75,
      // Отключаем smoothTouch на мобильных для предотвращения соскакивания
      smoothTouch: isMobileDevice ? false : (options.smoothTouch !== false),
      touchMultiplier: isMobileDevice ? 0.5 : (options.touchMultiplier || 1.6),
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

      // Настройка обработки горизонтальных контейнеров
      // Исключаем горизонтальные контейнеры из обработки Lenis
      // Используем небольшую задержку для гарантии, что все элементы загружены
      setTimeout(() => {
        this.setupHorizontalScrollHandling();
      }, 100);
      
      // Предотвращаем соскакивание в начало при touch событиях
      this.setupScrollPositionLock();

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
   * Настройка обработки горизонтальных контейнеров
   * Предотвращает конфликты между Lenis и нативным горизонтальным скроллом
   */
  setupHorizontalScrollHandling() {
    if (!this.lenis) return;

    // Селекторы горизонтальных контейнеров
    const horizontalSelectors = [
      '.services-container',
      '.alr-wrap',
      '.category-nav'
    ];
    
    // Селектор секции about для специальной обработки
    const aboutSection = document.querySelector('#about');

    // Находим все горизонтальные контейнеры
    const horizontalContainers = [];
    horizontalSelectors.forEach(selector => {
      const containers = document.querySelectorAll(selector);
      containers.forEach(container => {
        if (container.scrollWidth > container.clientWidth) {
          horizontalContainers.push(container);
        }
      });
    });

    // Специальная обработка для секции about
    if (aboutSection) {
      let aboutTouchStartY = 0;
      let aboutIsScrolling = false;

      const handleAboutTouchStart = (e) => {
        if (e.touches.length === 1) {
          aboutTouchStartY = e.touches[0].clientY;
          aboutIsScrolling = false;
        }
      };

      const handleAboutTouchMove = (e) => {
        if (e.touches.length === 1) {
          const touchY = e.touches[0].clientY;
          const deltaY = Math.abs(touchY - aboutTouchStartY);
          
          // Если вертикальный скролл в секции about
          if (deltaY > 10) {
            aboutIsScrolling = true;
            // Не останавливаем Lenis, но обеспечиваем плавную прокрутку
          }
        }
      };

      const handleAboutTouchEnd = () => {
        aboutIsScrolling = false;
      };

      aboutSection.addEventListener('touchstart', handleAboutTouchStart, { passive: true });
      aboutSection.addEventListener('touchmove', handleAboutTouchMove, { passive: true });
      aboutSection.addEventListener('touchend', handleAboutTouchEnd, { passive: true });
      aboutSection.addEventListener('touchcancel', handleAboutTouchEnd, { passive: true });
    }

    // Обработчики для каждого контейнера
    horizontalContainers.forEach(container => {
      let touchStartX = 0;
      let touchStartY = 0;
      let isHorizontalScroll = false;
      let lenisStopped = false;

      const handleTouchStart = (e) => {
        if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX;
          touchStartY = e.touches[0].clientY;
          isHorizontalScroll = false;
          lenisStopped = false;
          
          // Сразу останавливаем Lenis при touchstart на горизонтальном контейнере
          if (this.lenis && !lenisStopped) {
            this.lenis.stop();
            lenisStopped = true;
          }
        }
      };

      const handleTouchMove = (e) => {
        if (e.touches.length === 1) {
          const touchX = e.touches[0].clientX;
          const touchY = e.touches[0].clientY;
          const deltaX = Math.abs(touchX - touchStartX);
          const deltaY = Math.abs(touchY - touchStartY);

          // Определяем горизонтальный скролл раньше (порог 5px вместо 10px)
          if (!isHorizontalScroll && deltaX > 5) {
            // Если движение больше по горизонтали или достаточно горизонтальное
            if (deltaX > deltaY || (deltaX > 3 && deltaY < 10)) {
              isHorizontalScroll = true;
              // Останавливаем Lenis если еще не остановлен
              if (this.lenis && !lenisStopped) {
                this.lenis.stop();
                lenisStopped = true;
              }
              // Предотвращаем вертикальный скролл страницы
              e.preventDefault();
            }
          }
          
          // Если уже определили горизонтальный скролл, продолжаем предотвращать вертикальный
          if (isHorizontalScroll) {
            e.preventDefault();
          }
        }
      };

      const handleTouchEnd = () => {
        if (isHorizontalScroll || lenisStopped) {
          // Возобновляем Lenis после завершения горизонтального скролла
          setTimeout(() => {
            if (this.lenis) {
              this.lenis.start();
            }
          }, 150);
        }
        isHorizontalScroll = false;
        lenisStopped = false;
      };

      // Добавляем обработчики - touchmove должен быть non-passive для preventDefault
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
      container.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    });

    // Также обрабатываем wheel события для мыши/трекпада
    horizontalContainers.forEach(container => {
      let isScrolling = false;

      const handleWheel = (e) => {
        // Проверяем, горизонтальный ли это скролл
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
          isScrolling = true;
          if (this.lenis) {
            this.lenis.stop();
          }
          
          // Возобновляем Lenis после завершения скролла
          clearTimeout(this._wheelTimeout);
          this._wheelTimeout = setTimeout(() => {
            if (this.lenis && isScrolling) {
              this.lenis.start();
              isScrolling = false;
            }
          }, 150);
        }
      };

      container.addEventListener('wheel', handleWheel, { passive: true });
    });
  }

  /**
   * Блокировка позиции скролла при touch событиях
   * Предотвращает случайные прыжки в начало страницы
   */
  setupScrollPositionLock() {
    if (!this.lenis) return;

    let touchStartScrollY = 0;
    let touchStartY = 0;
    let touchStartX = 0;
    let isTouchActive = false;
    let lastScrollY = 0;
    let scrollCheckTimeout = null;

    const handleDocumentTouchStart = (e) => {
      const target = e.target;
      
      // Проверяем, находимся ли мы в горизонтальном контейнере
      const isInHorizontalContainer = target.closest('.services-container, .alr-wrap, .category-nav');
      
      if (!isInHorizontalContainer && e.touches.length === 1) {
        // Сохраняем текущую позицию скролла
        touchStartScrollY = window.scrollY || window.pageYOffset || 0;
        lastScrollY = touchStartScrollY;
        touchStartY = e.touches[0].clientY;
        touchStartX = e.touches[0].clientX;
        isTouchActive = true;
        
        // Очищаем предыдущий таймер
        if (scrollCheckTimeout) {
          clearTimeout(scrollCheckTimeout);
        }
      }
    };

    const handleDocumentTouchMove = (e) => {
      if (isTouchActive && e.touches.length === 1) {
        const target = e.target;
        const isInHorizontalContainer = target.closest('.services-container, .alr-wrap, .category-nav');
        
        if (isInHorizontalContainer) {
          isTouchActive = false;
          return;
        }

        const currentScrollY = window.scrollY || window.pageYOffset || 0;
        const currentTouchY = e.touches[0].clientY;
        const touchDeltaY = Math.abs(currentTouchY - touchStartY);
        
        // Проверяем резкие скачки позиции скролла
        const scrollDelta = Math.abs(currentScrollY - lastScrollY);
        lastScrollY = currentScrollY;
        
        // Если произошел большой скачок (больше 200px) без соответствующего движения пальца
        if (scrollDelta > 200 && touchDeltaY < 100) {
          // Возвращаем позицию скролла
          if (this.lenis) {
            this.lenis.scrollTo(touchStartScrollY, { immediate: true });
          } else {
            window.scrollTo({ top: touchStartScrollY, behavior: 'auto' });
          }
        }
        
        // Периодическая проверка на соскакивание в начало
        if (scrollCheckTimeout) {
          clearTimeout(scrollCheckTimeout);
        }
        
        scrollCheckTimeout = setTimeout(() => {
          const checkScrollY = window.scrollY || window.pageYOffset || 0;
          // Если скролл вернулся близко к началу (меньше 100px) без движения пальца
          if (checkScrollY < 100 && touchStartScrollY > 500 && touchDeltaY < 50) {
            if (this.lenis) {
              this.lenis.scrollTo(touchStartScrollY, { immediate: true });
            } else {
              window.scrollTo({ top: touchStartScrollY, behavior: 'auto' });
            }
          }
        }, 50);
      }
    };

    const handleDocumentTouchEnd = () => {
      if (scrollCheckTimeout) {
        clearTimeout(scrollCheckTimeout);
        scrollCheckTimeout = null;
      }
      
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
      }, 100);
      
      isTouchActive = false;
    };

    // Добавляем обработчики на document для перехвата всех touch событий
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
    
    if (this._wheelTimeout) {
      clearTimeout(this._wheelTimeout);
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

