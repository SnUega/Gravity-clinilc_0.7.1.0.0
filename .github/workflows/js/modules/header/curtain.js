/**
 * Curtain Mode для мобильных устройств
 * Полноэкранное меню для мобильных и планшетов в портретной ориентации
 */

/**
 * Класс Curtain Mode
 */
export class CurtainMode {
  constructor(elements, callbacks) {
    this.elements = elements;
    this.callbacks = callbacks;
    
    this.curtainOpen = false;
    this.curtainContentEl = null;
    this.panelOriginalParent = null;
    this.panelOriginalNextSibling = null;
    this.lastCurtainScrollTop = 0;
    this.headerHiddenByScroll = false;
  }

  /**
   * Построение контента для curtain
   */
  buildCurtainContent() {
    const container = document.createElement('div');
    container.className = 'curtain-content';

    const logo = document.querySelector('.navc-menu-logo');
    if (logo) container.appendChild(logo.cloneNode(true));

    const menuLeft = document.querySelector('.menu-left');
    if (menuLeft) {
      const heading = menuLeft.querySelector('h2');
      const navList = menuLeft.querySelector('.navc-links');
      if (heading) container.appendChild(heading.cloneNode(true));
      if (navList) container.appendChild(navList.cloneNode(true));
    }

    const hr1 = document.createElement('hr');
    hr1.className = 'curtain-divider';
    container.appendChild(hr1);

    const menuRight = document.querySelector('.menu-right');
    if (menuRight) container.appendChild(menuRight.cloneNode(true));

    const hr2 = document.createElement('hr');
    hr2.className = 'curtain-divider';
    container.appendChild(hr2);

    const contactsSection = document.querySelector('.menu-contacts-section');
    if (contactsSection) {
      const contactsClone = contactsSection.cloneNode(true);
      container.appendChild(contactsClone);
    }

    return container;
  }

  /**
   * Открытие curtain
   */
  open() {
    if (window.lockScroll) window.lockScroll();
    this.elements.body.classList.add('menu-open');
    this.elements.burger.classList.add('active');
    this.elements.burger.setAttribute('aria-expanded', 'true');

    this.elements.menuContainer.classList.add('curtain-open');
    this.elements.menuContainer.classList.add('active');

    if (!this.panelOriginalParent) {
      this.panelOriginalParent = this.elements.menuPanel.parentNode;
      this.panelOriginalNextSibling = this.elements.menuPanel.nextSibling;
    }
    document.body.appendChild(this.elements.menuPanel);
    this.elements.menuPanel.classList.add('curtain-floating');

    gsap.set(this.elements.menuPanel, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      borderRadius: 0,
      boxShadow: 'none',
      clipPath: 'none',
      xPercent: 0,
      yPercent: -100,
      zIndex: 50,
      overflowY: 'auto',
      backgroundColor: '#ffffff',
      opacity: 1,
      visibility: 'visible'
    });
    this.elements.menuPanel.style.transform = '';
    
    if (this.callbacks.animateHeaderContent) {
      this.callbacks.animateHeaderContent(false);
    }

    if (this.elements.menuInner) this.elements.menuInner.style.display = 'none';
    this.curtainContentEl = this.buildCurtainContent();
    if (this.curtainContentEl) this.elements.menuPanel.appendChild(this.curtainContentEl);

    gsap.to(this.elements.header, { 
      width: 64, 
      height: 64, 
      padding: 0, 
      borderRadius: 32, 
      duration: 0.4, 
      ease: 'power1.inOut' 
    });

    gsap.to(this.elements.menuPanel, { 
      yPercent: 0, 
      duration: 0.4, 
      ease: 'power1.inOut' 
    });

    this.setupScrollHandlers();

    this.curtainOpen = true;
  }

  /**
   * Закрытие curtain
   */
  close() {
    if (this.callbacks.hideMenuBackdrop) {
      this.callbacks.hideMenuBackdrop();
    }
    
    gsap.to(this.elements.menuPanel, { 
      yPercent: -100, 
      duration: 0.4, 
      ease: 'power1.inOut', 
      onComplete: () => {
        if (this.curtainContentEl && this.curtainContentEl.parentNode) {
          this.curtainContentEl.parentNode.removeChild(this.curtainContentEl);
        }
        this.curtainContentEl = null;
        if (this.elements.menuInner) this.elements.menuInner.style.display = '';
        this.elements.menuContainer.classList.remove('curtain-open');
        this.elements.menuContainer.classList.remove('active');
        this.removeScrollHandlers();
        if (this.panelOriginalParent) {
          if (this.panelOriginalNextSibling) {
            this.panelOriginalParent.insertBefore(this.elements.menuPanel, this.panelOriginalNextSibling);
          } else {
            this.panelOriginalParent.appendChild(this.elements.menuPanel);
          }
        }
        this.panelOriginalParent = null;
        this.panelOriginalNextSibling = null;
        this.elements.menuPanel.classList.remove('curtain-floating');
        gsap.set(this.elements.menuPanel, { clearProps: 'all' });
      }
    });

    gsap.to(this.elements.header, { 
      width: '', 
      height: '', 
      padding: '', 
      borderRadius: '', 
      duration: 0.4, 
      ease: 'power1.inOut' 
    });
    
    if (this.callbacks.animateHeaderContent) {
      this.callbacks.animateHeaderContent(true);
    }
    
    this.elements.burger.classList.remove('active');
    this.elements.burger.setAttribute('aria-expanded', 'false');
    this.elements.body.classList.remove('menu-open');
    if (window.unlockScroll) window.unlockScroll();

    this.curtainOpen = false;
  }

  /**
   * Настройка обработчиков скролла для curtain
   */
  setupScrollHandlers() {
    const wheelHandler = (e) => {
      const blogScrollArea = e.target.closest('.blog-scroll-area');
      if (blogScrollArea) return;
      
      const el = this.elements.menuPanel;
      const atTop = el.scrollTop === 0;
      const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
      const goingUp = e.deltaY < 0;
      const goingDown = e.deltaY > 0;
      if ((goingUp && !atTop) || (goingDown && !atBottom)) {
        e.stopPropagation();
      }
    };
    
    const touchMoveHandler = (e) => { e.stopPropagation(); };
    
    const scrollHandler = () => {
      const current = this.elements.menuPanel.scrollTop;
      const delta = current - this.lastCurtainScrollTop;
      if (delta > 8 && !this.headerHiddenByScroll) {
        gsap.to(this.elements.header, { autoAlpha: 0, y: -20, duration: 0.18, overwrite: true });
        this.headerHiddenByScroll = true;
      } else if (delta < -8 && this.headerHiddenByScroll) {
        gsap.to(this.elements.header, { autoAlpha: 1, y: 0, duration: 0.18, overwrite: true });
        this.headerHiddenByScroll = false;
      }
      this.lastCurtainScrollTop = current;
    };
    
    const blogScrollArea = this.elements.menuPanel.querySelector('.blog-scroll-area');
    const blogWheelHandler = (e) => {
      e.stopPropagation();
      e.preventDefault();
      const target = e.currentTarget;
      const delta = e.deltaY;
      target.scrollTop += delta * 0.5;
    };
    const blogTouchHandler = (e) => {
      e.stopPropagation();
    };
    
    this.elements.menuPanel.addEventListener('wheel', wheelHandler, { passive: false });
    this.elements.menuPanel.addEventListener('touchmove', touchMoveHandler, { passive: true });
    this.elements.menuPanel.addEventListener('scroll', scrollHandler, { passive: true });
    
    if (blogScrollArea) {
      blogScrollArea.addEventListener('wheel', blogWheelHandler, { passive: false });
      blogScrollArea.addEventListener('touchmove', blogTouchHandler, { passive: true });
    }
    
    this.elements.menuPanel._wheelHandler = wheelHandler;
    this.elements.menuPanel._touchMoveHandler = touchMoveHandler;
    this.elements.menuPanel._scrollHandler = scrollHandler;
    this.elements.menuPanel._blogWheelHandler = blogWheelHandler;
    this.elements.menuPanel._blogTouchHandler = blogTouchHandler;
  }

  /**
   * Удаление обработчиков скролла
   */
  removeScrollHandlers() {
    if (this.elements.menuPanel._wheelHandler) {
      this.elements.menuPanel.removeEventListener('wheel', this.elements.menuPanel._wheelHandler);
    }
    if (this.elements.menuPanel._touchMoveHandler) {
      this.elements.menuPanel.removeEventListener('touchmove', this.elements.menuPanel._touchMoveHandler);
    }
    if (this.elements.menuPanel._scrollHandler) {
      this.elements.menuPanel.removeEventListener('scroll', this.elements.menuPanel._scrollHandler);
    }
    if (this.elements.menuPanel._blogWheelHandler) {
      const blogArea = this.elements.menuPanel.querySelector('.blog-scroll-area');
      if (blogArea) {
        blogArea.removeEventListener('wheel', this.elements.menuPanel._blogWheelHandler);
        blogArea.removeEventListener('touchmove', this.elements.menuPanel._blogTouchHandler);
      }
    }
    delete this.elements.menuPanel._wheelHandler;
    delete this.elements.menuPanel._touchMoveHandler;
    delete this.elements.menuPanel._scrollHandler;
    delete this.elements.menuPanel._blogWheelHandler;
    delete this.elements.menuPanel._blogTouchHandler;
  }

  /**
   * Проверка, открыт ли curtain
   */
  isOpen() {
    return this.curtainOpen;
  }
}

