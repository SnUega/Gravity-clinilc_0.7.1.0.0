/**
 * Утилиты для проекта
 * Общие функции для использования во всех модулях
 */

/**
 * Debounce функция - откладывает выполнение функции
 * @param {Function} func - Функция для выполнения
 * @param {number} wait - Время задержки в миллисекундах
 * @returns {Function} - Debounced функция
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle функция - ограничивает частоту выполнения функции
 * @param {Function} func - Функция для выполнения
 * @param {number} limit - Лимит времени в миллисекундах
 * @returns {Function} - Throttled функция
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Утилита для querySelector (аналог jQuery $)
 * @param {string} selector - CSS селектор
 * @param {Element} context - Контекст поиска (по умолчанию document)
 * @returns {Element|null} - Найденный элемент или null
 */
export function $(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Утилита для querySelectorAll
 * @param {string} selector - CSS селектор
 * @param {Element} context - Контекст поиска (по умолчанию document)
 * @returns {NodeList} - Найденные элементы
 */
export function $$(selector, context = document) {
  return context.querySelectorAll(selector);
}

/**
 * Ожидание загрузки элемента в DOM
 * @param {string} selector - CSS селектор
 * @param {number} timeout - Таймаут в миллисекундах
 * @returns {Promise<Element>} - Promise с найденным элементом
 */
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = $(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = $(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Ожидание загрузки библиотеки
 * @param {string} libName - Имя библиотеки (например, 'gsap', 'Lenis')
 * @param {number} timeout - Таймаут в миллисекундах
 * @param {number} interval - Интервал проверки в миллисекундах
 * @returns {Promise} - Promise с загруженной библиотекой
 */
export function waitForLibrary(libName, timeout = 10000, interval = 100) {
  return new Promise((resolve, reject) => {
    if (window[libName]) {
      resolve(window[libName]);
      return;
    }

    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (window[libName]) {
        clearInterval(checkInterval);
        resolve(window[libName]);
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error(`Library ${libName} not loaded within ${timeout}ms`));
      }
    }, interval);
  });
}

/**
 * Проверка, является ли устройство мобильным
 * @returns {boolean}
 */
export function isMobile() {
  return window.innerWidth <= 768;
}

/**
 * Проверка, является ли устройство планшетом
 * @returns {boolean}
 */
export function isTablet() {
  return window.innerWidth > 768 && window.innerWidth <= 1024;
}

/**
 * Проверка, является ли устройство десктопом
 * @returns {boolean}
 */
export function isDesktop() {
  return window.innerWidth > 1024;
}

/**
 * Проверка ориентации устройства
 * @returns {boolean} - true если портретная ориентация
 */
export function isPortrait() {
  return window.innerHeight > window.innerWidth;
}

/**
 * Клонирование объекта
 * @param {*} obj - Объект для клонирования
 * @returns {*} - Клонированный объект
 */
export function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Проверка, является ли значение числом
 * @param {*} value - Значение для проверки
 * @returns {boolean}
 */
export function isNumber(value) {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Безопасное получение значения из объекта по пути
 * @param {Object} obj - Объект
 * @param {string} path - Путь к значению (например, 'user.name')
 * @param {*} defaultValue - Значение по умолчанию
 * @returns {*} - Значение или defaultValue
 */
export function get(obj, path, defaultValue = undefined) {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result == null) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}

