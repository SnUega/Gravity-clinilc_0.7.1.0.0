/**
 * Глобальная конфигурация проекта
 * Централизованное хранение настроек
 */

export const CONFIG = {
  // Брейкпоинты
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1024
  },
  
  // Анимации
  ANIMATIONS: {
    DURATION: {
      FAST: 0.2,
      NORMAL: 0.4,
      SLOW: 0.8,
      VERY_SLOW: 1.2
    },
    EASING: {
      DEFAULT: 'power2.out',
      SMOOTH: 'power1.inOut',
      BOUNCE: 'back.out(1.7)'
    }
  },
  
  // Debounce/Throttle задержки
  DELAYS: {
    RESIZE: 250,
    SCROLL: 100,
    INPUT: 300,
    CLICK: 300
  },
  
  // Z-index слои
  Z_INDEX: {
    MODAL: 1000,
    MENU: 50,
    HEADER: 10,
    OVERLAY: 5,
    DEFAULT: 1
  },
  
  // Селекторы (для централизованного управления)
  SELECTORS: {
    PRELOADER: '#preloader',
    HEADER: '.navc-header, .header',
    MENU: '.navc-menu, .menu-container',
    BURGER: '.navc-burger, .burger',
    BODY: 'body',
    MODAL: '.modal, .alr-mobile-modal'
  },
  
  // API endpoints (для будущей интеграции)
  API: {
    BASE_URL: '/api',
    ENDPOINTS: {
      CONTACT_FORM: '/contact',
      BLOG_ARTICLES: '/blog/articles',
      REVIEWS: '/reviews'
    },
    TIMEOUT: 10000
  },
  
  // Локальное хранилище
  STORAGE: {
    KEYS: {
      SCROLL_POSITION: 'preloader:lastScrollY',
      USER_PREFERENCES: 'user:preferences'
    }
  },
  
  // Флаги функциональности
  FEATURES: {
    SMOOTH_SCROLL: true,
    CUSTOM_SCROLLBAR: true,
    PARALLAX: true,
    LAZY_LOAD: true
  }
};

/**
 * Получение конфигурации для конкретного модуля
 * @param {string} moduleName - Имя модуля
 * @returns {Object} - Конфигурация модуля или пустой объект
 */
export function getModuleConfig(moduleName) {
  return CONFIG[moduleName.toUpperCase()] || {};
}

/**
 * Обновление конфигурации
 * @param {Object} updates - Обновления конфигурации
 */
export function updateConfig(updates) {
  Object.assign(CONFIG, updates);
}

