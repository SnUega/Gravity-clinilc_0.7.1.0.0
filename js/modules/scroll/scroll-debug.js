/**
 * Отладка проблем со скроллом на мобильных устройствах
 * Детальное логирование всех событий, связанных со скроллом
 */

export function initScrollDebug() {
  // Определяем, является ли устройство мобильным
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        (typeof window !== 'undefined' && 'ontouchstart' in window) ||
                        (typeof window !== 'undefined' && navigator.maxTouchPoints > 0);

  if (!isMobileDevice) {
    return; // Отладка только для мобильных устройств
  }

  const log = [];
  let lastScrollPosition = window.pageYOffset || document.documentElement.scrollTop || 0;
  let scrollHistory = [];

  // Логируем все вызовы scrollTo
  const originalScrollTo = window.scrollTo;
  window.scrollTo = function(...args) {
    const currentPos = window.pageYOffset || document.documentElement.scrollTop || 0;
    const targetY = typeof args[0] === 'object' ? args[0].top : (args[1] !== undefined ? args[1] : args[0]);
    const stack = new Error().stack;
    
    log.push({
      type: 'scrollTo',
      time: Date.now(),
      from: currentPos,
      to: targetY,
      stack: stack.split('\n').slice(2, 5).join('\n')
    });
    
    console.log('🔍 scrollTo called:', {
      from: currentPos,
      to: targetY,
      args,
      stack: stack.split('\n').slice(2, 5)
    });
    
    return originalScrollTo.apply(window, args);
  };

  // Логируем изменения позиции скролла
  let scrollTimer = null;
  window.addEventListener('scroll', () => {
    const currentPos = window.pageYOffset || document.documentElement.scrollTop || 0;
    const delta = currentPos - lastScrollPosition;
    
    if (Math.abs(delta) > 50) {
      console.log('🔍 Large scroll jump detected:', {
        from: lastScrollPosition,
        to: currentPos,
        delta,
        time: Date.now()
      });
      
      scrollHistory.push({
        from: lastScrollPosition,
        to: currentPos,
        delta,
        time: Date.now()
      });
    }
    
    lastScrollPosition = currentPos;
    
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (scrollHistory.length > 0) {
        console.log('📊 Scroll history:', scrollHistory);
        scrollHistory = [];
      }
    }, 1000);
  }, { passive: true });

  // Логируем touch события
  window.addEventListener('touchstart', (e) => {
    console.log('🔍 touchstart:', {
      touches: e.touches.length,
      scrollY: window.scrollY,
      pageYOffset: window.pageYOffset
    });
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    console.log('🔍 touchmove:', {
      touches: e.touches.length,
      scrollY: window.scrollY,
      pageYOffset: window.pageYOffset
    });
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    console.log('🔍 touchend:', {
      scrollY: window.scrollY,
      pageYOffset: window.pageYOffset
    });
  }, { passive: true });

  // Логируем изменения DOM, которые могут влиять на скролл
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && 
          (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
        const target = mutation.target;
        if (target === document.body || target === document.documentElement) {
          console.log('🔍 DOM change on body/html:', {
            attribute: mutation.attributeName,
            scrollY: window.scrollY
          });
        }
      }
    });
  });

  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style', 'class']
  });

  // Перехватываем ScrollTrigger.refresh() для логирования
  if (typeof ScrollTrigger !== 'undefined') {
    const originalRefresh = ScrollTrigger.refresh;
    ScrollTrigger.refresh = function(...args) {
      const currentPos = window.pageYOffset || document.documentElement.scrollTop || 0;
      console.log('🔍 ScrollTrigger.refresh() called:', {
        scrollY: currentPos,
        stack: new Error().stack.split('\n').slice(2, 5)
      });
      return originalRefresh.apply(ScrollTrigger, args);
    };
  }

  // Экспортируем логи для анализа
  window.scrollDebugLog = log;
  window.getScrollDebugLog = () => log;
  
  console.log('🔍 Scroll debug initialized');
}
