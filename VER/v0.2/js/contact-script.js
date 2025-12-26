const form = document.getElementById('contactForm');
const checkbox = document.getElementById('agree');
const warning = document.getElementById('warningText');
const modal = document.getElementById('thanksModal');
const modalClose = document.getElementById('modalClose');
const ring = document.querySelector('.ring-progress');

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  if (!checkbox.checked) {
    warning.style.display = 'block';
    return;
  }

  warning.style.display = 'none';

  const formData = new FormData(form);

  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json'
      }
    });

    if (response.ok) {
      modal.classList.add('active');
      form.reset();

      ring.style.strokeDashoffset = '138';
      void ring.offsetWidth;
      ring.style.strokeDashoffset = '0';

      setTimeout(() => {
        modal.classList.remove('active');
        ring.style.strokeDashoffset = '138';
      }, 3000);
    } else {
      alert('Произошла ошибка при отправке формы.');
    }
  } catch (error) {
    alert('Ошибка соединения.');
  }
});

modalClose.addEventListener('click', () => {
  modal.classList.remove('active');
  ring.style.strokeDashoffset = '138';
});

const sendBtn = document.querySelector('.send-btn');
sendBtn.addEventListener('mousemove', (e) => {
  const rect = sendBtn.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  sendBtn.style.setProperty('--x', `${x}px`);
  sendBtn.style.setProperty('--y', `${y}px`);
});

document.addEventListener("DOMContentLoaded", function () {
    const dropdown = document.getElementById("customDropdown");
    const selected = dropdown.querySelector(".selected");
    const optionsContainer = dropdown.querySelector(".dropdown-options");
    const options = dropdown.querySelectorAll(".option");
    const hiddenInput = document.getElementById("hiddenSelectValue");

    selected.addEventListener("click", () => {
      dropdown.classList.toggle("open");
    });

    options.forEach(option => {
      option.addEventListener("click", () => {
        selected.textContent = option.textContent;
        hiddenInput.value = option.textContent;

        options.forEach(o => o.classList.remove("selected-option"));
        option.classList.add("selected-option");

        dropdown.classList.remove("open");
      });
    });

    document.addEventListener("click", function (e) {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("open");
      }
    });
  });