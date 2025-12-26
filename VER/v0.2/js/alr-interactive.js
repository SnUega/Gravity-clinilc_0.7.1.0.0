document.addEventListener('DOMContentLoaded', () => {
  // Проверяем загрузку GSAP с задержкой
  const checkGSAP = () => {
  if (typeof gsap === 'undefined') {
      console.warn('GSAP not loaded, retrying...');
      setTimeout(checkGSAP, 100);
    return;
  }
    initializeALR();
  };
  
  const initializeALR = () => {
    new ALRInteractive();
  };

  class ALRInteractive {
    constructor() {
      this.cards = document.querySelectorAll('.alr-col');
      this.isDesktop = window.innerWidth > 768;
      this.activeCard = null;
      this.isAnimating = false;
      this.hoverTimeout = null;
      this.intersectionObserver = null;
      
      this.init();
    }

    init() {
      this.setupEventListeners();
      this.setupHoverEffects();
      this.setupMobileSlider();
      this.setupLoadingStates();
      this.setupAccessibility();
    }

    setupEventListeners() {
      this.cards.forEach(card => {
        const openBtn = card.querySelector('[data-action="open"]');
        const closeBtn = card.querySelector('[data-action="close"]');
        
        if (openBtn) {
          openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openCard(card);
          });
        }
        
        if (closeBtn) {
          closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeCard();
          });
        }
      });

      // Close on outside click (ignore clicks inside overlay)
      document.addEventListener('click', (e) => {
        const clickedInsideCard = e.target.closest('.alr-col');
        const clickedInsideOverlay = e.target.closest('.alr-overlay');
        if (this.activeCard && !clickedInsideCard && !clickedInsideOverlay) {
          this.closeCard();
        }
      });

      // Close on Escape
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeCard) {
          this.closeCard();
        }
      });
    }

    setupHoverEffects() {
      if (this.isDesktop) {
        this.cards.forEach(card => {
          const hoverContent = card.querySelector('.alr-hover-content');
          
          // Debounced hover effect
          card.addEventListener('mouseenter', () => {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = setTimeout(() => {
              this.loadHoverContent(card);
            }, 100);
          });
          
          card.addEventListener('mouseleave', () => {
            clearTimeout(this.hoverTimeout);
          });
        });
      }
    }

    loadHoverContent(card) {
      const hoverContent = card.querySelector('.alr-hover-content');
      const cardType = card.dataset.card;
      
      // Lazy loading for 3D models
      if (!hoverContent.innerHTML) {
        const placeholder = document.createElement('div');
        placeholder.className = 'hover-placeholder';
        placeholder.innerHTML = `
          <div style="
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: 600;
            will-change: transform;
            transform: translateZ(0);
          ">
            ${cardType === 'awards' ? '🏆' : cardType === 'licenses' ? '📄' : '⭐'}
          </div>
        `;
        hoverContent.appendChild(placeholder);
        
        // Load actual 3D model asynchronously
        this.load3DModel(card, cardType);
      }
    }
    
    load3DModel(card, cardType) {
      // Placeholder for 3D model loading
      // In real implementation, this would load actual 3D models
      setTimeout(() => {
        const hoverContent = card.querySelector('.alr-hover-content');
        if (hoverContent && hoverContent.querySelector('.hover-placeholder')) {
          // Replace placeholder with actual 3D model
          // This is where you'd integrate with Three.js or similar
        }
      }, 500);
    }

    openCard(card) {
      if (this.isAnimating || !card) return;
      
      this.isAnimating = true;
      this.activeCard = card;
      const cardType = card.dataset.card;
      
      // Добавляем класс для отключения hover эффектов
      card.classList.add('opened');
      
      try {
      if (this.isDesktop) {
        this.openCardDesktop(card, cardType);
      } else {
        this.openCardMobile(cardType);
        }
      } catch (error) {
        console.error('Error opening card:', error);
        this.isAnimating = false;
        this.activeCard = null;
        card.classList.remove('opened');
        this.showNotification('Произошла ошибка при открытии карточки', 'error');
      }
    }

    openCardDesktop(card, cardType) {
      const timeline = gsap.timeline({
        onComplete: () => {
          this.isAnimating = false;
        }
      });

      if (cardType === 'reviews') {
        // Center card - special animation
        this.openReviewsCarousel(timeline);
      } else {
        // Left or right card
        this.openSideCard(card, cardType, timeline);
      }
    }

    openSideCard(card, cardType, timeline) {
      const isLeft = cardType === 'awards';
      const otherCards = Array.from(this.cards).filter(c => c !== card);
      const detailContent = card.querySelector('.alr-detail-content');
      
      if (!detailContent) {
        console.warn('Detail content not found for card:', cardType);
        this.isAnimating = false;
        return;
      }
      
      // 1) Create an overlay that spans exactly across the two non-clicked cards
      const overlay = document.createElement('div');
      overlay.className = 'alr-overlay';
      // Position overlay over the two other cards
      const wrapRect = this.cards[0].parentElement.getBoundingClientRect();
      const firstOther = otherCards[0].getBoundingClientRect();
      const lastOther = otherCards[1].getBoundingClientRect();
      const left = Math.min(firstOther.left, lastOther.left) - wrapRect.left;
      const width = Math.max(firstOther.right, lastOther.right) - Math.min(firstOther.left, lastOther.left);
      overlay.style.left = left + 'px';
      overlay.style.width = width + 'px';
      overlay.style.clipPath = 'inset(0 0 100% 0)'; // hidden from top
      card.parentElement.appendChild(overlay);

      // 2) Build slider inside overlay
      const sliderData = this.getSliderData(cardType);
      const slider = document.createElement('div');
      slider.className = 'alr-slider';
      slider.innerHTML = this.createSliderHTML(cardType, sliderData);
      overlay.appendChild(slider);
      // Ensure inner slider is visible (overlay controls the reveal)
      slider.style.clipPath = 'inset(0 0 0 0)';

      // 3) Simultaneous animations at t0
      timeline
        // Horizontal shutter on the clicked card (detail content) - единая шторка
        .to(detailContent, {
          clipPath: isLeft ? 'inset(0 0% 0 0)' : 'inset(0 0 0 0%)',
          duration: 0.8,
          ease: 'none'
        }, 0)
        // Other cards move away
        .to(otherCards, {
          xPercent: isLeft ? 100 : -100,
          duration: 0.8,
          ease: 'none'
        }, 0)
        // Vertical shutter from top to reveal overlay (covering other two cards)
        .fromTo(overlay,
          { clipPath: 'inset(100% 0 0 0)' },
          { clipPath: 'inset(0 0 0 0)', duration: 0.8, ease: 'none' },
        0);

      // Prepare slider controls after overlay is visible
      timeline.call(() => {
        this.setupSliderNavigation(slider, cardType);
      });

      // Store reference for closing
      this._activeOverlay = overlay;
    }

    openReviewsCarousel(timeline) {
      // Full-width overlay over all three cards from bottom-up
      const wrap = this.cards[0].parentElement; // .alr-wrap
      const overlay = document.createElement('div');
      overlay.className = 'alr-overlay';
      overlay.style.left = '0px';
      overlay.style.width = '100%';
      overlay.style.clipPath = 'inset(0 0 100% 0)'; // hidden from bottom (bottom-up reveal)
      wrap.appendChild(overlay);

      let carousel = this.createReviewsCarousel();
      overlay.appendChild(carousel);
      // Ensure inner carousel is visible; overlay controls reveal
      carousel.style.clipPath = 'inset(0 0 0 0)';

      timeline.to(overlay, {
        clipPath: 'inset(0 0 0 0)',
        duration: 0.7,
        ease: 'power2.inOut'
      });

      this._activeOverlay = overlay;
      const backBtn = overlay.querySelector('.alr-reviews-back');
      if (backBtn) {
        backBtn.addEventListener('click', () => this.closeCard());
      }
      // Create heading inside reviews
      const heading = document.createElement('div');
      heading.className = 'alr-reviews-heading';
      heading.textContent = 'Отзывы';
      overlay.querySelector('.alr-reviews-content').insertBefore(heading, overlay.querySelector('.alr-reviews-rows'));
    }

    openCardMobile(cardType) {
      // Create modal for mobile
      const modal = this.createMobileModal(cardType);
      document.body.appendChild(modal);
      
      // Show modal with animation
      gsap.fromTo(modal, 
        { opacity: 0, scale: 0.8 },
        { 
          opacity: 1, 
          scale: 1, 
          duration: 0.3, 
          ease: "back.out(1.7)",
          onComplete: () => {
            this.isAnimating = false;
          }
        }
      );
    }

    closeCard() {
      if (this.isAnimating || !this.activeCard) return;
      
      this.isAnimating = true;
      
      // Убираем класс для восстановления hover эффектов
      this.activeCard.classList.remove('opened');
      
      if (this.isDesktop) {
        this.closeCardDesktop();
      } else {
        this.closeCardMobile();
      }
    }

    closeCardDesktop() {
      const timeline = gsap.timeline({
        onComplete: () => {
          this.isAnimating = false;
          this.activeCard = null;
          this.hideSliders();
          this.resetCards();
        }
      });

      // Hide overlay if exists (reviews or other overlay)
      if (this._activeOverlay) {
        const closingFromTop = this._activeOverlay.style.left !== '0px' || this._activeOverlay.style.width !== '100%';
        const targetClip = closingFromTop ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)';
        timeline.to(this._activeOverlay, {
          clipPath: targetClip,
          duration: 0.5,
          ease: 'power2.inOut'
        }, 0)
        .call(() => {
          // restore visibility of the two other cards after overlay removed
          this._activeOverlay.remove();
          this._activeOverlay = null;
        });
      }

      // Close the clicked card detail content via horizontal shutter back
      if (this.activeCard) {
        const detail = this.activeCard.querySelector('.alr-detail-content');
        if (detail) {
          timeline.to(detail, {
            clipPath: 'inset(0 100% 0 0)',
            duration: 0.45,
            ease: 'power2.inOut'
          }, 0.1)
          .call(() => {
            // reset detail to hidden but intact content for future opens
            gsap.set(detail, { clipPath: 'inset(0 100% 0 0)' });
          });
        }
      }

      // Reset all cards
      timeline.to(this.cards, {
        clipPath: 'inset(0 100% 0 0)',
        duration: 0.6,
        ease: "power2.inOut"
      });
    }

    closeCardMobile() {
      const modal = document.querySelector('.alr-mobile-modal');
      if (modal) {
        gsap.to(modal, {
          opacity: 0,
          scale: 0.8,
          duration: 0.2,
          ease: "back.in(1.7)",
          onComplete: () => {
            modal.remove();
            this.isAnimating = false;
            this.activeCard = null;
          }
        });
      }
    }

    resetCards() {
      // Reset all cards to original state
      this.cards.forEach(card => {
        // Убираем класс opened для восстановления hover эффектов
        card.classList.remove('opened');
        
        gsap.set(card, {
          height: '100vh',
          width: '33.333%',
          margin: '0',
          clipPath: 'inset(0 100% 0 0)'
        });
        
        // Reset detail content
        const detailContent = card.querySelector('.alr-detail-content');
        if (detailContent) {
          gsap.set(detailContent, {
            clipPath: 'inset(0 100% 0 0)'
          });
        }
      });
      
      // Reset reviews card specifically
      const reviewsCard = this.cards[1];
      gsap.set(reviewsCard, {
        height: '100vh',
        width: '33.333%',
        margin: '0'
      });
    }

    showSlider(cardType) {
      // Create slider content based on card type
      const sliderData = this.getSliderData(cardType);
      
      // Remove existing slider
      const existingSlider = document.querySelector('.alr-slider');
      if (existingSlider) {
        existingSlider.remove();
      }
      
      // Create new slider
      const slider = document.createElement('div');
      slider.className = 'alr-slider';
      slider.innerHTML = this.createSliderHTML(cardType, sliderData);
      
      // Add to the active card
      this.activeCard.appendChild(slider);
      
      // Animate slider in with hardware acceleration
      gsap.fromTo(slider, 
        { 
          clipPath: 'inset(100% 0 0 0)',
          transform: 'translateZ(0)'
        },
        { 
          clipPath: 'inset(0% 0 0 0)', 
          duration: 0.8, 
          ease: "power2.inOut",
          force3D: true
        }
      );
      
      // Setup slider navigation
      this.setupSliderNavigation(slider, cardType);
    }
    
    createSliderHTML(cardType, data) {
      const items = data.map((item, index) => `
        <div class="slider-item ${index === 0 ? 'active' : ''}" data-index="${index}">
          <img src="images/${item.image}" alt="${item.description}" class="alr-slider-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIFBsYWNlaG9sZGVyPC90ZXh0Pjwvc3ZnPg=='">
          <div class="alr-slider-description">${item.description}</div>
        </div>
      `).join('');
      
      return `
        <div class="alr-slider-content">
          <button class="alr-slider-close" data-action="close">&times;</button>
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
    
    setupSliderNavigation(slider, cardType) {
      const prevBtn = slider.querySelector('.prev');
      const nextBtn = slider.querySelector('.next');
      const closeBtn = slider.querySelector('.alr-slider-close');
      const items = slider.querySelectorAll('.slider-item');
      let currentIndex = 0;
      
      const showItem = (index) => {
        items.forEach((item, i) => {
          item.classList.toggle('active', i === index);
        });
      };
      
      prevBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        showItem(currentIndex);
      });
      
      nextBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        currentIndex = (currentIndex + 1) % items.length;
        showItem(currentIndex);
      });
      
      closeBtn.addEventListener('click', () => {
        this.closeCard();
      });
    }

    hideSliders() {
      // Hide all sliders
      const sliders = document.querySelectorAll('.alr-slider, .alr-reviews-carousel');
      sliders.forEach(slider => {
        gsap.set(slider, { clipPath: 'inset(100% 0 0 0)' });
      });
    }

    getSliderData(cardType) {
      const data = {
        awards: [
          { image: 'award1.jpg', description: 'Лучшая клиника эстетической медицины 2023' },
          { image: 'award2.jpg', description: 'Сертификат качества ISO 9001' },
          { image: 'award3.jpg', description: 'Диплом "Инновации в медицине"' }
        ],
        licenses: [
          { image: 'license1.jpg', description: 'Лицензия на медицинскую деятельность' },
          { image: 'license2.jpg', description: 'Сертификат специалиста по косметологии' },
          { image: 'license3.jpg', description: 'Разрешение на работу с лазерным оборудованием' }
        ],
        reviews: [
          { text: 'Отличная клиника! Профессиональный подход, современное оборудование.', author: 'Анна К.' },
          { text: 'Очень довольна результатом процедуры. Всё объяснили подробно.', author: 'Мария С.' },
          { text: 'Персонал вежливый, процедуры безболезненные. Рекомендую.', author: 'Елена В.' },
          { text: 'Прекрасные результаты! Врачи настоящие профессионалы своего дела.', author: 'Ольга М.' },
          { text: 'Клиника на высшем уровне. Очень довольна сервисом и результатом.', author: 'Ирина П.' },
          { text: 'Современное оборудование и опытные специалисты. Всё на отлично!', author: 'Татьяна Л.' },
          { text: 'Процедуры прошли комфортно, результат превзошёл ожидания.', author: 'Наталья Р.' },
          { text: 'Очень внимательный персонал и индивидуальный подход к каждому.', author: 'Светлана К.' },
          { text: 'Клиника соответствует всем современным стандартам качества.', author: 'Екатерина Н.' },
          { text: 'Рекомендую всем! Профессионализм и качество на высоте.', author: 'Юлия С.' }
        ]
      };
      return data[cardType] || [];
    }

    createReviewsCarousel() {
      const carousel = document.createElement('div');
      carousel.className = 'alr-reviews-carousel';
      const reviews = this.getSliderData('reviews');
      
      // Разделяем отзывы на два ряда
      const topReviews = reviews.slice(0, Math.ceil(reviews.length / 2));
      const bottomReviews = reviews.slice(Math.ceil(reviews.length / 2));
      
      const createItemsHTML = (reviewsData) => reviewsData.map((r) => `
        <div class="alr-review-item">
          <div class="alr-review-avatar">👤</div>
          <div class="alr-review-stars">★★★★★</div>
          <div class="alr-review-text">${r.text}</div>
          <div class="alr-review-author">${r.author}</div>
        </div>
      `).join('');

      carousel.innerHTML = `
        <div class="alr-reviews-content">
          <div class="alr-reviews-rows">
            <div class="alr-reviews-row" data-row="top">
              <div class="alr-reviews-track">${createItemsHTML(topReviews)}</div>
            </div>
            <div class="alr-reviews-row" data-row="bottom">
              <div class="alr-reviews-track">${createItemsHTML(bottomReviews)}</div>
            </div>
          </div>
          <button class="alr-btn alr-reviews-back" data-action="close">
            <span class="arrow">←</span>
            <span>Назад</span>
          </button>
        </div>
      `;
      
      // Setup autoplay
      this.setupReviewsAutoplay(carousel);
      
      return carousel;
    }
    
    setupReviewsAutoplay(carousel) {
      const topRow = carousel.querySelector('[data-row="top"]');
      const bottomRow = carousel.querySelector('[data-row="bottom"]');
      const topTrack = topRow.querySelector('.alr-reviews-track');
      const bottomTrack = bottomRow.querySelector('.alr-reviews-track');
      
      // Получаем данные отзывов
      const reviews = this.getSliderData('reviews');
      const topReviews = reviews.slice(0, Math.ceil(reviews.length / 2));
      const bottomReviews = reviews.slice(Math.ceil(reviews.length / 2));
      
      // Вычисляем ширину одного элемента + gap
      const itemWidth = 400 + 24; // 400px (средняя ширина) + 24px gap из CSS
      
      // Создаем карточки для верхнего ряда (движется вправо)
      this.createTopCards(topTrack, topReviews, itemWidth);
      
      // Создаем карточки для нижнего ряда (движется влево)
      this.createBottomCards(bottomTrack, bottomReviews, itemWidth);
      
      // Небольшая задержка для гарантии полной загрузки DOM
      setTimeout(() => {
        // Запускаем автопрокрутку
        this.autoScrollTop(topTrack, topReviews, itemWidth);
        this.autoScrollBottom(bottomTrack, bottomReviews, itemWidth);
      }, 100);
      
      // Добавляем hover эффекты
      topRow.addEventListener('mouseenter', () => this.pauseAnimation(topTrack));
      topRow.addEventListener('mouseleave', () => this.resumeAnimation(topTrack, 'top', topReviews, itemWidth));
      bottomRow.addEventListener('mouseenter', () => this.pauseAnimation(bottomTrack));
      bottomRow.addEventListener('mouseleave', () => this.resumeAnimation(bottomTrack, 'bottom', bottomReviews, itemWidth));
    }
    
    createTopCards(track, reviews, itemWidth) {
      track.innerHTML = '';
      
      // Создаем два полных набора карточек для бесшовной анимации
      for (let i = 0; i < 2; i++) {
        reviews.forEach((review, index) => {
          const card = this.createReviewCard(review, index);
          track.appendChild(card);
        });
      }
      
      // Устанавливаем ширину трека
      const totalWidth = reviews.length * 2 * itemWidth;
      track.style.width = `${totalWidth}px`;
    }
    
    createBottomCards(track, reviews, itemWidth) {
      track.innerHTML = '';
      
      // Создаем два полных набора карточек для бесшовной анимации
      for (let i = 0; i < 2; i++) {
        reviews.forEach((review, index) => {
          const card = this.createReviewCard(review, index);
          track.appendChild(card);
        });
      }
      
      // Устанавливаем ширину трека
      const totalWidth = reviews.length * 2 * itemWidth;
      track.style.width = `${totalWidth}px`;
    }
    
    createReviewCard(review, index) {
      const card = document.createElement('div');
      card.className = 'alr-review-item';
      card.setAttribute('data-index', index);
      card.innerHTML = `
        <div class="alr-review-avatar">👤</div>
        <div class="alr-review-stars">★★★★★</div>
        <div class="alr-review-text">${review.text}</div>
        <div class="alr-review-author">${review.author}</div>
      `;
      return card;
    }
    
    // Функция автопрокрутки для верхнего ряда (движется вправо)
    autoScrollTop(track, reviews, itemWidth) {
      const segmentWidth = reviews.length * itemWidth;
      
      // Начальная позиция
      gsap.set(track, { x: 0 });
      
      // Плавная бесконечная анимация
      const animation = gsap.to(track, {
        x: -segmentWidth,
        duration: 22.5, // Оптимальная скорость
        ease: "none",
        repeat: -1,
        modifiers: {
          x: function(x) {
            // Плавный цикл без рывков
            return (parseFloat(x) % segmentWidth) + 'px';
          }
        }
      });
      
      // Сохраняем ссылку на анимацию
      track._topAnimation = animation;
    }
    
    // Функция автопрокрутки для нижнего ряда (движется влево)
    autoScrollBottom(track, reviews, itemWidth) {
      const segmentWidth = reviews.length * itemWidth;
      
      // Начальная позиция - смещаем на один сегмент влево
      gsap.set(track, { x: -segmentWidth });
      
      // Плавная бесконечная анимация
      const animation = gsap.to(track, {
        x: 0,
        duration: 22.5, // Оптимальная скорость
        ease: "none",
        repeat: -1,
        modifiers: {
          x: function(x) {
            // Плавный цикл для движения влево
            let value = parseFloat(x);
            if (value >= 0) {
              value = value - segmentWidth;
            }
            return (value % segmentWidth) + 'px';
          }
        }
      });
      
      // Сохраняем ссылку на анимацию
      track._bottomAnimation = animation;
    }
    
    pauseAnimation(track) {
      // Приостанавливаем анимацию, сохраняя текущую позицию
      if (track._topAnimation) {
        track._topAnimation.pause();
      }
      if (track._bottomAnimation) {
        track._bottomAnimation.pause();
      }
    }
    
    resumeAnimation(track, direction, reviews, itemWidth) {
      // Возобновляем анимацию с текущей позиции
      if (direction === 'top' && track._topAnimation) {
        track._topAnimation.resume();
      } else if (direction === 'bottom' && track._bottomAnimation) {
        track._bottomAnimation.resume();
      }
    }

    createMobileModal(cardType) {
      const modal = document.createElement('div');
      modal.className = 'alr-mobile-modal';
      const sliderData = this.getSliderData(cardType);
      
      modal.innerHTML = `
        <div class="modal-content">
          <button class="modal-close">&times;</button>
          <div class="modal-body">
            <h2>${cardType === 'awards' ? 'Награды' : cardType === 'licenses' ? 'Лицензии' : 'Отзывы'}</h2>
            <div class="mobile-slider">
              ${this.createMobileSliderHTML(cardType, sliderData)}
            </div>
          </div>
        </div>
      `;
      
      // Setup mobile slider
      this.setupMobileSlider(modal, cardType);
      
      return modal;
    }
    
    createMobileSliderHTML(cardType, data) {
      if (cardType === 'reviews') {
        return `
          <div class="mobile-reviews-slider">
            <div class="mobile-review-item active">
              <div class="mobile-review-text">"Отличная клиника! Профессиональный подход, современное оборудование."</div>
              <div class="mobile-review-author">- Анна К.</div>
            </div>
            <div class="mobile-review-item">
              <div class="mobile-review-text">"Очень довольна результатом процедуры. Врач подробно объяснил все этапы."</div>
              <div class="mobile-review-author">- Мария С.</div>
            </div>
            <div class="mobile-review-item">
              <div class="mobile-review-text">"Клиника с отличной репутацией. Персонал вежливый, процедуры безболезненные."</div>
              <div class="mobile-review-author">- Елена В.</div>
            </div>
          </div>
          <div class="mobile-slider-nav">
            <button class="mobile-slider-btn prev">←</button>
            <button class="mobile-slider-btn next">→</button>
          </div>
        `;
      } else {
        const items = data.map((item, index) => `
          <div class="mobile-slider-item ${index === 0 ? 'active' : ''}" data-index="${index}">
            <img src="images/${item.image}" alt="${item.description}" class="mobile-slider-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIFBsYWNlaG9sZGVyPC90ZXh0Pjwvc3ZnPg=='">
            <div class="mobile-slider-description">${item.description}</div>
          </div>
        `).join('');
        
        return `
          <div class="mobile-slider-container">
            ${items}
          </div>
          <div class="mobile-slider-nav">
            <button class="mobile-slider-btn prev">←</button>
            <button class="mobile-slider-btn next">→</button>
          </div>
        `;
      }
    }    
    setupMobileSlider(modal, cardType) {
      const closeBtn = modal.querySelector('.modal-close');
      const prevBtn = modal.querySelector('.prev');
      const nextBtn = modal.querySelector('.next');
      
      // Close modal
      closeBtn.addEventListener('click', () => {
        this.closeCard();
      });
      
      // Close on backdrop click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeCard();
        }
      });
      
      if (cardType === 'reviews') {
        this.setupMobileReviewsSlider(modal);
      } else {
        this.setupMobileImageSlider(modal);
      }
    }
    
    setupMobileImageSlider(modal) {
      const items = modal.querySelectorAll('.mobile-slider-item');
      const prevBtn = modal.querySelector('.prev');
      const nextBtn = modal.querySelector('.next');
      let currentIndex = 0;
      
      const showItem = (index) => {
        items.forEach((item, i) => {
          item.classList.toggle('active', i === index);
        });
      };
      
      prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        showItem(currentIndex);
      });
      
      nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % items.length;
        showItem(currentIndex);
      });
    }
    
    setupMobileReviewsSlider(modal) {
      const items = modal.querySelectorAll('.mobile-review-item');
      const prevBtn = modal.querySelector('.prev');
      const nextBtn = modal.querySelector('.next');
      let currentIndex = 0;
      
      const showItem = (index) => {
        items.forEach((item, i) => {
          item.classList.toggle('active', i === index);
        });
      };
      
      prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + items.length) % items.length;
        showItem(currentIndex);
      });
      
      nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % items.length;
        showItem(currentIndex);
      });
    }

    setupMobileSlider() {
      if (!this.isDesktop) {
        // Initialize mobile slider functionality
        this.setupMobileTouchEvents();
      }
    }
    
    setupMobileTouchEvents() {
      // Добавляем поддержку свайпов для мобильных устройств
      let startX = 0;
      let startY = 0;
      let isScrolling = false;
      
      this.cards.forEach(card => {
        card.addEventListener('touchstart', (e) => {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          isScrolling = false;
        });
        
        card.addEventListener('touchmove', (e) => {
          if (!startX || !startY) return;
          
          const diffX = Math.abs(e.touches[0].clientX - startX);
          const diffY = Math.abs(e.touches[0].clientY - startY);
          
          if (diffX > diffY) {
            isScrolling = true;
            e.preventDefault();
          }
        });
        
        card.addEventListener('touchend', (e) => {
          if (!isScrolling) return;
          
          const endX = e.changedTouches[0].clientX;
          const diffX = startX - endX;
          
          if (Math.abs(diffX) > 50) {
            if (diffX > 0) {
              // Свайп влево - открыть карточку
              this.openCard(card);
            }
          }
          
          startX = 0;
          startY = 0;
          isScrolling = false;
        });
      });
    }
    
    setupLoadingStates() {
      // Добавляем индикаторы загрузки
      this.cards.forEach(card => {
        card.classList.add('loading');
        
        // Симулируем загрузку контента
        setTimeout(() => {
          card.classList.remove('loading');
          card.classList.add('loaded');
        }, Math.random() * 1000 + 500);
      });
    }
    
    setupAccessibility() {
      // Улучшаем доступность
      this.cards.forEach((card, index) => {
        const openBtn = card.querySelector('[data-action="open"]');
        const closeBtn = card.querySelector('[data-action="close"]');
        
        if (openBtn) {
          openBtn.setAttribute('aria-label', `Открыть ${card.dataset.card}`);
          openBtn.setAttribute('role', 'button');
          openBtn.setAttribute('tabindex', '0');
        }
        
        if (closeBtn) {
          closeBtn.setAttribute('aria-label', 'Закрыть');
          closeBtn.setAttribute('role', 'button');
          closeBtn.setAttribute('tabindex', '0');
        }
        
        // Добавляем поддержку клавиатуры
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.openCard(card);
          }
        });
      });
    }
    
    showNotification(message, type = 'info') {
      // Создаем уведомление для пользователя
      const notification = document.createElement('div');
      notification.className = `alr-notification alr-notification-${type}`;
      notification.textContent = message;
      
      // Добавляем стили
      Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '10000',
        opacity: '0',
        transform: 'translateX(100%)',
        transition: 'all 0.3s ease',
        maxWidth: '300px',
        wordWrap: 'break-word'
      });
      
      // Устанавливаем цвет в зависимости от типа
      const colors = {
        error: '#ff4757',
        success: '#2ed573',
        info: '#3742fa',
        warning: '#ffa502'
      };
      notification.style.backgroundColor = colors[type] || colors.info;
      
      document.body.appendChild(notification);
      
      // Анимация появления
      setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
      }, 10);
      
      // Автоматическое скрытие
      setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 3000);
    }
    
    // Cleanup function for performance
    destroy() {
      // Clear timeouts
      if (this.hoverTimeout) {
        clearTimeout(this.hoverTimeout);
      }
      
      // Clear intervals
      const carousels = document.querySelectorAll('.alr-reviews-carousel');
      carousels.forEach(carousel => {
        if (carousel._cleanup) {
          carousel._cleanup();
        }
      });
      
      // Remove event listeners
      this.cards.forEach(card => {
        const openBtn = card.querySelector('[data-action="open"]');
        const closeBtn = card.querySelector('[data-action="close"]');
        
        if (openBtn) {
          openBtn.removeEventListener('click', this.openCard);
        }
        if (closeBtn) {
          closeBtn.removeEventListener('click', this.closeCard);
        }
      });
    }
  }

  // Запускаем проверку GSAP
  checkGSAP();
});

