/**
 * Accordion Module
 * Модуль для раскрывающихся аккордеонов на страницах услуг
 */

/**
 * Добавить кнопку "Записаться" в аккордеоны, где её нет
 */
function ensureAccordionButtons() {
  const accordionItems = document.querySelectorAll('.accordion-item');
  
  accordionItems.forEach(item => {
    const content = item.querySelector('.accordion-content');
    if (!content) return;
    
    // Проверяем есть ли уже кнопка
    const existingButton = content.querySelector('.accordion-cta');
    if (existingButton) return;
    
    // Находим accordion-body или используем content напрямую
    const body = content.querySelector('.accordion-body');
    const targetContainer = body || content;
    
    // Создаём кнопку
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'accordion-cta';
    button.setAttribute('data-open-modal', 'contactModal');
    button.textContent = 'Записаться';
    
    // Добавляем кнопку в конец
    targetContainer.appendChild(button);
  });
}

/**
 * Инициализация аккордеонов (основных и вложенных)
 */
export function initAccordions() {
  // Добавляем кнопки в аккордеоны, где их нет
  ensureAccordionButtons();
  
  // Основные аккордеоны
  const accordionHeaders = document.querySelectorAll('.accordion-header:not(.accordion-header--static)');
  
  if (!accordionHeaders.length) {
    console.log('No accordions found');
    return;
  }
  
  accordionHeaders.forEach(header => {
    header.addEventListener('click', handleAccordionClick);
    
    // Keyboard navigation
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleAccordionClick(e);
      }
    });
    
    // Улучшенная accessibility
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
  });
  
  // Вложенные аккордеоны
  const nestedHeaders = document.querySelectorAll('.nested-accordion-header');
  nestedHeaders.forEach(header => {
    header.addEventListener('click', handleNestedAccordionClick);
    
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNestedAccordionClick(e);
      }
    });
    
    header.setAttribute('role', 'button');
    header.setAttribute('tabindex', '0');
    
    // Добавляем ResizeObserver для вложенных аккордеонов, которые уже открыты
    const content = header.parentElement.querySelector('.nested-accordion-content');
    if (content && header.getAttribute('aria-expanded') === 'true') {
      const resizeObserver = new ResizeObserver(() => {
        updateParentAccordionHeight(content);
      });
      resizeObserver.observe(content);
      content._nestedResizeObserver = resizeObserver;
    }
  });
  
  console.log(`✅ Accordions initialized: ${accordionHeaders.length} main, ${nestedHeaders.length} nested`);
}

/**
 * Обработчик клика по заголовку аккордеона
 * @param {Event} event 
 */
function handleAccordionClick(event) {
  const header = event.currentTarget;
  const item = header.parentElement;
  const content = item.querySelector('.accordion-content');
  
  if (!content) return;
  
  const isOpen = header.getAttribute('aria-expanded') === 'true';
  
  // Сохраняем позицию заголовка относительно viewport до любых изменений
  const headerRect = header.getBoundingClientRect();
  const headerTopBefore = headerRect.top;
  
  // Закрываем другие аккордеоны на странице
  closeOtherAccordions(item);
  
  // Переключаем текущий
  toggleAccordion(header, content, !isOpen, true);
  
  // Компенсируем сдвиг позиции после закрытия других аккордеонов
  // Используем requestAnimationFrame для синхронизации с рендером
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const newHeaderRect = header.getBoundingClientRect();
      const drift = newHeaderRect.top - headerTopBefore;
      
      // Если заголовок сдвинулся более чем на 5px, корректируем скролл
      if (Math.abs(drift) > 5) {
        window.scrollBy({
          top: drift,
          behavior: 'instant'
        });
      }
    });
  });
}

/**
 * Закрыть все другие аккордеоны на странице
 * @param {HTMLElement} currentItem 
 */
function closeOtherAccordions(currentItem) {
  // Закрываем все аккордеоны на странице, кроме текущего
  document.querySelectorAll('.accordion-item').forEach(otherItem => {
    if (otherItem !== currentItem) {
      const otherHeader = otherItem.querySelector('.accordion-header');
      const otherContent = otherItem.querySelector('.accordion-content');
      
      if (otherHeader && otherContent && otherHeader.getAttribute('aria-expanded') === 'true') {
        toggleAccordion(otherHeader, otherContent, false, true);
      }
    }
  });
}

/**
 * Переключить состояние аккордеона
 * @param {HTMLElement} header 
 * @param {HTMLElement} content 
 * @param {boolean} open 
 */
function toggleAccordion(header, content, open, skipScroll = false) {
  const item = header.closest('.accordion-item');
  header.setAttribute('aria-expanded', open);
  item.setAttribute('aria-expanded', open);
  
  if (open) {
    // Сначала устанавливаем высоту с учетом всех вложенных аккордеонов
    content.style.maxHeight = content.scrollHeight + 'px';
    
    // Дополнительное обновление после небольшой задержки для учета анимаций
    setTimeout(() => {
      content.style.maxHeight = content.scrollHeight + 'px';
    }, 100);
    
    // Убран автоматический скролл - пользователь сам управляет позицией просмотра
    
    // Обновляем высоту при изменении содержимого (включая вложенные аккордеоны)
    const resizeObserver = new ResizeObserver(() => {
      if (header.getAttribute('aria-expanded') === 'true') {
        // Используем requestAnimationFrame для синхронизации
        requestAnimationFrame(() => {
          content.style.maxHeight = content.scrollHeight + 'px';
        });
      }
    });
    resizeObserver.observe(content);
    
    // Также отслеживаем изменения во всех вложенных аккордеонах
    const nestedContents = content.querySelectorAll('.nested-accordion-content');
    nestedContents.forEach(nestedContent => {
      const nestedResizeObserver = new ResizeObserver(() => {
        if (header.getAttribute('aria-expanded') === 'true') {
          // Синхронное обновление через requestAnimationFrame
          requestAnimationFrame(() => {
            content.style.maxHeight = content.scrollHeight + 'px';
          });
        }
      });
      nestedResizeObserver.observe(nestedContent);
      
      // Сохраняем для очистки
      if (!nestedContent._parentResizeObserver) {
        nestedContent._parentResizeObserver = nestedResizeObserver;
      }
    });
    
    // Сохраняем observer для очистки
    content._resizeObserver = resizeObserver;
  } else {
    content.style.maxHeight = null;
    
    // Очищаем observer
    if (content._resizeObserver) {
      content._resizeObserver.disconnect();
      delete content._resizeObserver;
    }
    
    // Очищаем observers вложенных аккордеонов
    const nestedContents = content.querySelectorAll('.nested-accordion-content');
    nestedContents.forEach(nestedContent => {
      if (nestedContent._parentResizeObserver) {
        nestedContent._parentResizeObserver.disconnect();
        delete nestedContent._parentResizeObserver;
      }
    });
  }
}

/**
 * Открыть конкретный аккордеон по ID или селектору
 * @param {string} selector 
 */
export function openAccordion(selector) {
  const item = document.querySelector(selector);
  if (!item) return;
  
  const header = item.querySelector('.accordion-header');
  const content = item.querySelector('.accordion-content');
  
  if (header && content) {
    closeOtherAccordions(item);
    toggleAccordion(header, content, true);
    
    // Скроллим к аккордеону
    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Обработчик клика по вложенному аккордеону
 * @param {Event} event 
 */
function handleNestedAccordionClick(event) {
  const header = event.currentTarget;
  const item = header.parentElement;
  const content = item.querySelector('.nested-accordion-content');
  
  if (!content) return;
  
  const isOpen = header.getAttribute('aria-expanded') === 'true';
  toggleNestedAccordion(header, content, !isOpen);
}

/**
 * Переключить состояние вложенного аккордеона
 * @param {HTMLElement} header 
 * @param {HTMLElement} content 
 * @param {boolean} open 
 */
function toggleNestedAccordion(header, content, open) {
  header.setAttribute('aria-expanded', open);
  
  // Находим родительский аккордеон сразу
  const parentAccordionContent = content.closest('.accordion-content');
  const parentHeader = parentAccordionContent?.closest('.accordion-item')?.querySelector('.accordion-header');
  const isParentOpen = parentHeader?.getAttribute('aria-expanded') === 'true';
  
  if (!isParentOpen || !parentAccordionContent) return;
  
  // Отменяем предыдущую анимацию если была
  if (content._animationFrameId) {
    cancelAnimationFrame(content._animationFrameId);
    delete content._animationFrameId;
  }
  
  if (open) {
    // Получаем целевую высоту вложенного контента
    const targetHeight = content.scrollHeight;
    
    // Получаем БАЗОВУЮ высоту родителя (до открытия вложенного)
    // Это высота родителя когда вложенный закрыт (offsetHeight вложенного = 0)
    const baseParentHeight = parentAccordionContent.offsetHeight;
    
    // Отключаем transition у родителя для синхронного обновления
    const originalTransition = parentAccordionContent.style.transition;
    parentAccordionContent.style.transition = 'none';
    
    // Устанавливаем начальную высоту вложенного (0)
    content.style.maxHeight = '0px';
    
    // Принудительный reflow
    void content.offsetHeight;
    
    // Запускаем CSS transition на вложенном
    content.style.maxHeight = targetHeight + 'px';
    
    // Покадровая синхронизация высоты родителя с реальной высотой вложенного
    const startTime = performance.now();
    const duration = 450; // Чуть больше чем CSS transition (400ms)
    
    const syncParentHeight = () => {
      // Читаем РЕАЛЬНУЮ текущую высоту вложенного (меняется во время CSS анимации)
      const currentNestedHeight = content.offsetHeight;
      
      // Синхронно устанавливаем высоту родителя
      parentAccordionContent.style.maxHeight = (baseParentHeight + currentNestedHeight) + 'px';
      
      const elapsed = performance.now() - startTime;
      
      if (elapsed < duration && currentNestedHeight < targetHeight - 1) {
        content._animationFrameId = requestAnimationFrame(syncParentHeight);
      } else {
        // Анимация завершена - восстанавливаем transition и финальную высоту
        parentAccordionContent.style.transition = originalTransition;
        parentAccordionContent.style.maxHeight = parentAccordionContent.scrollHeight + 'px';
        delete content._animationFrameId;
      }
    };
    
    content._animationFrameId = requestAnimationFrame(syncParentHeight);
    
    // Добавляем ResizeObserver для отслеживания изменений высоты после анимации
    if (!content._nestedResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        const parentHeader = parentAccordionContent?.closest('.accordion-item')?.querySelector('.accordion-header');
        const isStillOpen = parentHeader?.getAttribute('aria-expanded') === 'true';
        if (isStillOpen && parentAccordionContent && !content._animationFrameId) {
          parentAccordionContent.style.maxHeight = parentAccordionContent.scrollHeight + 'px';
        }
      });
      resizeObserver.observe(content);
      content._nestedResizeObserver = resizeObserver;
    }
  } else {
    // ЗАКРЫТИЕ: получаем текущую высоту вложенного
    const currentNestedHeight = content.offsetHeight;
    
    // Получаем текущую высоту родителя
    const currentParentHeight = parentAccordionContent.offsetHeight;
    
    // Базовая высота родителя (без вложенного) = текущая - высота вложенного
    const baseParentHeight = currentParentHeight - currentNestedHeight;
    
    // Отключаем transition у родителя для синхронного обновления
    const originalTransition = parentAccordionContent.style.transition;
    parentAccordionContent.style.transition = 'none';
    
    // Принудительный reflow
    void content.offsetHeight;
    
    // Запускаем CSS transition на вложенном (закрытие)
    content.style.maxHeight = null;
    
    // Покадровая синхронизация высоты родителя
    const startTime = performance.now();
    const duration = 450;
    
    const syncParentHeight = () => {
      // Читаем РЕАЛЬНУЮ текущую высоту вложенного
      const nestedHeight = content.offsetHeight;
      
      // Синхронно устанавливаем высоту родителя
      parentAccordionContent.style.maxHeight = (baseParentHeight + nestedHeight) + 'px';
      
      const elapsed = performance.now() - startTime;
      
      if (elapsed < duration && nestedHeight > 1) {
        content._animationFrameId = requestAnimationFrame(syncParentHeight);
      } else {
        // Анимация завершена
        parentAccordionContent.style.transition = originalTransition;
        parentAccordionContent.style.maxHeight = parentAccordionContent.scrollHeight + 'px';
        delete content._animationFrameId;
      }
    };
    
    content._animationFrameId = requestAnimationFrame(syncParentHeight);
    
    // Очищаем observer
    if (content._nestedResizeObserver) {
      content._nestedResizeObserver.disconnect();
      delete content._nestedResizeObserver;
    }
  }
}

/**
 * Обновить высоту родительского аккордеона (синхронно, без задержек)
 * @param {HTMLElement} nestedContent 
 */
function updateParentAccordionHeight(nestedContent) {
  // Находим родительский .accordion-content
  const parentAccordionContent = nestedContent.closest('.accordion-content');
  if (!parentAccordionContent) return;
  
  // Проверяем, открыт ли родительский аккордеон
  const parentAccordionItem = parentAccordionContent.closest('.accordion-item');
  if (!parentAccordionItem) return;
  
  const parentHeader = parentAccordionItem.querySelector('.accordion-header');
  if (!parentHeader) return;
  
  const isParentOpen = parentHeader.getAttribute('aria-expanded') === 'true';
  if (!isParentOpen) return;
  
  // СИНХРОННО обновляем maxHeight родительского аккордеона (без requestAnimationFrame для мгновенного обновления)
  parentAccordionContent.style.maxHeight = parentAccordionContent.scrollHeight + 'px';
}

/**
 * Закрыть все аккордеоны
 */
export function closeAllAccordions() {
  document.querySelectorAll('.accordion-item').forEach(item => {
    const header = item.querySelector('.accordion-header');
    const content = item.querySelector('.accordion-content');
    
    if (header && content) {
      toggleAccordion(header, content, false);
    }
  });
  
  // Закрыть все вложенные аккордеоны
  document.querySelectorAll('.nested-accordion-item').forEach(item => {
    const header = item.querySelector('.nested-accordion-header');
    const content = item.querySelector('.nested-accordion-content');
    
    if (header && content) {
      toggleNestedAccordion(header, content, false);
    }
  });
}

/**
 * Обновить высоту всех открытых аккордеонов
 * Полезно после загрузки контента или изменения размеров
 */
export function refreshAccordionHeights() {
  document.querySelectorAll('.accordion-content').forEach(content => {
    const header = content.closest('.accordion-item')?.querySelector('.accordion-header');
    if (header && header.getAttribute('aria-expanded') === 'true') {
      content.style.maxHeight = content.scrollHeight + 'px';
    }
  });
}
