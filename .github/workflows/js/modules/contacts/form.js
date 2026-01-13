/**
 * Форма контактов
 * Обработка отправки формы контактов и кастомного dropdown
 */

import { $, $$, throttle } from '../../core/utils.js';
import { CONFIG } from '../../core/config.js';
import { eventManager } from '../../core/events.js';
import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';

/**
 * Класс формы контактов
 */
export class ContactForm {
  constructor(options = {}) {
    this.options = {
      formSelector: options.formSelector || '#contactForm',
      checkboxSelector: options.checkboxSelector || '#agree',
      warningSelector: options.warningSelector || '#warningText',
      modalSelector: options.modalSelector || '#thanksModal',
      modalCloseSelector: options.modalCloseSelector || '#modalClose',
      ringSelector: options.ringSelector || '.ring-progress',
      sendBtnSelector: options.sendBtnSelector || '.send-btn',
      dropdownSelector: options.dropdownSelector || '#customDropdown',
      ...options
    };

    this.form = null;
    this.checkbox = null;
    this.warning = null;
    this.modal = null;
    this.modalClose = null;
    this.ring = null;
    this.sendBtn = null;
    this.dropdown = null;
    this.isSubmitting = false;
    this.autoCloseTimeout = null;
    
    // Throttled handler для mousemove
    this.handleSendBtnMouseMove = throttle(this._handleSendBtnMouseMove.bind(this), 16);
  }
  
  /**
   * Внутренний обработчик движения мыши (для throttle)
   */
  _handleSendBtnMouseMove(e) {
    if (!this.sendBtn) return;

    const rect = this.sendBtn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.sendBtn.style.setProperty('--x', `${x}px`);
    this.sendBtn.style.setProperty('--y', `${y}px`);
  }

  /**
   * Валидация формы
   * @returns {boolean} - true если форма валидна
   */
  validateForm() {
    if (!this.checkbox || !this.checkbox.checked) {
      if (this.warning) {
        this.warning.style.display = 'block';
      }
      return false;
    }

    if (this.warning) {
      this.warning.style.display = 'none';
    }

    return true;
  }

  /**
   * Обработка отправки формы
   */
  handleSubmit = async (e) => {
    e.preventDefault();

    // Предотвращаем множественные отправки
    if (this.isSubmitting) {
      return;
    }

    // Валидация
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData(this.form);

    // Оптимистичный UI: показываем модалку сразу, не дожидаясь ответа сервера
    // Это устраняет задержку и улучшает UX
    this.showThanksModal();
    this.form.reset();

    // Отправляем форму в фоне
    fetch(this.form.action, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(CONFIG.API.TIMEOUT)
    })
    .then(response => {
      if (!response.ok) {
        // Если ошибка, можно показать уведомление, но модалку уже не закрываем
        const errorHandler = getErrorHandler();
        errorHandler.handle(new Error(`Form submission failed: ${response.status}`), {
          module: 'contact-form',
          severity: ERROR_SEVERITY.HIGH,
          context: { status: response.status, formData: Object.fromEntries(formData) },
          userMessage: 'Не удалось отправить форму. Пожалуйста, попробуйте позже или свяжитесь с нами по телефону.',
          showToUser: true,
          sendToServer: true
        });
      }
    })
    .catch(error => {
      // Ошибка сети - логируем, но модалку не закрываем
      const errorHandler = getErrorHandler();
      if (error.name === 'AbortError') {
        errorHandler.handle(error, {
          module: 'contact-form',
          severity: ERROR_SEVERITY.MEDIUM,
          context: { type: 'timeout' },
          userMessage: 'Превышено время ожидания. Пожалуйста, проверьте подключение к интернету и попробуйте снова.',
          showToUser: true
        });
      } else {
        errorHandler.handle(error, {
          module: 'contact-form',
          severity: ERROR_SEVERITY.HIGH,
          context: { type: 'network' },
          userMessage: 'Ошибка сети. Пожалуйста, проверьте подключение к интернету и попробуйте снова.',
          showToUser: true,
          sendToServer: true
        });
      }
    })
    .finally(() => {
      this.isSubmitting = false;
    });
  };

  /**
   * Показ модального окна благодарности
   */
  showThanksModal() {
    if (!this.modal) return;

    // Сбрасываем состояние перед показом
    this.modal.classList.remove('active');
    
    // Небольшая задержка для сброса анимации
    requestAnimationFrame(() => {
      this.modal.classList.add('active');

      // Анимация кольца прогресса
      if (this.ring) {
        // Сбрасываем анимацию
        this.ring.style.transition = 'none';
        this.ring.style.strokeDashoffset = '138';
        void this.ring.offsetWidth; // Force reflow
        
        // Запускаем анимацию
        this.ring.style.transition = 'stroke-dashoffset 3s linear';
        this.ring.style.strokeDashoffset = '0';
      }

      // Автоматическое закрытие через 3 секунды
      if (this.autoCloseTimeout) {
        clearTimeout(this.autoCloseTimeout);
      }
      
      this.autoCloseTimeout = setTimeout(() => {
        this.hideThanksModal();
      }, 3000);
    });
  }

  /**
   * Скрытие модального окна благодарности
   */
  hideThanksModal() {
    if (!this.modal) return;

    // Отменяем автоматическое закрытие если оно было запланировано
    if (this.autoCloseTimeout) {
      clearTimeout(this.autoCloseTimeout);
      this.autoCloseTimeout = null;
    }

    this.modal.classList.remove('active');

    // Сброс анимации кольца
    if (this.ring) {
      this.ring.style.transition = 'none';
      this.ring.style.strokeDashoffset = '138';
    }
    
    // Сбрасываем флаг отправки для возможности повторной отправки
    this.isSubmitting = false;
  }

  /**
   * Обработка ошибки
   * @param {string} message - Сообщение об ошибке
   */
  handleError(message) {
    // TODO: Заменить alert на более красивое уведомление
    alert(message);
  }


  /**
   * Инициализация кастомного dropdown
   */
  initDropdown() {
    if (!this.dropdown) return;

    const selected = this.dropdown.querySelector('.selected');
    const optionsContainer = this.dropdown.querySelector('.dropdown-options');
    const options = this.dropdown.querySelectorAll('.option');
    const hiddenInput = $('#time');

    if (!selected || !optionsContainer || !options.length) {
      return;
    }

    // Обработчик клика по выбранному элементу
    selected.addEventListener('click', () => {
      this.dropdown.classList.toggle('open');
    });

    // Обработчики клика по опциям
    options.forEach(option => {
      option.addEventListener('click', () => {
        selected.textContent = option.textContent;
        
        if (hiddenInput) {
          hiddenInput.value = option.textContent;
        }

        // Убираем выделение с других опций
        options.forEach(o => o.classList.remove('selected-option'));
        option.classList.add('selected-option');

        // Закрываем dropdown
        this.dropdown.classList.remove('open');
      });
    });

    // Закрытие dropdown при клике вне его
    document.addEventListener('click', (e) => {
      if (!this.dropdown.contains(e.target)) {
        this.dropdown.classList.remove('open');
      }
    });
  }

  /**
   * Инициализация формы
   */
  init() {
    // Находим элементы формы
    this.form = $(this.options.formSelector);
    this.checkbox = $(this.options.checkboxSelector);
    this.warning = $(this.options.warningSelector);
    this.modal = $(this.options.modalSelector);
    this.modalClose = $(this.options.modalCloseSelector);
    this.ring = $(this.options.ringSelector);
    this.sendBtn = $(this.options.sendBtnSelector);
    this.dropdown = $(this.options.dropdownSelector);

    if (!this.form) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error(`Contact form ${this.options.formSelector} not found`), {
        module: 'contact-form',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'init', selector: this.options.formSelector },
        userMessage: null
      });
      return;
    }

    // Настраиваем обработчик отправки формы
    this.form.addEventListener('submit', this.handleSubmit);

    // Настраиваем обработчик закрытия модального окна
    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => {
        this.hideThanksModal();
      });
    }

    // Настраиваем эффект движения мыши на кнопке отправки
    if (this.sendBtn) {
      this.sendBtn.addEventListener('mousemove', this.handleSendBtnMouseMove);
    }

    // Инициализируем dropdown
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.initDropdown();
      });
    } else {
      this.initDropdown();
    }

    // ContactForm initialized
  }

  /**
   * Уничтожение формы
   */
  destroy() {
    if (this.form) {
      this.form.removeEventListener('submit', this.handleSubmit);
    }

    if (this.sendBtn) {
      this.sendBtn.removeEventListener('mousemove', this.handleSendBtnMouseMove);
    }

    this.form = null;
    this.checkbox = null;
    this.warning = null;
    this.modal = null;
    this.modalClose = null;
    this.ring = null;
    this.sendBtn = null;
    this.dropdown = null;
    this.isSubmitting = false;
  }
}

/**
 * Инициализация формы контактов
 */
let contactFormInstance = null;

export function initContactForm(options) {
  if (contactFormInstance) {
    return contactFormInstance;
  }

  contactFormInstance = new ContactForm(options);

  // Инициализируем при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      contactFormInstance.init();
    });
  } else {
    contactFormInstance.init();
  }

  return contactFormInstance;
}

// Автоматическая инициализация если модуль загружен напрямую
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initContactForm();
    });
  } else {
    initContactForm();
  }
}

