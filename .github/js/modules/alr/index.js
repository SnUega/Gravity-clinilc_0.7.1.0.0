/**
 * Модуль ALR
 * Экспорт интерактивных карточек ALR
 */

import { ALRInteractive } from './interactive.js';

/**
 * Инициализация ALR модуля
 */
let alrInstance = null;

export function initALRInteractive(options = {}) {
  if (alrInstance) {
    return alrInstance;
  }

  alrInstance = new ALRInteractive(options);

  // Ждем загрузки DOM и GSAP
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      alrInstance.init();
    });
  } else {
    alrInstance.init();
  }

  // Экспортируем в window для глобального доступа
  if (typeof window !== 'undefined') {
    window.ALRInteractive = alrInstance;
  }

  return alrInstance;
}

// Автоматическая инициализация если модуль загружен напрямую
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initALRInteractive();
    });
  } else {
    initALRInteractive();
  }
}

