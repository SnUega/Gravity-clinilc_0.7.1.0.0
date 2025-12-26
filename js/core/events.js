/**
 * Утилиты для работы с событиями
 * Централизованная обработка событий
 */

import { debounce, throttle } from './utils.js';

/**
 * Класс для управления событиями
 */
export class EventManager {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Добавление обработчика события
   * @param {Element|Window} target - Целевой элемент
   * @param {string} event - Тип события
   * @param {Function} handler - Обработчик
   * @param {Object} options - Опции (passive, capture, etc.)
   * @returns {Function} - Функция для удаления обработчика
   */
  on(target, event, handler, options = {}) {
    if (!target) return () => {};
    
    const key = `${target.constructor.name}-${event}`;
    const wrappedHandler = options.debounce 
      ? debounce(handler, options.debounce)
      : options.throttle
      ? throttle(handler, options.throttle)
      : handler;
    
    target.addEventListener(event, wrappedHandler, {
      passive: options.passive !== false,
      capture: options.capture || false
    });
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    this.listeners.get(key).push({ target, event, handler: wrappedHandler, original: handler });
    
    // Возвращаем функцию для удаления
    return () => {
      this.off(target, event, wrappedHandler);
    };
  }

  /**
   * Удаление обработчика события
   * @param {Element|Window} target - Целевой элемент
   * @param {string} event - Тип события
   * @param {Function} handler - Обработчик
   */
  off(target, event, handler) {
    if (!target) return;
    
    const key = `${target.constructor.name}-${event}`;
    const listeners = this.listeners.get(key) || [];
    
    const index = listeners.findIndex(
      l => l.target === target && l.handler === handler
    );
    
    if (index !== -1) {
      target.removeEventListener(event, listeners[index].handler);
      listeners.splice(index, 1);
    }
  }

  /**
   * Удаление всех обработчиков для элемента
   * @param {Element|Window} target - Целевой элемент
   */
  removeAll(target) {
    if (!target) return;
    
    this.listeners.forEach((listeners, key) => {
      listeners
        .filter(l => l.target === target)
        .forEach(l => {
          l.target.removeEventListener(l.event, l.handler);
        });
    });
    
    // Очистка из Map
    this.listeners.forEach((listeners, key) => {
      const filtered = listeners.filter(l => l.target !== target);
      if (filtered.length === 0) {
        this.listeners.delete(key);
      } else {
        this.listeners.set(key, filtered);
      }
    });
  }

  /**
   * Очистка всех обработчиков
   */
  clear() {
    this.listeners.forEach((listeners) => {
      listeners.forEach(l => {
        l.target.removeEventListener(l.event, l.handler);
      });
    });
    this.listeners.clear();
  }

  /**
   * Эмит кастомного события
   * @param {Element|Window} target - Целевой элемент
   * @param {string} eventName - Имя события
   * @param {Object} detail - Данные события
   */
  emit(target, eventName, detail = {}) {
    if (!target) return;
    
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true
    });
    
    target.dispatchEvent(event);
  }
}

// Глобальный экземпляр менеджера событий
export const eventManager = new EventManager();

/**
 * Делегирование событий
 * @param {Element} container - Контейнер для делегирования
 * @param {string} selector - Селектор целевых элементов
 * @param {string} event - Тип события
 * @param {Function} handler - Обработчик
 * @param {Object} options - Опции
 * @returns {Function} - Функция для удаления обработчика
 */
export function delegate(container, selector, event, handler, options = {}) {
  if (!container) return () => {};
  
  const wrappedHandler = (e) => {
    const target = e.target.closest(selector);
    if (target && container.contains(target)) {
      handler.call(target, e, target);
    }
  };
  
  return eventManager.on(container, event, wrappedHandler, options);
}

