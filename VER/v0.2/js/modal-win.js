document.addEventListener('DOMContentLoaded', () => {
  // Получаем все кнопки и модальные окна
  const modalTriggers = document.querySelectorAll('[data-modal-trigger]');
  const modals = document.querySelectorAll('.modal');
  const closeButtons = document.querySelectorAll('.modal-close');

  console.log('Modal triggers found:', modalTriggers.length);
  console.log('Modals found:', modals.length);

  // Функция для открытия модального окна
  function openModal(modalId) {
    console.log('Opening modal:', modalId);
    const modal = document.getElementById(modalId + 'Modal');
    console.log('Modal element:', modal);
    
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden'; // Блокируем скролл
      
      // Простая анимация без GSAP
      modal.style.opacity = '0';
      modal.style.transform = 'scale(0.8)';
      
      setTimeout(() => {
        modal.style.transition = 'all 0.3s ease';
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
      }, 10);
    }
  }

  // Функция для закрытия модального окна
  function closeModal(modal) {
    console.log('Closing modal');
    
    // Простая анимация без GSAP
    modal.style.transition = 'all 0.2s ease';
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.8)';
    
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = 'auto'; // Разблокируем скролл
    }, 200);
  }

  // Обработчики для кнопок открытия
  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const modalType = trigger.getAttribute('data-modal-trigger');
      openModal(modalType);
    });
  });

  // Обработчики для кнопок закрытия
  closeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = button.closest('.modal');
      closeModal(modal);
    });
  });

  // Закрытие по клику вне модального окна
  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // Закрытие по клавише Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modals.forEach(modal => {
        if (modal.style.display === 'block') {
          closeModal(modal);
        }
      });
    }
  });
});
