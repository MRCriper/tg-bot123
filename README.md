# Telegram Mini App - Магазин звезд Telegram с оплатой Paysto

Telegram Mini App для покупки и перевода звезд Telegram с возможностью приема платежей через Paysto. Приложение разработано с использованием React, TypeScript и интегрировано с Telegram Web App API.

## Технологии и стек

- React + TypeScript
- React Router для маршрутизации
- Styled Components для стилизации
- React Query для управления данными
- @twa-dev/sdk для интеграции с Telegram Mini Apps
- React Hook Form для управления формами
- Axios для HTTP-запросов

## Особенности приложения

- Адаптивный дизайн для мобильных устройств
- Поддержка светлой и темной темы (синхронизация с Telegram)
- Каталог готовых пакетов звезд Telegram
- Корзина с возможностью изменения количества пакетов
- Оформление заказа с валидацией полей и указанием Telegram-аккаунта для перевода
- Интеграция с платежной системой Paysto
- Отслеживание статуса заказа и начисления звезд

## Установка и запуск

1. Клонируйте репозиторий:
```bash
git clone https://github.com/your-username/tg-bot123.git
cd tg-bot123
```

2. Установите зависимости:
```bash
npm install
```

3. Настройте переменные окружения:
Создайте файл `.env` в корне проекта и добавьте необходимые переменные:
```
REACT_APP_PAYSTO_SECRET_KEY=your_paysto_secret_key
REACT_APP_PAYSTO_API_URL=https://api.paysto.com/v2
REACT_APP_TELEGRAM_BOT_USERNAME=your_telegram_bot_username
```

4. Запустите приложение для разработки:
```bash
npm start
```

5. Для создания production-сборки:
```bash
npm run build
```

## Интеграция с Telegram ботом

1. Создайте нового бота через @BotFather в Telegram.

2. Получите токен для вашего бота.

3. Добавьте поддержку Web Apps для вашего бота через @BotFather:
   - Выберите бота
   - Выберите "Bot Settings" -> "Menu Button" -> "Web App"
   - Введите URL вашего развернутого приложения

4. Для локального тестирования можно использовать ngrok:
```bash
# Установите ngrok, затем запустите:
ngrok http 3000
```

5. Для деплоя на Replit:
   - Создайте новый Repl с импортом из GitHub
   - Настройте переменные окружения в секции "Secrets"
   - Проект уже содержит необходимые файлы конфигурации для Replit (.replit, replit.nix)
   - Запуск проекта происходит автоматически через команду `npm run dev`
   - Проект использует TypeScript, поэтому убедитесь, что в Replit установлен TypeScript

## Решение проблем с запуском на Replit

Если при запуске на Replit возникает ошибка:
```
Invalid options object. Dev Server has been initialized using an options object that does not match the API schema.
options.allowedHosts[0] should be a non-empty string.
```

Это связано с настройками webpack-dev-server в Replit. Проект уже содержит необходимые файлы конфигурации:

1. `.env.development` - содержит настройки для webpack-dev-server:
```
HOST=0.0.0.0
PORT=3000
WDS_SOCKET_HOST=0.0.0.0
WDS_SOCKET_PORT=0
DANGEROUSLY_DISABLE_HOST_CHECK=true
FAST_REFRESH=false
```

2. `.replit` - содержит настройки для запуска проекта на Replit

Если проблема сохраняется:
- Убедитесь, что файлы `.env.development` и `.replit` присутствуют в корне проекта
- Перезапустите Repl (используйте кнопку "Stop" и затем "Run")
- Проверьте, что в Secrets Replit не переопределены переменные окружения, которые могут конфликтовать с настройками

## Структура проекта

```
tg-bot123/
├── public/                  # Публичные ресурсы
├── src/                     # Исходный код
│   ├── assets/              # Статические ресурсы
│   ├── components/          # Компоненты React
│   │   ├── Cart/            # Компоненты корзины
│   │   ├── CheckoutForm/    # Компоненты оформления заказа
│   │   ├── Header/          # Компоненты заголовка
│   │   ├── OrderStatus/     # Компоненты статуса заказа
│   │   ├── PaymentForm/     # Компоненты оплаты
│   │   ├── ProductCard/     # Карточка товара
│   │   └── ProductList/     # Список товаров
│   ├── hooks/               # Пользовательские хуки React
│   │   ├── useCart.ts       # Хук для работы с корзиной
│   │   ├── usePayment.ts    # Хук для работы с платежами
│   │   └── useTelegram.ts   # Хук для интеграции с Telegram
│   ├── pages/               # Страницы приложения
│   │   ├── Home.tsx         # Главная страница
│   │   ├── CartPage.tsx     # Страница корзины
│   │   ├── CheckoutPage.tsx # Страница оформления заказа
│   │   ├── PaymentPage.tsx  # Страница оплаты
│   │   └── PaymentSuccessPage.tsx # Страница успешной оплаты
│   ├── providers/           # Провайдеры контекста
│   ├── services/            # Сервисы API
│   │   └── paystoService.ts # Сервис для Paysto API
│   ├── styles/              # Глобальные стили
│   │   └── GlobalStyles.ts  # Глобальные CSS
│   ├── types/               # TypeScript типы
│   │   └── index.ts         # Общие типы данных
│   ├── utils/               # Утилиты и хелперы
│   ├── App.tsx              # Основной компонент приложения
│   └── index.tsx            # Точка входа
├── .env                     # Переменные окружения
├── package.json             # Зависимости
└── tsconfig.json            # Конфигурация TypeScript
```

## Безопасность и платежи

**Важно**: В реальном приложении все платежные операции должны проходить через ваш бэкенд. Никогда не храните секретные ключи на фронтенде. Текущая реализация является демонстрационной.

Для интеграции Paysto в production-окружении:

1. Создайте аккаунт в Paysto и получите API-ключи.
2. Реализуйте бэкенд для обработки платежей и хранения секретных ключей.
3. Настройте webhook для получения уведомлений об изменении статуса платежей.

## Лицензия

MIT
