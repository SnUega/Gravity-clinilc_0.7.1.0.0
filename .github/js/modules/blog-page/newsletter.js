/**
 * Newsletter Form Module
 * Обработка формы подписки на блог
 */

/**
 * Инициализация формы подписки
 */
export function initNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  
  if (!form) {
    return;
  }
  
  form.addEventListener('submit', handleSubmit);
  
  console.log('✅ Newsletter form initialized');
}

/**
 * Обработчик отправки формы
 * @param {Event} event 
 */
async function handleSubmit(event) {
  event.preventDefault();
  
  const form = event.target;
  const emailInput = form.querySelector('input[type="email"]');
  const submitBtn = form.querySelector('button[type="submit"]');
  
  if (!emailInput || !submitBtn) return;
  
  const email = emailInput.value.trim();
  
  if (!validateEmail(email)) {
    showMessage(form, 'Пожалуйста, введите корректный email', 'error');
    return;
  }
  
  // Disable form during submission
  submitBtn.disabled = true;
  submitBtn.textContent = 'Отправка...';
  
  try {
    // TODO: Интеграция с backend/admin panel
    // await fetch('/api/newsletter/subscribe', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email })
    // });
    
    // Имитация отправки
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Успех
    showMessage(form, 'Спасибо! Мы сообщим вам, когда блог заработает.', 'success');
    form.reset();
    
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    showMessage(form, 'Произошла ошибка. Попробуйте позже.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Подписаться';
  }
}

/**
 * Валидация email
 * @param {string} email 
 * @returns {boolean}
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Показать сообщение
 * @param {HTMLFormElement} form 
 * @param {string} message 
 * @param {string} type - 'success' | 'error'
 */
function showMessage(form, message, type) {
  // Remove existing message
  const existing = form.parentElement.querySelector('.newsletter-message');
  if (existing) existing.remove();
  
  // Create message element
  const messageEl = document.createElement('p');
  messageEl.className = `newsletter-message newsletter-message--${type}`;
  messageEl.textContent = message;
  messageEl.style.cssText = `
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-size: 0.875rem;
    text-align: center;
    animation: fadeIn 0.3s ease;
    ${type === 'success' 
      ? 'background: rgba(76, 175, 80, 0.1); color: #4CAF50; border: 1px solid rgba(76, 175, 80, 0.3);'
      : 'background: rgba(244, 67, 54, 0.1); color: #F44336; border: 1px solid rgba(244, 67, 54, 0.3);'
    }
  `;
  
  form.after(messageEl);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    messageEl.style.opacity = '0';
    messageEl.style.transition = 'opacity 0.3s ease';
    setTimeout(() => messageEl.remove(), 300);
  }, 5000);
}
