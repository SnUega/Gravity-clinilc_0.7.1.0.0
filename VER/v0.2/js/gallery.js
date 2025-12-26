const categories = {
  "Здание": [
    "../img/IMG_4583.jpg",
    "../img/ASH.jpg"
  ],
  "Холл": [
    "../img/img-placeholder.jpg",
    "../img/img-placeholder_1.jpg"
  ],
  "Инъекционная": [
    "../img/img-placeholder.jpg",
    "../img/img-placeholder_1.jpg"
  ],
  "Лицевая эстетика": [
    "../img/IMG_4583.jpg",
    "../img/ASH.jpg"
  ],
  "Тело эстетика": [
    "../img/img-placeholder.jpg",
    "../img/img-placeholder_1.jpg"
  ],
  "Комната отдыха": [
    "../img/img-placeholder.jpg",
    "../img/img-placeholder_1.jpg"
  ],
};

const sliderContainer = document.getElementById("sliderContainer");
const categoryNav = document.getElementById("categoryNav");

let currentCategory = "Здание";
let currentSlide = 0;

function createSlide(url, hidden = false) {
  const slide = document.createElement("div");
  slide.classList.add("slide");
  if (hidden) slide.classList.add("hidden");
  slide.style.backgroundImage = `url('${url}')`;
  return slide;
}

function showSlide(index) {
  const slides = sliderContainer.querySelectorAll(".slide");
  slides.forEach((slide, i) => {
    slide.classList.toggle("hidden", i !== index);
  });
}

function switchCategory(newCategory) {
  if (newCategory === currentCategory) return;

  const leavingImage = categories[currentCategory][currentSlide];
  const newImage = categories[newCategory][0];

  const oldSlides = sliderContainer.querySelectorAll(".slide");
  oldSlides.forEach(slide => slide.remove());

  const nextSlide = createSlide(newImage);
  sliderContainer.insertBefore(nextSlide, categoryNav);

  const mask = document.createElement("div");
  mask.className = "transition-mask";

  const leftHalf = document.createElement("div");
  const rightHalf = document.createElement("div");
  leftHalf.className = "half-slide left";
  rightHalf.className = "half-slide right";

  const leftImage = document.createElement("div");
  const rightImage = document.createElement("div");
  leftImage.className = "slide-image";
  rightImage.className = "slide-image";
  leftImage.style.backgroundImage = `url('${leavingImage}')`;
  rightImage.style.backgroundImage = `url('${leavingImage}')`;

  leftHalf.appendChild(leftImage);
  rightHalf.appendChild(rightImage);
  mask.appendChild(leftHalf);
  mask.appendChild(rightHalf);

  sliderContainer.appendChild(mask);

  gsap.to(leftHalf, {
    y: "100%",
    duration: 1,
    ease: "power3.inOut",
  });

  gsap.to(rightHalf, {
    y: "100%",
    duration: 0.8,
    delay: 0.25,
    ease: "power3.inOut",
    onComplete: () => {
      mask.remove();
      currentCategory = newCategory;
      currentSlide = 0;
    },
  });
}

function renderCategoryNav() {
  const highlight = document.createElement("div");
  highlight.className = "category-highlight";
  categoryNav.appendChild(highlight);

  const updateHighlight = (btn) => {
    const rect = btn.getBoundingClientRect();
    const offsetLeft = btn.offsetLeft - categoryNav.scrollLeft;
    highlight.style.left = offsetLeft + "px";
    highlight.style.width = rect.width + "px";
  };

  Object.keys(categories).forEach(category => {
    const btn = document.createElement("button");
    btn.textContent = category;
    btn.className = "category-btn";

    if (category === currentCategory) {
      btn.classList.add("active");
      setTimeout(() => updateHighlight(btn), 0);
    }

    btn.addEventListener("click", () => {
      if (btn.classList.contains("active")) return;

      document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      updateHighlight(btn);
      switchCategory(category);
    });

    categoryNav.appendChild(btn);
  });
}

function handleSlideChange(direction = 'next') {
  const catSlides = categories[currentCategory];
  const totalSlides = catSlides.length;

  currentSlide = direction === 'next'
    ? (currentSlide + 1) % totalSlides
    : (currentSlide - 1 + totalSlides) % totalSlides;

  const newSlide = createSlide(catSlides[currentSlide]);
  newSlide.classList.add(direction === 'next' ? 'slide-anim-right' : 'slide-anim-left');

  const oldSlides = sliderContainer.querySelectorAll(".slide");
  oldSlides.forEach(s => s.remove());

  sliderContainer.insertBefore(newSlide, categoryNav);
}

function enableSlideDrag() {
  let startX = 0;
  let isDragging = false;

  sliderContainer.addEventListener('mousedown', (e) => {
    startX = e.clientX;
    isDragging = true;
  });

  sliderContainer.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    const delta = e.clientX - startX;
    if (delta > 50) handleSlideChange('prev');
    else if (delta < -50) handleSlideChange('next');
    isDragging = false;
  });

  sliderContainer.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  });

  sliderContainer.addEventListener('touchend', (e) => {
    const endX = e.changedTouches[0].clientX;
    const delta = endX - startX;
    if (delta > 50) handleSlideChange('prev');
    else if (delta < -50) handleSlideChange('next');
  });
}

function init() {
  const initialSlide = createSlide(categories[currentCategory][0]);
  sliderContainer.insertBefore(initialSlide, categoryNav);
  renderCategoryNav();
  enableSlideDrag();
}

document.getElementById("nextSlide").addEventListener("click", () => handleSlideChange('next'));
document.getElementById("prevSlide").addEventListener("click", () => handleSlideChange('prev'));

init();
