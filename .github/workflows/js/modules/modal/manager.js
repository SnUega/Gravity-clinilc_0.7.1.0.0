/**
 * Универсальный менеджер модальных окон
 * Обрабатывает все типы модальных окон в проекте
 */

import { $, $$ } from '../../core/utils.js';
import { CONFIG } from '../../core/config.js';
import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';

/**
 * Класс менеджера модальных окон
 */
export class ModalManager {
  constructor() {
    this.activeModals = new Set();
    this.scrollPosition = 0;
  }

  /**
   * Инициализация менеджера
   */
  init() {
    // Обработчики для всех кнопок закрытия
    this.setupCloseButtons();
    
    // Обработчик для клавиши Escape
    this.setupEscapeHandler();
    
    // Обработчик для клика вне модального окна
    this.setupBackdropHandler();
    
    // Обработчики для кнопок открытия
    this.setupOpenButtons();
  }

  /**
   * Настраивает обработчики для всех кнопок закрытия
   */
  setupCloseButtons() {
    // Обработчик для всех кнопок с классом modal-close
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-close') || 
          e.target.closest('.modal-close')) {
        e.preventDefault();
        e.stopPropagation();
        
        const modal = e.target.closest('.modal, .alr-mobile-modal');
        if (modal) {
          this.closeModal(modal);
        }
      }
    });
  }

  /**
   * Настраивает обработчик клавиши Escape
   */
  setupEscapeHandler() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });
  }

  /**
   * Настраивает обработчик клика вне модального окна
   */
  setupBackdropHandler() {
    document.addEventListener('click', (e) => {
      // Проверяем, что клик был по backdrop (самому модальному окну)
      if (e.target.classList.contains('modal') || 
          e.target.classList.contains('alr-mobile-modal')) {
        this.closeModal(e.target);
      }
    });
  }

  /**
   * Настраивает обработчики для кнопок открытия
   */
  setupOpenButtons() {
    const modalTriggers = $$('[data-modal-trigger]');
    
    modalTriggers.forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const modalType = trigger.getAttribute('data-modal-trigger');
        const modalId = modalType + 'Modal';
        
        this.openModal(modalId);
      });
    });
  }

  /**
   * Открывает модальное окно
   * @param {HTMLElement|string} modal - Элемент модального окна или его ID
   */
  openModal(modal) {
    const modalElement = typeof modal === 'string' ? 
      $(modal) : modal;
    
    if (!modalElement) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error(`Modal not found: ${modal}`), {
        module: 'modal-manager',
        severity: ERROR_SEVERITY.LOW,
        context: { action: 'openModal', modal },
        userMessage: null
      });
      return;
    }

    // Добавляем в список активных модальных окон
    this.activeModals.add(modalElement);
    
    // Сохраняем текущую позицию скролла
    this.scrollPosition = window.scrollY || window.pageYOffset;
    
    // Блокируем скролл более надежным способом
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    
    // Показываем модальное окно
    modalElement.style.display = 'block';
    
    // Анимация появления
    this.animateIn(modalElement);
  }

  /**
   * Закрывает модальное окно
   * @param {HTMLElement} modal - Элемент модального окна
   */
  closeModal(modal) {
    if (!modal) return;

    // Убираем из списка активных модальных окон
    this.activeModals.delete(modal);
    
    // Анимация исчезновения
    this.animateOut(modal, () => {
      modal.style.display = 'none';
      
      // Если больше нет активных модальных окон, разблокируем скролл
      if (this.activeModals.size === 0) {
        // Восстанавливаем стили
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.top = '';
        
        // Восстанавливаем позицию скролла
        window.scrollTo(0, this.scrollPosition);
      }
    });
  }

  /**
   * Закрывает все модальные окна
   */
  closeAllModals() {
    this.activeModals.forEach(modal => {
      this.closeModal(modal);
    });
  }

  /**
   * Анимация появления модального окна
   * @param {HTMLElement} modal - Элемент модального окна
   */
  animateIn(modal) {
    // Curtain reveals only modal window; backdrop fades simultaneously
    const content = modal.querySelector('.modal-content') || modal;
    
    // Prepare backdrop fade
    const targetBg = 'rgba(0, 0, 0, 0.45)';
    modal.style.transition = 'none';
    const prevBg = getComputedStyle(modal).backgroundColor;
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    
    // Prepare content curtain + slight settle
    if (content) {
      content.style.willChange = 'clip-path, transform, opacity';
      content.style.clipPath = 'inset(0 0 100% 0)';
      content.style.opacity = '0';
      content.style.transformOrigin = 'top center';
      content.style.transform = 'translateY(-8px) scale(0.985)';
    }
    
    // Animate on next frame
    requestAnimationFrame(() => {
      modal.style.transition = 'background-color 400ms ease';
      modal.style.backgroundColor = targetBg;
      
      if (content) {
        content.style.transition = 'clip-path 400ms ease, transform 400ms ease, opacity 400ms ease';
        content.style.clipPath = 'inset(0 0 0 0)';
        content.style.opacity = '1';
        content.style.transform = 'translateY(0) scale(1)';
      }
    });
  }

  /**
   * Анимация исчезновения модального окна
   * @param {HTMLElement} modal - Элемент модального окна
   * @param {Function} callback - Функция обратного вызова
   */
  animateOut(modal, callback) {
    const content = modal.querySelector('.modal-content') || modal;
    
    // Reverse: content curtains up; backdrop fades out
    if (content) {
      // Ensure curtain property present before reversing
      if (!content.style.clipPath) {
        content.style.clipPath = 'inset(0 0 0 0)';
      }
      content.style.transition = 'clip-path 400ms ease, transform 400ms ease, opacity 400ms ease';
      content.style.clipPath = 'inset(0 0 100% 0)';
      content.style.opacity = '0';
      content.style.transform = 'translateY(-8px) scale(0.985)';
    }
    
    modal.style.transition = 'background-color 400ms ease';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0)';

    setTimeout(() => {
      // Cleanup inline styles
      if (content) {
        content.style.willChange = '';
        content.style.clipPath = '';
        content.style.transition = '';
        content.style.opacity = '';
        content.style.transform = '';
        content.style.transformOrigin = '';
      }
      modal.style.transition = '';
      
      // Done
      if (callback) callback();
    }, 400);
  }

  /**
   * Проверяет, открыто ли модальное окно
   * @param {HTMLElement} modal - Элемент модального окна
   * @returns {boolean}
   */
  isModalOpen(modal) {
    return this.activeModals.has(modal);
  }

  /**
   * Получает количество открытых модальных окон
   * @returns {number}
   */
  getActiveModalsCount() {
    return this.activeModals.size;
  }
}

/**
 * Инициализация менеджера модальных окон
 */
let modalManagerInstance = null;

export function initModalManager() {
  if (modalManagerInstance) {
    return modalManagerInstance;
  }

  modalManagerInstance = new ModalManager();

  // Инициализируем при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      modalManagerInstance.init();
    });
  } else {
    modalManagerInstance.init();
  }

  // Экспортируем в window для глобального доступа
  if (typeof window !== 'undefined') {
    window.modalManager = modalManagerInstance;
  }

  return modalManagerInstance;
}

// Автоматическая инициализация если модуль загружен напрямую
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initModalManager();
    });
  } else {
    initModalManager();
  }
}

