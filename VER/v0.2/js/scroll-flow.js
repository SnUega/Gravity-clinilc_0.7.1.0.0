document.addEventListener('DOMContentLoaded', () => {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.log('GSAP or ScrollTrigger not loaded');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const contacts = document.querySelector('#contacts');
  const footer = document.querySelector('#page-footer');
  const wrap = document.querySelector('#revealWrap');

  if (!contacts || !footer || !wrap) return;

  // Настройка начального состояния
  gsap.set(footer, { 
    clipPath: 'inset(100% 0 0 0)', // Скрыт сверху
    visibility: 'visible' // Убеждаемся что футер видим
  });

  // Создание ScrollTrigger для анимации футера
  const st = ScrollTrigger.create({
    trigger: contacts,
    start: 'bottom bottom', // Когда нижняя граница контактов отрывается от низа viewport
    end: () => `+=${footer.offsetHeight}`, // Длительность = высота футера
    scrub: true, // Жесткая привязка к скроллу
    pin: wrap, // Фиксируем обертку на время анимации
    pinSpacing: true, // Добавляем отступы для корректного скролла
    onUpdate: (self) => {
      const progress = self.progress;
      
      // Раскрытие футера снизу вверх
      const clipValue = 100 - progress * 100;
      gsap.set(footer, { 
        clipPath: `inset(${clipValue}% 0 0 0)` 
      });
      
      // Сдвиг секции контактов вверх
      const yValue = -footer.offsetHeight * progress;
      gsap.set(contacts, { 
        y: yValue 
      });
    }
  });

});
