# Быстрый старт

## Установка

```bash
cd apps/app-web
npm install
```

## Конфигурация

Скопируйте `.env.example` в `.env.local` и настройте переменные:

```bash
cp .env.example .env.local
```

Отредактируйте `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Запуск

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

## Основные команды

```bash
# Разработка
npm run dev

# Сборка для продакшн
npm run build

# Запуск продакшн версии
npm start

# Линтинг
npm run lint

# Добавить компонент shadcn
npx shadcn@latest add [component-name]
```

## Доступные страницы

- `/` - Главная страница с демо
- `/workflows` - Управление workflows
- `/users` - Управление пользователями

## Основные технологии

- **Next.js 15** - React фреймворк
- **TypeScript** - Типизация
- **shadcn/ui** - UI компоненты
- **React Query** - Управление данными
- **Axios** - HTTP клиент
- **Tailwind CSS** - Стили

## Структура

```
src/
├── app/          # Страницы (Next.js App Router)
├── components/   # React компоненты
├── hooks/        # React Query hooks
├── lib/          # Утилиты (API, helpers)
└── providers/    # React провайдеры
```

## Полезные ссылки

- [README.md](./README.md) - Детальная документация
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Архитектура приложения
- [Next.js Docs](https://nextjs.org/docs)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [React Query Docs](https://tanstack.com/query/latest)

