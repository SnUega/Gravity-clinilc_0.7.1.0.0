/**
 * Визуальная отладка проблем со скроллом на мобильных устройствах
 * Выводит логи на экран для просмотра без консоли
 */

export function initScrollDebugVisual() {
  // Определяем, является ли устройство мобильным
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                        (typeof window !== 'undefined' && 'ontouchstart' in window) ||
                        (typeof window !== 'undefined' && navigator.maxTouchPoints > 0);

  if (!isMobileDevice) {
    return; // Визуальная отладка только для мобильных устройств
  }

  // Создаем визуальный элемент для логов
  const debugPanel = document.createElement('div');
  debugPanel.id = 'scroll-debug-panel';
  debugPanel.style.cssText = `
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    max-height: 200px;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.8);
    color: #0f0;
    font-family: monospace;
    font-size: 10px;
    padding: 10px;
    z-index: 99999;
    border: 2px solid #0f0;
    border-radius: 5px;
    pointer-events: none;
    display: none;
  `;
  document.body.appendChild(debugPanel);

  const logs = [];
  const maxLogs = 10;

  const addLog = (message, data = {}) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
      time: timestamp,
      message,
      data,
      scrollY: window.pageYOffset || document.documentElement.scrollTop || 0
    };
    
    logs.unshift(logEntry);
    if (logs.length > maxLogs) {
      logs.pop();
    }

    // Обновляем визуальный вывод
    debugPanel.innerHTML = logs.map(log => {
      const dataStr = Object.keys(log.data).length > 0 
        ? ` | ${JSON.stringify(log.data).substring(0, 50)}` 
        : '';
      return `<div>${log.time} | ${log.message} | Y:${log.scrollY}${dataStr}</div>`;
    }).join('');
    
    debugPanel.style.display = 'block';
  };

  // Логируем все вызовы scrollTo
  const originalScrollTo = window.scrollTo;
  window.scrollTo = function(...args) {
    const currentPos = window.pageYOffset || document.documentElement.scrollTop || 0;
    const targetY = typeof args[0] === 'object' ? args[0].top : (args[1] !== undefined ? args[1] : args[0]);
    
    addLog('scrollTo', { from: currentPos, to: targetY });
    
    return originalScrollTo.apply(window, args);
  };

  // Логируем изменения позиции скролла
  let lastScrollPosition = window.pageYOffset || document.documentElement.scrollTop || 0;
  let scrollTimer = null;
  
  window.addEventListener('scroll', () => {
    const currentPos = window.pageYOffset || document.documentElement.scrollTop || 0;
    const delta = currentPos - lastScrollPosition;
    
    if (Math.abs(delta) > 50) {
      addLog('JUMP!', { from: lastScrollPosition, to: currentPos, delta });
    }
    
    lastScrollPosition = currentPos;
    
    if (scrollTimer) clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      addLog('scroll stop', { position: currentPos });
    }, 300);
  }, { passive: true });

  // Логируем touch события
  window.addEventListener('touchstart', (e) => {
    addLog('touchstart', { touches: e.touches.length });
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    addLog('touchend', { scrollY: window.pageYOffset });
  }, { passive: true });

  // Перехватываем ScrollTrigger.refresh()
  if (typeof ScrollTrigger !== 'undefined') {
    const originalRefresh = ScrollTrigger.refresh;
    ScrollTrigger.refresh = function(...args) {
      addLog('ScrollTrigger.refresh', { scrollY: window.pageYOffset });
      return originalRefresh.apply(ScrollTrigger, args);
    };
  }

  // Кнопка для показа/скрытия панели (двойной тап)
  let tapCount = 0;
  let tapTimer = null;
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 3) { // Тройной тап для показа/скрытия
      e.preventDefault();
      debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    }
  }, { passive: false });

  console.log('🔍 Visual scroll debug initialized - triple tap to show/hide');
}
