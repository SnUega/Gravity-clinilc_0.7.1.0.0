/**
 * Мобильные модалки и слайдеры
 */

import { debounce } from '../../core/utils.js';
import { getSliderData } from './data.js';

/**
 * Класс для управления мобильными модалками
 */
export class MobileManager {
  constructor(context) {
    this.context = context;
  }

  /**
   * Открытие карточки на mobile
   */
  openCardMobile(cardType) {
    const modal = this.createMobileModal(cardType);
    document.body.appendChild(modal);
    
    document.body.style.overflow = 'hidden';
    
    if (window.modalManager) {
      window.modalManager.openModal(modal);
      this.context.isAnimating = false;
    } else {
      gsap.fromTo(modal, 
        { opacity: 0, scale: 0.8 },
        { 
          opacity: 1, 
          scale: 1, 
          duration: 0.3, 
          ease: "back.out(1.7)",
          onComplete: () => {
            this.context.isAnimating = false;
          }
        }
      );
    }
  }

  /**
   * Закрытие карточки на mobile
   */
  closeCardMobile() {
    const modal = document.querySelector('.alr-mobile-modal');
    if (modal) {
      if (window.modalManager) {
        window.modalManager.closeModal(modal);
        setTimeout(() => {
          modal.remove();
          document.body.style.overflow = 'auto';
          this.context.cardsManager.resetALRState();
          this.context.isAnimating = false;
          this.context.activeCard = null;
        }, 200);
      } else {
        gsap.to(modal, {
          opacity: 0,
          scale: 0.8,
          duration: 0.2,
          ease: "back.in(1.7)",
          onComplete: () => {
            modal.remove();
            document.body.style.overflow = 'auto';
            this.context.cardsManager.resetALRState();
            this.context.isAnimating = false;
            this.context.activeCard = null;
          }
        });
      }
    }
  }

  /**
   * Создание мобильного модального окна
   */
  createMobileModal(cardType) {
    const modal = document.createElement('div');
    modal.className = 'alr-mobile-modal';
    const sliderData = getSliderData(cardType);
    
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close">✕</button>
        <div class="modal-body">
          <h2>${cardType === 'awards' ? 'Награды' : cardType === 'licenses' ? 'Лицензии' : 'Отзывы'}</h2>
          <div class="mobile-slider">
            ${this.createMobileSliderHTML(cardType, sliderData)}
          </div>
        </div>
      </div>
    `;
    
    this.setupMobileImageSlider(modal);
    
    return modal;
  }

  /**
   * Создание HTML мобильного слайдера
   */
  createMobileSliderHTML(cardType, data) {
    if (cardType === 'reviews') {
      return `
        <div class="mobile-slider-wrapper">
          ${data.map((review, index) => `
            <div class="mobile-slider-item ${index === 0 ? 'active' : ''}" data-index="${index}">
              <div class="mobile-slider-container">
                <div class="mobile-review-card">
                  <div class="mobile-review-header">
                    <div class="mobile-review-info">
                      <div class="mobile-review-avatar">${review.avatar || '👤'}</div>
                      <div class="mobile-review-author">${review.author}</div>
                    </div>
                    <div class="mobile-review-stars">${review.rating || '★★★★★'}</div>
                  </div>
                  <div class="mobile-review-text">${review.text}</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="mobile-slider-nav">
          <button class="mobile-slider-btn prev">←</button>
          <button class="mobile-slider-btn next">→</button>
        </div>
      `;
    } else {
      const items = data.map((item, index) => `
        <div class="mobile-slider-item ${index === 0 ? 'active' : ''}" data-index="${index}">
          <div class="mobile-slider-container">
            <img src="${item.image}" alt="${item.description}" class="mobile-slider-image">
          </div>
          <div class="mobile-slider-description">${item.description}</div>
        </div>
      `).join('');
      
      return `
        <div class="mobile-slider-wrapper">
          ${items}
        </div>
        <div class="mobile-slider-nav">
          <button class="mobile-slider-btn prev">←</button>
          <button class="mobile-slider-btn next">→</button>
        </div>
      `;
    }
  }

  /**
   * Настройка мобильного слайдера изображений
   */
  setupMobileImageSlider(modal) {
    const items = modal.querySelectorAll('.mobile-slider-item');
    const prevBtn = modal.querySelector('.mobile-slider-btn.prev');
    const nextBtn = modal.querySelector('.mobile-slider-btn.next');
    let currentIndex = 0;

    const wrapper = modal.querySelector('.mobile-slider-wrapper');
    if (wrapper) {
      wrapper.style.position = 'relative';
      wrapper.style.height = 'auto';
      wrapper.style.minHeight = '300px';
    }

    const recalibrateWrapper = () => {
      if (!wrapper || !items.length) return;
      let maxHeight = 0;
      items.forEach((itm) => {
        const prevVis = itm.style.visibility;
        const prevDisp = itm.style.display;
        itm.style.visibility = 'hidden';
        itm.style.display = 'block';
        const h = itm.offsetHeight || itm.scrollHeight || 0;
        if (h > maxHeight) maxHeight = h;
        itm.style.visibility = prevVis || '';
        itm.style.display = prevDisp || '';
      });
      if (maxHeight > 0) wrapper.style.height = maxHeight + 'px';
    };

    items.forEach((item, i) => {
      const img = item.querySelector('.mobile-slider-image');
      const desc = item.querySelector('.mobile-slider-description');
      const container = item.querySelector('.mobile-slider-container');

      item.style.position = 'absolute';
      item.style.top = '0';
      item.style.left = '0';
      item.style.width = '100%';
      item.style.height = '100%';
      item.style.display = 'block';
      item.style.visibility = i === 0 ? 'visible' : 'hidden';

      if (container) {
        container.style.position = 'relative';
        container.style.height = '100%';
        container.style.overflow = 'hidden';
      }

      if (img) {
        Object.assign(img.style, {
          position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', objectFit: 'cover', willChange: 'transform'
        });
      }

      const reviewCard = item.querySelector('.mobile-review-card');
      const slideContent = img || reviewCard;
      if (slideContent) {
        gsap.set(slideContent, { xPercent: i === 0 ? 0 : 120, force3D: true });
      }

      if (desc) {
        gsap.set(desc, { autoAlpha: i === 0 ? 1 : 0, y: i === 0 ? 0 : 8, scale: i === 0 ? 1 : 0.98, transformPerspective: 400 });
      }

      item.classList.toggle('active', i === 0);
    });

    const imgs = modal.querySelectorAll('img');
    imgs.forEach((im) => {
      im.addEventListener('load', recalibrateWrapper, { once: true });
      im.addEventListener('error', recalibrateWrapper, { once: true });
    });
    const debouncedRecalibrate = debounce(recalibrateWrapper, 250);
    window.addEventListener('resize', debouncedRecalibrate);
    setTimeout(recalibrateWrapper, 0);

    const nav = modal.querySelector('.mobile-slider-nav');
    if (nav) {
      nav.style.position = 'relative';
      nav.style.width = '100%';
      nav.style.height = 'auto';
      nav.style.display = 'flex';
      nav.style.justifyContent = 'center';
      nav.style.alignItems = 'center';
      nav.style.gap = '20px';
      nav.style.margin = '0';
      nav.style.pointerEvents = 'auto';
      nav.style.zIndex = '10';
    }

    if (prevBtn) {
      prevBtn.style.position = 'static';
      prevBtn.style.left = 'auto';
      prevBtn.style.right = 'auto';
      prevBtn.style.top = 'auto';
      prevBtn.style.transform = 'none';
      prevBtn.style.pointerEvents = 'auto';
      prevBtn.style.zIndex = 'auto';
      prevBtn.style.margin = '0';
    }

    if (nextBtn) {
      nextBtn.style.position = 'static';
      nextBtn.style.left = 'auto';
      nextBtn.style.right = 'auto';
      nextBtn.style.top = 'auto';
      nextBtn.style.transform = 'none';
      nextBtn.style.pointerEvents = 'auto';
      nextBtn.style.zIndex = 'auto';
      nextBtn.style.margin = '0';
    }

    let isAnimating = false;

    const animateTo = (nextIndex, direction) => {
      if (isAnimating || nextIndex === currentIndex) return;
      isAnimating = true;
      const outgoing = items[currentIndex];
      const incoming = items[nextIndex];
      const outImg = outgoing.querySelector('.mobile-slider-image');
      const inImg = incoming.querySelector('.mobile-slider-image');
      const outReview = outgoing.querySelector('.mobile-review-card');
      const inReview = incoming.querySelector('.mobile-review-card');
      const outDesc = outgoing.querySelector('.mobile-slider-description');
      const inDesc = incoming.querySelector('.mobile-slider-description');

      const toSign = direction === 'next' ? -120 : 120;
      const fromSign = direction === 'next' ? 120 : -120;

      incoming.style.visibility = 'visible';
      incoming.style.zIndex = '2';
      outgoing.style.zIndex = '1';
      
      const outContent = outImg || outReview;
      const inContent = inImg || inReview;
      if (inContent) gsap.set(inContent, { xPercent: fromSign, force3D: true });
      if (inDesc) gsap.set(inDesc, { autoAlpha: 0, y: 8, scale: 0.985 });
      incoming.classList.add('active');

      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
      if (outContent) tl.to(outContent, { xPercent: toSign, duration: 0.38, force3D: true }, 0);
      if (inContent) tl.to(inContent, { xPercent: 0, duration: 0.38, force3D: true }, 0);
      if (outDesc) tl.to(outDesc, { autoAlpha: 0, y: -6, duration: 0.22 }, 0);
      if (inDesc) tl.to(inDesc, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: 'power3.out' }, 0.08);

      tl.add(() => {
        outgoing.style.visibility = 'hidden';
        outgoing.style.zIndex = '';
        incoming.style.zIndex = '';
        outgoing.classList.remove('active');
        currentIndex = nextIndex;
        isAnimating = false;
        recalibrateWrapper();
      });
    };

    prevBtn.addEventListener('click', () => {
      const nextIndex = (currentIndex - 1 + items.length) % items.length;
      animateTo(nextIndex, 'prev');
    });
    
    nextBtn.addEventListener('click', () => {
      const nextIndex = (currentIndex + 1) % items.length;
      animateTo(nextIndex, 'next');
    });
  }
}

