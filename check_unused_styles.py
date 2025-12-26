#!/usr/bin/env python3
"""
Скрипт для проверки неиспользуемых CSS классов и ID
"""
import re
import os
from pathlib import Path
from collections import defaultdict

# Пути
CSS_MODULES_DIR = Path('css/modules')
HTML_FILE = Path('html/index.html')
JS_DIR = Path('js')

# Собираем все классы и ID из CSS
css_selectors = {
    'classes': set(),
    'ids': set(),
    'files': defaultdict(list)
}

def extract_selectors_from_css(file_path):
    """Извлекает селекторы из CSS файла"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Ошибка чтения {file_path}: {e}")
        return
    
    # Удаляем комментарии
    content = re.sub(r'/\*.*?\*/', '', content, flags=re.DOTALL)
    
    # Находим все селекторы (классы и ID)
    # Паттерн: .class-name или #id-name (в начале строки или после запятой/пробела)
    class_pattern = r'\.([a-zA-Z][a-zA-Z0-9_-]*(?:__[a-zA-Z0-9_-]+)?(?:--[a-zA-Z0-9_-]+)?)'
    id_pattern = r'#([a-zA-Z][a-zA-Z0-9_-]*)'
    
    classes = set(re.findall(class_pattern, content))
    ids = set(re.findall(id_pattern, content))
    
    # Фильтруем псевдоклассы и псевдоэлементы
    classes = {c for c in classes if not c.startswith(':') and not c.startswith('::')}
    
    # Убираем служебные классы (active, hidden, etc.)
    utility_classes = {'active', 'hidden', 'visible', 'invisible', 'loading', 'loaded', 'open', 'closed'}
    classes = {c for c in classes if c not in utility_classes}
    
    css_selectors['classes'].update(classes)
    css_selectors['ids'].update(ids)
    
    for cls in classes:
        css_selectors['files'][cls].append(str(file_path))
    for id_name in ids:
        css_selectors['files'][id_name].append(str(file_path))

# Сканируем все CSS файлы
for css_file in CSS_MODULES_DIR.rglob('*.css'):
    extract_selectors_from_css(css_file)

# Собираем используемые классы и ID из HTML
used_in_html = {
    'classes': set(),
    'ids': set()
}

if HTML_FILE.exists():
    with open(HTML_FILE, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Находим все class="..."
    class_matches = re.findall(r'class=["\']([^"\']+)["\']', html_content)
    for match in class_matches:
        classes = match.split()
        used_in_html['classes'].update(classes)
    
    # Находим все id="..."
    id_matches = re.findall(r'id=["\']([^"\']+)["\']', html_content)
    used_in_html['ids'].update(id_matches)

# Собираем используемые классы и ID из JavaScript
used_in_js = {
    'classes': set(),
    'ids': set()
}

if JS_DIR.exists():
    for js_file in JS_DIR.rglob('*.js'):
        try:
            with open(js_file, 'r', encoding='utf-8') as f:
                js_content = f.read()
            
            # Находим querySelector, querySelectorAll, getElementById и т.д.
            # Паттерны: .class-name, #id-name
            class_matches = re.findall(r'["\']\.([a-zA-Z][a-zA-Z0-9_-]*(?:__[a-zA-Z0-9_-]+)?(?:--[a-zA-Z0-9_-]+)?)["\']', js_content)
            id_matches = re.findall(r'["\']#([a-zA-Z][a-zA-Z0-9_-]*)["\']', js_content)
            
            # Также ищем без кавычек (querySelector('.class'))
            class_matches2 = re.findall(r'\.([a-zA-Z][a-zA-Z0-9_-]*(?:__[a-zA-Z0-9_-]+)?(?:--[a-zA-Z0-9_-]+)?)', js_content)
            id_matches2 = re.findall(r'#([a-zA-Z][a-zA-Z0-9_-]*)', js_content)
            
            used_in_js['classes'].update(class_matches)
            used_in_js['classes'].update(class_matches2)
            used_in_js['ids'].update(id_matches)
            used_in_js['ids'].update(id_matches2)
        except Exception as e:
            print(f"Ошибка чтения {js_file}: {e}")

# Объединяем все используемые
all_used_classes = used_in_html['classes'] | used_in_js['classes']
all_used_ids = used_in_html['ids'] | used_in_js['ids']

# Находим неиспользуемые
unused_classes = css_selectors['classes'] - all_used_classes
unused_ids = css_selectors['ids'] - all_used_ids

# Выводим результаты
print("=" * 80)
print("АНАЛИЗ НЕИСПОЛЬЗУЕМЫХ CSS СТИЛЕЙ")
print("=" * 80)
print(f"\nВсего классов в CSS: {len(css_selectors['classes'])}")
print(f"Используется в HTML: {len(used_in_html['classes'])}")
print(f"Используется в JS: {len(used_in_js['classes'])}")
print(f"Неиспользуемых классов: {len(unused_classes)}")

print(f"\nВсего ID в CSS: {len(css_selectors['ids'])}")
print(f"Используется в HTML: {len(used_in_html['ids'])}")
print(f"Используется в JS: {len(used_in_js['ids'])}")
print(f"Неиспользуемых ID: {len(unused_ids)}")

if unused_classes:
    print("\n" + "=" * 80)
    print("НЕИСПОЛЬЗУЕМЫЕ КЛАССЫ:")
    print("=" * 80)
    for cls in sorted(unused_classes):
        files = css_selectors['files'].get(cls, [])
        print(f"  .{cls}")
        for file in files:
            print(f"    └─ {file}")

if unused_ids:
    print("\n" + "=" * 80)
    print("НЕИСПОЛЬЗУЕМЫЕ ID:")
    print("=" * 80)
    for id_name in sorted(unused_ids):
        files = css_selectors['files'].get(id_name, [])
        print(f"  #{id_name}")
        for file in files:
            print(f"    └─ {file}")

if not unused_classes and not unused_ids:
    print("\n✅ Неиспользуемых стилей не найдено!")

print("\n" + "=" * 80)
print("ПОТЕНЦИАЛЬНО НЕИСПОЛЬЗУЕМЫЕ (требуют ручной проверки):")
print("=" * 80)

# Классы, которые могут использоваться динамически
potential_unused = []
for cls in unused_classes:
    # Проверяем, может ли класс использоваться динамически
    if any(keyword in cls.lower() for keyword in ['active', 'open', 'close', 'show', 'hide', 'loading', 'loaded']):
        potential_unused.append(cls)

if potential_unused:
    print("\nКлассы, которые могут использоваться динамически (требуют проверки):")
    for cls in sorted(potential_unused):
        print(f"  .{cls}")

