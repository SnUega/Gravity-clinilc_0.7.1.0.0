# CSS Modules Structure

## Обзор

Эта директория содержит модульную структуру CSS для проекта. Каждый модуль отвечает за определенную часть интерфейса.

## Структура

```
modules/
├── base/           # Базовые стили
│   ├── _variables.css    # CSS переменные (цвета, spacing, typography)
│   ├── _reset.css        # Reset стили
│   └── _utilities.css    # Утилитные классы (flex-center, absolute-center и т.д.)
├── components/     # Компоненты интерфейса
│   ├── _preloader.css
│   ├── _mobile-hint.css
│   ├── _header.css
│   ├── _services.css
│   ├── _menu.css
│   ├── _alr.css
│   ├── _footer.css
│   ├── _about.css
│   ├── _contacts.css
│   └── _gallery.css
└── responsive/     # Responsive утилиты
    └── _breakpoints.css
```

## Использование

### Импорт в main.css

```css
/* Base - порядок важен! */
@import url('modules/base/_variables.css');
@import url('modules/base/_reset.css');
@import url('modules/base/_utilities.css');

/* Components */
@import url('modules/components/_preloader.css');
@import url('modules/components/_header.css');
/* ... и т.д. */
```

### Импорт в HTML (для разработки)

```html
<link rel="stylesheet" href="../css/modules/base/_variables.css">
<link rel="stylesheet" href="../css/modules/components/_header.css">
```

**Примечание**: Для production рекомендуется использовать CSS bundler для объединения всех модулей в один файл.

## Правила именования

- Файлы модулей начинаются с `_` (underscore)
- Используется kebab-case для имен файлов
- Компоненты именуются по их функциональности

## Соглашения

1. **Комментарии**: Используйте заголовки секций с `===`
2. **Организация**: Сначала базовые стили, затем состояния, затем медиа-запросы
3. **Специфичность**: Избегайте избыточной вложенности (максимум 3 уровня)
4. **Переменные**: Используйте CSS переменные из `_variables.css`
5. **Утилиты**: Используйте утилитные классы из `_utilities.css` вместо дублирования паттернов

## Пример структуры модуля

```css
/* ============================================
   Component Name
   ============================================ */

.component {
  /* Base styles */
}

.component--modifier {
  /* Modifier styles */
}

.component__element {
  /* Element styles */
}

/* States */
.component.is-active {
  /* Active state */
}

/* Responsive */
@media (max-width: 768px) {
  .component {
    /* Mobile styles */
  }
}
```

