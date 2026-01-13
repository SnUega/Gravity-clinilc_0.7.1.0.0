/**
 * Модуль хедера
 * Экспорт меню хедера
 */

import { HeaderMenu } from './menu.js';

let headerMenuInstance = null;

export function initHeaderMenu(options = {}) {
  if (headerMenuInstance) {
    return headerMenuInstance;
  }

  headerMenuInstance = new HeaderMenu(options);

  // Ждем загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      headerMenuInstance.init();
    });
  } else {
    headerMenuInstance.init();
  }

  // Экспортируем в window для глобального доступа
  if (typeof window !== 'undefined') {
    window.HeaderMenu = headerMenuInstance;
    window.headerMenuCleanup = () => headerMenuInstance.destroy();
  }

  return headerMenuInstance;
}

