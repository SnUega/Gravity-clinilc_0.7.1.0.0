/**
 * Вспомогательные функции для ALR модуля
 */

/**
 * Определение режима desktop/mobile
 */
export function updateDesktopMode() {
  const isPortrait = window.innerHeight > window.innerWidth;
  const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
  const isIPadPro = window.innerWidth === 1024 && window.innerHeight === 1366;
  
  return !isIPadPro && (window.innerWidth > 1024 || (isTablet && !isPortrait));
}

/**
 * Настройка мобильной подсказки
 */
export function setupMobileHint() {
  const hints = document.querySelectorAll('.alr-mobile-hint');
  
  if (hints.length === 0) {
    return;
  }
  
  if (window.innerWidth > 1024) {
    return;
  }
  
  if (window.innerWidth > 768 && window.innerHeight < window.innerWidth) {
    return;
  }
  
  let isExpanding = true;
  let currentMargin = 0;
  
  const animateMargin = () => {
    if (isExpanding) {
      currentMargin += 0.35;
      if (currentMargin >= 12) {
        isExpanding = false;
      }
    } else {
      currentMargin -= 0.35;
      if (currentMargin <= 0) {
        isExpanding = true;
      }
    }
    
    hints.forEach(hint => {
      const leftArrow = hint.querySelector('.hint-arrow:first-child');
      const rightArrow = hint.querySelector('.hint-arrow:last-child');
      if (leftArrow && rightArrow) {
        leftArrow.style.marginRight = currentMargin + 'px';
        rightArrow.style.marginLeft = currentMargin + 'px';
      }
    });
    
    requestAnimationFrame(animateMargin);
  };
  
  animateMargin();
}

