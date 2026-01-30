/**
 * Прелоадер
 * Управление прелоадером страницы
 */

import { $ } from '../../core/utils.js';
import { eventManager } from '../../core/events.js';
import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';

/**
 * Класс прелоадера
 */
export class Preloader {
  constructor(options = {}) {
    this.options = {
      preloaderSelector: options.preloaderSelector || '#preloader',
      fillSelector: options.fillSelector || '.preloader-fill',
      ...options
    };

    this.preloader = null;
    this.fillContainer = null;
    this.progress = 0;
    this.maxProgress = 100;
    this.maxHeight = 80;
    this.animationId = null;
    this.scrollBlockers = [];
  }


  /**
   * Блокировка скролла
   */
  blockScroll() {
    // Блокируем скролл через CSS
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    // Блокируем события скролла
    const preventScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const blockKeys = (e) => {
      if ([32, 33, 34, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Добавляем обработчики
    const events = [
      { target: window, event: 'wheel', handler: preventScroll },
      { target: window, event: 'touchmove', handler: preventScroll },
      { target: window, event: 'scroll', handler: preventScroll },
      { target: document, event: 'wheel', handler: preventScroll },
      { target: document, event: 'touchmove', handler: preventScroll },
      { target: document, event: 'scroll', handler: preventScroll },
      { target: window, event: 'keydown', handler: blockKeys }
    ];

    events.forEach(({ target, event, handler }) => {
      target.addEventListener(event, handler, { passive: false, capture: true });
      this.scrollBlockers.push({ target, event, handler });
    });
  }

  /**
   * Разблокировка скролла
   */
  unlockScroll() {
    // Разблокируем скролл через CSS
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';

    // Удаляем обработчики блокировки
    this.scrollBlockers.forEach(({ target, event, handler }) => {
      target.removeEventListener(event, handler, { capture: true });
    });
    this.scrollBlockers = [];
  }

  /**
   * Обновление прогресса загрузки
   */
  updateProgress = () => {
    this.progress += 0.5; // Плавное увеличение по 0.5% за кадр

    if (this.progress > this.maxProgress) {
      this.progress = this.maxProgress;
    }

    // Вычисляем высоту на основе прогресса (снизу вверх)
    const currentHeight = (this.progress / this.maxProgress) * this.maxHeight;
    if (this.fillContainer) {
      this.fillContainer.style.height = currentHeight + 'px';
    }

    // Проверяем, завершена ли загрузка
    if (this.progress >= this.maxProgress) {
      // Ждем реальной загрузки страницы
      this.checkLoadingComplete();
    } else {
      // Продолжаем анимацию загрузки
      this.animationId = requestAnimationFrame(this.updateProgress);
    }
  };

  /**
   * Проверка завершения загрузки
   */
  checkLoadingComplete() {
    // Проверяем, загружены ли все ресурсы
    if (document.readyState === 'complete' &&
        (typeof gsap !== 'undefined') &&
        (typeof ScrollTrigger !== 'undefined')) {

      // Все ресурсы загружены, скрываем прелоадер
      setTimeout(() => {
        this.hidePreloader();
      }, 500);
    } else {
      // Все еще загружается, продолжаем проверку
      setTimeout(() => this.checkLoadingComplete(), 100);
    }
  }

  /**
   * Скрытие прелоадера
   */
  hidePreloader() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (!this.preloader) return;

    // Находим hero секцию и перемещаем прелоадер туда
    const heroSection = $('#hero, .hero, section:first-of-type');
    if (heroSection) {
      heroSection.appendChild(this.preloader);

      // Устанавливаем позицию относительно hero секции
      this.preloader.style.position = 'absolute';
      this.preloader.style.top = '50%';
      this.preloader.style.left = '50%';
      this.preloader.style.transform = 'translate(-50%, -50%)';
      this.preloader.style.zIndex = '1';
      this.preloader.style.pointerEvents = 'none';
    } else {
      // Fallback: фиксированная позиция
      this.preloader.style.position = 'fixed';
      this.preloader.style.top = '50%';
      this.preloader.style.left = '50%';
      this.preloader.style.transform = 'translate(-50%, -50%)';
      this.preloader.style.zIndex = '1';
      this.preloader.style.pointerEvents = 'none';
    }

    // Принудительный reflow для применения позиции
    void this.preloader.offsetHeight;

    // Запускаем плавный визуальный переход
    this.preloader.classList.add('hidden');

    // Запускаем анимацию слова
    setTimeout(() => {
      this.preloader.classList.add('word-animate');
    }, 400);

    // Инициализация страницы и разблокировка скролла
    setTimeout(() => {
      // Разблокируем скролл
      this.unlockScroll();

      // Сбрасываем скролл в начало (hero) только если нет hash в URL
      // Если есть hash, переход на секцию произойдет после завершения прелоадера
      if (!window.location.hash) {
        // Используем Lenis если доступен, иначе нативный scrollTo
        if (window.lenis && typeof window.lenis.scrollTo === 'function') {
          window.lenis.scrollTo(0, { immediate: true });
        } else {
          window.scrollTo(0, 0);
        }
      }

      // Эмитим событие завершения прелоадера
      window.dispatchEvent(new CustomEvent('preloaderComplete'));
    }, 100);

    // После завершения перехода фиксируем финальное состояние
    setTimeout(() => {
      const content = this.preloader.querySelector('.preloader-content');
      if (content) {
        content.style.transform = 'scale(4.0) translateY(3.5vh)';
        content.style.transition = 'none';
      }
      this.preloader.style.setProperty('--bg-opacity', '0');
    }, 800);
  }

  /**
   * Инициализация прелоадера
   */
  init() {
    // Устанавливаем ручное управление восстановлением скролла
    try {
      window.history.scrollRestoration = 'manual';
    } catch (e) {}

    // Сбрасываем скролл в начало при загрузке только если нет hash в URL
    if (!window.location.hash) {
      if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        window.lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    }

    // Блокируем скролл сразу при загрузке скрипта
    this.blockScroll();

    // Инициализируем функциональность прелоадера
    this.preloader = $(this.options.preloaderSelector);
    this.fillContainer = $(this.options.fillSelector, this.preloader);

    if (!this.preloader || !this.fillContainer) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('Preloader elements not found'), {
        module: 'preloader',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { 
          action: 'init',
          preloader: !!this.preloader,
          fillContainer: !!this.fillContainer
        },
        userMessage: null
      });
      return;
    }

    // Запускаем анимацию загрузки сразу
    this.animationId = requestAnimationFrame(this.updateProgress);

    // Preloader initialized
  }

  /**
   * Уничтожение прелоадера
   */
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.unlockScroll();
    this.preloader = null;
    this.fillContainer = null;
  }
}

/**
 * Инициализация прелоадера
 */
let preloaderInstance = null;

export function initPreloader(options) {
  if (preloaderInstance) {
    return preloaderInstance;
  }

  preloaderInstance = new Preloader(options);
  preloaderInstance.init();

  return preloaderInstance;
}

// Автоматическая инициализация при загрузке скрипта
if (typeof window !== 'undefined') {
  initPreloader();
}
