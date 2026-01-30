/**
 * Логика карточек секции "О нас"
 * Анимация появления карточек и раскрытие overlay
 */

import { $, $$, isTablet, isPortrait } from '../../core/utils.js';
import { delegate } from '../../core/events.js';
import { CONFIG } from '../../core/config.js';
import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';

/**
 * Класс управления карточками
 */
export class CardsManager {
  constructor(options = {}) {
    this.options = {
      sectionSelector: options.sectionSelector || '#about',
      cardSelector: options.cardSelector || '.card',
      containerSelector: options.containerSelector || '.cards-container',
      buildDuration: options.buildDuration || (() => Math.max(window.innerHeight * 1.1, 900)),
      pauseAfter: options.pauseAfter || 120,
      delayBetween: options.delayBetween || 0.38,
      animationDuration: options.animationDuration || 0.95,
      holdBeforeReveal: options.holdBeforeReveal || 0.22,
      ...options
    };

    this.section = null;
    this.cards = [];
    this.container = null;
    this.timeline = null;
    this.scrollTrigger = null;
    this.openCards = new Set(); // Отслеживаем открытые карточки
    this.isAnimating = new Set(); // Отслеживаем карточки в процессе анимации
    
    // Кэш для matchMedia результатов
    this.deviceTypeCache = null;
    this.mediaQueries = {
      smallTabletPortrait: null,
      iPadAirPortrait: null
    };
  }

  /**
   * Инициализация кэша MediaQueryList
   */
  initMediaQueries() {
    this.mediaQueries.smallTabletPortrait = window.matchMedia('(orientation: portrait) and (min-width: 700px) and (max-width: 820px)');
    this.mediaQueries.iPadAirPortrait = window.matchMedia('(orientation: portrait) and (min-width: 810px) and (max-width: 834px)');
    
    // Обновляем кэш при изменении медиа-запросов
    const updateCache = () => {
      this.deviceTypeCache = {
        isSmallTabletPortrait: this.mediaQueries.smallTabletPortrait.matches,
        isIPadAirPortrait: this.mediaQueries.iPadAirPortrait.matches
      };
    };
    
    this.mediaQueries.smallTabletPortrait.addEventListener('change', updateCache);
    this.mediaQueries.iPadAirPortrait.addEventListener('change', updateCache);
    
    // Инициализируем кэш
    updateCache();
  }

  /**
   * Проверка типа устройства для адаптивности
   * Оптимизировано: использует кэшированные результаты
   */
  getDeviceType() {
    // Если кэш не инициализирован, инициализируем его
    if (this.deviceTypeCache === null) {
      this.initMediaQueries();
    }
    
    return this.deviceTypeCache || {
      isSmallTabletPortrait: false,
      isIPadAirPortrait: false
    };
  }

  /**
   * Инициализация анимации появления карточек
   */
  initScrollAnimation() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('GSAP or ScrollTrigger not available'), {
        module: 'cards-manager',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'initScrollAnimation' },
        userMessage: null
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    this.section = $(this.options.sectionSelector);
    if (!this.section) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error(`Section ${this.options.sectionSelector} not found`), {
        module: 'cards-manager',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'initScrollAnimation', selector: this.options.sectionSelector },
        userMessage: null
      });
      return;
    }

    this.cards = Array.from($$(this.options.cardSelector, this.section));
    if (this.cards.length === 0) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error(`No cards found with selector ${this.options.cardSelector}`), {
        module: 'cards-manager',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'initScrollAnimation', selector: this.options.cardSelector },
        userMessage: null
      });
      return;
    }

    const deviceType = this.getDeviceType();

    // Создаем timeline для анимации появления карточек
    this.timeline = gsap.timeline({
      scrollTrigger: {
        trigger: this.section,
        start: 'top top',
        end: () => `+=${this.options.buildDuration() + this.options.pauseAfter}`,
        scrub: true,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        fastScrollEnd: true
      }
    });

    // Пауза перед началом сборки после фиксации
    this.timeline.to({}, { duration: this.options.holdBeforeReveal });

    // Анимация появления каждой карточки
    this.cards.forEach((card, i) => {
      const startTime = this.options.holdBeforeReveal + i * (this.options.animationDuration + this.options.delayBetween);

      // Финишное положение по устройствам
      const yEnd = deviceType.isIPadAirPortrait
        ? (window.innerHeight * (0.30 + i * 0.06))
        : 0;

      // Стартовые смещения по устройствам
      const yStart = deviceType.isIPadAirPortrait
        ? (yEnd + (window.innerHeight * 0.18))
        : (deviceType.isSmallTabletPortrait
            ? (-560 + i * 18)
            : (i % 2 === 0 ? 140 : -140));

      this.timeline.fromTo(card,
        {
          opacity: 0,
          y: yStart
        },
        {
          opacity: 1,
          y: yEnd,
          duration: this.options.animationDuration,
          ease: 'power3.out'
        },
        startTime
      );
    });

    // Инициализируем кэш медиа-запросов
    this.initMediaQueries();
  }

  /**
   * Инициализация обработчиков открытия/закрытия карточек
   */
  initCardHandlers() {
    this.cards.forEach(card => {
      const openBtn = card.querySelector('.open');
      const closeBtn = card.querySelector('.close');
      const overlay = card.querySelector('.overlay');

      if (!openBtn || !closeBtn || !overlay) {
        const errorHandler = getErrorHandler();
        errorHandler.handle(new Error('Card missing required elements'), {
          module: 'cards-manager',
          severity: ERROR_SEVERITY.LOW,
          context: { action: 'openCard', card: card ? card.className : 'unknown' },
          userMessage: null
        });
        return;
      }

      // Устанавливаем начальное состояние
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.pointerEvents = 'none';
      openBtn.setAttribute('aria-expanded', 'false');

      // Обработчик открытия карточки
      openBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Проверяем, не открыта ли уже карточка и не идет ли анимация
        if (this.openCards.has(card) || this.isAnimating.has(card)) {
          return;
        }

        this.openCard(card, openBtn, closeBtn, overlay);
      });

      // Обработчик закрытия карточки
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Проверяем, открыта ли карточка и не идет ли анимация
        if (!this.openCards.has(card) || this.isAnimating.has(card)) {
          return;
        }

        this.closeCard(card, openBtn, closeBtn, overlay);
      });
    });

    // Делегирование событий для мобильных/планшетов
    this.initDelegation();
  }

  /**
   * Открытие карточки
   */
  openCard(card, openBtn, closeBtn, overlay) {
    this.isAnimating.add(card);
    this.openCards.add(card);

    // Обновляем ARIA атрибуты
    openBtn.setAttribute('aria-expanded', 'true');
    overlay.setAttribute('aria-hidden', 'false');
    overlay.style.pointerEvents = 'auto';

    // Анимация открытия
    if (typeof gsap !== 'undefined') {
      gsap.to(overlay, {
        y: '0%',
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => {
          this.isAnimating.delete(card);
        }
      });
    } else {
      // Fallback без GSAP
      overlay.style.transform = 'translateY(0%)';
      overlay.style.opacity = '1';
      this.isAnimating.delete(card);
    }
  }

  /**
   * Закрытие карточки
   */
  closeCard(card, openBtn, closeBtn, overlay) {
    this.isAnimating.add(card);

    // Обновляем ARIA атрибуты
    openBtn.setAttribute('aria-expanded', 'false');
    overlay.setAttribute('aria-hidden', 'true');

    // Анимация закрытия
    if (typeof gsap !== 'undefined') {
      gsap.to(overlay, {
        y: '100%',
        opacity: 0,
        duration: 0.6,
        ease: 'power2.in',
        onComplete: () => {
          overlay.style.pointerEvents = 'none';
          this.openCards.delete(card);
          this.isAnimating.delete(card);
        }
      });
    } else {
      // Fallback без GSAP
      overlay.style.transform = 'translateY(100%)';
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      this.openCards.delete(card);
      this.isAnimating.delete(card);
    }
  }

  /**
   * Инициализация делегирования событий для мобильных устройств
   * Исправляет проблему с кликами по перекрывающимся карточкам
   */
  initDelegation() {
    this.container = $(this.options.containerSelector);
    if (!this.container) {
      return;
    }

    // Делегирование событий для корректной обработки тапов по скрытым кнопкам
    const delegateHandler = (event) => {
      // Если уже нажали непосредственно на кнопку, выходим
      const directButton = event.target && event.target.closest && 
        event.target.closest('button.open, button.close');
      if (directButton) {
        return;
      }

      const x = event.clientX;
      const y = event.clientY;
      if (typeof x !== 'number' || typeof y !== 'number') {
        return;
      }

      // Получаем все элементы под точкой касания
      const stack = document.elementsFromPoint(x, y);
      if (!Array.isArray(stack)) {
        return;
      }

      // Находим первую подходящую кнопку под точкой касания
      const targetBtn = stack.find(el => 
        el instanceof Element && 
        el.matches && 
        el.matches('button.open, button.close')
      );

      if (targetBtn) {
        // Проверяем состояние карточки перед кликом
        const card = targetBtn.closest('.card');
        if (!card) {
          return;
        }

        const overlay = card.querySelector('.overlay');
        const isOpen = overlay && overlay.getAttribute('aria-hidden') === 'false';
        const isButtonOpen = targetBtn.classList.contains('open');
        const isButtonClose = targetBtn.classList.contains('close');

        // Предотвращаем клик, если:
        // 1. Пытаемся открыть уже открытую карточку
        // 2. Пытаемся закрыть уже закрытую карточку
        if ((isButtonOpen && isOpen) || (isButtonClose && !isOpen)) {
          event.preventDefault();
          return;
        }

        // Предотвращаем действие верхнего слоя и инициируем клик по нужной кнопке
        try {
          event.preventDefault();
          event.stopPropagation();
          targetBtn.click();
        } catch (e) {
          const errorHandler = getErrorHandler();
          errorHandler.handle(e, {
            module: 'cards-manager',
            severity: ERROR_SEVERITY.LOW,
            context: { action: 'delegation' },
            userMessage: null
          });
        }
      }
    };

    // Используем pointerdown для раннего срабатывания
    this.container.addEventListener('pointerdown', delegateHandler, { passive: false });
  }

  /**
   * Инициализация модуля
   */
  init() {
    this.initScrollAnimation();
    this.initCardHandlers();
    // CardsManager initialized
  }

  /**
   * Обновление при изменении размера окна
   */
  refresh() {
    if (this.scrollTrigger) {
      this.scrollTrigger.refresh();
    }
    if (this.timeline) {
      ScrollTrigger.refresh();
    }
  }

  /**
   * Уничтожение модуля
   */
  destroy() {
    // Закрываем все открытые карточки
    this.openCards.forEach(card => {
      const overlay = card.querySelector('.overlay');
      const openBtn = card.querySelector('.open');
      const closeBtn = card.querySelector('.close');
      if (overlay && openBtn && closeBtn) {
        this.closeCard(card, openBtn, closeBtn, overlay);
      }
    });

    this.openCards.clear();
    this.isAnimating.clear();

    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
      this.scrollTrigger = null;
    }

    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }

    // Сбрасываем стили карточек
    if (this.cards.length > 0) {
      gsap.set(this.cards, { clearProps: 'opacity,y' });
    }
  }
}

/**
 * Инициализация менеджера карточек
 */
let cardsManagerInstance = null;

export function initCardsManager(options) {
  if (cardsManagerInstance) {
    return cardsManagerInstance;
  }

  cardsManagerInstance = new CardsManager(options);

  // Ждем загрузки DOM и GSAP
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (typeof gsap !== 'undefined') {
        cardsManagerInstance.init();
      } else {
        // Пытаемся подождать GSAP
        const checkGSAP = setInterval(() => {
          if (typeof gsap !== 'undefined') {
            clearInterval(checkGSAP);
            cardsManagerInstance.init();
          }
        }, 100);

        setTimeout(() => clearInterval(checkGSAP), 10000);
      }
    });
  } else {
    if (typeof gsap !== 'undefined') {
      cardsManagerInstance.init();
    }
  }

  return cardsManagerInstance;
}

// Автоматическая инициализация если модуль загружен напрямую
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initCardsManager();
    });
  } else {
    initCardsManager();
  }
}
