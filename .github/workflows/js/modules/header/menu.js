/**
 * Основной контроллер меню хедера
 * Координирует работу всех подмодулей
 */

import { $ } from '../../core/utils.js';
import { debounce } from '../../core/utils.js';
import { MENU_CONFIG } from './config.js';
import { getErrorHandler, ERROR_SEVERITY } from '../../core/errors.js';
import { CurtainMode } from './curtain.js';
import { MenuAnimations } from './animations.js';
import {
  smoothScrollToTarget,
  showMenuBackdrop,
  hideMenuBackdrop,
  animateHeaderContent,
  setPanelClipPath,
  getCurrentStemWidth,
  PanelWidthCache,
  addBlogScrollHandlers,
  removeBlogScrollHandlers
} from './helpers.js';

/**
 * Класс меню хедера
 */
export class HeaderMenu {
  constructor(options = {}) {
    this.options = {
      burgerSelector: options.burgerSelector || '.navc-burger, .burger',
      headerSelector: options.headerSelector || '.navc-header, .header',
      logoSelector: options.logoSelector || '.navc-logo, .header__logo',
      contactSelector: options.contactSelector || '.navc-phone, .header__contact, .navc-call-btn',
      menuContainerSelector: options.menuContainerSelector || '.navc-menu, .menu-container',
      menuStemSelector: options.menuStemSelector || '.navc-stem, .menu-stem',
      menuInnerSelector: options.menuInnerSelector || '.navc-inner, .menu-inner',
      menuPanelSelector: options.menuPanelSelector || '.navc-panel, .menu-panel',
      ...options
    };

    // Элементы
    this.elements = {
      burger: null,
      header: null,
      headerLogo: null,
      headerContact: null,
      menuContainer: null,
      menuStem: null,
      menuInner: null,
      menuPanel: null,
      body: document.body
    };

    // Состояние
    this.pendingAnchorTarget = null;
    this.openTl = null;

    // Подмодули
    this.curtainMode = null;
    this.animations = null;
    this.panelWidthCache = new PanelWidthCache(MENU_CONFIG.CACHE_DURATION);

    // Обработчики для cleanup
    this.handlers = {
      resize: null,
      click: null,
      keydown: null
    };
  }

  /**
   * Инициализация меню
   */
  init() {
    // Проверяем наличие GSAP
    if (typeof gsap === 'undefined') {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('GSAP not available, menu animations may not work'), {
        module: 'header-menu',
        severity: ERROR_SEVERITY.LOW,
        context: { action: 'init' },
        userMessage: null
      });
    }

    // Находим элементы
    this.elements.burger = $(this.options.burgerSelector);
    this.elements.header = $(this.options.headerSelector);
    this.elements.headerLogo = $(this.options.logoSelector);
    this.elements.headerContact = $(this.options.contactSelector);
    this.elements.menuContainer = $(this.options.menuContainerSelector);
    this.elements.menuStem = $(this.options.menuStemSelector);
    this.elements.menuInner = $(this.options.menuInnerSelector);
    this.elements.menuPanel = $(this.options.menuPanelSelector);

    if (!this.elements.burger || !this.elements.header || !this.elements.menuContainer || 
        !this.elements.menuStem || !this.elements.menuInner || !this.elements.menuPanel) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('Required menu elements not found'), {
        module: 'header-menu',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { 
          action: 'init',
          burger: !!this.elements.burger,
          header: !!this.elements.header,
          menuContainer: !!this.elements.menuContainer,
          menuStem: !!this.elements.menuStem,
          menuInner: !!this.elements.menuInner,
          menuPanel: !!this.elements.menuPanel
        },
        userMessage: null
      });
      return;
    }

    // Инициализируем scroll lock helpers
    this.initScrollLock();

    // Подготавливаем начальное состояние
    this.prepareInitialState();

    // Создаем подмодули
    this.createSubmodules();

    // Настраиваем обработчики
    this.setupEventHandlers();

    // Запускаем intro анимацию
    this.animations.runHeaderIntro();

    // Настраиваем кнопку звонка
    this.setupCallButton();

    // HeaderMenu initialized
  }

  /**
   * Инициализация scroll lock helpers
   */
  initScrollLock() {
    if (!window.lockScroll) {
      window.lockScroll = () => this.elements.body.classList.add('lock-scroll');
    }
    if (!window.unlockScroll) {
      window.unlockScroll = () => this.elements.body.classList.remove('lock-scroll');
    }
  }

  /**
   * Подготовка начального состояния элементов
   */
  prepareInitialState() {
    gsap.set(this.elements.menuStem, { 
      height: 0, 
      width: 64, 
      left: '50%', 
      xPercent: -50, 
      transformOrigin: '50% 0%' 
    });
    gsap.set(this.elements.menuPanel, { clipPath: 'inset(0 47.33% 0 47.33% round 50px)' });
    gsap.set(this.elements.menuInner, { opacity: 0 });
  }

  /**
   * Создание подмодулей
   */
  createSubmodules() {
    // Создаем helpers объект для передачи в подмодули
    const helpers = {
      showMenuBackdrop,
      hideMenuBackdrop,
      animateHeaderContent: (visible, duration) => 
        animateHeaderContent(this.elements, visible, duration),
      smoothScrollToTarget,
      setPanelClipPath: (panelW, currentW) => 
        setPanelClipPath(this.elements.menuPanel, panelW, currentW),
      getCurrentStemWidth: () => 
        getCurrentStemWidth(this.elements.menuStem, MENU_CONFIG.DIMENSIONS.STEM_INITIAL_WIDTH),
      getCachedPanelWidth: () => 
        this.panelWidthCache.get(this.elements.menuContainer)
    };

    // Создаем curtain mode
    this.curtainMode = new CurtainMode(this.elements, {
      animateHeaderContent: (visible) => 
        animateHeaderContent(this.elements, visible),
      hideMenuBackdrop
    });

    // Создаем animations с callback для pendingAnchorTarget
    helpers.onReverseComplete = () => {
      if (this.pendingAnchorTarget) {
        smoothScrollToTarget(this.pendingAnchorTarget, -80);
        this.pendingAnchorTarget = null;
      }
    };
    
    this.animations = new MenuAnimations(this.elements, helpers);
    this.animations.createOpenAnimation();
    this.openTl = this.animations.getOpenTimeline();
  }

  /**
   * Настройка обработчиков событий
   */
  setupEventHandlers() {
    // Обработчик кликов (делегирование)
    this.handlers.click = (e) => {
      // Burger clicks
      if (e.target.matches(this.options.burgerSelector) || 
          e.target.closest(this.options.burgerSelector)) {
        e.preventDefault();
        e.stopPropagation();
        if (this.isCurtainMode()) {
          this.toggleCurtain();
        } else {
          this.toggleMenu();
        }
        return;
      }
      
      // Menu link clicks
      if (e.target.matches('.navc-links a, .menu-left a')) {
        const href = e.target.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          e.stopPropagation();
          const target = document.querySelector(href);
          if (target) {
            this.pendingAnchorTarget = target;
            if (this.isCurtainMode()) {
              this.curtainMode.close();
            } else {
              this.openTl.reverse();
            }
          }
        }
        return;
      }
      
      // Click-outside close
      const isOpen = this.openTl && this.openTl.progress() > 0 && !this.openTl.reversed();
      const curtainActive = this.curtainMode && this.curtainMode.isOpen();
      if (isOpen || curtainActive) {
        const within = this.elements.menuPanel.contains(e.target) || 
                      this.elements.burger.contains(e.target) || 
                      this.elements.header.contains(e.target);
        if (!within) {
          if (curtainActive) {
            this.curtainMode.close();
          } else {
            this.openTl.timeScale(0.8).reverse();
          }
        }
      }
    };
    document.addEventListener('click', this.handlers.click);

    // ESC key
    this.handlers.keydown = (e) => {
      if (e.key === 'Escape' && this.openTl && this.openTl.progress() > 0 && !this.openTl.reversed()) {
        hideMenuBackdrop();
        this.openTl.timeScale(0.8).reverse();
      }
    };
    document.addEventListener('keydown', this.handlers.keydown);

    // Anchor navigation
    document.querySelectorAll('[data-anchor]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = a.getAttribute('href') || '';
        if (href.startsWith('#')) {
          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            this.pendingAnchorTarget = target;
          }
        }
        if (this.isCurtainMode()) {
          const targetAfter = this.pendingAnchorTarget;
          this.curtainMode.close();
          if (targetAfter) {
            setTimeout(() => { 
              smoothScrollToTarget(targetAfter, -80); 
            }, 260);
          }
          this.pendingAnchorTarget = null;
          return;
        }
        if (this.openTl && this.openTl.progress() > 0 && !this.openTl.reversed()) {
          this.openTl.timeScale(1).reverse(0);
        } else if (this.pendingAnchorTarget) {
          smoothScrollToTarget(this.pendingAnchorTarget, -80);
          this.pendingAnchorTarget = null;
        }
      });
    });

    // Curtain content anchor clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest && e.target.closest('.curtain-content a[data-anchor]');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      if (!href.startsWith('#')) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      this.pendingAnchorTarget = target;
      const targetAfter = this.pendingAnchorTarget;
      this.curtainMode.close();
      if (targetAfter) {
        setTimeout(() => { 
          smoothScrollToTarget(targetAfter, -80); 
        }, 260);
      }
      this.pendingAnchorTarget = null;
    });

    // Resize handler
    this.handlers.resize = debounce(() => {
      this.panelWidthCache.clear();
      
      if (!this.isCurtainMode() && this.curtainMode && this.curtainMode.isOpen()) {
        this.curtainMode.close();
      }
    }, MENU_CONFIG.ANIMATIONS.DURATION.RESIZE_DEBOUNCE);
    window.addEventListener('resize', this.handlers.resize);
  }

  /**
   * Настройка кнопки звонка
   */
  setupCallButton() {
    const callBtn = document.querySelector('.navc-call-btn');
    if (callBtn) {
      callBtn.addEventListener('click', () => {
        const tel = callBtn.getAttribute('data-tel');
        if (tel) window.location.href = `tel:${tel}`;
      });
    }
  }

  /**
   * Переключение меню
   */
  toggleMenu() {
    if (this.isCurtainMode()) {
      this.toggleCurtain();
      return;
    }
    const isOpening = this.openTl.reversed() || this.openTl.progress() === 0;
    if (isOpening) {
      this.openTl.timeScale(1).play(0);
      this.elements.burger.setAttribute('aria-expanded', 'true');
      setTimeout(() => addBlogScrollHandlers(this.elements.menuInner), 1000);
    } else {
      const panelW = this.panelWidthCache.get(this.elements.menuContainer);
      const currentW = getCurrentStemWidth(this.elements.menuStem, MENU_CONFIG.DIMENSIONS.STEM_INITIAL_WIDTH);
      setPanelClipPath(this.elements.menuPanel, panelW, currentW);
      this.openTl.timeScale(0.8).reverse();
      this.elements.burger.setAttribute('aria-expanded', 'false');
      removeBlogScrollHandlers(this.elements.menuInner);
    }
  }

  /**
   * Переключение curtain
   */
  toggleCurtain() {
    if (this.curtainMode.isOpen()) {
      hideMenuBackdrop();
      this.curtainMode.close();
    } else {
      showMenuBackdrop();
      this.curtainMode.open();
    }
  }

  /**
   * Проверка, нужно ли использовать curtain mode
   */
  isCurtainMode() {
    try {
      const isSmall = window.innerWidth <= MENU_CONFIG.BREAKPOINTS.MOBILE;
      const isPortraitTablet = window.innerWidth <= MENU_CONFIG.BREAKPOINTS.TABLET && 
                               window.matchMedia('(orientation: portrait)').matches;
      return isSmall || isPortraitTablet;
    } catch (_) {
      return window.innerWidth <= MENU_CONFIG.BREAKPOINTS.MOBILE;
    }
  }

  /**
   * Очистка
   */
  destroy() {
    // Удаляем обработчики
    if (this.handlers.click) {
      document.removeEventListener('click', this.handlers.click);
    }
    if (this.handlers.keydown) {
      document.removeEventListener('keydown', this.handlers.keydown);
    }
    if (this.handlers.resize) {
      window.removeEventListener('resize', this.handlers.resize);
    }

    // Очищаем кэш
    this.panelWidthCache.clear();

    // Убиваем анимации
    if (this.openTl) {
      this.openTl.kill();
    }

    // Закрываем curtain если открыт
    if (this.curtainMode && this.curtainMode.isOpen()) {
      this.curtainMode.close();
    }
  }
}
