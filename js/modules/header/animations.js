/**
 * Анимации меню хедера
 * Intro анимация и desktop анимация открытия
 */

import { MENU_CONFIG } from './config.js';

/**
 * Класс анимаций меню
 */
export class MenuAnimations {
  constructor(elements, helpers) {
    this.elements = elements;
    this.helpers = helpers;
    this.openTl = null;
  }

  /**
   * Создание анимации открытия меню (desktop)
   */
  createOpenAnimation() {
    // Кэшируем элементы меню один раз при создании анимации
    const leftItems = this.elements.menuInner ? 
      Array.from(this.elements.menuInner.querySelectorAll('.menu-left h2, .menu-left li')) : [];
    const rightItems = this.elements.menuInner ? 
      Array.from(this.elements.menuInner.querySelectorAll('.menu-right h2, .blog-container')) : [];
    const contactItems = this.elements.menuInner ? 
      Array.from(this.elements.menuInner.querySelectorAll('.menu-contacts-section .contact-btn')) : [];
    
    // Кэшируем ширину панели ДО создания анимации
    const panelW = this.helpers.getCachedPanelWidth();
    const startW = 64;
    
    // Предвычисляем значения для оптимизации
    const startInset = ((panelW - startW) / 2 / panelW) * 100;
    const startScale = startW / panelW;

    this.openTl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.out' },
      onReverseComplete: () => {
        this.elements.menuContainer.classList.remove('active');
        this.elements.burger.classList.remove('active');
        this.elements.menuStem.style.top = '';
        this.elements.menuStem.style.width = '64px';
        this.elements.menuStem.style.height = '0px';
        this.elements.menuContainer.style.top = 'calc(var(--index) * 4)';
        this.elements.menuContainer.style.left = '';
        this.elements.menuContainer.style.transform = '';
        this.elements.menuStem.style.left = '';
        this.elements.menuStem.style.transform = 'translateX(-50%)';
        this.elements.menuPanel.style.clipPath = '';
        
        this.elements.body.classList.remove('menu-open');
        if (window.unlockScroll) window.unlockScroll();
        this.helpers.hideMenuBackdrop();
        
        // pendingAnchorTarget обрабатывается в menu.js через callback
        if (this.helpers.onReverseComplete) {
          this.helpers.onReverseComplete();
        }
      }
    });

    this.openTl.eventCallback('onReverseStart', () => {
      // Очищаем will-change после анимации для освобождения ресурсов
      gsap.set(this.elements.menuStem, { willChange: 'auto' });
      gsap.set(this.elements.menuPanel, { willChange: 'auto' });
      
      // Используем кэшированную ширину панели из замыкания
      const currentW = this.helpers.getCurrentStemWidth();
      this.helpers.setPanelClipPath(panelW, currentW);
    });
    
    // Очищаем will-change при завершении анимации
    this.openTl.eventCallback('onComplete', () => {
      gsap.set(this.elements.menuStem, { willChange: 'auto' });
      gsap.set(this.elements.menuPanel, { willChange: 'auto' });
      if (leftItems && leftItems.length) gsap.set(leftItems, { willChange: 'auto' });
      if (rightItems && rightItems.length) gsap.set(rightItems, { willChange: 'auto' });
      if (contactItems && contactItems.length) gsap.set(contactItems, { willChange: 'auto' });
    });

    this.openTl
      .add(() => {
        if (window.lockScroll) window.lockScroll();
        this.elements.body.classList.add('menu-open');
        if (this.helpers.showMenuBackdrop) {
          this.helpers.showMenuBackdrop();
        }
      }, 0)
      .to([this.elements.headerLogo, this.elements.headerContact], { 
        autoAlpha: 0, 
        y: -10, 
        duration: 0.2 
      }, 0)
      .add(() => { 
        this.elements.burger.classList.add('active'); 
      }, 0)
      .to(this.elements.header, { 
        width: 64, 
        height: 64, 
        padding: 0, 
        borderRadius: 32, 
        duration: 0.5, 
        ease: 'none' 
      }, 0)
      .add(() => {
        // Кэшируем getBoundingClientRect результат ДО анимации
        const headerRect = this.elements.header.getBoundingClientRect();
        const circleCenterY = headerRect.top + headerRect.height / 2;
        this.elements.menuContainer.style.top = (circleCenterY - 1) + 'px';
        this.elements.menuContainer.classList.add('active');
        this.elements.menuStem.style.top = '0px';
        this.elements.menuStem.style.left = '50%';
        this.elements.menuStem.style.transform = 'translateX(-50%)';
      }, '>-0.05')
      .add(() => {
        // Устанавливаем will-change для GPU ускорения
        gsap.set(this.elements.menuStem, {
          willChange: 'height, width',
          backgroundColor: '#ffffff',
          borderWidth: 0,
          borderStyle: 'none',
          borderRadius: '0 0 32px 32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        });
        gsap.set(this.elements.menuPanel, {
          willChange: 'clip-path, transform'
        });
        // Используем предвычисленные значения
        gsap.set(this.elements.menuPanel, { 
          clipPath: `inset(0 ${startInset}% 0 ${startInset}% round 50px)`, 
          '--panelScale': startScale 
        });
      }, '>-0.05')
      .to(this.elements.menuStem, { 
        height: '85vh', 
        duration: MENU_CONFIG.ANIMATIONS.DURATION.STEM_DROP, 
        ease: 'power1.inOut',
        // Оптимизируем onUpdate: кэшируем panelW и используем throttle для обновлений
        onUpdate: (() => {
          let lastUpdateTime = 0;
          const throttleMs = 16; // ~60fps
          return () => {
            const now = performance.now();
            if (now - lastUpdateTime < throttleMs) return;
            lastUpdateTime = now;
            
            // Используем кэшированную ширину панели
            const currentW = this.helpers.getCurrentStemWidth();
            this.helpers.setPanelClipPath(panelW, currentW);
            const scale = currentW / panelW;
            gsap.set(this.elements.menuPanel, { '--panelScale': scale });
          };
        })()
      }, '>-0.02')
      .add('expandStart')
      .add(() => {
        // Используем предвычисленные значения (startW и startInset определены выше)
        this.elements.menuStem.style.width = startW + 'px';
        this.elements.menuStem.style.transformOrigin = '50% 0%';
        gsap.set(this.elements.menuPanel, { clipPath: `inset(0 ${startInset}% 0 ${startInset}% round 50px)` });
        gsap.set(this.elements.menuPanel, { '--panelScale': 1 });
      }, 'expandStart')
      .add(() => {
        // Используем кэшированную ширину панели (panelW определен выше)
        const widthTween = gsap.to(this.elements.menuStem, {
          width: panelW,
          duration: MENU_CONFIG.ANIMATIONS.DURATION.STEM_EXPAND,
          ease: 'power1.inOut',
          // Оптимизируем onUpdate с throttle
          onUpdate: (() => {
            let lastUpdateTime = 0;
            const throttleMs = 16; // ~60fps
            return () => {
              const now = performance.now();
              if (now - lastUpdateTime < throttleMs) return;
              lastUpdateTime = now;
              
              const currentW = this.helpers.getCurrentStemWidth();
              this.helpers.setPanelClipPath(panelW, currentW);
              const scale = currentW / panelW;
              gsap.set(this.elements.menuPanel, { '--panelScale': scale });
            };
          })()
        });
        this.openTl.add(widthTween, 'expandStart');
      })
      .add('expandEnd', `expandStart+=${MENU_CONFIG.ANIMATIONS.DURATION.STEM_EXPAND}`)
      .to(this.elements.menuInner, { 
        opacity: 1, 
        duration: 0.35, 
        ease: 'power2.out' 
      }, 'expandEnd-=0.05')
      .to(this.elements.menuStem, { 
        borderWidth: 0, 
        backgroundColor: 'transparent', 
        duration: 0 
      }, 'expandStart')
      .add(() => {
        // Устанавливаем will-change для элементов меню перед анимацией
        if (leftItems && leftItems.length) {
          gsap.set(leftItems, { 
            opacity: 0, 
            y: 6,
            willChange: 'opacity, transform'
          });
        }
        if (rightItems && rightItems.length) {
          gsap.set(rightItems, { 
            opacity: 0, 
            y: 6,
            willChange: 'opacity, transform'
          });
        }
        if (contactItems && contactItems.length) {
          gsap.set(contactItems, { 
            opacity: 0, 
            y: 6,
            willChange: 'opacity, transform'
          });
        }
        
        // Анимируем элементы с GPU ускорением
        if (leftItems && leftItems.length) {
          gsap.to(leftItems, { 
            opacity: 1, 
            y: 0, 
            stagger: 0.06, 
            duration: 0.5, 
            ease: 'power3.out', 
            overwrite: true, 
            delay: 0,
            force3D: true
          });
        }
        if (rightItems && rightItems.length) {
          gsap.to(rightItems, { 
            opacity: 1, 
            y: 0, 
            stagger: 0.06, 
            duration: 0.5, 
            ease: 'power3.out', 
            overwrite: true, 
            delay: 0,
            force3D: true
          });
        }
        if (contactItems && contactItems.length) {
          gsap.to(contactItems, { 
            opacity: 1, 
            y: 0, 
            stagger: 0.08, 
            duration: 0.5, 
            ease: 'power3.out', 
            overwrite: true, 
            delay: 0.1,
            force3D: true
          });
        }
      }, 'expandEnd-0.04');
  }

  /**
   * Intro анимация хедера
   */
  runHeaderIntro() {
    try {
      if (!this.elements.header || !this.elements.burger || !this.elements.menuContainer || 
          !this.elements.menuStem || !this.elements.menuPanel) {
        console.warn('Required elements for header intro not found');
        return;
      }

      let played = false;

      const cs = getComputedStyle(this.elements.header);
      const orig = {
        width: cs.width,
        height: cs.height,
        paddingTop: parseFloat(cs.paddingTop) || 0,
        paddingRight: parseFloat(cs.paddingRight) || 0,
        paddingBottom: parseFloat(cs.paddingBottom) || 0,
        paddingLeft: parseFloat(cs.paddingLeft) || 0,
        borderRadius: cs.borderRadius
      };

      document.documentElement.classList.add('intro-start');

      const start = () => {
        if (played) return; 
        played = true;
        document.documentElement.classList.add('intro-animating');
        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
        gsap.set(this.elements.header, { transformPerspective: 900, force3D: true });
        tl.fromTo(this.elements.header,
          { scale: 0.86, y: -18, z: -70, rotationX: 6 },
          { scale: 1.02, y: 4, z: -10, rotationX: 2, duration: 0.28, ease: 'power2.out' },
        0)
        .to(this.elements.header, { scale: 1, y: 0, z: 0, rotationX: 0, duration: 0.5, ease: 'power1.out' });
        tl.to({}, { duration: 0.05 })
          .to(this.elements.header, { 
            width: orig.width, 
            height: orig.height, 
            borderRadius: orig.borderRadius, 
            duration: 0.95, 
            ease: 'power1.inOut' 
          })
          .to(this.elements.header, { 
            paddingTop: orig.paddingTop,
            paddingRight: orig.paddingRight,
            paddingBottom: orig.paddingBottom,
            paddingLeft: orig.paddingLeft,
            duration: 0.55,
            ease: 'power1.inOut'
          }, '-=0.65')
          .to([this.elements.headerLogo, this.elements.headerContact], { 
            autoAlpha: 1, 
            y: 0, 
            duration: 0.3 
          }, '-=0.2')
          .add(() => {
            document.documentElement.classList.add('intro-complete');
            document.documentElement.classList.remove('intro-start');
            document.documentElement.classList.remove('intro-animating');
            gsap.set(this.elements.header, { 
              clearProps: 'width,height,paddingTop,paddingRight,paddingBottom,paddingLeft,borderRadius' 
            });
            setTimeout(() => {
              document.documentElement.classList.remove('intro-complete');
            }, 400);
          });
      };

      function waitForPreloader() {
        if (document.getElementById('preloader')) {
          window.addEventListener('preloaderComplete', () => {
            requestAnimationFrame(start);
          }, { once: true });
        } else {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(start));
          } else {
            requestAnimationFrame(start);
          }
        }
      }
      
      waitForPreloader();
    } catch (_) {}
  }

  /**
   * Получение timeline открытия
   */
  getOpenTimeline() {
    return this.openTl;
  }
}

