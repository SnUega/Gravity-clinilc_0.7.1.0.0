# Security Guide

## Использование HTML Sanitizer

### Безопасное создание элементов

Вместо:
```javascript
element.innerHTML = userInput; // ❌ Опасно!
```

Используйте:
```javascript
// Через HTMLSanitizer
HTMLSanitizer.setInnerHTML(element, userInput, true);

// Или через улучшенный DOMUtils
const el = DOMUtils.createElement('div', {}, userInput);
```

### Функции HTMLSanitizer

1. **setInnerHTML(element, html, safe)** - Безопасная установка innerHTML
2. **escapeHTML(text)** - Экранирование HTML символов
3. **isSafe(html)** - Проверка безопасности HTML
4. **createElementWithHTML(tag, html, attrs)** - Безопасное создание элементов
5. **getTextOnly(html)** - Получение только текста из HTML

## Текущие использования innerHTML в проекте

### Безопасные места:
- `alr-interactive.js` - статичный контент из `getSliderData()`
- `blog-manager.js` - статичные шаблоны статей
- `header-menu.js` - клонирование существующих элементов

### Требуют внимания:
- Все места где innerHTML устанавливается с динамическими данными
- В будущем: использовать sanitizer для user-generated content

## Рекомендации

1. **Для статичного контента** - innerHTML можно использовать
2. **Для user input** - использовать textContent или sanitizer
3. **Для динамического контента** - проверять через `isSafe()`

## Примечания

- Sanitizer работает автоматически через улучшенный `DOMUtils.createElement`
- В dev режиме показываются предупреждения
- Production: автоматическая защита без предупреждений

