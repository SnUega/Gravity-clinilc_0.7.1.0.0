/**
 * ALR Interactive Module
 * Основной контроллер для интерактивных карточек секции ALR
 * 
 * Координирует работу подмодулей:
 * - cards.js - логика открытия/закрытия карточек
 * - animations.js - GSAP анимации для desktop
 * - sliders.js - слайдеры для наград/лицензий
 * - reviews.js - карусель отзывов
 * - mobile.js - мобильные модалки и слайдеры
 * - helpers.js - вспомогательные функции
 * - data.js - данные для слайдеров
 */

import { $, $$, debounce } from '../../core/utils.js';
import { waitForLibrary } from '../../core/utils.js';
import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';
import { CardsManager } from './cards.js';
import { AnimationsManager } from './animations.js';
import { SlidersManager } from './sliders.js';
import { ReviewsManager } from './reviews.js';
import { MobileManager } from './mobile.js';
import { updateDesktopMode, setupMobileHint } from './helpers.js';
import { getSliderData } from './data.js';

/**
 * Класс ALR Interactive
 * Управляет интерактивными карточками секции ALR
 */
export class ALRInteractive {
  constructor(options = {}) {
    this.options = {
      cardsSelector: options.cardsSelector || '.alr-col',
      wrapSelector: options.wrapSelector || '.alr-wrap',
      ...options
    };

    this.cards = [];
    this.wrap = null;
    this.isDesktop = false;
    this.activeCard = null;
    this.isAnimating = false;
    this.hoverTimeout = null;
    this.intersectionObserver = null;
    this.currentTimeline = null;
    this.tempLayers = [];

    // Константы анимации
    this.DURATION = 0.8;
    this.EASE = 'none';

    // Инициализируем менеджеры подмодулей
    this.cardsManager = new CardsManager(this);
    this.animationsManager = new AnimationsManager(this);
    this.slidersManager = new SlidersManager(this);
    this.reviewsManager = new ReviewsManager(this);
    this.mobileManager = new MobileManager(this);
  }

  /**
   * Инициализация
   */
  async init() {
    // Ждем загрузки GSAP
    await waitForLibrary('gsap', 100, 10000);

    // Находим элементы
    this.cards = Array.from($$(this.options.cardsSelector));
    this.wrap = $(this.options.wrapSelector);

    if (!this.cards.length || !this.wrap) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('ALR elements not found'), {
        module: 'alr-interactive',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'init' },
        userMessage: null
      });
      return;
    }

    // Определяем режим (desktop/mobile)
    this.isDesktop = updateDesktopMode();

    // Инициализируем функциональность
    this.setupEventListeners();
    this.setupHoverEffects();
    setupMobileHint();
    this.setupResizeHandler();

    // ALRInteractive initialized
  }

  /**
   * Настройка обработчиков событий
   */
  setupEventListeners() {
    this.cards.forEach(card => {
      const openBtn = card.querySelector('[data-action="open"]');
      const closeBtn = card.querySelector('[data-action="close"]');
      
      if (openBtn) {
        openBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.cardsManager.openCard(card);
        });
      }
      
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this.cardsManager.closeCard();
        });
      }
    });
  }

  /**
   * Настройка hover эффектов
   */
  setupHoverEffects() {
    // Hover effects are handled by CSS only
    // No JavaScript hover logic needed
  }

  /**
   * Настройка обработчика изменения размера
   */
  setupResizeHandler() {
    this.handleResize = debounce(() => {
      this.isDesktop = updateDesktopMode();
    }, 250);
    window.addEventListener('resize', this.handleResize);
  }

  /**
   * Методы для делегирования в подмодули
   */

  // Делегирование в cardsManager
  openCard(card) {
    return this.cardsManager.openCard(card);
  }

  closeCard() {
    return this.cardsManager.closeCard();
  }

  resetALRState() {
    return this.cardsManager.resetALRState();
  }

  cleanupAfterClose() {
    return this.cardsManager.cleanupAfterClose();
  }

  // Делегирование в animationsManager
  openCardDesktop(card, cardType) {
    return this.animationsManager.openCardDesktop(card, cardType);
  }

  closeCardDesktop() {
    return this.animationsManager.closeCardDesktop();
  }

  // Делегирование в mobileManager
  openCardMobile(cardType) {
    return this.mobileManager.openCardMobile(cardType);
  }

  closeCardMobile() {
    return this.mobileManager.closeCardMobile();
  }

  // Делегирование в slidersManager
  createSliderHTML(cardType, data) {
    return this.slidersManager.createSliderHTML(cardType, data);
  }

  setupSliderNavigation(slider, cardType) {
    return this.slidersManager.setupSliderNavigation(slider, cardType);
  }

  // Делегирование в reviewsManager
  createReviewsCarousel() {
    return this.reviewsManager.createReviewsCarousel();
  }

  setupReviewsAutoplay(carousel) {
    return this.reviewsManager.setupReviewsAutoplay(carousel);
  }

  // Делегирование в mobileManager
  createMobileModal(cardType) {
    return this.mobileManager.createMobileModal(cardType);
  }

  // Утилита для получения данных
  getSliderData(cardType) {
    return getSliderData(cardType);
  }

  /**
   * Уничтожение модуля
   */
  destroy() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    
    if (this.currentTimeline) {
      this.currentTimeline.kill();
      this.currentTimeline = null;
    }
    
    const carousels = document.querySelectorAll('.alr-reviews-carousel');
    carousels.forEach(carousel => {
      if (carousel._cleanup) {
        carousel._cleanup();
      }
    });
    
    this.tempLayers.forEach(layer => {
      if (layer && layer.parentNode) {
        layer.parentNode.removeChild(layer);
      }
    });
    this.tempLayers = [];
    
    this.isAnimating = false;
    this.activeCard = null;
  }
}
