/**
 * Page Preloader Module
 * Быстрый прелоадер для внутренних страниц
 */

const PRELOADER_DELAY = 200; // Задержка перед скрытием (мс)
const FADE_DURATION = 400; // Длительность fade-out (мс)

/**
 * Инициализация прелоадера страницы
 */
export function initPagePreloader() {
  const preloader = document.getElementById('page-preloader');
  
  if (!preloader) {
    console.log('No page preloader found');
    return;
  }
  
  const fill = preloader.querySelector('.page-preloader-fill');
  
  // Анимация заполнения (как на страницах услуг)
  if (fill) {
    let progress = 0;
    const targetProgress = 100;
    const duration = 400; // ms
    const startTime = Date.now();
    
    function animateFill() {
      const elapsed = Date.now() - startTime;
      progress = Math.min((elapsed / duration) * targetProgress, targetProgress);
      
      fill.style.height = `${progress}%`;
      
      if (progress < targetProgress) {
        requestAnimationFrame(animateFill);
      }
    }
    
    animateFill();
  }
  
  // Скрываем после загрузки
  const hidePreloaderFunc = () => {
    setTimeout(() => {
      preloader.classList.add('loaded');
      setTimeout(() => {
        preloader.remove();
        console.log('✅ Page preloader hidden');
      }, 600);
    }, 200);
  };
  
  if (document.readyState === 'complete') {
    hidePreloaderFunc();
  } else {
    window.addEventListener('load', hidePreloaderFunc, { once: true });
  }
}

/**
 * Скрыть прелоадер
 * @param {HTMLElement} preloader 
 */
function hidePreloader(preloader) {
  setTimeout(() => {
    preloader.classList.add('loaded');
    
    // Удаляем из DOM после анимации
    setTimeout(() => {
      preloader.remove();
      console.log('✅ Page preloader hidden');
    }, FADE_DURATION);
  }, PRELOADER_DELAY);
}

/**
 * Показать прелоадер (для программной навигации)
 */
export function showPagePreloader() {
  // Проверяем, есть ли уже прелоадер
  let preloader = document.getElementById('page-preloader');
  
  if (!preloader) {
    preloader = document.createElement('div');
    preloader.id = 'page-preloader';
    preloader.className = 'page-preloader';
    preloader.innerHTML = `
      <div class="page-preloader-inner">
        <div class="page-preloader-spinner"></div>
      </div>
    `;
    document.body.prepend(preloader);
  }
  
  preloader.classList.remove('loaded');
}
