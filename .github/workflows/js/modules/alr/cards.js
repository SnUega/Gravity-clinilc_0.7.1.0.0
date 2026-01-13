/**
 * Логика открытия/закрытия карточек ALR
 */

import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';

/**
 * Класс для управления карточками
 */
export class CardsManager {
  constructor(context) {
    this.context = context; // Ссылка на основной контекст ALRInteractive
  }

  /**
   * Открытие карточки
   */
  openCard(card) {
    if (this.context.isAnimating || !card) return;
    
    this.context.isAnimating = true;
    this.context.activeCard = card;
    const cardType = card.dataset.card;
    
    card.classList.add('opened');
    this.context.resetALRState();

    const isPortrait = window.innerHeight > window.innerWidth;
    const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    const isIPadPro = window.innerWidth === 1024 && window.innerHeight === 1366;
    const shouldUseDesktop = !isIPadPro && (window.innerWidth > 1024 || (isTablet && !isPortrait));

    try {
      if (shouldUseDesktop) {
        this.context.openCardDesktop(card, cardType);
      } else {
        this.context.openCardMobile(cardType);
      }
    } catch (error) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(error, {
        module: 'alr-cards',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { cardType, isDesktop: shouldUseDesktop },
        fallback: () => {
          this.context.isAnimating = false;
          this.context.activeCard = null;
          card.classList.remove('opened');
        },
        userMessage: null
      });
    }
  }

  /**
   * Закрытие карточки
   */
  closeCard() {
    if (!this.context.activeCard) {
      return;
    }
    
    if (this.context.currentTimeline) {
      this.context.currentTimeline.kill();
    }
    
    this.context.isAnimating = true;
    
    if (this.context.isDesktop) {
      this.context.closeCardDesktop();
    } else {
      this.context.closeCardMobile();
    }
  }

  /**
   * Очистка после закрытия
   */
  cleanupAfterClose() {
    this.context.tempLayers.forEach(layer => {
      if (layer && layer.parentNode) {
        layer.parentNode.removeChild(layer);
      }
    });
    this.context.tempLayers = [];
    
    if (this.context.wrap) {
      this.context.wrap.classList.remove('alr-animating');
    }
    
    gsap.set(this.context.wrap, {
      gridTemplateColumns: '1fr 1fr 1fr'
    });
    
    this.context.cards.forEach((card, index) => {
      if (index === 1) return;
      
      const detailContent = card.querySelector('.alr-detail-content');
      if (detailContent) {
        gsap.set(detailContent, {
          clipPath: 'inset(0 100% 0 0)'
        });
      }
    });
    
    if (this.context.cards && this.context.cards.length > 0) {
      gsap.set(this.context.cards, { clearProps: 'zIndex' });
    }
    
    if (this.context.activeCard) {
      this.context.activeCard.classList.remove('opened');
    }
    
    this.context.isAnimating = false;
    this.context.activeCard = null;
    this.context.currentTimeline = null;
  }

  /**
   * Полный сброс состояния ALR
   */
  resetALRState() {
    if (this.context.wrap) {
      this.context.wrap.classList.remove('alr-animating');
      gsap.set(this.context.wrap, { gridTemplateColumns: '1fr 1fr 1fr' });
    }

    const selectors = [
      '.alr-shutter',
      '.alr-content-panel',
      '.alr-reviews-carousel',
      '.alr-center-half-left',
      '.alr-center-half-right'
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.parentNode && el.parentNode.removeChild(el));
    });

    this.context.tempLayers = [];

    if (this.context.cards && this.context.cards.length > 0) {
      gsap.set(this.context.cards, { xPercent: 0, x: 0, clearProps: 'transform,zIndex' });
    }

    const centerCard = this.context.cards && this.context.cards[1];
    if (centerCard) {
      const centerContent = centerCard.querySelector('.alr-main-content');
      if (centerContent) gsap.set(centerContent, { opacity: 1 });
    }

    this.context.cards && this.context.cards.forEach((card, index) => {
      if (index === 1) return;
      const detail = card.querySelector('.alr-detail-content');
      if (detail) {
        gsap.set(detail, { clipPath: index === 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)' });
      }
    });

    if (this.context.currentTimeline) {
      this.context.currentTimeline.kill();
      this.context.currentTimeline = null;
    }

    this.context.isAnimating = false;
  }
}

