# Core модули

Базовые утилиты и конфигурация для всех модулей проекта.

## Структура

- `utils.js` - Общие утилиты (debounce, throttle, $, waitFor, etc.)
- `dom.js` - DOM утилиты (getComputedStyleValue, setStyles, scrollToElement, etc.)
- `config.js` - Глобальная конфигурация проекта
- `constants.js` - Константы (размеры, цвета, классы, события)
- `events.js` - Менеджер событий и делегирование
- `errors.js` - Централизованная обработка ошибок

## Использование

```javascript
// Импорт утилит
import { $, debounce, throttle } from './core/utils.js';
import { scrollToElement, setStyles } from './core/dom.js';
import { CONFIG } from './core/config.js';
import { eventManager, delegate } from './core/events.js';
import { getErrorHandler, ERROR_SEVERITY } from './core/errors.js';

// Пример использования
const element = $('.my-element');
const debouncedHandler = debounce(() => {
  console.log('Debounced!');
}, 300);

// Делегирование событий
delegate(container, '.button', 'click', (e, target) => {
  console.log('Button clicked:', target);
});
```

## Документация

Подробная документация функций доступна в JSDoc комментариях в каждом файле.

