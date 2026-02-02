# Vateco Web App

Фронтенд-приложение на Next.js с shadcn/ui и React Query.

## 🚀 Технологии

- **Next.js 15** - React фреймворк с App Router
- **TypeScript** - Строгая типизация
- **shadcn/ui** - Компоненты UI на основе Radix UI
- **Tailwind CSS** - Утилитарный CSS фреймворк
- **React Query (TanStack Query)** - Управление серверным состоянием
- **Axios** - HTTP клиент

## 📦 Установка

```bash
npm install
```

## 🛠 Разработка

```bash
npm run dev
```

Приложение будет доступно по адресу [http://localhost:3000](http://localhost:3000)

## 🏗 Структура проекта

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Корневой layout
│   ├── page.tsx           # Главная страница
│   └── globals.css        # Глобальные стили
├── components/            # React компоненты
│   ├── ui/               # shadcn/ui компоненты
│   └── *.tsx             # Пользовательские компоненты
├── hooks/                # Custom React hooks
│   └── use-users.ts      # Пример хуков с React Query
├── lib/                  # Утилиты
│   ├── api.ts           # Axios instance с перехватчиками
│   └── utils.ts         # shadcn utils
└── providers/           # React провайдеры
    └── query-provider.tsx # React Query провайдер
```

## 🔧 Настройка

Создайте файл `.env.local` на основе `.env.example`:

```bash
cp .env.example .env.local
```

Укажите URL вашего API:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📝 Использование React Query

Пример создания hook для работы с API:

```typescript
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users')
      return data
    },
  })
}
```

## 🎨 Добавление компонентов shadcn/ui

```bash
npx shadcn@latest add [component-name]
```

Доступные компоненты: https://ui.shadcn.com/docs/components

## 🔨 Сборка

```bash
npm run build
```

## 🚢 Запуск продакшн версии

```bash
npm run start
```

## 📚 Полезные ссылки

- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [React Query](https://tanstack.com/query/latest)
- [Tailwind CSS](https://tailwindcss.com)

