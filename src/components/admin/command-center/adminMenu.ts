/**
 * Центральный конфиг горизонтального меню администратора.
 * Каждый подпункт привязан к реальному маршруту (или ближайшему табу admin_dashboard).
 */

const AD = (tab: string) => `/admin_dashboard?tab=${tab}`;

export interface AdminMenuItem {
  label: string;
  href: string;
}

export interface AdminMenuSection {
  id: string;
  icon: string;
  label: string;
  href?: string; // пункт без подменю (прямая ссылка)
  items?: AdminMenuItem[];
}

export const ADMIN_MENU: AdminMenuSection[] = [
  { id: "home", icon: "🏠", label: "Центр принятия решений", href: "/admin" },

  {
    id: "analytics",
    icon: "📈",
    label: "Аналитика",
    items: [
      { label: "Общая аналитика", href: "/admin/analytics" },
      { label: "Продажи", href: "/admin/analytics" },
      { label: "Конверсия", href: "/admin/analytics" },
      { label: "Доходы", href: "/admin/revenue" },
      { label: "Пользователи", href: "/admin/users" },
      { label: "Партнеры", href: "/admin/partners" },
      { label: "Услуги", href: "/admin/analytics" },
      { label: "Маркетинг", href: "/admin/marketing" },
      { label: "Финансы", href: "/admin/finance" },
      { label: "География", href: "/admin/analytics" },
      { label: "AI-прогнозы", href: "/admin/ai" },
    ],
  },

  {
    id: "sales",
    icon: "💰",
    label: "Продажи",
    items: [
      { label: "Все продажи", href: AD("orders") },
      { label: "Онлайн-продажи", href: AD("orders") },
      { label: "Ожидают оплаты", href: AD("payments") },
      { label: "Оплаченные", href: AD("payments") },
      { label: "Подтвержденные", href: AD("orders") },
      { label: "Завершенные", href: AD("orders") },
      { label: "Отмененные", href: AD("orders") },
      { label: "Возвраты", href: AD("refunds") },
      { label: "Архив продаж", href: AD("orders") },
    ],
  },

  {
    id: "bookings",
    icon: "📑",
    label: "Бронирования",
    items: [
      { label: "Все бронирования", href: AD("bookings") },
      { label: "Новые", href: AD("bookings") },
      { label: "Ожидают подтверждения", href: AD("bookings") },
      { label: "Подтвержденные", href: AD("bookings") },
      { label: "В процессе", href: AD("bookings") },
      { label: "Завершенные", href: AD("bookings") },
      { label: "Отмененные", href: AD("bookings") },
      { label: "Календарь бронирований", href: AD("calendar") },
    ],
  },

  {
    id: "orders",
    icon: "📦",
    label: "Заказы",
    items: [
      { label: "Все заказы", href: AD("orders") },
      { label: "Активные", href: AD("orders") },
      { label: "Выполненные", href: AD("orders") },
      { label: "Отмененные", href: AD("orders") },
      { label: "Спорные", href: AD("orders") },
      { label: "История заказов", href: AD("orders") },
    ],
  },

  {
    id: "catalog",
    icon: "🧳",
    label: "Каталог услуг",
    items: [
      { label: "Все услуги", href: AD("services") },
      { label: "Туры", href: AD("services") },
      { label: "Отели", href: AD("services") },
      { label: "Санатории", href: AD("services") },
      { label: "Авиабилеты", href: AD("services") },
      { label: "Ж/д билеты", href: AD("services") },
      { label: "Экскурсии", href: AD("services") },
      { label: "Гиды", href: AD("services") },
      { label: "Трансферы", href: AD("services") },
      { label: "Фотографы", href: AD("services") },
      { label: "Видеографы", href: AD("services") },
      { label: "Страхование", href: AD("services") },
      { label: "Визы", href: AD("services") },
      { label: "Другие услуги", href: AD("services") },
    ],
  },

  {
    id: "content",
    icon: "📝",
    label: "Контент",
    items: [
      { label: "Страны", href: AD("settings") },
      { label: "Регионы", href: AD("settings") },
      { label: "Города", href: AD("settings") },
      { label: "Курорты", href: AD("settings") },
      { label: "Направления", href: AD("settings") },
      { label: "Достопримечательности", href: AD("settings") },
      { label: "Категории туров", href: AD("settings") },
      { label: "Типы туров", href: AD("settings") },
      { label: "Типы питания", href: AD("settings") },
      { label: "Категории номеров", href: AD("settings") },
      { label: "Удобства отелей", href: AD("settings") },
      { label: "Профили лечения", href: AD("settings") },
      { label: "Аэропорты", href: AD("settings") },
      { label: "Вокзалы", href: AD("settings") },
      { label: "Авиакомпании", href: AD("settings") },
      { label: "Железнодорожные перевозчики", href: AD("settings") },
      { label: "Блог", href: AD("settings") },
      { label: "Новости", href: AD("settings") },
      { label: "FAQ", href: AD("support") },
      { label: "Страницы сайта", href: AD("settings") },
      { label: "Медиафайлы", href: AD("settings") },
    ],
  },

  {
    id: "users",
    icon: "👥",
    label: "Пользователи",
    items: [
      { label: "Все пользователи", href: "/admin/users" },
      { label: "Клиенты", href: "/admin/users" },
      { label: "Партнеры", href: "/admin/partners" },
      { label: "Модераторы", href: AD("moderators") },
      { label: "Администраторы", href: AD("users_mgmt") },
      { label: "Роли и права доступа", href: AD("security") },
    ],
  },

  {
    id: "finance",
    icon: "💳",
    label: "Финансы",
    items: [
      { label: "Финансовая панель", href: "/admin/finance" },
      { label: "Платежи", href: AD("payments") },
      { label: "Выплаты партнерам", href: AD("commissions") },
      { label: "Комиссии платформы", href: AD("commissions") },
      { label: "Возвраты", href: AD("refunds") },
      { label: "Налоги", href: AD("finance") },
      { label: "Счета", href: AD("finance") },
      { label: "Акты", href: AD("finance") },
      { label: "Финансовые отчеты", href: AD("reports") },
    ],
  },

  {
    id: "marketing",
    icon: "📢",
    label: "Маркетинг",
    items: [
      { label: "Обзор", href: "/admin/marketing" },
      { label: "Рекламные кампании", href: AD("marketing") },
      { label: "Баннеры", href: AD("marketing") },
      { label: "Промокоды", href: AD("promotions") },
      { label: "Купоны", href: AD("promotions") },
      { label: "Email-рассылки", href: AD("marketing") },
      { label: "Push-уведомления", href: AD("notifications") },
      { label: "SMS-рассылки", href: AD("marketing") },
      { label: "Партнерская программа", href: AD("partners") },
      { label: "SEO", href: AD("marketing") },
      { label: "Аналитика маркетинга", href: AD("marketing") },
    ],
  },

  {
    id: "loyalty",
    icon: "⭐",
    label: "Лояльность",
    items: [
      { label: "Бонусная программа", href: AD("customers") },
      { label: "Баллы", href: AD("customers") },
      { label: "Cashback", href: AD("customers") },
      { label: "Сертификаты", href: AD("promotions") },
      { label: "Подарочные карты", href: AD("promotions") },
      { label: "Уровни клиентов", href: AD("customers") },
      { label: "Реферальная программа", href: AD("customers") },
    ],
  },

  {
    id: "support",
    icon: "🎧",
    label: "Поддержка",
    items: [
      { label: "Все обращения", href: AD("support") },
      { label: "Жалобы", href: AD("support") },
      { label: "Споры", href: AD("support") },
      { label: "Чаты", href: AD("messages") },
      { label: "Центр помощи", href: AD("support") },
      { label: "FAQ", href: AD("support") },
      { label: "Обратная связь", href: AD("support") },
    ],
  },

  {
    id: "reports",
    icon: "📊",
    label: "Отчеты",
    items: [
      { label: "Продажи", href: AD("reports") },
      { label: "Финансы", href: AD("reports") },
      { label: "Пользователи", href: AD("reports") },
      { label: "Партнеры", href: AD("reports") },
      { label: "Услуги", href: AD("reports") },
      { label: "Маркетинг", href: AD("reports") },
      { label: "Бронирования", href: AD("reports") },
      { label: "Возвраты", href: AD("reports") },
      { label: "Конструктор отчетов", href: AD("reports") },
    ],
  },

  {
    id: "calendar",
    icon: "📅",
    label: "Календарь",
    items: [
      { label: "Все события", href: AD("calendar") },
      { label: "Бронирования", href: AD("calendar") },
      { label: "Заезды", href: AD("calendar") },
      { label: "Выезды", href: AD("calendar") },
      { label: "Экскурсии", href: AD("calendar") },
      { label: "Расписание гидов", href: AD("calendar") },
      { label: "Трансферы", href: AD("calendar") },
      { label: "Выплаты", href: AD("calendar") },
      { label: "Задачи", href: AD("calendar") },
    ],
  },

  {
    id: "documents",
    icon: "📁",
    label: "Документы",
    items: [
      { label: "Договоры", href: AD("documents") },
      { label: "Ваучеры", href: AD("documents") },
      { label: "Счета", href: AD("documents") },
      { label: "Акты", href: AD("documents") },
      { label: "Чеки", href: AD("documents") },
      { label: "Полисы", href: AD("documents") },
      { label: "Документы партнеров", href: AD("documents") },
      { label: "Лицензии", href: AD("documents") },
      { label: "Экспортированные отчеты", href: AD("documents") },
    ],
  },

  {
    id: "integrations",
    icon: "🔌",
    label: "Интеграции",
    items: [
      { label: "API", href: AD("api") },
      { label: "GDS", href: AD("api") },
      { label: "Платежные системы", href: AD("api") },
      { label: "CRM", href: AD("api") },
      { label: "Email", href: AD("api") },
      { label: "SMS", href: AD("api") },
      { label: "Push", href: AD("api") },
      { label: "Карты", href: AD("api") },
      { label: "Аналитические сервисы", href: AD("api") },
    ],
  },

  {
    id: "system",
    icon: "🖥",
    label: "Система",
    items: [
      { label: "Мониторинг", href: AD("system") },
      { label: "Производительность", href: AD("system") },
      { label: "База данных", href: AD("system") },
      { label: "API-мониторинг", href: AD("api") },
      { label: "Очереди", href: AD("system") },
      { label: "Фоновые задачи", href: AD("system") },
      { label: "Логи", href: AD("logs") },
      { label: "Безопасность", href: AD("security") },
      { label: "Резервное копирование", href: AD("system") },
    ],
  },

  {
    id: "ai",
    icon: "🤖",
    label: "AI Center",
    items: [
      { label: "AI Dashboard", href: "/admin/ai" },
      { label: "AI Insights", href: "/admin/ai" },
      { label: "AI Pricing", href: "/admin/ai" },
      { label: "AI Forecast", href: "/admin/ai" },
      { label: "AI Marketing", href: "/admin/ai" },
      { label: "AI Fraud Detection", href: "/admin/ai" },
      { label: "AI Content Review", href: "/admin/ai" },
      { label: "AI Search", href: "/admin/ai" },
      { label: "AI Assistant", href: "/admin/ai" },
    ],
  },

  {
    id: "settings",
    icon: "⚙",
    label: "Настройки",
    items: [
      { label: "Общие", href: AD("settings") },
      { label: "Языки", href: AD("settings") },
      { label: "Валюты", href: AD("settings") },
      { label: "Комиссии", href: AD("settings") },
      { label: "Налоги", href: AD("settings") },
      { label: "Способы оплаты", href: AD("settings") },
      { label: "Уведомления", href: AD("notifications") },
      { label: "Email-шаблоны", href: AD("settings") },
      { label: "SMS-шаблоны", href: AD("settings") },
      { label: "Push-шаблоны", href: AD("settings") },
      { label: "SEO", href: AD("settings") },
      { label: "Брендинг", href: AD("settings") },
      { label: "AI-настройки", href: AD("settings") },
      { label: "Роли и права доступа", href: AD("security") },
    ],
  },

  { id: "logout", icon: "🚪", label: "Выход" },
];
