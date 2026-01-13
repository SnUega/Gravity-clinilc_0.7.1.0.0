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
  
  if (open) {
    // Получаем целевую высоту
    const targetHeight = content.scrollHeight;
    
    // Устанавливаем начальную высоту вложенного (0 для плавной анимации)
    content.style.maxHeight = '0px';
    
    // Принудительно пересчитываем layout
    void content.offsetHeight;
    
    // Устанавливаем целевую высоту
    content.style.maxHeight = targetHeight + 'px';
    
    // СРАЗУ обновляем родительский аккордеон ДО начала анимации
    parentAccordionContent.style.maxHeight = parentAccordionContent.scrollHeight + 'px';
    
    // Непрерывное обновление во время анимации (каждый кадр)
    let animationFrameId;
    let startTime = performance.now();
    const animate = (currentTime) => {
      // В КАЖДОМ кадре обновляем высоту родителя на основе ТЕКУЩЕЙ высоты вложенного
      // Используем offsetHeight для получения реальной текущей высоты во время анимации
      const currentNestedHeight = content.offsetHeight;
      
      // Обновляем высоту родителя синхронно с текущей высотой вложенного
      parentAccordionContent.style.maxHeight = parentAccordionContent.scrollHeight + 'px';
      
      // Продолжаем пока не прошло время анимации (400ms) И пока вложенный еще анимируется
      const elapsed = currentTime - startTime;
      const isAnimating = currentNestedHeight < targetHeight - 1; // -1 для учета погрешности
      
      if (elapsed < 450 && isAnimating) { // 450ms для небольшого запаса
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Финальное обновление после завершения анимации
        content.style.maxHeight = targetHeight + 'px'; // Убеждаемся что установлена финальная высота
        parentAccordionContent.style.maxHeight = parentAccordionContent.scrollHeight + 'px';
      }
    };
    animationFrameId = requestAnimationFrame(animate);
    
    // Сохраняем для очистки
    content._animationFrameId = animationFrameId;
    
    // Добавляем ResizeObserver для отслеживания изменений высоты
    if (!content._nestedResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        // Синхронное обновление при изменении размера
        if (isParentOpen && parentAccordionContent) {
          parentAccordionContent.style.maxHeight = parentAccordionContent.scrollHeight + 'px';
        }
      });
      resizeObserver.observe(content);
      content._nestedResizeObserver = resizeObserver;
    }
  } else {
    // Сохраняем начальную высоту перед закрытием
    const startHeight = content.offsetHeight;
    
    // Обновляем родительский аккордеон перед закрытием
    parentAccordionContent.style.maxHeight = parentAccordionContent.scrollHeight + 'px';
    
    // Принудительно пересчитываем layout
    void content.offsetHeight;
    
    content.style.maxHeight = null;
    
    // Непрерывное обновление во время анимации закрытия
    let animationFrameId;
    let startTime = performance.now();
    const animate = (currentTime) => {
      // В КАЖДОМ кадре обновляем высоту родителя на основе ТЕКУЩЕЙ высоты вложенного
      const currentNestedHeight = content.offsetHeight;
      
      // Обновляем высоту родителя синхронно с текущей высотой вложенного
      parentAccordionContent.style.maxHeight = parentAccordionContent.scrollHeight + 'px';
      
      // Продолжаем пока не прошло время анимации И пока вложенный еще виден
      const elapsed = currentTime - startTime;
      const isAnimating = currentNestedHeight > 1; // > 1 для учета погрешности
      
      if (elapsed < 450 && isAnimating) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        // Финальное обновление
        parentAccordionContent.style.maxHeight = parentAccordionContent.scrollHeight + 'px';
      }
    };
    animationFrameId = requestAnimationFrame(animate);
    
    // Очищаем observer
    if (content._nestedResizeObserver) {
      content._nestedResizeObserver.disconnect();
      delete content._nestedResizeObserver;
    }
    
    // Отменяем предыдущий animation frame если был
    if (content._animationFrameId) {
      cancelAnimationFrame(content._animationFrameId);
      delete content._animationFrameId;
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
