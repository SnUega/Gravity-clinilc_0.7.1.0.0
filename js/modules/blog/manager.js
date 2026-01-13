/**
 * Менеджер блога
 * Управление отображением статей блога с поддержкой интеграции с админ-панелью
 * 
 * Поддерживает:
 * - Загрузку статей из API (для будущей интеграции с админ-панелью)
 * - Обновление мини-блога в меню (7 последних статей)
 * - Обновление hero блога (последняя статья)
 * - Кэширование данных
 */

import { $ } from '../../core/utils.js';
import { CONFIG } from '../../core/config.js';

/**
 * Класс менеджера блога
 */
export class BlogManager {
  constructor(options = {}) {
    this.options = {
      maxArticles: options.maxArticles || 7,
      apiEndpoint: options.apiEndpoint || CONFIG.API.ENDPOINTS.BLOG_ARTICLES,
      cacheDuration: options.cacheDuration || 300000, // 5 минут
      scrollAreaSelector: options.scrollAreaSelector || '#blogScrollArea',
      ...options
    };

    this.articlesCache = null;
    this.cacheTimestamp = 0;
    this.blogScrollArea = null;
    this.isInitialized = false;
  }

  /**
   * Создание шаблона статьи
   * @param {Object} article - Данные статьи
   * @returns {string} - HTML шаблон
   */
  createArticleTemplate(article) {
    return `
      <div class="blog-article" data-article-id="${article.id}" data-slug="${article.slug || ''}">
        <div class="article-thumbnail">
          <img src="${article.thumbnail || './img/img-placeholder.jpg'}" alt="${article.title}" loading="lazy" />
        </div>
        <div class="article-content">
          <h3 class="article-title">${article.title}</h3>
          <p class="article-preview">${article.preview || ''}</p>
          ${article.date ? `<span class="article-date">${this.formatDate(article.date)}</span>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Форматирование даты
   * @param {string} dateString - Дата в формате ISO
   * @returns {string} - Отформатированная дата
   */
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }

  /**
   * Загрузка статей из API (для будущей интеграции с админ-панелью)
   * @returns {Promise<Array>} - Массив статей
   */
  async loadArticlesFromAPI() {
    try {
      const response = await fetch(this.options.apiEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        // Добавляем таймаут для предотвращения зависания
        signal: AbortSignal.timeout(CONFIG.API.TIMEOUT)
      });

      if (!response.ok) {
        // API еще не реализован - это нормально на этапе разработки
        if (response.status === 404) {
          // Тихая обработка 404 - API еще не создан
          return this.getMockArticles();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Ожидаем структуру: { articles: [...] } или просто массив
      return Array.isArray(data) ? data : (data.articles || []);
    } catch (error) {
      // API еще не реализован - используем мок данные
      // Не показываем предупреждение для 404, т.к. это ожидаемо
      if (error.message && error.message.includes('404')) {
        return this.getMockArticles();
      }
      
      // Логируем ошибку через централизованный обработчик
      const { getErrorHandler, ERROR_SEVERITY } = await import('../../core/errors.js');
      const errorHandler = getErrorHandler();
      errorHandler.handle(error, {
        module: 'blog-manager',
        severity: ERROR_SEVERITY.LOW,
        context: { action: 'loadArticlesFromAPI' },
        fallback: () => this.getMockArticles(),
        userMessage: null // Не показываем пользователю, используем fallback
      });
      
      // Возвращаем мок данные при ошибке
      return this.getMockArticles();
    }
  }

  /**
   * Получение мок данных (временное решение до интеграции с админ-панелью)
   * @returns {Array} - Массив мок статей
   */
  getMockArticles() {
    return [
      {
        id: 1,
        title: "Как выбрать косметолога?",
        preview: "Выбор косметолога — это важный шаг на пути к красоте и здоровью кожи. В этой статье мы расскажем о ключевых критериях...",
        thumbnail: "img/img-placeholder.jpg",
        date: "2024-01-15",
        category: "Советы",
        slug: "kak-vybrat-kosmetologa"
      },
      {
        id: 2,
        title: "Топ-5 процедур июня",
        preview: "Лето — идеальное время для обновления и ухода за кожей. Представляем вашему вниманию самые популярные процедуры...",
        thumbnail: "img/img-placeholder_1.jpg",
        date: "2024-01-10",
        category: "Процедуры",
        slug: "top-5-procedur-iyunya"
      },
      {
        id: 3,
        title: "Правила подготовки к лазерной эпиляции",
        preview: "Лазерная эпиляция — эффективный способ удаления нежелательных волос. Правильная подготовка к процедуре обеспечивает максимальный результат...",
        thumbnail: "img/img-placeholder.jpg",
        date: "2024-01-05",
        category: "Подготовка",
        slug: "pravila-podgotovki-k-lazernoy-epilyatsii"
      },
      {
        id: 4,
        title: "Уход за кожей зимой",
        preview: "Зимний период требует особого подхода к уходу за кожей. Холодный воздух и отопление могут негативно влиять на состояние кожи...",
        thumbnail: "img/img-placeholder_1.jpg",
        date: "2024-01-01",
        category: "Уход",
        slug: "uhod-za-kozhey-zimoy"
      },
      {
        id: 5,
        title: "Антивозрастные процедуры",
        preview: "Современная косметология предлагает множество эффективных методов борьбы с признаками старения. Рассмотрим самые популярные...",
        thumbnail: "img/img-placeholder.jpg",
        date: "2023-12-28",
        category: "Антивозраст",
        slug: "antivozrastnye-protsedury"
      },
      {
        id: 6,
        title: "Питание для здоровой кожи",
        preview: "Красота кожи начинается изнутри. Правильное питание играет ключевую роль в поддержании здоровья и молодости кожи...",
        thumbnail: "img/img-placeholder_1.jpg",
        date: "2023-12-25",
        category: "Питание",
        slug: "pitanie-dlya-zdorovoy-kozhi"
      },
      {
        id: 7,
        title: "Современные методы омоложения",
        preview: "Технологии в области эстетической медицины развиваются стремительно. Новые методы позволяют достигать впечатляющих результатов...",
        thumbnail: "img/img-placeholder.jpg",
        date: "2023-12-20",
        category: "Технологии",
        slug: "sovremennye-metody-omolozheniya"
      }
    ];
  }

  /**
   * Рендеринг статей в области блога
   * @param {Array} articles - Массив статей
   */
  renderArticles(articles) {
    if (!this.blogScrollArea) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error('Blog scroll area not found'), {
        module: 'blog-manager',
        severity: ERROR_SEVERITY.LOW,
        context: { action: 'setupScrollHandlers' },
        userMessage: null
      });
      return;
    }

    // Очищаем существующие статьи
    // Проверяем, есть ли уже заглушки (blog-stub)
    const existingStubs = this.blogScrollArea.querySelectorAll('.blog-stub');
    
    // Если есть заглушки, не заменяем их
    if (existingStubs.length > 0) {
      console.log('Blog stubs found, skipping article rendering');
      return;
    }

    this.blogScrollArea.innerHTML = '';

    // Ограничиваем количество статей
    const limitedArticles = articles.slice(0, this.options.maxArticles);

    // Рендерим все статьи
    limitedArticles.forEach(article => {
      const articleElement = document.createElement('div');
      articleElement.innerHTML = this.createArticleTemplate(article);
      const articleNode = articleElement.firstElementChild;
      
      if (articleNode) {
        this.blogScrollArea.appendChild(articleNode);
      }
    });
  }

  /**
   * Настройка обработчиков кликов по статьям
   */
  setupArticleClickHandlers() {
    // Используем делегирование событий для динамически добавленных статей
    document.addEventListener('click', (e) => {
      const article = e.target.closest('.blog-article');
      if (!article) return;

      const articleId = article.getAttribute('data-article-id');
      const slug = article.getAttribute('data-slug');
      
      this.handleArticleClick(articleId, slug);
    });
  }

  /**
   * Обработка клика по статье
   * @param {string|number} articleId - ID статьи
   * @param {string} slug - Slug статьи (для URL)
   */
  handleArticleClick(articleId, slug) {
    // TODO: Реализовать навигацию на страницу статьи
    // После создания страниц статей через админ-панель:
    // if (slug) {
    //   window.location.href = `/blog/articles/${slug}.html`;
    // } else {
    //   window.location.href = `/blog/article/${articleId}`;
    // }
    
      // Article clicked: { articleId, slug }
  }

  /**
   * Добавление новой статьи (для интеграции с админ-панелью)
   * @param {Object} articleData - Данные статьи
   */
  addNewArticle(articleData) {
    if (!this.articlesCache) {
      this.articlesCache = [];
    }

    // Добавляем новую статью в начало
    const newArticle = {
      id: articleData.id || Date.now(),
      date: articleData.date || new Date().toISOString().split('T')[0],
      ...articleData
    };

    this.articlesCache.unshift(newArticle);

    // Удаляем самую старую статью если превышаем лимит
    if (this.articlesCache.length > this.options.maxArticles * 2) {
      this.articlesCache = this.articlesCache.slice(0, this.options.maxArticles);
    }

    // Обновляем кэш
    this.cacheTimestamp = Date.now();

    // Перерисовываем статьи
    this.renderArticles(this.articlesCache);

    // Эмитим событие для обновления других компонентов (hero блога, мини-блог в меню)
    this.emitArticleUpdate(newArticle, 'added');
  }

  /**
   * Обновление статьи (для интеграции с админ-панелью)
   * @param {string|number} articleId - ID статьи
   * @param {Object} articleData - Новые данные статьи
   */
  updateArticle(articleId, articleData) {
    if (!this.articlesCache) return;

    const articleIndex = this.articlesCache.findIndex(article => article.id == articleId);
    if (articleIndex !== -1) {
      this.articlesCache[articleIndex] = {
        ...this.articlesCache[articleIndex],
        ...articleData
      };

      // Обновляем кэш
      this.cacheTimestamp = Date.now();

      // Перерисовываем статьи
      this.renderArticles(this.articlesCache);

      // Эмитим событие
      this.emitArticleUpdate(this.articlesCache[articleIndex], 'updated');
    }
  }

  /**
   * Удаление статьи (для интеграции с админ-панелью)
   * @param {string|number} articleId - ID статьи
   */
  removeArticle(articleId) {
    if (!this.articlesCache) return;

    const article = this.articlesCache.find(a => a.id == articleId);
    this.articlesCache = this.articlesCache.filter(article => article.id != articleId);

    // Обновляем кэш
    this.cacheTimestamp = Date.now();

    // Перерисовываем статьи
    this.renderArticles(this.articlesCache);

    // Эмитим событие
    if (article) {
      this.emitArticleUpdate(article, 'removed');
    }
  }

  /**
   * Эмит события обновления статьи для других компонентов
   * @param {Object} article - Статья
   * @param {string} action - Действие (added, updated, removed)
   */
  emitArticleUpdate(article, action) {
    const event = new CustomEvent('blogArticleUpdate', {
      detail: { article, action },
      bubbles: true
    });
    document.dispatchEvent(event);
  }

  /**
   * Обновление статей из API (для интеграции с админ-панелью)
   * @param {boolean} force - Принудительное обновление (игнорировать кэш)
   * @returns {Promise<Array>} - Массив статей
   */
  async refreshArticles(force = false) {
    const now = Date.now();

    // Проверяем кэш если не принудительное обновление
    if (!force && this.articlesCache && (now - this.cacheTimestamp) < this.options.cacheDuration) {
      return this.articlesCache;
    }

    // Загружаем свежие статьи
    const articles = await this.loadArticlesFromAPI();
    
    this.articlesCache = articles;
    this.cacheTimestamp = now;

    // Рендерим статьи
    this.renderArticles(articles);

    return articles;
  }

  /**
   * Получение последней статьи (для hero блога)
   * @returns {Object|null} - Последняя статья или null
   */
  getLatestArticle() {
    if (!this.articlesCache || this.articlesCache.length === 0) {
      return null;
    }

    // Сортируем по дате (новые первыми)
    const sorted = [...this.articlesCache].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });

    return sorted[0];
  }

  /**
   * Получение статей для мини-блога в меню (7 последних)
   * @returns {Array} - Массив из 7 последних статей
   */
  getMenuBlogArticles() {
    if (!this.articlesCache || this.articlesCache.length === 0) {
      return [];
    }

    // Сортируем по дате (новые первыми) и берем 7 последних
    const sorted = [...this.articlesCache].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB - dateA;
    });

    return sorted.slice(0, 7);
  }

  /**
   * Инициализация менеджера блога
   */
  async init() {
    if (this.isInitialized) {
      return;
    }

    // Находим область скролла блога
    this.blogScrollArea = $(this.options.scrollAreaSelector);
    if (!this.blogScrollArea) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(new Error(`Blog scroll area ${this.options.scrollAreaSelector} not found`), {
        module: 'blog-manager',
        severity: ERROR_SEVERITY.MEDIUM,
        context: { action: 'init', selector: this.options.scrollAreaSelector },
        userMessage: null
      });
      return;
    }

    try {
      // Загружаем статьи
      const articles = await this.refreshArticles();

      if (articles.length === 0) {
        const errorHandler = getErrorHandler();
        errorHandler.handle(new Error('No articles loaded'), {
          module: 'blog-manager',
          severity: ERROR_SEVERITY.LOW,
          context: { action: 'getLatestArticle' },
          userMessage: null
        });
        return;
      }

      // Настраиваем обработчики кликов
      this.setupArticleClickHandlers();

      this.isInitialized = true;
      // BlogManager initialized

    } catch (error) {
      const errorHandler = getErrorHandler();
      errorHandler.handle(error, {
        module: 'blog-manager',
        severity: ERROR_SEVERITY.HIGH,
        context: { action: 'init' },
        userMessage: null
      });
    }
  }

  /**
   * Уничтожение менеджера блога
   */
  destroy() {
    this.articlesCache = null;
    this.cacheTimestamp = 0;
    this.blogScrollArea = null;
    this.isInitialized = false;
  }
}

/**
 * Инициализация менеджера блога
 */
let blogManagerInstance = null;

export function initBlogManager(options) {
  if (blogManagerInstance) {
    return blogManagerInstance;
  }

  blogManagerInstance = new BlogManager(options);

  // Автоматическая инициализация при загрузке DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      blogManagerInstance.init();
    });
  } else {
    blogManagerInstance.init();
  }

  return blogManagerInstance;
}

// Экспорт для глобального использования (для интеграции с админ-панелью)
if (typeof window !== 'undefined') {
  // Создаем глобальный API для интеграции с админ-панелью
  window.BlogManager = {
    init: (options) => initBlogManager(options),
    addArticle: (articleData) => {
      if (blogManagerInstance) {
        blogManagerInstance.addNewArticle(articleData);
      }
    },
    updateArticle: (articleId, articleData) => {
      if (blogManagerInstance) {
        blogManagerInstance.updateArticle(articleId, articleData);
      }
    },
    removeArticle: (articleId) => {
      if (blogManagerInstance) {
        blogManagerInstance.removeArticle(articleId);
      }
    },
    refreshArticles: (force) => {
      if (blogManagerInstance) {
        return blogManagerInstance.refreshArticles(force);
      }
      return Promise.resolve([]);
    },
    // Алиас с опечаткой для обратной совместимости
    refresfArticles: (force) => {
      if (blogManagerInstance) {
        return blogManagerInstance.refreshArticles(force);
      }
      return Promise.resolve([]);
    },
    getArticles: () => {
      return blogManagerInstance ? blogManagerInstance.articlesCache : null;
    },
    getLatestArticle: () => {
      return blogManagerInstance ? blogManagerInstance.getLatestArticle() : null;
    },
    getMenuBlogArticles: () => {
      return blogManagerInstance ? blogManagerInstance.getMenuBlogArticles() : [];
    },
    // Алиас без 's' для обратной совместимости
    getMenuBlogArticle: () => {
      return blogManagerInstance ? blogManagerInstance.getMenuBlogArticles() : [];
    }
  };

  // Автоматическая инициализация
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initBlogManager();
    });
  } else {
    initBlogManager();
  }
}

