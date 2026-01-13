/**
 * DOM утилиты
 * Функции для работы с DOM элементами
 */

import { $, $$ } from './utils.js';

/**
 * Получение вычисленных стилей элемента
 * @param {Element} element - DOM элемент
 * @param {string} property - CSS свойство
 * @returns {string|null} - Значение свойства или null
 */
export function getComputedStyleValue(element, property) {
  try {
    return getComputedStyle(element)[property];
  } catch (error) {
    console.warn(`Failed to get computed style for ${property}:`, error);
    return null;
  }
}

/**
 * Установка стилей элемента
 * @param {Element} element - DOM элемент
 * @param {Object} styles - Объект со стилями
 */
export function setStyles(element, styles) {
  if (!element) return;
  
  Object.assign(element.style, styles);
}

/**
 * Добавление класса с проверкой
 * @param {Element} element - DOM элемент
 * @param {string} className - Имя класса
 */
export function addClass(element, className) {
  if (element && className) {
    element.classList.add(className);
  }
}

/**
 * Удаление класса с проверкой
 * @param {Element} element - DOM элемент
 * @param {string} className - Имя класса
 */
export function removeClass(element, className) {
  if (element && className) {
    element.classList.remove(className);
  }
}

/**
 * Переключение класса
 * @param {Element} element - DOM элемент
 * @param {string} className - Имя класса
 * @param {boolean} force - Принудительное добавление/удаление
 */
export function toggleClass(element, className, force) {
  if (element && className) {
    element.classList.toggle(className, force);
  }
}

/**
 * Проверка наличия класса
 * @param {Element} element - DOM элемент
 * @param {string} className - Имя класса
 * @returns {boolean}
 */
export function hasClass(element, className) {
  return element && element.classList.contains(className);
}

/**
 * Получение всех родителей элемента
 * @param {Element} element - DOM элемент
 * @returns {Array<Element>} - Массив родительских элементов
 */
export function getParents(element) {
  const parents = [];
  let current = element.parentElement;
  
  while (current) {
    parents.push(current);
    current = current.parentElement;
  }
  
  return parents;
}

/**
 * Проверка, является ли элемент потомком другого элемента
 * @param {Element} child - Потомок
 * @param {Element} parent - Родитель
 * @returns {boolean}
 */
export function isDescendant(child, parent) {
  let node = child.parentNode;
  
  while (node != null) {
    if (node === parent) {
      return true;
    }
    node = node.parentNode;
  }
  
  return false;
}

/**
 * Получение позиции элемента относительно viewport
 * @param {Element} element - DOM элемент
 * @returns {Object} - Объект с позицией {top, left, right, bottom, width, height}
 */
export function getBoundingClientRect(element) {
  if (!element) return null;
  
  return element.getBoundingClientRect();
}

/**
 * Проверка, виден ли элемент в viewport
 * @param {Element} element - DOM элемент
 * @param {number} threshold - Порог видимости (0-1)
 * @returns {boolean}
 */
export function isInViewport(element, threshold = 0) {
  if (!element) return false;
  
  const rect = getBoundingClientRect(element);
  if (!rect) return false;
  
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;
  
  return (
    rect.top >= -rect.height * threshold &&
    rect.left >= -rect.width * threshold &&
    rect.bottom <= windowHeight + rect.height * threshold &&
    rect.right <= windowWidth + rect.width * threshold
  );
}

/**
 * Плавная прокрутка к элементу
 * @param {Element|string} target - Целевой элемент или селектор
 * @param {number} offset - Смещение в пикселях
 * @param {Object} options - Дополнительные опции
 */
export function scrollToElement(target, offset = 0, options = {}) {
  const element = typeof target === 'string' ? $(target) : target;
  if (!element) return;
  
  try {
    // Используем Lenis если доступен
    if (window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(element, { offset, ...options });
      return;
    }
  } catch (_) {}
  
  try {
    const rect = getBoundingClientRect(element);
    if (!rect) return;
    
    const absoluteTop = rect.top + window.pageYOffset + offset;
    window.scrollTo({
      top: absoluteTop,
      behavior: options.behavior || 'smooth'
    });
  } catch (error) {
    // Fallback: native scrollIntoView
    try {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } catch (_) {}
  }
}

/**
 * Создание элемента с атрибутами
 * @param {string} tagName - Имя тега
 * @param {Object} attributes - Атрибуты элемента
 * @param {string|Element} content - Содержимое элемента
 * @returns {Element} - Созданный элемент
 */
export function createElement(tagName, attributes = {}, content = null) {
  const element = document.createElement(tagName);
  
  // Устанавливаем атрибуты
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'style' && typeof value === 'object') {
      setStyles(element, value);
    } else if (key === 'class' || key === 'className') {
      const classes = Array.isArray(value) ? value : value.split(' ');
      classes.forEach(cls => addClass(element, cls));
    } else if (key.startsWith('data-')) {
      element.setAttribute(key, value);
    } else {
      element[key] = value;
    }
  });
  
  // Устанавливаем содержимое
  if (content) {
    if (typeof content === 'string') {
      element.innerHTML = content;
    } else if (content instanceof Element) {
      element.appendChild(content);
    } else if (Array.isArray(content)) {
      content.forEach(child => {
        if (child instanceof Element) {
          element.appendChild(child);
        }
      });
    }
  }
  
  return element;
}

/**
 * Удаление элемента из DOM
 * @param {Element} element - DOM элемент
 */
export function removeElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
}

/**
 * Очистка содержимого элемента
 * @param {Element} element - DOM элемент
 */
export function clearElement(element) {
  if (element) {
    element.innerHTML = '';
  }
}

