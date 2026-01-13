/**
 * Параллакс эффект для секции услуг
 * Анимация карточек услуг при скролле
 */

import { $, $$ } from '../../core/utils.js';
import { CONFIG } from '../../core/config.js';
import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';

/**
 * Класс параллакс эффекта для услуг
 */
export class ServicesParallax {
  constructor(options = {}) {
    this.options = {
      sectionSelector: options.sectionSelector || '#services-section',
      cardSelector: options.cardSelector || '.service-card',
      startOffset: options.startOffset || 90,
      midOffsets: options.midOffsets || [18, 26, 34],
      finalOffsets: options.finalOffsets || [2, 1, 0],
      phaseGap: options.phaseGap || 0.22,
      split: options.split || 0.62,
      ...options
    };

    this.section = null;
    this.cards = [];
    this.scrollTrigger = null;
    this.exitTimeline = null;
    this.pinTrigger = null;
    
    // Кэш для производительности
    this.isParallaxDisabled = false; // Кэш результата shouldDisableParallax
    this.deviceMediaQueries = null; // Кэш MediaQueryList
    this.windowHeight = 0; // Кэш высоты окна
  }

  /**
   * Проверка, нужно ли отключить параллакс (мобильные устройства)
   * Оптимизировано: кэширует результат и обновляет только при resize
   */
  calculateParallaxDisabled() {
    const isMobileOrTabletPortrait = window.innerWidth <= 1024 || 
      (window.innerWidth > 768 && window.innerWidth <= 1024 && window.innerHeight > window.innerWidth);
    
    return isMobileOrTabletPortrait;
  }
  
  /**
   * Получение кэшированного результата проверки
   */
  shouldDisableParallax() {
    return this.isParallaxDisabled;
  }

  /**
   * Инициализация параллакс эффекта
   */
  init() {
    // Проверяем наличие GSAP и ScrollTrigger
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('GSAP or ScrollTrigger not available'), {
        module: 'services-parallax',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'init' },
        userMessage: null
      });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Находим секцию и карточки
    this.section = $(this.options.sectionSelector);
    if (!this.section) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error(`Section ${this.options.sectionSelector} not found`), {
        module: 'services-parallax',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'init', selector: this.options.sectionSelector },
        userMessage: null
      });
      return;
    }

    this.cards = Array.from($$(this.options.cardSelector, this.section));
    if (this.cards.length === 0) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error(`No cards found with selector ${this.options.cardSelector}`), {
        module: 'services-parallax',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'init', selector: this.options.cardSelector },
        userMessage: null
      });
      return;
    }

    // Кэшируем результат проверки параллакса
    this.isParallaxDisabled = this.calculateParallaxDisabled();
    
    // Кэшируем высоту окна
    this.windowHeight = window.innerHeight;

    // Подготовка padding по высоте под pin (чтобы не было «среза» при удержании)
    this._originalPaddingBottom = null;
    
    // Настраиваем обработчик resize для обновления кэша
    window.addEventListener('resize', () => {
      this.isParallaxDisabled = this.calculateParallaxDisabled();
      this.windowHeight = window.innerHeight;
    });
    
    // Проверяем, нужно ли отключить параллакс
    if (this.isParallaxDisabled) {
      // Для мобильных/планшетов в портретной ориентации: отключаем параллакс
      gsap.set(this.cards, { yPercent: 0 });
      return;
    }

    // Добавляем дополнительное пространство снизу на величину pin (~12vh)
    // Это исключает «срез» карточек нижней границей следующей секции, не меняя их высоту
    if (this.section) {
      this._originalPaddingBottom = this.section.style.paddingBottom || '';
      this.section.style.paddingBottom = '12vh';
    }

    // Улучшаем производительность отрисовки
    this.cards.forEach(el => {
      el.style.willChange = 'transform';
    });

    // Устанавливаем начальные позиции вне экрана
    gsap.set(this.cards, { yPercent: this.options.startOffset });

    // Создаем анимацию входа
    this.createEnterAnimation();

    // Создаем анимацию выхода
    this.createExitAnimation();

    // Создаем микро-фиксацию
    this.createPinTrigger();

    // ServicesParallax initialized
  }

  /**
   * Создание единой непрерывной анимации входа и выхода
   * Объединяет enter и exit в одну анимацию для предотвращения конфликтов и дерганий
   */
  createEnterAnimation() {
    const { startOffset, midOffsets, finalOffsets, phaseGap, split } = this.options;
    
    // Предвычисляем функции для оптимизации
    const clamp01 = gsap.utils.clamp(0, 1);
    const lerp = (a, b, t) => a + (b - a) * t;
    const easeOutQuad = t => 1 - (1 - t) * (1 - t);
    
    // Предвычисляем коэффициенты для каждой карточки
    const cardCoefficients = this.cards.map((card, i) => {
      const mid = midOffsets[i % midOffsets.length];
      const fin = finalOffsets[i % finalOffsets.length];
      return { mid, fin, phaseOffset: i * phaseGap };
    });

    // АНИМАЦИЯ ВХОДА (как в оригинале)
    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.section,
      start: 'top 70%',
      end: 'top top',
      scrub: true,
      immediateRender: true,
      invalidateOnRefresh: true,
      onUpdate: (() => {
        // Throttle для onUpdate - обновляем максимум 60 раз в секунду
        let lastUpdateTime = 0;
        const throttleMs = 16; // ~60fps
        
        return (self) => {
          const now = performance.now();
          if (now - lastUpdateTime < throttleMs) return;
          lastUpdateTime = now;
          
          const p = clamp01(self.progress); // 0..1
          
          // Используем предвычисленные коэффициенты
          this.cards.forEach((card, i) => {
            const { mid, fin, phaseOffset } = cardCoefficients[i];
            
            // Локальный прогресс карточки с фазовым сдвигом
            const local = clamp01((p - phaseOffset) / (1 - phaseOffset));
            let y;
            
            if (local <= split) {
              const t = local / split; // быстрая фаза
              y = lerp(startOffset, mid, t);
            } else {
              const t = (local - split) / (1 - split); // медленная фаза
              const eased = easeOutQuad(t);
              y = lerp(mid, fin, eased);
            }
            
            gsap.set(card, { yPercent: y });
          });
        };
      })()
    });

    // АНИМАЦИЯ ВЫХОДА (используем timeline как в оригинале)
    // Exit начинается сразу после входа, но timeline автоматически учитывает pin
    this.exitTimeline = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: this.section,
        start: 'top top',      // Начинается когда секция достигает верха
        end: 'bottom top',     // Пока секция уходит вверх
        scrub: true,
        immediateRender: false,
        invalidateOnRefresh: true,
        // Важно: timeline автоматически паузится во время pin
        // и продолжит работу после завершения pin
      }
    });

    // Каскадное уплывание вверх (как в оригинале)
    const neededOrder = this.cards.slice();
    neededOrder.forEach((card, idx) => {
      this.exitTimeline.to(card, { yPercent: -80 }, idx * 0.2);
    });
  }

  /**
   * Создание анимации выхода
   * Теперь использует отдельный ScrollTrigger вместо timeline
   */
  createExitAnimation() {
    // Exit анимация создается в createEnterAnimation для правильной последовательности
  }

  /**
   * Создание микро-фиксации
   * Мягко фиксирует секцию когда она заполняет экран
   */
  createPinTrigger() {
    // Кэшируем высоту окна для end функции
    const endOffset = Math.round(this.windowHeight * 0.12); // ~12% vh
    
    // Micro-fixation: short hold when all cards have landed (whole section), no spacing
    this.pinTrigger = ScrollTrigger.create({
      trigger: this.section,
      start: 'top top',
      end: () => `+=${endOffset}`, // Используем кэшированное значение
      pin: true,
      pinSpacing: false,
      anticipatePin: 1,
      fastScrollEnd: false
    });
  }

  /**
   * Обновление при изменении размера окна
   */
  refresh() {
    // Обновляем кэш высоты окна и проверки параллакса
    this.windowHeight = window.innerHeight;
    this.isParallaxDisabled = this.calculateParallaxDisabled();
    
    if (this.scrollTrigger) {
      this.scrollTrigger.refresh();
    }
    if (this.exitTimeline) {
      ScrollTrigger.refresh();
    }
    if (this.pinTrigger) {
      this.pinTrigger.refresh();
    }
  }

  /**
   * Уничтожение параллакс эффекта
   */
  destroy() {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
      this.scrollTrigger = null;
    }
    
    if (this.exitTimeline) {
      this.exitTimeline.kill();
      this.exitTimeline = null;
    }
    
    if (this.pinTrigger) {
      this.pinTrigger.kill();
      this.pinTrigger = null;
    }

    // Восстанавливаем исходный padding секции
    if (this.section && this._originalPaddingBottom !== null) {
      this.section.style.paddingBottom = this._originalPaddingBottom;
      this._originalPaddingBottom = null;
    }

    // Сбрасываем стили карточек
    if (this.cards.length > 0) {
      gsap.set(this.cards, { yPercent: 0, clearProps: 'willChange' });
    }
  }
}

/**
 * Инициализация параллакс эффекта
 */
let parallaxInstance = null;

export function initServicesParallax(options) {
  if (parallaxInstance) {
    return parallaxInstance;
  }

  parallaxInstance = new ServicesParallax(options);
  
  // Ждем загрузки DOM и GSAP
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Ждем загрузки GSAP
      if (typeof gsap !== 'undefined') {
        parallaxInstance.init();
      } else {
        // Пытаемся подождать GSAP
        const checkGSAP = setInterval(() => {
          if (typeof gsap !== 'undefined') {
            clearInterval(checkGSAP);
            parallaxInstance.init();
          }
        }, 100);
        
        setTimeout(() => clearInterval(checkGSAP), 10000);
      }
    });
  } else {
    if (typeof gsap !== 'undefined') {
      parallaxInstance.init();
    }
  }

  return parallaxInstance;
}

// Автоматическая инициализация если модуль загружен напрямую
if (typeof window !== 'undefined' && CONFIG.FEATURES.PARALLAX) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initServicesParallax();
    });
  } else {
    initServicesParallax();
  }
}

