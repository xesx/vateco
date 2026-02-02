# Архитектура приложения

## Структура проекта

### `/src/app`
Next.js App Router страницы и layouts. Каждая папка представляет собой роут.

- `layout.tsx` - корневой layout с провайдерами
- `page.tsx` - главная страница
- `workflows/page.tsx` - страница управления workflows
- `users/page.tsx` - страница управления пользователями

### `/src/components`
React компоненты.

- `ui/` - shadcn/ui компоненты (Button, Card, Input, Label и т.д.)
- `navigation.tsx` - компонент навигационного меню
- `dashboard-card.tsx` - пример переиспользуемого компонента

### `/src/hooks`
Custom React hooks для работы с API через React Query.

- `use-users.ts` - хуки для работы с пользователями (CRUD операции)
- `use-workflows.ts` - хуки для работы с workflows (CRUD операции + запуск)

### `/src/lib`
Утилиты и вспомогательные функции.

- `api.ts` - настроенный Axios instance с перехватчиками
- `utils.ts` - утилиты shadcn (cn функция для классов)

### `/src/providers`
React Context провайдеры.

- `query-provider.tsx` - провайдер React Query с настройками

## Паттерны и лучшие практики

### 1. Работа с API через React Query

**Queries** - для получения данных:
```typescript
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users')
      return data
    },
  })
}
```

**Mutations** - для изменения данных:
```typescript
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userData: CreateUserDto) => {
      const { data } = await api.post<User>('/users', userData)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
```

### 2. Использование TypeScript

- Всегда типизируем данные API
- Используем интерфейсы для DTO (Data Transfer Objects)
- Избегаем `any`, используем `unknown` при необходимости

### 3. Компоненты shadcn/ui

Компоненты устанавливаются локально и могут быть кастомизированы:
```bash
npx shadcn@latest add [component-name]
```

Все компоненты находятся в `src/components/ui/` и могут быть изменены под нужды проекта.

### 4. Axios перехватчики

В `lib/api.ts` настроены перехватчики для:
- Автоматического добавления токена авторизации
- Обработки ошибок 401 (редирект на логин)

### 5. React Query настройки

По умолчанию:
- `staleTime: 60s` - данные считаются актуальными 1 минуту
- `refetchOnWindowFocus: false` - не обновлять при фокусе окна

## Интеграция с backend

### Настройка API URL

В `.env.local` указывается URL backend API:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Авторизация

Токен сохраняется в `localStorage` и автоматически добавляется в заголовки всех запросов:
```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

## Добавление новых функций

### Новая страница

1. Создайте папку в `src/app/[route-name]/`
2. Добавьте `page.tsx`
3. Добавьте ссылку в `components/navigation.tsx`

### Новый API endpoint

1. Создайте типы в соответствующем hook файле
2. Создайте функции-хуки (useQuery или useMutation)
3. Используйте в компонентах

Пример:
```typescript
// src/hooks/use-posts.ts
export interface Post {
  id: string
  title: string
  content: string
}

export function usePosts() {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data } = await api.get<Post[]>('/posts')
      return data
    },
  })
}
```

### Новый компонент shadcn

```bash
npx shadcn@latest add [component-name]
```

Доступные компоненты: https://ui.shadcn.com/docs/components

## Оптимизация производительности

1. **React Query кеширование** - данные кешируются автоматически
2. **Next.js оптимизации** - автоматический code splitting
3. **TypeScript** - статическая типизация предотвращает ошибки

## Debugging

- **React Query DevTools** - доступны в dev режиме (нижний правый угол)
- **Next.js Fast Refresh** - мгновенное обновление при изменениях
- **TypeScript errors** - проверка типов в реальном времени

