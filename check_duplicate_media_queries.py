#!/usr/bin/env python3
"""
Скрипт для поиска дублирующихся медиа-запросов
"""
import re
from pathlib import Path
from collections import defaultdict

CSS_MODULES_DIR = Path('css/modules')

# Собираем все медиа-запросы
media_queries = defaultdict(list)

def extract_media_queries(file_path):
    """Извлекает медиа-запросы из CSS файла"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Ошибка чтения {file_path}: {e}")
        return
    
    # Находим все медиа-запросы
    # Паттерн: @media (условие) { ... }
    pattern = r'@media\s+([^{]+)\s*\{'
    
    matches = re.finditer(pattern, content, re.MULTILINE | re.DOTALL)
    
    for match in matches:
        condition = match.group(1).strip()
        # Нормализуем условие (убираем лишние пробелы)
        condition = re.sub(r'\s+', ' ', condition)
        
        # Извлекаем содержимое медиа-запроса
        start = match.end()
        brace_count = 1
        end = start
        
        while end < len(content) and brace_count > 0:
            if content[end] == '{':
                brace_count += 1
            elif content[end] == '}':
                brace_count -= 1
            end += 1
        
        query_content = content[start:end-1].strip()
        
        # Сохраняем информацию
        media_queries[condition].append({
            'file': str(file_path),
            'content': query_content[:200] + '...' if len(query_content) > 200 else query_content,
            'full_content': query_content
        })

# Сканируем все CSS файлы
for css_file in CSS_MODULES_DIR.rglob('*.css'):
    extract_media_queries(css_file)

# Анализируем дубликаты
print("=" * 80)
print("АНАЛИЗ ДУБЛИРУЮЩИХСЯ МЕДИА-ЗАПРОСОВ")
print("=" * 80)

# Группируем по условиям
duplicates = {k: v for k, v in media_queries.items() if len(v) > 1}
unique_queries = {k: v for k, v in media_queries.items() if len(v) == 1}

print(f"\nВсего уникальных медиа-запросов: {len(media_queries)}")
print(f"Дублирующихся условий: {len(duplicates)}")
print(f"Уникальных условий: {len(unique_queries)}")

if duplicates:
    print("\n" + "=" * 80)
    print("ДУБЛИРУЮЩИЕСЯ МЕДИА-ЗАПРОСЫ:")
    print("=" * 80)
    
    for condition, occurrences in sorted(duplicates.items(), key=lambda x: len(x[1]), reverse=True):
        print(f"\n📱 @media {condition}")
        print(f"   Найдено в {len(occurrences)} файлах:")
        for i, occ in enumerate(occurrences, 1):
            file_name = Path(occ['file']).name
            print(f"   {i}. {file_name}")
            print(f"      Путь: {occ['file']}")
            # Показываем первые селекторы из содержимого
            selectors = re.findall(r'([.#][a-zA-Z][a-zA-Z0-9_-]*(?:\s*,\s*[.#][a-zA-Z][a-zA-Z0-9_-]*)*)\s*\{', occ['content'])
            if selectors:
                print(f"      Селекторы: {', '.join(selectors[:3])}{'...' if len(selectors) > 3 else ''}")

# Анализируем популярные breakpoints
print("\n" + "=" * 80)
print("ПОПУЛЯРНЫЕ BREAKPOINTS:")
print("=" * 80)

breakpoint_stats = defaultdict(int)

for condition in media_queries.keys():
    # Извлекаем breakpoints
    if 'max-width: 768px' in condition or 'max-width:767px' in condition:
        breakpoint_stats['mobile (≤768px)'] += len(media_queries[condition])
    elif 'min-width: 769px' in condition or 'min-width:769px' in condition:
        if 'max-width: 1024px' in condition or 'max-width:1024px' in condition:
            breakpoint_stats['tablet (769-1024px)'] += len(media_queries[condition])
    elif 'min-width: 1025px' in condition or 'min-width:1025px' in condition:
        breakpoint_stats['desktop (≥1025px)'] += len(media_queries[condition])
    elif 'min-width: 1367px' in condition or 'min-width:1367px' in condition:
        breakpoint_stats['large desktop (≥1367px)'] += len(media_queries[condition])
    elif 'orientation: portrait' in condition:
        breakpoint_stats['portrait orientation'] += len(media_queries[condition])
    elif 'orientation: landscape' in condition:
        breakpoint_stats['landscape orientation'] += len(media_queries[condition])

for bp, count in sorted(breakpoint_stats.items(), key=lambda x: x[1], reverse=True):
    print(f"  {bp}: {count} использований")

# Показываем все уникальные условия для справки
print("\n" + "=" * 80)
print("ВСЕ УНИКАЛЬНЫЕ УСЛОВИЯ МЕДИА-ЗАПРОСОВ:")
print("=" * 80)
for condition in sorted(media_queries.keys()):
    count = len(media_queries[condition])
    files = [Path(f['file']).name for f in media_queries[condition]]
    print(f"  @media {condition}")
    print(f"    → {count} раз(а) в: {', '.join(files)}")

