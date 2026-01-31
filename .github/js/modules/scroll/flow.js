/**
 * Анимация скролла футера
 * Плавное раскрытие футера при скролле
 */

import { $, debounce } from '../../core/utils.js';
import { CONFIG } from '../../core/config.js';
import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';

/**
 * Класс анимации скролла футера
 */
export class ScrollFlow {
  constructor(options = {}) {
    this.options = {
      contactsSelector: options.contactsSelector || '#contacts',
      footerSelector: options.footerSelector || '#page-footer',
      wrapSelector: options.wrapSelector || '#revealWrap',
      ...options
    };

    this.contacts = null;
    this.footer = null;
    this.wrap = null;
    this.scrollTrigger = null;
    this.resizeTimeout = null;
    this.footerHeight = 0; // Кэш высоты футера
    this.debouncedResize = null; // Для очистки обработчика resize
  }

  /**
   * Инициализация анимации
   */
  init() {
    // Проверяем наличие GSAP и ScrollTrigger
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('GSAP or ScrollTrigger not available'), {
        module: 'scroll-flow',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'init' },
        userMessage: null
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Находим элементы
    this.contacts = $(this.options.contactsSelector);
    this.footer = $(this.options.footerSelector);
    this.wrap = $(this.options.wrapSelector);

    if (!this.contacts || !this.footer || !this.wrap) {
      // На некоторых страницах элементы могут отсутствовать - это нормально
      // Не логируем ошибку, просто выходим
      return;
    }
    
    // ВАЖНО: Устанавливаем clipPath СРАЗУ при инициализации, до создания ScrollTrigger
    // Это предотвращает появление белой полосы на всех страницах
    gsap.set(this.footer, {
      clipPath: 'inset(100% 0 0 0)', // Скрыт сверху (полностью) - СИНХРОННО!
      visibility: 'visible'
    });

    // Если есть прелоадер — ждём его завершения, чтобы создать ScrollTrigger уже на финальной позиции скролла
    // Кэшируем элемент прелоадера
    const preloaderElement = document.getElementById('preloader');
    const hasPreloader = !!preloaderElement;
    if (hasPreloader) {
      const onPreloaderDone = () => {
        // Небольшая задержка для стабильности layout и восстановления позиции скролла (Lenis/Native)
        setTimeout(() => {
          this.initScrollTrigger();
          // НЕ вызываем ScrollTrigger.refresh() здесь, так как:
          // 1. initScrollTrigger() создает новый ScrollTrigger, который автоматически обновляется
          // 2. Вызов refresh() здесь может создать цикл с scroll-protection.js
          // 3. ScrollTrigger сам обновляется через ScrollTrigger.update() в scroll handler
        }, 50);
      };
      window.addEventListener('preloaderComplete', onPreloaderDone, { once: true });
    } else {
      // Без прелоадера — инициируем сразу
      this.initScrollTrigger();
    }

    // Обработка изменения размера окна
    this.setupResizeHandler();

    // Обработка смены ориентации
    this.setupOrientationHandler();

    // ScrollFlow initialized
  }

  /**
   * Инициализация ScrollTrigger
   */
  initScrollTrigger() {
    // Удаляем существующий ScrollTrigger если есть
    // Важно: делаем это синхронно, чтобы избежать конфликтов
    // ВАЖНО: сохраняем clipPath при удалении, чтобы избежать белой полосы
    if (this.scrollTrigger) {
      try {
        // Сохраняем текущий clipPath перед удалением
        const currentClipPath = gsap.getProperty(this.footer, 'clipPath');
        this.scrollTrigger.kill();
        // Восстанавливаем clipPath сразу после удаления, чтобы избежать белой полосы
        if (currentClipPath) {
          gsap.set(this.footer, { clipPath: currentClipPath });
        } else {
          // Если clipPath не был установлен, устанавливаем по умолчанию
          gsap.set(this.footer, { clipPath: 'inset(100% 0 0 0)' });
        }
      } catch (e) {
        console.warn('Error killing scroll trigger:', e);
        // В случае ошибки все равно устанавливаем clipPath
        gsap.set(this.footer, { clipPath: 'inset(100% 0 0 0)' });
      }
      this.scrollTrigger = null;
    }

    // Сброс состояний перед инициализацией
    // ВАЖНО: устанавливаем clipPath СИНХРОННО, до requestAnimationFrame
    // чтобы избежать появления белой полосы (белый фон #contacts виден поверх черного фона #revealWrap)
    // clipPath уже установлен в init(), но переустанавливаем для гарантии
    gsap.set(this.footer, {
      clipPath: 'inset(100% 0 0 0)', // Скрыт сверху (полностью) - СИНХРОННО!
      visibility: 'visible',
      clearProps: 'transform' // Очищаем возможные трансформации, но НЕ clipPath!
    });
    
    // Устанавливаем force3D один раз для GPU ускорения (не в onUpdate)
    // Сбрасываем позицию contacts, чтобы избежать артефактов
    gsap.set(this.contacts, { 
      y: 0,
      force3D: true, // GPU ускорение для плавности
      clearProps: 'transform' // Очищаем возможные трансформации
    });
    
    // Убеждаемся, что wrap имеет правильный z-index и overflow
    if (this.wrap) {
      gsap.set(this.wrap, {
        clearProps: 'transform' // Очищаем возможные трансформации
      });
    }

    // Кэшируем высоту футера ДО создания ScrollTrigger
    // Используем requestAnimationFrame для корректного расчета размеров после layout
    // НО clipPath уже установлен синхронно выше, поэтому белая полоса не появится
    requestAnimationFrame(() => {
      // Кэшируем высоту футера один раз
      this.footerHeight = this.footer.offsetHeight;
      
      // Создание ScrollTrigger для анимации футера
      this.scrollTrigger = ScrollTrigger.create({
        trigger: this.contacts,
        start: 'bottom bottom', // Когда нижняя граница контактов отрывается от низа viewport
        end: () => `+=${this.footerHeight}`, // Длительность = высота футера (из кэша)
        scrub: true, // Жесткая привязка к скроллу
        pin: this.wrap, // Фиксируем обертку на время анимации
        pinSpacing: true, // Добавляем отступы для корректного скролла
        anticipatePin: 1, // Предсказание для плавности
        invalidateOnRefresh: true, // Пересчет при обновлении
        onUpdate: (self) => {
          const progress = self.progress;

          // Раскрытие футера снизу вверх
          const clipValue = 100 - progress * 100;
          gsap.set(this.footer, {
            clipPath: `inset(${clipValue}% 0 0 0)`
          });

          // Сдвиг секции контактов вверх (параллакс эффект)
          // Используем кэшированную высоту вместо offsetHeight
          const yValue = -this.footerHeight * progress;
          gsap.set(this.contacts, {
            y: yValue
            // force3D уже установлен выше, не нужно устанавливать в onUpdate
          });
        },
        onRefresh: () => {
          // При обновлении пересчитываем размеры и обновляем кэш
          // НЕ вызываем this.scrollTrigger.refresh() здесь, так как это создает рекурсию
          // onRefresh вызывается ВО ВРЕМЯ ScrollTrigger.refresh(), и повторный вызов refresh() создает цикл
          this.footerHeight = this.footer.offsetHeight;
        }
      });
    });
  }

  /**
   * Настройка обработчика изменения размера
   */
  setupResizeHandler() {
    // Сохраняем debounced функцию для возможности очистки
    this.debouncedResize = debounce(() => {
      // Пересоздаем ScrollTrigger при изменении размера
      // Высота футера будет пересчитана в initScrollTrigger
      // Восстановление позиции скролла после refresh обрабатывается в scroll-protection.js
      this.initScrollTrigger();
      
      // ScrollTrigger.refresh() будет вызван автоматически через scroll-protection.js
      // или через другие модули, не нужно вызывать его здесь вручную
    }, CONFIG.DELAYS.RESIZE);

    window.addEventListener('resize', this.debouncedResize);
  }

  /**
   * Настройка обработчика смены ориентации
   */
  setupOrientationHandler() {
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.initScrollTrigger();
        // НЕ вызываем ScrollTrigger.refresh() здесь, так как:
        // 1. initScrollTrigger() создает новый ScrollTrigger, который автоматически обновляется
        // 2. Вызов refresh() здесь может создать цикл с scroll-protection.js
        // 3. ScrollTrigger сам обновляется через ScrollTrigger.update() в scroll handler
      }, 100);
    });
  }

  /**
   * Обновление анимации
   */
  refresh() {
    if (this.scrollTrigger) {
      this.scrollTrigger.refresh();
    }
  }

  /**
   * Уничтожение анимации
   */
  destroy() {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
      this.scrollTrigger = null;
    }

    // Удаляем обработчик resize
    if (this.debouncedResize) {
      window.removeEventListener('resize', this.debouncedResize);
      this.debouncedResize = null;
    }

    // Сбрасываем стили
    if (this.footer) {
      gsap.set(this.footer, { clearProps: 'clipPath,visibility' });
    }
    if (this.contacts) {
      gsap.set(this.contacts, { clearProps: 'y,force3D' });
    }

    // Очищаем таймеры
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    // Очищаем кэш
    this.footerHeight = 0;
  }
}

/**
 * Инициализация анимации скролла футера
 */
let scrollFlowInstance = null;

export function initScrollFlow(options) {
  if (scrollFlowInstance) {
    return scrollFlowInstance;
  }

  scrollFlowInstance = new ScrollFlow(options);

  // Ждем загрузки DOM и GSAP
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Ждем загрузки GSAP
      if (typeof gsap !== 'undefined') {
        scrollFlowInstance.init();
      } else {
        // Пытаемся подождать GSAP
        const checkGSAP = setInterval(() => {
          if (typeof gsap !== 'undefined') {
            clearInterval(checkGSAP);
            scrollFlowInstance.init();
          }
        }, 100);

        setTimeout(() => clearInterval(checkGSAP), 10000);
      }
    });
  } else {
    if (typeof gsap !== 'undefined') {
      scrollFlowInstance.init();
    }
  }

  return scrollFlowInstance;
}

// Автоматическая инициализация если модуль загружен напрямую
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initScrollFlow();
    });
  } else {
    initScrollFlow();
  }
}

