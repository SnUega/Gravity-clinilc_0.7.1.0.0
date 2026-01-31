/**
 * Защита от сброса скролла на мобильных устройствах
 * Предотвращает нежелательные сбросы позиции скролла
 */

/**
 * Инициализация защиты от сброса скролла
 */
export function initScrollProtection() {
  // Определяем, является ли устройство мобильным
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        (typeof window !== 'undefined' && 'ontouchstart' in window) ||
                        (typeof window !== 'undefined' && navigator.maxTouchPoints > 0);

  if (!isMobileDevice) {
    return; // Защита только для мобильных устройств
  }

  let lastScrollPosition = window.pageYOffset || document.documentElement.scrollTop || 0;
  let isUserScrolling = false;
  let scrollTimeout = null;

  let lastScrollTime = Date.now();
  
  // Отслеживаем начало скролла пользователем
  const handleTouchStart = () => {
    isUserScrolling = true;
    lastScrollPosition = window.pageYOffset || document.documentElement.scrollTop || 0;
    lastScrollTime = Date.now();
    
    // Сбрасываем флаг через некоторое время после окончания скролла
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(() => {
      isUserScrolling = false;
    }, 300); // Увеличено до 300ms для более надежного определения
  };

  // Отслеживаем изменения позиции скролла
  let isHandlingJump = false;
  const handleScroll = () => {
    const currentPosition = window.pageYOffset || document.documentElement.scrollTop || 0;
    
    // Если пользователь скроллит и произошел большой скачок в начало (более 100px)
    // и текущая позиция меньше сохраненной более чем на 100px, это подозрительно
    if (!isHandlingJump && isUserScrolling && currentPosition < lastScrollPosition - 100 && currentPosition < 100) {
      // Восстанавливаем позицию только один раз
      isHandlingJump = true;
      console.warn('Scroll jump detected, restoring position', { from: lastScrollPosition, to: currentPosition });
      requestAnimationFrame(() => {
        window.scrollTo(0, lastScrollPosition);
        setTimeout(() => {
          isHandlingJump = false;
        }, 200);
      });
    } else {
      lastScrollPosition = currentPosition;
    }
  };

  // Перехватываем попытки программного сброса скролла
  const originalScrollTo = window.scrollTo;
  let isInitialLoad = true;
  let scrollToCallCount = 0;
  let lastScrollToTime = 0;
  let isRestoringPosition = false; // Флаг для предотвращения циклов
  
  // После первой загрузки страницы разрешаем сброс только если пользователь не скроллил
  setTimeout(() => {
    isInitialLoad = false;
  }, 2000); // 2 секунды после загрузки
  
  // Переменные для отслеживания вызовов scrollTo во время refresh
  let scrollToCallCountDuringRefresh = 0;
  let isRefreshing = false;
  
  window.scrollTo = function(...args) {
    const now = Date.now();
    const targetY = typeof args[0] === 'object' ? args[0].top : (args[1] !== undefined ? args[1] : args[0]);
    const currentPosition = window.pageYOffset || document.documentElement.scrollTop || 0;
    
    // Отслеживаем вызовы scrollTo во время refresh для статистики
    if (isRefreshing) {
      scrollToCallCountDuringRefresh++;
    }
    
    // Защита от множественных быстрых вызовов scrollTo(0)
    if (targetY === 0 && currentPosition === 0) {
      scrollToCallCount++;
      if (now - lastScrollToTime < 100 && scrollToCallCount > 3) {
        // Множественные вызовы scrollTo(0) подряд - игнорируем
        console.warn('Prevented multiple scrollTo(0) calls', { count: scrollToCallCount });
        return;
      }
      lastScrollToTime = now;
    } else {
      scrollToCallCount = 0;
    }
    
    // Если это попытка сбросить скролл в начало (0 или близко к 0)
    // и пользователь недавно скроллил, предотвращаем это
    if (args.length > 0 && !isInitialLoad) {
      if (targetY === 0 || (typeof targetY === 'number' && targetY < 50)) {
        // Во время refresh блокируем ВСЕ попытки сбросить скролл в 0, если позиция была больше 0
        // Это предотвращает дергания, которые создает ScrollTrigger при refresh
        // ScrollTrigger сам правильно обрабатывает позицию скролла, не нужно вмешиваться
        if (isRefreshing && currentPosition > 0) {
          // Блокируем все scrollTo(0) во время refresh, чтобы предотвратить дергания
          return; // Не выполняем сброс во время refresh
        }
        
        // Если пользователь скроллит и позиция была больше 100px, не сбрасываем
        if (isUserScrolling && currentPosition > 100) {
          console.warn('Prevented scroll reset to top', { currentPosition, targetY });
          return; // Не выполняем сброс
        }
        // Также проверяем, не было ли недавнего скролла
        if (currentPosition > 100 && Date.now() - lastScrollTime < 1000) {
          console.warn('Prevented scroll reset - recent user scroll detected');
          return;
        }
      }
    }
    
    // Вызываем оригинальный scrollTo
    return originalScrollTo.apply(window, args);
  };
  
  // Перехватываем ScrollTrigger.refresh() для предотвращения сброса скролла
  if (typeof ScrollTrigger !== 'undefined') {
    const originalRefresh = ScrollTrigger.refresh;
    let refreshStartPosition = 0;
    
    ScrollTrigger.refresh = function(...args) {
      if (isRefreshing) {
        // Предотвращаем рекурсивные вызовы
        console.warn('ScrollTrigger.refresh() called recursively, skipping');
        return originalRefresh.apply(ScrollTrigger, args);
      }
      
      refreshStartPosition = window.pageYOffset || document.documentElement.scrollTop || 0;
      isRefreshing = true;
      isRestoringPosition = true; // Блокируем перехват scrollTo(0) во время refresh
      scrollToCallCountDuringRefresh = 0; // Сбрасываем счетчик вызовов scrollTo во время refresh
      
      console.log('ScrollTrigger.refresh() started', { savedPosition: refreshStartPosition });
      
      try {
        const result = originalRefresh.apply(ScrollTrigger, args);
        
        // Проверяем, не был ли скролл сброшен внутри refresh
        const positionAfterRefresh = window.pageYOffset || document.documentElement.scrollTop || 0;
        console.log('ScrollTrigger.refresh() completed', { 
          before: refreshStartPosition, 
          after: positionAfterRefresh,
          delta: positionAfterRefresh - refreshStartPosition,
          scrollToCalls: scrollToCallCountDuringRefresh
        });
        
        // НЕ восстанавливаем позицию после refresh, так как:
        // 1. ScrollTrigger сам управляет позицией скролла во время refresh
        // 2. Попытка восстановления создает конфликт и множественные вызовы scrollTo
        // 3. Это вызывает дергания и остановки скролла
        // ScrollTrigger сам правильно обрабатывает позицию скролла при refresh
        
        setTimeout(() => {
          isRestoringPosition = false;
          isRefreshing = false;
          scrollToCallCountDuringRefresh = 0;
        }, 100); // Увеличена задержка для гарантии завершения всех операций
        
        return result;
      } catch (e) {
        console.error('Error in ScrollTrigger.refresh()', e);
        isRestoringPosition = false;
        isRefreshing = false;
        scrollToCallCountDuringRefresh = 0;
        throw e;
      }
    };
  }

  // Добавляем обработчики событий
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('scroll', handleScroll, { passive: true });

  console.log('Scroll protection initialized for mobile devices');
}
