/**
 * Слайдеры для наград и лицензий
 */

import { debounce } from '../../core/utils.js';
import { getSliderData } from './data.js';

/**
 * Класс для управления слайдерами
 */
export class SlidersManager {
  constructor(context) {
    this.context = context;
  }

  /**
   * Создание HTML слайдера
   */
  createSliderHTML(cardType, data) {
    const items = data.map((item, index) => `
      <div class="slider-item ${index === 0 ? 'active' : ''}" data-index="${index}">
        <img src="${item.image}" alt="${item.description}" class="alr-slider-image">
        <div class="alr-slider-description">${item.description}</div>
      </div>
    `).join('');
    
    return `
      <div class="alr-slider-content">
        <div class="slider-container">
          ${items}
        </div>
        <div class="alr-slider-nav">
          <button class="alr-slider-btn prev">←</button>
          <button class="alr-slider-btn next">→</button>
        </div>
      </div>
    `;
  }

  /**
   * Настройка навигации слайдера
   */
  setupSliderNavigation(slider, cardType) {
    const prevBtn = slider.querySelector('.prev');
    const nextBtn = slider.querySelector('.next');
    const items = Array.from(slider.querySelectorAll('.slider-item'));
    const nav = slider.querySelector('.alr-slider-nav');
    const container = slider.querySelector('.slider-container');
    if (!prevBtn || !nextBtn || items.length === 0 || !container) return;
    
    const positionNav = () => {
      const activeItem = items.find(el => el.classList.contains('active')) || items[0];
      const img = activeItem ? activeItem.querySelector('.alr-slider-image') : null;
      const root = slider.querySelector('.alr-slider-content');
      if (!nav || !img || !root) return;
      const imgRect = img.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      const centerY = imgRect.top - rootRect.top + imgRect.height / 2;
      const leftX = imgRect.left - rootRect.left;
      const rightX = imgRect.right - rootRect.left;

      Object.assign(nav.style, {
        position: 'absolute',
        top: '0px',
        left: '0px',
        right: '0px',
        bottom: '0px',
        width: '100%',
        height: '100%',
        transform: 'none',
        pointerEvents: 'none'
      });

      const GAP_PX = 48;
      [prevBtn, nextBtn].forEach(btn => {
        btn.style.position = 'absolute';
        btn.style.top = centerY + 'px';
        btn.style.transform = 'translate(-50%, -50%)';
        btn.style.pointerEvents = 'auto';
      });
      prevBtn.style.left = Math.max(0, leftX - GAP_PX) + 'px';
      nextBtn.style.left = (rightX + GAP_PX) + 'px';
    };
    
    positionNav();
    const debouncedPositionNav = debounce(positionNav, 250);
    window.addEventListener('resize', debouncedPositionNav);
    
    let currentIndex = items.findIndex(el => el.classList.contains('active'));
    if (currentIndex < 0) currentIndex = 0;
    let isAnimating = false;
    const GAP_PERCENT = 27;
    
    items.forEach((item, i) => {
      const img = item.querySelector('.alr-slider-image');
      const desc = item.querySelector('.alr-slider-description');
      if (img) gsap.set(img, { xPercent: i === currentIndex ? 0 : (100 + GAP_PERCENT) });
      if (desc) {
        gsap.set(desc, { autoAlpha: i === currentIndex ? 1 : 0, y: i === currentIndex ? 0 : -10, z: i === currentIndex ? 0 : 40, transformPerspective: 400 });
      }
      item.classList.toggle('active', i === currentIndex);
    });
    
    const animateTo = (nextIndex, direction) => {
      if (isAnimating || nextIndex === currentIndex) return;
      isAnimating = true;
      const outgoing = items[currentIndex];
      const incoming = items[nextIndex];
      const outImg = outgoing.querySelector('.alr-slider-image');
      const inImg = incoming.querySelector('.alr-slider-image');
      const outDesc = outgoing.querySelector('.alr-slider-description');
      const inDesc = incoming.querySelector('.alr-slider-description');
      
      const toSign = direction === 'next' ? (100 + GAP_PERCENT) : (-100 - GAP_PERCENT);
      const fromSign = direction === 'next' ? (-100 - GAP_PERCENT) : (100 + GAP_PERCENT);
      
      gsap.set(outgoing, { zIndex: 2 });
      gsap.set(incoming, { zIndex: 1 });
      if (inImg) gsap.set(inImg, { xPercent: fromSign });
      if (inDesc) gsap.set(inDesc, { autoAlpha: 0, y: -10, z: 40, transformPerspective: 400 });
      incoming.classList.add('active');
      
      const tl = gsap.timeline({ defaults: { ease: 'power2.inOut' } });
      
      if (outImg) tl.to(outImg, { xPercent: toSign, duration: 0.45, force3D: true }, 0);
      if (inImg) tl.to(inImg, { xPercent: 0, duration: 0.45, force3D: true }, 0);
      
      if (outDesc) tl.to(outDesc, { autoAlpha: 0, y: -8, z: 30, duration: 0.28 }, 0);
      if (inDesc) tl.to(inDesc, { autoAlpha: 1, y: 0, z: 0, duration: 0.36, ease: 'power3.out' }, 0.12);
      
      tl.add(() => {
        outgoing.classList.remove('active');
        currentIndex = nextIndex;
        isAnimating = false;
        positionNav();
        const elementsToClean = [outgoing, incoming].filter(el => el != null);
        if (elementsToClean.length > 0) {
          gsap.set(elementsToClean, { clearProps: 'zIndex' });
        }
      });
    };
    
    prevBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const nextIndex = (currentIndex - 1 + items.length) % items.length;
      animateTo(nextIndex, 'prev');
    });
    
    nextBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const nextIndex = (currentIndex + 1) % items.length;
      animateTo(nextIndex, 'next');
    });
  }
}

