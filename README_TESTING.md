# 🧪 Тестирование мигрированных модулей

## 📋 Быстрый старт

### 1. Запустить локальный сервер

```bash
# В папке проекта
python -m http.server 8000
```

### 2. Подключить новые модули

Откройте `html/index.html` и:

1. **Закомментируйте** строки 703-710 (мигрированные скрипты):
```html
<!--
<script src="../js/preloader.js"></script>
<script src="../js/custom-scrollbar-overlay.js" defer></script>
<script src="../js/scroll-controller.js" defer></script>
<script src="../js/scroll-flow.js" defer></script>
<script src="../js/services-parallax.js" defer></script>
<script src="../js/contact-script.js" defer></script>
<script src="../js/card-logic.js" defer></script>
<script src="../js/blog-manager.js" defer></script>
-->
```

2. **Добавьте** перед `</body>` (после строки 714):
```html
<!-- Новые модули (для тестирования) -->
<script type="module" src="../js/main.js"></script>
```

### 3. Открыть в браузере

```
http://localhost:8000/html/index.html
```

### 4. Проверить консоль (F12)

Должны быть сообщения:
- ✅ `Preloader initialized`
- ✅ `ScrollController initialized`
- ✅ `CustomScrollbar initialized`
- ✅ `ScrollFlow initialized`
- ✅ `ServicesParallax initialized`
- ✅ `ContactForm initialized`
- ✅ `CardsManager initialized`
- ✅ `BlogManager initialized`

---

## ✅ Критические проверки

1. **Параллакс футера:** Прокрутить до контактов → футер должен раскрываться
2. **Карточки:** Нажать "Подробнее" → должна открыться (и НЕ открываться повторно)
3. **Форма:** Отправить форму → должно появиться модальное окно

---

## 📚 Документация

- `docs/TESTING_CHECKLIST.md` - Детальный чеклист
- `docs/HOW_TO_TEST.md` - Подробная инструкция
- `docs/QUICK_TEST_GUIDE.md` - Быстрое руководство

---

**После тестирования сообщите о результатах!** 🚀

