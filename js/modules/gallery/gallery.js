/**
 * Галерея изображений с категориями
 * Управление слайдами, переключение категорий, анимации
 */

import { $, $$, debounce } from '../../core/utils.js';
import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';

/**
 * Класс галереи изображений
 */
export class Gallery {
  constructor(options = {}) {
    this.options = {
      containerSelector: options.containerSelector || '#sliderContainer',
      categoryNavSelector: options.categoryNavSelector || '#categoryNav',
      nextButtonSelector: options.nextButtonSelector || '#nextSlide',
      prevButtonSelector: options.prevButtonSelector || '#prevSlide',
      categories: options.categories || {},
      defaultCategory: options.defaultCategory || null,
      ...options
    };

    this.container = null;
    this.categoryNav = null;
    this.nextButton = null;
    this.prevButton = null;
    this.currentCategory = null;
    this.currentSlide = 0;
    this.categories = this.options.categories;
    
    // Кэш DOM элементов для производительности
    this.slidesCache = []; // Кэш слайдов
    this.categoryButtonsCache = []; // Кэш кнопок категорий

    // Состояние для drag-to-scroll
    this.isDown = false;
    this.startX = 0;
    this.startScrollLeft = 0;
    this.scrollEndTimer = null;

    // Состояние для slide drag
    this.slideStartX = 0;
    this.isSlideDragging = false;
    this.gestureLocked = false;

    // Состояние для touch inertia
    this.lastX = 0;
    this.lastT = 0;
    this.velocity = 0;
    this.rafId = null;
  }

  /**
   * Инициализация галереи
   */
  init() {
    // Проверяем наличие GSAP
    if (typeof gsap === 'undefined') {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('GSAP not available, gallery animations may not work'), {
        module: 'gallery',
        severity: ERROR_SEVERITY.LOW,
        context: { action: 'init' },
        userMessage: null
      });
    }

    // Находим элементы
    this.container = $(this.options.containerSelector);
    this.categoryNav = $(this.options.categoryNavSelector);
    this.nextButton = $(this.options.nextButtonSelector);
    this.prevButton = $(this.options.prevButtonSelector);

    if (!this.container || !this.categoryNav) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('Gallery container or navigation not found'), {
        module: 'gallery',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { 
          action: 'init',
          container: !!this.container,
          categoryNav: !!this.categoryNav
        },
        userMessage: null
      });
      return;
    }

    // Определяем начальную категорию
    const categoryKeys = Object.keys(this.categories);
    if (categoryKeys.length === 0) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('No categories defined'), {
        module: 'gallery',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'init' },
        userMessage: null
      });
      return;
    }

    this.currentCategory = this.options.defaultCategory || categoryKeys[0];

    // Инициализируем галерею
    this.createInitialSlide();
    this.renderCategoryNav();
    this.updateSlidesCache(); // Обновляем кэш слайдов после создания
    this.updateCategoryButtonsCache(); // Обновляем кэш кнопок категорий
    this.enableSlideDrag();
    this.setupNavigationButtons();
  }

  /**
   * Создание слайда
   */
  createSlide(url, hidden = false) {
    const slide = document.createElement('div');
    slide.classList.add('slide');
    if (hidden) slide.classList.add('hidden');
    slide.style.backgroundImage = `url('${url}')`;
    return slide;
  }

  /**
   * Обновление кэша слайдов
   */
  updateSlidesCache() {
    this.slidesCache = Array.from(this.container.querySelectorAll('.slide'));
  }

  /**
   * Обновление кэша кнопок категорий
   */
  updateCategoryButtonsCache() {
    if (this.categoryNav) {
      this.categoryButtonsCache = Array.from(this.categoryNav.querySelectorAll('.category-btn'));
    }
  }

  /**
   * Показ слайда по индексу
   */
  showSlide(index) {
    // Используем кэшированные слайды вместо querySelectorAll
    this.slidesCache.forEach((slide, i) => {
      slide.classList.toggle('hidden', i !== index);
    });
  }

  /**
   * Создание начального слайда
   */
  createInitialSlide() {
    const initialImage = this.categories[this.currentCategory]?.[0];
    if (!initialImage) return;

    const initialSlide = this.createSlide(initialImage);
    this.container.insertBefore(initialSlide, this.categoryNav);
    // Обновляем кэш после создания слайда
    this.slidesCache.push(initialSlide);
  }

  /**
   * Переключение категории
   */
  switchCategory(newCategory) {
    if (newCategory === this.currentCategory) return;
    if (!this.categories[newCategory] || this.categories[newCategory].length === 0) return;

    const leavingImage = this.categories[this.currentCategory]?.[this.currentSlide];
    const newImage = this.categories[newCategory][0];

    if (!leavingImage || !newImage) return;

    // Удаляем старые слайды (используем кэш)
    this.slidesCache.forEach(slide => slide.remove());
    this.slidesCache = []; // Очищаем кэш

    // Создаем новый слайд
    const nextSlide = this.createSlide(newImage);
    this.container.insertBefore(nextSlide, this.categoryNav);
    this.slidesCache.push(nextSlide); // Обновляем кэш

    // Создаем маску перехода
    const mask = document.createElement('div');
    mask.className = 'transition-mask';

    const leftHalf = document.createElement('div');
    const rightHalf = document.createElement('div');
    leftHalf.className = 'half-slide left';
    rightHalf.className = 'half-slide right';

    const leftImage = document.createElement('div');
    const rightImage = document.createElement('div');
    leftImage.className = 'slide-image';
    rightImage.className = 'slide-image';
    leftImage.style.backgroundImage = `url('${leavingImage}')`;
    rightImage.style.backgroundImage = `url('${leavingImage}')`;

    leftHalf.appendChild(leftImage);
    rightHalf.appendChild(rightImage);
    mask.appendChild(leftHalf);
    mask.appendChild(rightHalf);

    this.container.appendChild(mask);

    // Анимация перехода
    if (typeof gsap !== 'undefined') {
      gsap.to(leftHalf, {
        y: '100%',
        duration: 1,
        ease: 'power3.inOut',
      });

      gsap.to(rightHalf, {
        y: '100%',
        duration: 0.8,
        delay: 0.25,
        ease: 'power3.inOut',
        onComplete: () => {
          mask.remove();
          this.currentCategory = newCategory;
          this.currentSlide = 0;
          // Обновляем кэш слайдов после переключения категории
          this.updateSlidesCache();
        },
      });
    } else {
      // Fallback без GSAP
      setTimeout(() => {
        mask.remove();
        this.currentCategory = newCategory;
        this.currentSlide = 0;
        // Обновляем кэш слайдов после переключения категории
        this.updateSlidesCache();
      }, 1000);
    }
  }

  /**
   * Рендеринг навигации по категориям
   */
  renderCategoryNav() {
    // Очищаем предыдущий контент
    this.categoryNav.innerHTML = '';

    // Создаем внутренний контейнер для скролла
    const inner = document.createElement('div');
    inner.className = 'category-nav-inner';
    this.categoryNav.appendChild(inner);

    // Создаем подсветку активной категории
    const highlight = document.createElement('div');
    highlight.className = 'category-highlight';
    inner.appendChild(highlight);

    const updateHighlight = (btn, immediate = false) => {
      if (!btn || !highlight) return;
      const offsetLeft = btn.offsetLeft;
      const width = btn.offsetWidth + 2;
      if (immediate || this.categoryNav.classList.contains('is-scrolling')) {
        highlight.style.transition = 'none';
      } else {
        highlight.style.transition = '';
      }
      highlight.style.left = (offsetLeft - 1) + 'px';
      highlight.style.width = width + 'px';
    };

    // Создаем кнопки категорий
    Object.keys(this.categories).forEach(category => {
      const btn = document.createElement('button');
      btn.textContent = category;
      btn.className = 'category-btn';

      if (category === this.currentCategory) {
        btn.classList.add('active');
        setTimeout(() => updateHighlight(btn), 0);
      }

      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) return;

        // Используем кэшированные кнопки вместо querySelectorAll
        this.categoryButtonsCache.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        updateHighlight(btn);
        this.switchCategory(category);
      });

      inner.appendChild(btn);
    });
    
    // Обновляем кэш кнопок после создания
    this.updateCategoryButtonsCache();

    // Синхронизация подсветки при скролле
    this.categoryNav.addEventListener('scroll', () => {
      // Используем кэшированные кнопки вместо querySelector
      const active = this.categoryButtonsCache.find(btn => btn.classList.contains('active'));
      this.categoryNav.classList.add('is-scrolling');
      if (active) updateHighlight(active, true);
      if (this.scrollEndTimer) clearTimeout(this.scrollEndTimer);
      this.scrollEndTimer = setTimeout(() => {
        this.categoryNav.classList.remove('is-scrolling');
        if (active) updateHighlight(active, false);
      }, 120);
    }, { passive: true });

    // Обновление при изменении размера
    const refreshActive = () => {
      // Используем кэшированные кнопки вместо querySelector
      const active = this.categoryButtonsCache.find(btn => btn.classList.contains('active'));
      if (active) updateHighlight(active, true);
    };
    const debouncedRefreshActive = debounce(refreshActive, 250);
    window.addEventListener('resize', debouncedRefreshActive);
    window.addEventListener('orientationchange', refreshActive);

    // ResizeObserver для отслеживания изменений
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(() => refreshActive());
      ro.observe(this.categoryNav);
      ro.observe(inner);
      // Используем кэшированные кнопки вместо querySelectorAll
      this.categoryButtonsCache.forEach(btn => ro.observe(btn));
    }

    // Drag-to-scroll для десктопа
    this.setupDragToScroll();

    // Touch inertia для мобильных
    this.setupTouchInertia();
  }

  /**
   * Настройка drag-to-scroll для навигации категорий
   */
  setupDragToScroll() {
    const hasOverflow = () => this.categoryNav.scrollWidth > this.categoryNav.clientWidth + 1;

    // Mouse drag
    this.categoryNav.addEventListener('mousedown', (e) => {
      if (!hasOverflow()) return;
      this.isDown = true;
      this.startX = e.clientX;
      this.startScrollLeft = this.categoryNav.scrollLeft;
      this.categoryNav.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mouseup', () => {
      if (!this.isDown) return;
      this.isDown = false;
      this.categoryNav.style.cursor = '';
    });

    this.categoryNav.addEventListener('mouseleave', () => {
      if (!this.isDown) return;
      this.isDown = false;
      this.categoryNav.style.cursor = '';
    });

    this.categoryNav.addEventListener('mousemove', (e) => {
      if (!this.isDown) return;
      const dx = e.clientX - this.startX;
      this.categoryNav.scrollLeft = this.startScrollLeft - dx;
    });

    // Wheel to horizontal
    this.categoryNav.addEventListener('wheel', (e) => {
      if (!hasOverflow()) return;
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      this.categoryNav.scrollLeft += delta;
      e.preventDefault();
    }, { passive: false });
  }

  /**
   * Настройка touch inertia для мобильных устройств
   */
  setupTouchInertia() {
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouch) return;

    const stopGlide = () => {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    };

    const onTouchStart = (e) => {
      stopGlide();
      this.lastX = e.touches[0].clientX;
      this.lastT = performance.now();
      this.velocity = 0;
    };

    const onTouchMove = (e) => {
      const x = e.touches[0].clientX;
      const t = performance.now();
      const dx = x - this.lastX;
      const dt = Math.max(1, t - this.lastT);
      this.velocity = -dx / dt;
      this.lastX = x;
      this.lastT = t;
    };

    const glide = () => {
      if (Math.abs(this.velocity) < 0.012) {
        this.rafId = null;
        return;
      }
      const t = 16;
      this.categoryNav.scrollLeft += this.velocity * t;
      this.velocity *= 0.955;
      if (this.categoryNav.scrollLeft <= 0 || 
          this.categoryNav.scrollLeft >= this.categoryNav.scrollWidth - this.categoryNav.clientWidth) {
        this.rafId = null;
        return;
      }
      this.rafId = requestAnimationFrame(glide);
    };

    const onTouchEnd = () => {
      const before = this.categoryNav.scrollLeft;
      setTimeout(() => {
        const after = this.categoryNav.scrollLeft;
        const nativeMomentum = Math.abs(after - before) > 1;
        if (!nativeMomentum && Math.abs(this.velocity) > 0.05 && !this.rafId) {
          this.rafId = requestAnimationFrame(glide);
        }
      }, 40);
    };

    this.categoryNav.addEventListener('touchstart', onTouchStart, { passive: true });
    this.categoryNav.addEventListener('touchmove', onTouchMove, { passive: true });
    this.categoryNav.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  /**
   * Обработка переключения слайда
   */
  handleSlideChange(direction = 'next') {
    const catSlides = this.categories[this.currentCategory];
    if (!catSlides || catSlides.length === 0) return;

    const totalSlides = catSlides.length;

    // Сохраняем индекс текущего слайда ДО обновления
    const oldSlideIndex = this.currentSlide;
    
    this.currentSlide = direction === 'next'
      ? (this.currentSlide + 1) % totalSlides
      : (this.currentSlide - 1 + totalSlides) % totalSlides;

    // Seamless carousel: анимация выхода и входа одновременно
    // Используем кэшированные слайды - берем слайд по старому индексу
    const outgoing = this.slidesCache[oldSlideIndex] || this.slidesCache[0];
    
    const incoming = this.createSlide(catSlides[this.currentSlide]);
    incoming.classList.add(direction === 'next' ? 'slide-anim-right' : 'slide-anim-left');
    this.container.insertBefore(incoming, this.categoryNav);
    
    // Обновляем кэш: заменяем старый слайд новым
    if (outgoing && this.slidesCache.includes(outgoing)) {
      const outgoingIndex = this.slidesCache.indexOf(outgoing);
      this.slidesCache[outgoingIndex] = incoming;
    } else {
      this.slidesCache.push(incoming);
    }

    if (outgoing) {
      outgoing.classList.add(direction === 'next' ? 'slide-out-left' : 'slide-out-right');
      setTimeout(() => {
        outgoing.remove();
        // Удаляем из кэша после удаления из DOM, если еще там
        const index = this.slidesCache.indexOf(outgoing);
        if (index > -1) {
          this.slidesCache.splice(index, 1);
        }
      }, 560);
    }
  }

  /**
   * Включение drag для переключения слайдов
   */
  enableSlideDrag() {
    this.container.addEventListener('mousedown', (e) => {
      // Игнорируем drag, если он начался в навигации категорий
      if (e.target.closest('#categoryNav')) return;
      this.slideStartX = e.clientX;
      this.isSlideDragging = true;
    });

    this.container.addEventListener('mouseup', (e) => {
      if (!this.isSlideDragging) return;
      const delta = e.clientX - this.slideStartX;
      if (delta > 50) this.handleSlideChange('prev');
      else if (delta < -50) this.handleSlideChange('next');
      this.isSlideDragging = false;
    });

    this.container.addEventListener('touchstart', (e) => {
      // Блокируем обработку жеста, если пользователь начал в навигации
      this.gestureLocked = !!e.target.closest('#categoryNav');
      if (this.gestureLocked) return;
      this.slideStartX = e.touches[0].clientX;
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      if (this.gestureLocked) {
        this.gestureLocked = false;
        return;
      }
      const endX = e.changedTouches[0].clientX;
      const delta = endX - this.slideStartX;
      if (delta > 50) this.handleSlideChange('prev');
      else if (delta < -50) this.handleSlideChange('next');
    });
  }

  /**
   * Настройка кнопок навигации
   */
  setupNavigationButtons() {
    if (this.nextButton) {
      this.nextButton.addEventListener('click', () => this.handleSlideChange('next'));
    }
    if (this.prevButton) {
      this.prevButton.addEventListener('click', () => this.handleSlideChange('prev'));
    }
  }

  /**
   * Обновление категорий
   */
  updateCategories(newCategories) {
    this.categories = newCategories;
    this.renderCategoryNav();
  }

  /**
   * Получение текущей категории
   */
  getCurrentCategory() {
    return this.currentCategory;
  }

  /**
   * Получение текущего слайда
   */
  getCurrentSlide() {
    return this.currentSlide;
  }

  /**
   * Уничтожение галереи
   */
  destroy() {
    // Очищаем таймеры
    if (this.scrollEndTimer) {
      clearTimeout(this.scrollEndTimer);
    }
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    // Удаляем обработчики событий (они будут удалены автоматически при удалении элементов)
    // Но можно добавить более детальную очистку при необходимости
  }
}

