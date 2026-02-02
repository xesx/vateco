# Workflow Templates - Frontend

## Созданные файлы

### Хуки (Hooks)
- `/src/hooks/use-workflow-templates.ts` - React Query хуки для работы с API workflow templates

### Страницы (Pages)
- `/src/app/workflow-templates/page.tsx` - Список всех workflow templates с возможностью создания, редактирования и удаления
- `/src/app/workflow-templates/[id]/page.tsx` - Просмотр и редактирование отдельного workflow template

### UI Компоненты
- `/src/components/ui/dialog.tsx` - Модальное окно (Dialog)
- `/src/components/ui/alert-dialog.tsx` - Диалог подтверждения (AlertDialog)
- `/src/components/ui/textarea.tsx` - Многострочное текстовое поле (Textarea)

## Функциональность

### Список Templates (`/workflow-templates`)
- ✅ Просмотр всех workflow templates
- ✅ Создание нового template (с именем, описанием и JSON схемой)
- ✅ Редактирование имени и описания template
- ✅ Удаление template с подтверждением
- ✅ Переход к просмотру отдельного template
- ✅ Отображение даты создания и обновления

### Просмотр Template (`/workflow-templates/[id]`)
- ✅ Просмотр информации о template (ID, название, описание, даты)
- ✅ Редактирование JSON схемы в текстовом редакторе
- ✅ Форматирование JSON (кнопка "Форматировать JSON")
- ✅ Сброс изменений (кнопка "Сбросить")
- ✅ Индикатор несохранённых изменений
- ✅ Предварительный просмотр схемы

## API Endpoints

Все запросы используют POST метод и отправляются на `/wf/template/*`:

- `POST /wf/template/list` - Получение списка всех templates
- `POST /wf/template/get` - Получение template по ID
- `POST /wf/template/create` - Создание нового template
- `POST /wf/template/update` - Обновление имени и описания
- `POST /wf/template/update-schema` - Обновление JSON схемы
- `POST /wf/template/delete` - Удаление template

## Технологии

- **Next.js 16** (App Router)
- **React 19**
- **TanStack Query** (React Query) для управления состоянием и кэшированием
- **Radix UI** для доступных UI компонентов
- **Tailwind CSS** для стилизации
- **Lucide React** для иконок
- **TypeScript** для типобезопасности

## Запуск

```bash
cd fe/admin
npm install
npm run dev
```

Приложение будет доступно по адресу: http://localhost:3000

## Навигация

С главной страницы (`/`) можно перейти в раздел "Workflow Templates" → `/workflow-templates`
