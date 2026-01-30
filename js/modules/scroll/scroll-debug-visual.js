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
    max-height: 300px;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.9);
    color: #0f0;
    font-family: monospace;
    font-size: 10px;
    padding: 10px;
    z-index: 99999;
    border: 2px solid #0f0;
    border-radius: 5px;
    pointer-events: auto;
    display: none;
  `;
  
  // Кнопка для копирования логов
  const copyButton = document.createElement('button');
  copyButton.textContent = '📋 Копировать логи';
  copyButton.style.cssText = `
    position: sticky;
    top: 0;
    width: 100%;
    padding: 8px;
    margin-bottom: 10px;
    background: #0f0;
    color: #000;
    border: none;
    border-radius: 3px;
    font-weight: bold;
    cursor: pointer;
    font-size: 12px;
  `;
  
  const logsContainer = document.createElement('div');
  logsContainer.id = 'scroll-debug-logs';
  logsContainer.style.cssText = `
    max-height: 250px;
    overflow-y: auto;
  `;
  
  debugPanel.appendChild(copyButton);
  debugPanel.appendChild(logsContainer);
  document.body.appendChild(debugPanel);

  const logs = [];
  const maxLogs = 250; // Увеличено для большего количества логов

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

    // Сохраняем в localStorage
    try {
      localStorage.setItem('scrollDebugLogs', JSON.stringify(logs));
    } catch (e) {
      // Игнорируем ошибки localStorage
    }

    // Обновляем визуальный вывод
    updateLogsDisplay();
  };

  const updateLogsDisplay = () => {
    logsContainer.innerHTML = logs.map(log => {
      const dataStr = Object.keys(log.data).length > 0 
        ? ` | ${JSON.stringify(log.data).substring(0, 80)}` 
        : '';
      return `<div style="margin-bottom: 2px; padding: 2px; border-bottom: 1px solid rgba(0,255,0,0.2);">${log.time} | ${log.message} | Y:${log.scrollY}${dataStr}</div>`;
    }).join('');
  };

  // Загружаем логи из localStorage при инициализации
  try {
    const savedLogs = localStorage.getItem('scrollDebugLogs');
    if (savedLogs) {
      const parsed = JSON.parse(savedLogs);
      logs.push(...parsed.slice(0, maxLogs));
      updateLogsDisplay();
    }
  } catch (e) {
    // Игнорируем ошибки
  }

  // Кнопка для копирования логов
  copyButton.addEventListener('click', () => {
    const logText = logs.map(log => {
      const dataStr = Object.keys(log.data).length > 0 
        ? ` | ${JSON.stringify(log.data)}` 
        : '';
      return `${log.time} | ${log.message} | Y:${log.scrollY}${dataStr}`;
    }).join('\n');
    
    // Копируем в буфер обмена
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(logText).then(() => {
        copyButton.textContent = '✅ Скопировано!';
        setTimeout(() => {
          copyButton.textContent = '📋 Копировать логи';
        }, 2000);
      }).catch(() => {
        // Fallback для старых браузеров
        fallbackCopy(logText);
      });
    } else {
      fallbackCopy(logText);
    }
  });

  const fallbackCopy = (text) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      copyButton.textContent = '✅ Скопировано!';
      setTimeout(() => {
        copyButton.textContent = '📋 Копировать логи';
      }, 2000);
    } catch (e) {
      copyButton.textContent = '❌ Ошибка копирования';
      setTimeout(() => {
        copyButton.textContent = '📋 Копировать логи';
      }, 2000);
    }
    document.body.removeChild(textarea);
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

  // Кнопка для очистки логов
  const clearButton = document.createElement('button');
  clearButton.textContent = '🗑️ Очистить';
  clearButton.style.cssText = `
    position: sticky;
    top: 0;
    width: 100%;
    padding: 8px;
    margin-top: 5px;
    margin-bottom: 10px;
    background: #f00;
    color: #fff;
    border: none;
    border-radius: 3px;
    font-weight: bold;
    cursor: pointer;
    font-size: 12px;
  `;
  clearButton.addEventListener('click', () => {
    logs.length = 0;
    localStorage.removeItem('scrollDebugLogs');
    updateLogsDisplay();
  });
  debugPanel.insertBefore(clearButton, logsContainer);

  // Кнопка для показа/скрытия панели (тройной тап)
  document.addEventListener('touchstart', (e) => {
    if (e.touches.length === 3) { // Тройной тап для показа/скрытия
      e.preventDefault();
      debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
    }
  }, { passive: false });

  // Экспортируем функции для доступа из консоли
  window.scrollDebugLogs = logs;
  window.getScrollDebugLogs = () => {
    return logs.map(log => {
      const dataStr = Object.keys(log.data).length > 0 
        ? ` | ${JSON.stringify(log.data)}` 
        : '';
      return `${log.time} | ${log.message} | Y:${log.scrollY}${dataStr}`;
    }).join('\n');
  };
  window.clearScrollDebugLogs = () => {
    logs.length = 0;
    localStorage.removeItem('scrollDebugLogs');
    updateLogsDisplay();
  };

  console.log('🔍 Visual scroll debug initialized - triple tap to show/hide');
  console.log('📋 Use window.getScrollDebugLogs() to get logs as text');
  console.log('🗑️ Use window.clearScrollDebugLogs() to clear logs');
}
