/**
 * Кастомный скроллбар
 * Создает кастомный скроллбар поверх страницы
 */

import { CONFIG } from '../../core/config.js';
import { createElement, setStyles, removeElement } from '../../core/dom.js';
import { eventManager } from '../../core/events.js';
import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';

/**
 * Класс кастомного скроллбара
 */
export class CustomScrollbar {
  constructor(options = {}) {
    this.options = {
      width: options.width || 4,
      color: options.color || 'rgba(51, 51, 51, 0.85)',
      colorHover: options.colorHover || 'rgba(51, 51, 51, 1)',
      idleDelay: options.idleDelay || 1000,
      ...options
    };

    this.scrollbarTrack = null;
    this.scrollbarThumb = null;
    this.isScrolling = false;
    this.scrollTimeout = null;
    this.isDragging = false;
    this.dragStartY = 0;
    this.dragStartScrollTop = 0;
    this.thumbHeight = 0; // Кэш высоты ползунка
  }

  /**
   * Создание элементов скроллбара
   */
  createScrollbar() {
    // Создаем контейнер для скроллбара
    this.scrollbarTrack = createElement('div', {
      id: 'custom-scrollbar-track',
      style: {
        position: 'fixed',
        top: '0',
        right: '0',
        width: `${this.options.width}px`,
        height: '100vh',
        pointerEvents: 'none',
        zIndex: '9999',
        opacity: '0',
        transition: 'opacity 0.3s ease'
      }
    });

    // Создаем ползунок
    this.scrollbarThumb = createElement('div', {
      id: 'custom-scrollbar-thumb',
      style: {
        position: 'absolute',
        right: '0',
        width: `${this.options.width}px`,
        background: this.options.color,
        borderRadius: '2px',
        minHeight: '30px',
        transition: 'background 0.3s ease, opacity 0.3s ease',
        cursor: 'pointer',
        pointerEvents: 'auto'
      }
    });

    this.scrollbarTrack.appendChild(this.scrollbarThumb);
    document.body.appendChild(this.scrollbarTrack);
  }

  /**
   * Получение текущей позиции скролла (совместимо с Lenis)
   */
  getScrollPosition() {
    if (window.lenis && typeof window.lenis.scroll === 'number') {
      return window.lenis.scroll;
    }
    return window.pageYOffset ?? document.documentElement.scrollTop ?? 0;
  }

  /**
   * Обновление позиции и размера ползунка
   */
  updateScrollbar() {
    if (!this.scrollbarThumb || !this.scrollbarTrack) return;

    try {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = this.getScrollPosition();

      // Если контент не требует прокрутки, скрываем скроллбар
      if (documentHeight <= windowHeight) {
        setStyles(this.scrollbarTrack, { opacity: '0' });
        return;
      }

      // Вычисляем размер и позицию ползунка
      const trackHeight = windowHeight;
      const thumbHeight = Math.max(30, (windowHeight / documentHeight) * trackHeight);
      const maxThumbTop = trackHeight - thumbHeight;
      const thumbTop = (scrollTop / (documentHeight - windowHeight)) * maxThumbTop;

      setStyles(this.scrollbarThumb, {
        height: `${thumbHeight}px`,
        top: `${thumbTop}px`
      });
    } catch (error) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(error, {
        module: 'scrollbar',
        severity: ERROR_SEVERITY.LOW,
        context: { action: 'updateScrollbar' },
        userMessage: null
      });
    }
  }

  /**
   * Показ скроллбара
   */
  showScrollbar() {
    if (!this.scrollbarTrack) return;
    
    setStyles(this.scrollbarTrack, { opacity: '1' });
    this.isScrolling = true;

    clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.hideScrollbar();
    }, this.options.idleDelay);
  }

  /**
   * Скрытие скроллбара
   */
  hideScrollbar() {
    if (!this.scrollbarTrack || this.isScrolling) return;
    
    setStyles(this.scrollbarTrack, { opacity: '0' });
  }

  /**
   * Обработчик скролла
   */
  handleScroll = () => {
    this.updateScrollbar();
    // Устанавливаем isScrolling в true перед показом скроллбара
    // showScrollbar сам установит таймер для скрытия
    this.isScrolling = true;
    this.showScrollbar();
  };

  /**
   * Обработчик движения мыши
   */
  handleMouseMove = (e) => {
    if (window.innerWidth - e.clientX <= 20) {
      this.showScrollbar();
      clearTimeout(this.scrollTimeout);
    }

    if (this.isDragging) {
      this.handleMouseMoveDrag(e);
    }
  };

  /**
   * Обработчик начала перетаскивания
   */
  handleThumbMouseDown = (e) => {
    this.isDragging = true;
    this.dragStartY = e.clientY;
    this.dragStartScrollTop = this.getScrollPosition();
    // Кэшируем высоту ползунка при начале перетаскивания
    this.thumbHeight = this.scrollbarThumb.offsetHeight;
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * Обработчик перетаскивания
   */
  handleMouseMoveDrag = (e) => {
    if (!this.isDragging) return;

    const deltaY = e.clientY - this.dragStartY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const maxScroll = documentHeight - windowHeight;
    const trackHeight = windowHeight;
    // Используем кэшированную высоту ползунка вместо offsetHeight
    const scrollRatio = maxScroll / (trackHeight - this.thumbHeight);

    const newScrollTop = this.dragStartScrollTop + (deltaY * scrollRatio);
    const clampedScrollTop = Math.max(0, Math.min(maxScroll, newScrollTop));
    
    // Используем Lenis API если доступен, иначе нативный scrollTo
    if (window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(clampedScrollTop, { immediate: true });
    } else {
      window.scrollTo(0, clampedScrollTop);
    }
  };

  /**
   * Обработчик окончания перетаскивания
   */
  handleMouseUp = () => {
    this.isDragging = false;
  };

  /**
   * Обработчик наведения на ползунок
   */
  handleThumbMouseEnter = () => {
    if (this.scrollbarThumb) {
      setStyles(this.scrollbarThumb, { background: this.options.colorHover });
    }
  };

  /**
   * Обработчик ухода с ползунка
   */
  handleThumbMouseLeave = () => {
    if (!this.isDragging && this.scrollbarThumb) {
      setStyles(this.scrollbarThumb, { background: this.options.color });
    }
  };

  /**
   * Инициализация скроллбара
   */
  init() {
    try {
      this.createScrollbar();
      this.updateScrollbar();
    } catch (error) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(error, {
        module: 'scrollbar',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'init' },
        userMessage: null
      });
      return;
    }

    // Слушаем события
    eventManager.on(window, 'scroll', this.handleScroll, { passive: true });
    eventManager.on(window, 'resize', () => {
      this.updateScrollbar();
      this.handleScroll();
    }, { passive: true });
    eventManager.on(window, 'wheel', this.handleScroll, { passive: true });
    eventManager.on(document, 'mousemove', this.handleMouseMove, { passive: true });
    eventManager.on(document, 'mouseup', this.handleMouseUp);
    eventManager.on(document, 'mouseleave', this.handleMouseUp);

    // Обработчики для ползунка
    if (this.scrollbarThumb) {
      eventManager.on(this.scrollbarThumb, 'mousedown', this.handleThumbMouseDown);
      eventManager.on(this.scrollbarThumb, 'mouseenter', this.handleThumbMouseEnter);
      eventManager.on(this.scrollbarThumb, 'mouseleave', this.handleThumbMouseLeave);
    }

    // Начальное состояние - скрыт
    setTimeout(() => {
      this.hideScrollbar();
    }, 500);

    // CustomScrollbar initialized
  }

  /**
   * Уничтожение скроллбара
   */
  destroy() {
    // Удаляем обработчики событий
    eventManager.removeAll(window);
    eventManager.removeAll(document);
    
    if (this.scrollbarThumb) {
      eventManager.removeAll(this.scrollbarThumb);
    }

    // Удаляем элементы
    if (this.scrollbarTrack) {
      removeElement(this.scrollbarTrack);
    }

    // Очищаем таймеры
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollbarTrack = null;
    this.scrollbarThumb = null;
    this.isScrolling = false;
    this.isDragging = false;
  }
}

/**
 * Инициализация кастомного скроллбара
 */
let scrollbarInstance = null;

export function initCustomScrollbar(options) {
  if (scrollbarInstance) {
    return scrollbarInstance;
  }

  scrollbarInstance = new CustomScrollbar(options);
  
  // Ждем загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      scrollbarInstance.init();
    });
  } else {
    scrollbarInstance.init();
  }

  return scrollbarInstance;
}

// Автоматическая инициализация если модуль загружен напрямую
if (typeof window !== 'undefined' && CONFIG.FEATURES.CUSTOM_SCROLLBAR) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCustomScrollbar();
    });
  } else {
    initCustomScrollbar();
  }
}

