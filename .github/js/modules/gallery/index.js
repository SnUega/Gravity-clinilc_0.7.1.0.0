/**
 * Модуль галереи
 * Экспорт галереи изображений
 */

import { Gallery } from './gallery.js';
import { waitForLibrary } from '../../core/utils.js';

/**
 * Данные категорий по умолчанию
 */
const defaultCategories = {
  "Здание": [
    "img/IMG_4583.jpg",
    "img/ASH.jpg"
  ],
  "Холл": [
    "img/img-placeholder.jpg",
    "img/img-placeholder_1.jpg"
  ],
  "Инъекционная": [
    "img/img-placeholder.jpg",
    "img/img-placeholder_1.jpg"
  ],
  "Лицевая эстетика": [
    "img/IMG_4583.jpg",
    "img/ASH.jpg"
  ],
  "Тело эстетика": [
    "img/img-placeholder.jpg",
    "img/img-placeholder_1.jpg"
  ],
  "Комната отдыха": [
    "img/img-placeholder.jpg",
    "img/img-placeholder_1.jpg"
  ],
};

/**
 * Инициализация галереи
 */
let galleryInstance = null;

export function initGallery(options = {}) {
  if (galleryInstance) {
    return galleryInstance;
  }

  // Используем категории по умолчанию, если не указаны
  const finalOptions = {
    categories: defaultCategories,
    defaultCategory: 'Здание',
    ...options
  };

  galleryInstance = new Gallery(finalOptions);

  // Ждем загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      galleryInstance.init();
    });
  } else {
    galleryInstance.init();
  }

  // Экспортируем в window для глобального доступа
  if (typeof window !== 'undefined') {
    window.Gallery = galleryInstance;
  }

  return galleryInstance;
}

