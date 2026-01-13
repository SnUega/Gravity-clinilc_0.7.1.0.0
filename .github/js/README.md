# JavaScript структура проекта

## Обзор

Проект использует ванильный JavaScript (ES6+) без фреймворков. Основные библиотеки:
- **GSAP** - анимации
- **ScrollTrigger** - scroll-based анимации
- **Lenis** - плавный скролл
- **Swiper** - слайдеры

---

## Структура

```
js/
├── preloader.js       # Прелоадер
├── header-menu.js     # Меню в хедере
├── alr-interactive.js # Интерактивная секция ALR
├── gallery.js         # Галерея
├── services-parallax.js # Параллакс для услуг
├── contact-script.js  # Форма контактов
├── scroll-controller.js # Контроллер скролла
├── scroll-flow.js     # Анимация скролла футера
├── blog-manager.js    # Менеджер блога
├── card-logic.js      # Логика карточек
└── modal-win.js       # Менеджер модальных окон
```

---

## Подключение в HTML

Все скрипты подключаются в `html/index.html`:

```html
<script src="../js/preloader.js"></script>
<script src="../js/header-menu.js" defer></script>
<!-- ... и т.д. -->
```

---

## Документация

См. `docs/PROJECT_DOCUMENTATION.md` для полной документации проекта, включая планы оптимизации и код ревью.

