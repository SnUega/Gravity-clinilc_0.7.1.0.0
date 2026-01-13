/**
 * Константы проекта
 * Неизменяемые значения для использования в модулях
 */

// Размеры и измерения
export const DIMENSIONS = {
  BURGER_SIZE: 64,
  STEM_INITIAL_WIDTH: 64,
  HEADER_HEIGHT: 80,
  MENU_PANEL_WIDTH: 1200
};

// Временные константы
export const TIMING = {
  PRELOADER_DELAY: 500,
  MODAL_ANIMATION: 400,
  MENU_ANIMATION: 650,
  TRANSITION_DEFAULT: 300
};

// Цвета (если нужны в JS)
export const COLORS = {
  PRIMARY: '#7a00c7',
  SECONDARY: '#1a1a1a',
  BACKGROUND: '#ffffff',
  TEXT: '#1a1a1a',
  OVERLAY: 'rgba(0, 0, 0, 0.45)'
};

// Классы для использования в коде
export const CLASSES = {
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  OPEN: 'open',
  CLOSED: 'closed',
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success'
};

// Data-атрибуты
export const DATA_ATTRIBUTES = {
  ACTION: 'data-action',
  MODAL: 'data-modal-trigger',
  ANCHOR: 'data-anchor',
  CARD: 'data-card'
};

// События (кастомные события проекта)
export const EVENTS = {
  PRELOADER_COMPLETE: 'preloaderComplete',
  MENU_OPEN: 'menuOpen',
  MENU_CLOSE: 'menuClose',
  MODAL_OPEN: 'modalOpen',
  MODAL_CLOSE: 'modalClose'
};

