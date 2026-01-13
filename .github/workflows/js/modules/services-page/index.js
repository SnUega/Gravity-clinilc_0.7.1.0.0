/**
 * Services Page Module
 * Главный модуль для страниц услуг
 */

export { initAccordions, openAccordion, closeAllAccordions } from './accordion.js';
export { initPagePreloader, showPagePreloader } from './page-preloader.js';

/**
 * Инициализация всех компонентов страницы услуг
 */
export async function initServicesPage() {
  const { initAccordions } = await import('./accordion.js');
  const { initPagePreloader } = await import('./page-preloader.js');
  
  // Инициализируем прелоадер
  initPagePreloader();
  
  // Инициализируем аккордеоны
  initAccordions();
  
  console.log('✅ Services page initialized');
}
