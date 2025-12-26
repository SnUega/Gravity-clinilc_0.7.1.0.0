    function $(selectors) { return document.querySelector(selectors); }
    const burger = $('.navc-burger, .burger');
    const header = $('.navc-header, .header');
    const headerLogo = $('.navc-logo, .header__logo');
    const headerContact = $('.navc-phone, .header__contact');
    const menuContainer = $('.navc-menu, .menu-container');
    const menuStem = $('.navc-stem, .menu-stem');
    const menuInner = $('.navc-inner, .menu-inner');
    const menuPanel = $('.navc-panel, .menu-panel');
    const burgerRing = $('.navc-ring, .burger-ring');
    const body = document.body;

    const leftItems = menuInner ? menuInner.querySelectorAll('.menu-left h2, .menu-left li') : [];
    const rightItems = menuInner ? menuInner.querySelectorAll('.menu-right h2, .blog-links a') : [];

    // Prepare elements initial state
    gsap.set(menuStem, { height: 0, width: 64, left: '50%', xPercent: -50, transformOrigin: '50% 0%' });
    gsap.set(menuPanel, { clipPath: 'inset(0 50% 0 50% round 50px)' });
    gsap.set(menuInner, { opacity: 0 });

    const openTl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.out' },
      onComplete() {},
      onReverseComplete() {
        menuContainer.classList.remove('active');
        burger.classList.remove('active');
        body.classList.remove('menu-open');
        if (window.unlockScroll) window.unlockScroll();
        menuStem.style.top = '';
        menuStem.style.width = '64px';
        menuStem.style.height = '0px';
        menuContainer.style.top = 'calc(var(--index) * 4)';
        menuContainer.style.left = '';
        menuContainer.style.transform = '';
        menuStem.style.left = '';
        menuStem.style.transform = 'translateX(-50%)';
        menuPanel.style.clipPath = '';
      }
    });

    openTl
      .add(() => {
        // Lock scroll and mark open early
        if (window.lockScroll) window.lockScroll();
        body.classList.add('menu-open');
      }, 0)
      // fade header side content
      .to([headerLogo, headerContact], { autoAlpha: 0, y: -10, duration: 0.2 }, 0)
      // morph burger to X and draw ring
      .add(() => { burger.classList.add('active'); }, 0)
      // shrink header to circular button and align container so its top crosses circle center
      .to(header, { width: 64, height: 64, padding: 0, borderRadius: 32, duration: 0.5, ease: 'none' }, 0)
      .add(() => {
        // привязка к контейнеру: ствол по центру контейнера
        const headerRect = header.getBoundingClientRect();
        const circleCenterY = headerRect.top + headerRect.height / 2;
        menuContainer.style.top = (circleCenterY - 1) + 'px';
        menuContainer.classList.add('active');
        menuStem.style.top = '0px';
        menuStem.style.left = '50%';
        menuStem.style.transform = 'translateX(-50%)';
      }, '>-0.05')
      // make stem visible for the falling animation
      .add(() => {
        gsap.set(menuStem, {
          backgroundColor: '#ffffff',
          borderColor: 'rgba(0,0,0,0.15)',
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: '0 0 32px 32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
        });
      }, '>-0.05')
      // drop the rounded vertical stem from button to final height
      .to(menuStem, { height: '85vh', duration: 0.7, ease: 'power2.inOut' }, '>-0.02')
      // strictly AFTER drop completes, run horizontal expansion
      .add('expandStart')
      .add(() => {
        const panelW = menuContainer.clientWidth;
        const startW = 64;
        const startInset = ((panelW - startW) / 2 / panelW) * 100;
        menuStem.style.width = startW + 'px';
        menuStem.style.transformOrigin = '50% 0%';
        menuPanel.style.clipPath = `inset(0 ${startInset}% 0 ${startInset}% round 50px)`;
      }, 'expandStart')
      .add(() => {
        const panelW = menuContainer.clientWidth;
        const expandTween = gsap.to(menuStem, {
          width: panelW,
          duration: 0.7,
          ease: 'sine.inOut',
          onUpdate: () => {
            const currentW = parseFloat(gsap.getProperty(menuStem, 'width'));
            const inset = ((panelW - currentW) / 2 / panelW) * 100;
            menuPanel.style.clipPath = `inset(0 ${inset}% 0 ${inset}% round 50px)`;
          }
        });
        openTl.add(expandTween, 'expandStart');
      })
      .add('expandEnd', 'expandStart+=0.7')
      // near the end of horizontal reveal, show content (no idle gap)
      .to(menuInner, { opacity: 1, duration: 0.35, ease: 'power2.out' }, 'expandEnd-=0.05')
      // hide stem border for the entire expansion (prevents double border); on reverse он появится ровно в точке expandStart
      .to(menuStem, { borderWidth: 0, backgroundColor: 'transparent', duration: 0 }, 'expandStart')
      .add(() => { if (openTl.reversed()) { gsap.set(menuStem, { borderWidth: 1, backgroundColor: '#ffffff' }); } }, 'expandStart')
      .add(() => {
        if (leftItems && leftItems.length) gsap.set(leftItems, { opacity: 0, y: 6 });
        if (rightItems && rightItems.length) gsap.set(rightItems, { opacity: 0, y: 6 });
        // стартуем одновременно для обеих колонок
        gsap.to(leftItems, { opacity: 1, y: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out', overwrite: true, delay: 0 });
        gsap.to(rightItems, { opacity: 1, y: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out', overwrite: true, delay: 0 });
      }, 'expandEnd-0.04');

    function toggleMenu() {
      const isOpening = openTl.reversed() || openTl.progress() === 0;
      if (isOpening) {
        openTl.timeScale(1).play(0);
        burger.setAttribute('aria-expanded', 'true');
      } else {
        openTl.timeScale(0.8).reverse();
        burger.setAttribute('aria-expanded', 'false');
      }
    }

    burger.addEventListener('click', toggleMenu);
    // Click-outside close
    document.addEventListener('click', (e) => {
      const isOpen = openTl.progress() > 0 && !openTl.reversed();
      if (!isOpen) return;
      const within = menuPanel.contains(e.target) || burger.contains(e.target) || header.contains(e.target);
      if (!within) openTl.timeScale(0.8).reverse();
    });

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && openTl.progress() > 0 && !openTl.reversed()) {
        openTl.timeScale(0.8).reverse();
      }
    });