/**
 * Blog Page Module
 * Главный модуль для страницы блога
 */

export { initNewsletterForm } from './newsletter.js';

/**
 * Инициализация страницы блога
 */
export async function initBlogPage() {
  const { initNewsletterForm } = await import('./newsletter.js');
  
  // Инициализируем форму подписки
  initNewsletterForm();
  
  console.log('✅ Blog page initialized');
}
