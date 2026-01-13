/**
 * Вспомогательные функции для меню хедера
 * Backdrop, smooth scroll, утилиты
 */

/**
 * Плавная прокрутка к цели
 */
export function smoothScrollToTarget(target, offset = 0) {
  if (!target) return;
  try {
    if (window.lenis && typeof window.lenis.scrollTo === 'function') {
      window.lenis.scrollTo(target, { offset });
      return;
    }
  } catch (_) {}
  try {
    const rect = target.getBoundingClientRect();
    const absoluteTop = rect.top + window.pageYOffset + offset;
    window.scrollTo({ top: absoluteTop, behavior: 'smooth' });
  } catch (_) {
    try { 
      target.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
    } catch (_) {}
  }
}

/**
 * Показать backdrop
 */
export function showMenuBackdrop() {
  let bd = document.querySelector('.menu-backdrop');
  if (!bd) {
    bd = document.createElement('div');
    bd.className = 'menu-backdrop';
    document.body.appendChild(bd);
  }
  void bd.offsetWidth;
  bd.classList.add('is-visible');
}

/**
 * Скрыть backdrop
 */
export function hideMenuBackdrop() {
  const bd = document.querySelector('.menu-backdrop');
  if (!bd) return;
  bd.classList.remove('is-visible');
  setTimeout(() => { 
    if (bd.parentNode) bd.parentNode.removeChild(bd); 
  }, 320);
}

/**
 * Анимация контента хедера
 */
export function animateHeaderContent(elements, visible, duration = 0.2) {
  if (!elements.headerLogo && !elements.headerContact) return;
  try {
    gsap.to([elements.headerLogo, elements.headerContact], { 
      autoAlpha: visible ? 1 : 0, 
      y: visible ? 0 : -10, 
      duration, 
      overwrite: true 
    });
  } catch (error) {
    console.warn('Failed to animate header content:', error);
  }
}

/**
 * Установка clip-path для панели
 */
export function setPanelClipPath(menuPanel, panelW, currentW) {
  if (!menuPanel || !panelW || !currentW) return;
  try {
    const inset = ((panelW - currentW) / 2 / panelW) * 100;
    gsap.set(menuPanel, { clipPath: `inset(0 ${inset}% 0 ${inset}% round 50px)` });
  } catch (error) {
    console.warn('Failed to set panel clip path:', error);
  }
}

/**
 * Получение текущей ширины stem
 * Оптимизировано: использует offsetWidth вместо getComputedStyle для избежания reflow
 */
export function getCurrentStemWidth(menuStem, defaultWidth = 64) {
  if (!menuStem) return defaultWidth;
  try {
    // Используем offsetWidth вместо getComputedStyle для лучшей производительности
    // offsetWidth не вызывает reflow, так как это layout свойство
    const width = menuStem.offsetWidth;
    return width > 0 ? width : defaultWidth;
  } catch (error) {
    console.warn('Failed to get stem width:', error);
    return defaultWidth;
  }
}

/**
 * Кэш для ширины панели
 */
export class PanelWidthCache {
  constructor(cacheDuration = 100) {
    this.cachedWidth = null;
    this.cacheTimestamp = 0;
    this.cacheDuration = cacheDuration;
  }

  get(menuContainer) {
    const now = Date.now();
    if (!this.cachedWidth || (now - this.cacheTimestamp) > this.cacheDuration) {
      this.cachedWidth = menuContainer.clientWidth;
      this.cacheTimestamp = now;
    }
    return this.cachedWidth;
  }

  clear() {
    this.cachedWidth = null;
    this.cacheTimestamp = 0;
  }
}

/**
 * Настройка обработчиков скролла для блога
 */
export function addBlogScrollHandlers(menuInner) {
  const blogScrollArea = menuInner ? menuInner.querySelector('.blog-scroll-area') : null;
  if (!blogScrollArea) return;
  
  const blogWheelHandler = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    const delta = e.deltaY;
    target.scrollTop += delta * 0.5;
  };
  
  const blogTouchHandler = (e) => {
    e.stopPropagation();
  };
  
  blogScrollArea.addEventListener('wheel', blogWheelHandler, { passive: false });
  blogScrollArea.addEventListener('touchmove', blogTouchHandler, { passive: true });
  
  blogScrollArea._blogWheelHandler = blogWheelHandler;
  blogScrollArea._blogTouchHandler = blogTouchHandler;
}

/**
 * Удаление обработчиков скролла для блога
 */
export function removeBlogScrollHandlers(menuInner) {
  const blogScrollArea = menuInner ? menuInner.querySelector('.blog-scroll-area') : null;
  if (!blogScrollArea) return;
  
  if (blogScrollArea._blogWheelHandler) {
    blogScrollArea.removeEventListener('wheel', blogScrollArea._blogWheelHandler);
    blogScrollArea.removeEventListener('touchmove', blogScrollArea._blogTouchHandler);
    delete blogScrollArea._blogWheelHandler;
    delete blogScrollArea._blogTouchHandler;
  }
}

