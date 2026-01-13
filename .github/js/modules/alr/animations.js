/**
 * GSAP анимации для desktop версии ALR
 */

import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';

/**
 * Класс для управления анимациями
 */
export class AnimationsManager {
  constructor(context) {
    this.context = context;
  }

  /**
   * Открытие карточки на desktop
   */
  openCardDesktop(card, cardType) {
    if (cardType === 'reviews') {
      this.openCenterCardSimple(card);
    } else {
      this.context.currentTimeline = gsap.timeline({
        onComplete: () => {
          this.context.isAnimating = false;
        }
      });
      this.openSideCard(card, cardType);
    }
  }

  /**
   * Открытие центральной карточки (Отзывы)
   */
  openCenterCardSimple(card) {
    this.context.cardsManager.resetALRState();
    if (this.context.currentTimeline) {
      this.context.currentTimeline.kill();
    }
    
    this.context.isAnimating = false;
    
    const leftCard = this.context.cards[0];
    const rightCard = this.context.cards[2];
    
    if (this.context.cards && this.context.cards.length > 0) {
      gsap.set(this.context.cards, {
        xPercent: 0,
        x: 0,
        clearProps: 'transform'
      });
    }
    
    if (leftCard) gsap.set(leftCard, { xPercent: 0, zIndex: 10, force3D: true });
    if (rightCard) gsap.set(rightCard, { xPercent: 0, zIndex: 10, force3D: true });
    
    const centerCard = this.context.cards[1];
    
    // Левая половина
    const leftHalf = document.createElement('div');
    leftHalf.className = 'alr-center-half-left';
    leftHalf.style.cssText = `
      position: absolute;
      top: 0;
      left: 33.333%;
      width: 16.6665%;
      height: 100%;
      background: #fff;
      z-index: 3;
      transform-origin: left center;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      will-change: transform;
    `;
    
    // Правая половина
    const rightHalf = document.createElement('div');
    rightHalf.className = 'alr-center-half-right';
    rightHalf.style.cssText = `
      position: absolute;
      top: 0;
      left: 50%;
      width: 16.6665%;
      height: 100%;
      background: #fff;
      z-index: 3;
      transform-origin: right center;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      will-change: transform;
    `;
    
    // Копируем контент
    const centerContent = centerCard.querySelector('.alr-main-content');
    if (centerContent) {
      const leftContent = centerContent.cloneNode(true);
      const rightContent = centerContent.cloneNode(true);
      
      leftContent.style.cssText = `
        position: absolute;
        top: 50%;
        left: 0;
        transform: translateY(-50%);
        width: 200%;
        text-align: center;
        padding: 0 20px;
        box-sizing: border-box;
      `;
      
      rightContent.style.cssText = `
        position: absolute;
        top: 50%;
        left: -100%;
        transform: translateY(-50%);
        width: 200%;
        text-align: center;
        padding: 0 20px;
        box-sizing: border-box;
      `;
      
      const leftH3 = leftContent.querySelector('h3');
      const rightH3 = rightContent.querySelector('h3');
      
      if (leftH3) {
        leftH3.style.cssText = `
          font-size: 32px;
          font-weight: 400;
          margin-bottom: 24px;
          color: #1a1a1a;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 0;
          padding: 0;
          line-height: 1.2;
        `;
      }
      
      if (rightH3) {
        rightH3.style.cssText = `
          font-size: 32px;
          font-weight: 400;
          margin-bottom: 24px;
          color: #1a1a1a;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 0;
          padding: 0;
          line-height: 1.2;
        `;
      }
      
      leftHalf.appendChild(leftContent);
      rightHalf.appendChild(rightContent);
    }
    
    this.context.wrap.appendChild(leftHalf);
    this.context.wrap.appendChild(rightHalf);
    this.context.tempLayers.push(leftHalf, rightHalf);
    
    if (centerContent) {
      gsap.set(centerContent, { opacity: 0 });
    }
    
    this.context.currentTimeline = gsap.timeline({
      onComplete: () => {
        this.context.isAnimating = false;
      }
    });
    
    const panel = document.createElement('div');
    panel.className = 'alr-content-panel alr-reviews-panel';
    panel.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      background: #fff;
      pointer-events: auto;
      overflow: hidden;
      opacity: 1;
      will-change: opacity;
    `;
    
    const carousel = this.context.reviewsManager.createReviewsCarousel();
    panel.appendChild(carousel);
    gsap.set(carousel, { clipPath: 'inset(0 0 0 0)' });
    this.context.wrap.appendChild(panel);
    this.context.tempLayers.push(panel);
    
    this.context.currentTimeline
      .to(leftCard, {
        xPercent: -100,
        duration: .7,
        ease: 'power2.out',
        force3D: true
      })
      .to(rightCard, {
        xPercent: 100,
        duration: .7,
        ease: 'power2.out',
        force3D: true
      }, 0)
      .to(leftHalf, {
        x: '-305%',
        duration: 1.3,
        ease: 'power2.out',
        force3D: true
      }, 0)
      .to(rightHalf, {
        x: '305%',
        duration: 1.3,
        ease: 'power2.out',
        force3D: true
      }, 0)
      .set(this.context.wrap, { gridTemplateColumns: '0fr 1fr 0fr' }, 2.2);
    
    const backBtn = panel.querySelector('.alr-reviews-back');
    if (backBtn) backBtn.addEventListener('click', () => this.context.cardsManager.closeCard());
  }

  /**
   * Открытие боковой карточки
   */
  openSideCard(card, cardType) {
    const isLeft = cardType === 'awards';
    const otherCards = this.context.cards ? Array.from(this.context.cards).filter(c => c !== card && c != null) : [];
    
    this.context.wrap.classList.add('alr-animating');
    if (otherCards && otherCards.length > 0) {
      gsap.set(otherCards, { zIndex: 6 });
    }
    
    const shutter = document.createElement('div');
    shutter.className = 'alr-shutter';
    shutter.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #fff;
      z-index: 10;
      clip-path: ${isLeft ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)'};
      pointer-events: auto;
      padding: 40px;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      text-align: center;
    `;
    
    const detailContent = card.querySelector('.alr-detail-content');
    if (detailContent) {
      shutter.innerHTML = detailContent.innerHTML;
      
      const backBtn = shutter.querySelector('[data-action="close"]');
      if (backBtn) {
        backBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.context.cardsManager.closeCard();
        });
      }
    }
    
    card.appendChild(shutter);
    this.context.tempLayers.push(shutter);
    
    const contentPanel = document.createElement('div');
    contentPanel.className = 'alr-content-panel';
    
    if (isLeft) {
      contentPanel.style.cssText = `
        position: absolute;
        top: 0;
        left: 33.333%;
        height: 100%;
        z-index: 4;
        background: #fff;
        pointer-events: auto;
        width: 66.667%;
        overflow: hidden;
      `;
      contentPanel.classList.add('align-left');
    } else {
      contentPanel.style.cssText = `
        position: absolute;
        top: 0;
        right: 33.333%;
        height: 100%;
        z-index: 4;
        background: #fff;
        pointer-events: auto;
        width: 66.667%;
        overflow: hidden;
      `;
      contentPanel.classList.add('align-right');
    }
    
    const sliderData = this.context.getSliderData(cardType);
    contentPanel.innerHTML = this.context.slidersManager.createSliderHTML(cardType, sliderData);
    this.context.wrap.appendChild(contentPanel);
    this.context.tempLayers.push(contentPanel);

    const panelStart = 0.4;

    if (!shutter || !contentPanel) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('Failed to create shutter or contentPanel'), {
        module: 'alr-animations',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'openCardDesktop', cardType },
        userMessage: null
      });
      this.context.isAnimating = false;
      return;
    }
    
    this.context.currentTimeline = gsap.timeline();
    
    this.context.currentTimeline.to(shutter, {
      clipPath: isLeft ? 'inset(0 0% 0 0)' : 'inset(0 0 0 0%)',
      duration: 0.4,
      ease: this.context.EASE,
      force3D: true
    }, 0);
    
    if (otherCards && Array.isArray(otherCards) && otherCards.length > 0) {
      const validCards = otherCards.filter(card => card && card.nodeType === 1);
      if (validCards.length > 0) {
        this.context.currentTimeline.to(validCards, {
          xPercent: isLeft ? 200 : -200,
          duration: 0.8,
          ease: this.context.EASE,
          force3D: true
        }, panelStart);
      }
    }
    
    this.context.slidersManager.setupSliderNavigation(contentPanel, cardType);
    
    this.context.currentTimeline.call(() => {
      if (this.context.wrap) {
        this.context.wrap.classList.remove('alr-animating');
      }
      if (otherCards && otherCards.length > 0) {
        gsap.set(otherCards, { clearProps: 'zIndex' });
      }
      if (contentPanel) {
        const sliderRoot = contentPanel.querySelector('.alr-slider-content');
        if (sliderRoot) {
          const event = new Event('resize');
          window.dispatchEvent(event);
        }
      }
    }, 1.2);
    
    this.context.currentTimeline.call(() => {
      this.context.isAnimating = false;
    }, 1.1);
  }

  /**
   * Закрытие карточки на desktop
   */
  closeCardDesktop() {
    if (this.context.activeCard && this.context.activeCard.dataset.card === 'reviews') {
      const leftCard = this.context.cards[0];
      const rightCard = this.context.cards[2];
      const leftHalf = document.querySelector('.alr-center-half-left');
      const rightHalf = document.querySelector('.alr-center-half-right');
      
      this.context.currentTimeline = gsap.timeline({
        onComplete: () => {
          if (this.context.cards && this.context.cards.length > 0) {
            gsap.set(this.context.cards, {
              xPercent: 0,
              x: 0,
              clearProps: 'transform,zIndex'
            });
          }
          
          if (leftHalf) gsap.set(leftHalf, { x: 0, clearProps: 'transform' });
          if (rightHalf) gsap.set(rightHalf, { x: 0, clearProps: 'transform' });
          
          const centerCard = this.context.cards[1];
          const centerContent = centerCard.querySelector('.alr-main-content');
          if (centerContent) {
            gsap.set(centerContent, { opacity: 1 });
          }
          
          this.context.cardsManager.cleanupAfterClose();
          this.context.isAnimating = false;
        }
      });
      
      this.context.currentTimeline
        .set(this.context.wrap, { gridTemplateColumns: '1fr 1fr 1fr' }, 0)
        .to(leftHalf, {
          x: 0,
          duration: 1.55,
          ease: 'power2.out',
          force3D: true
        }, 0)
        .to(rightHalf, {
          x: 0,
          duration: 1.55,
          ease: 'power2.out',
          force3D: true
        }, 0)
        .to(leftCard, {
          xPercent: 0,
          duration: 1.0,
          ease: 'power2.out',
          force3D: true
        }, 0)
        .to(rightCard, {
          xPercent: 0,
          duration: 1.0,
          ease: 'power2.out',
          force3D: true
        }, 0);
      
      return;
    }

    if (this.context.currentTimeline) {
      this.context.currentTimeline.reverse();
      this.context.currentTimeline.eventCallback('onReverseComplete', () => {
        this.context.cardsManager.cleanupAfterClose();
      });
      this.context.currentTimeline.eventCallback('onReverseStart', () => {
        const card = this.context.activeCard;
        const otherCards = this.context.cards ? Array.from(this.context.cards).filter(c => c !== card && c != null) : [];
        if (this.context.wrap) {
          this.context.wrap.classList.add('alr-animating');
        }
        if (otherCards && otherCards.length > 0) {
          gsap.set(otherCards, { zIndex: 6 });
        }
      });
    } else {
      this.context.cardsManager.cleanupAfterClose();
    }
  }
}

