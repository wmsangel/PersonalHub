# PersonalHub — Sprint 01 Tasks
> **Для:** Cursor AI Agent  
> **Контекст:** Читай ARCHITECTURE.md перед началом каждой задачи  
> **Цель спринта:** Рабочий дашборд с виджетами (задачи, покупки, заметки) + красивый UI/дизайн-система  
> **Проверка после каждой задачи:** `npm run check-types -w web` + `npm run lint -w web`

---

## 🎨 БЛОК A — Дизайн-система и Layout

---

### A-01 · Установить и настроить shadcn/ui

**Что сделать:**
Инициализировать shadcn/ui в `apps/web`, установить базовый набор компонентов.

**Команды:**
```bash
cd apps/web
npx shadcn@latest init
```

**При инициализации выбрать:**
- Style: `Default`
- Base color: `Slate`
- CSS variables: `Yes`

**Установить компоненты:**
```bash
npx shadcn@latest add button card badge input label textarea select
npx shadcn@latest add dropdown-menu avatar separator skeleton toast
npx shadcn@latest add dialog sheet tabs scroll-area
```

**Результат:** `components/ui/` заполнен компонентами, `tailwind.config.ts` и `globals.css` обновлены.

---

### A-02 · Создать дизайн-токены и тему

**Что сделать:**
В `apps/web/app/globals.css` настроить CSS-переменные для светлой и тёмной темы PersonalHub.

**Цветовая палитра:**
```css
:root {
  /* Brand */
  --brand-primary: 245 90% 60%;       /* indigo */
  --brand-secondary: 280 85% 65%;     /* purple */
  
  /* Нейтральные */
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  
  /* Карточки */
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --border: 214 32% 91%;
  
  /* Статусы */
  --success: 142 76% 36%;
  --warning: 38 92% 50%;
  --destructive: 0 84% 60%;
}

.dark {
  --background: 222 47% 8%;
  --foreground: 210 40% 98%;
  --card: 222 47% 11%;
  --border: 217 33% 20%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
}
```

**Результат:** Единая тема, поддержка dark mode.

---

### A-03 · Создать корневой Layout дашборда

**Файл:** `apps/web/app/dashboard/layout.tsx`

**Что реализовать:**
Sidebar + Header + основная область контента. Sidebar фиксированный на десктопе, drawer на мобиле.

**Структура layout:**
```
┌─────────────────────────────────────────┐
│  Header (топ-бар): лого + аватар/меню   │
├──────────┬──────────────────────────────┤
│          │                              │
│ Sidebar  │   {children}                 │
│ (240px)  │   основной контент           │
│          │                              │
│ Nav:     │                              │
│ · Главная│                              │
│ · Задачи │                              │
│ · Покупки│                              │
│ · Заметки│                              │
│ · Семья  │                              │
│          │                              │
└──────────┴──────────────────────────────┘
```

**Компоненты для создания:**
- `components/layout/Sidebar.tsx` — навигация с иконками (lucide-react)
- `components/layout/Header.tsx` — логотип, имя семьи, аватар + dropdown (профиль, выход)
- `components/layout/MobileNav.tsx` — нижняя навигация для мобиле

**Навигационные пункты:**
```typescript
const navItems = [
  { href: '/dashboard',          icon: LayoutDashboard, label: 'Главная'  },
  { href: '/dashboard/tasks',    icon: CheckSquare,     label: 'Задачи'   },
  { href: '/dashboard/shopping', icon: ShoppingCart,    label: 'Покупки'  },
  { href: '/dashboard/notes',    icon: FileText,        label: 'Заметки'  },
  { href: '/dashboard/family',   icon: Users,           label: 'Семья'    },
]
```

**Результат:** Красивый, отзывчивый layout для всех страниц дашборда.

---

### A-04 · Главная страница дашборда — виджет-сетка

**Файл:** `apps/web/app/dashboard/page.tsx`

**Что реализовать:**
Главная страница с виджетами в CSS Grid. Каждый виджет — карточка с заголовком, кратким содержимым и ссылкой "Открыть".

**Сетка:**
```
Десктоп (3 колонки):
┌──────────────┬──────────────┬──────────────┐
│   Задачи     │   Покупки    │   Заметки    │
│  (виджет)    │  (виджет)    │  (виджет)    │
├──────────────┴──────────────┴──────────────┤
│           Участники семьи                   │
└─────────────────────────────────────────────┘

Мобиле (1 колонка): карточки стекаются вертикально
```

**Каждый виджет показывает:**
- Задачи: количество активных + 3 последних задачи со статусом
- Покупки: количество непокупленного + 3 последних пункта
- Заметки: количество заметок + 2 последних с превью текста
- Семья: аватары участников + их роли

**Данные:** Загружать через Server Component из Supabase (пока заглушки если таблиц ещё нет).

---

## ✅ БЛОК B — Модуль Задачи

---

### B-01 · Миграция БД для задач

**Файл:** `supabase/migrations/20260217200000_tasks.sql`

**SQL:**
```sql
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id    UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  created_by   UUID REFERENCES profiles(id),
  assigned_to  UUID REFERENCES family_members(id),
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority     TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date     DATE,
  is_shared    BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Автообновление updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select" ON tasks FOR SELECT
  USING (is_family_member(family_id));

CREATE POLICY "tasks_insert" ON tasks FOR INSERT
  WITH CHECK (is_family_member(family_id));

CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  USING (
    is_family_member(family_id) AND (
      created_by = auth.uid() OR
      is_family_admin(family_id)
    )
  );

CREATE POLICY "tasks_delete" ON tasks FOR DELETE
  USING (
    created_by = auth.uid() OR is_family_admin(family_id)
  );
```

**После создания файла:** `npx supabase db push`

---

### B-02 · Server Actions для задач

**Файл:** `apps/web/lib/actions/tasks.ts`

**Реализовать:**

```typescript
// Получить все задачи семьи (с фильтрами)
export async function getTasksAction(params: {
  status?: 'todo' | 'in_progress' | 'done' | 'all'
  assignedTo?: string
  priority?: 'low' | 'medium' | 'high'
})

// Создать задачу
export async function createTaskAction(data: {
  title: string
  description?: string
  assigned_to?: string   // family_member.id
  priority?: 'low' | 'medium' | 'high'
  due_date?: string
})

// Обновить статус задачи
export async function updateTaskStatusAction(
  taskId: string,
  status: 'todo' | 'in_progress' | 'done'
)

// Обновить задачу полностью
export async function updateTaskAction(taskId: string, data: Partial<Task>)

// Удалить задачу
export async function deleteTaskAction(taskId: string)
```

**Важно:** Каждый action проверяет что пользователь авторизован и является членом семьи (через RLS автоматически, но явно проверять сессию).

---

### B-03 · UI страницы задач

**Файл:** `apps/web/app/dashboard/tasks/page.tsx`

**Что реализовать:**

1. **Заголовок** с кнопкой "Добавить задачу"

2. **Фильтры (горизонтальная полоска):**
    - Статус: Все / Активные / В процессе / Выполненные
    - Приоритет: Все / Высокий / Средний / Низкий
    - Исполнитель: Все / аватары участников семьи

3. **Список задач** — каждая задача:
```
┌─────────────────────────────────────────┐
│ ☐  Купить продукты          [Маша] 🔴   │
│    до 18 фев · Средний приоритет        │
│                              [···] меню │
└─────────────────────────────────────────┘
```
- Чекбокс (клик → статус done)
- Заголовок задачи
- Аватар исполнителя (если назначена)
- Бейдж приоритета (красный/жёлтый/серый)
- Дата дедлайна (красным если просрочена)
- Dropdown меню: Редактировать / Удалить

4. **Dialog "Создать/Редактировать задачу":**
    - Поле: Название (required)
    - Поле: Описание (textarea)
    - Select: Приоритет
    - Select: Назначить на (список участников семьи)
    - DatePicker: Дедлайн
    - Кнопки: Отмена / Сохранить

5. **Пустое состояние** (если задач нет): иллюстрация + текст + кнопка создать

**Компоненты для создания:**
- `components/tasks/TaskItem.tsx`
- `components/tasks/TaskDialog.tsx`
- `components/tasks/TaskFilters.tsx`

---

## 🛒 БЛОК C — Модуль Список покупок

---

### C-01 · Миграция БД для покупок

**Файл:** `supabase/migrations/20260217210000_shopping.sql`

```sql
CREATE TABLE shopping_lists (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  title      TEXT DEFAULT 'Список покупок',
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE shopping_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id     UUID REFERENCES shopping_lists(id) ON DELETE CASCADE NOT NULL,
  added_by    UUID REFERENCES family_members(id),
  checked_by  UUID REFERENCES family_members(id),
  title       TEXT NOT NULL,
  quantity    TEXT,                  -- "2 шт", "1 кг", "500 г"
  category    TEXT,                  -- "Молочное", "Овощи", "Мясо"
  is_checked  BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shopping_lists_all" ON shopping_lists
  USING (is_family_member(family_id))
  WITH CHECK (is_family_member(family_id));

CREATE POLICY "shopping_items_select" ON shopping_items FOR SELECT
  USING (list_id IN (
    SELECT id FROM shopping_lists WHERE is_family_member(family_id)
  ));

CREATE POLICY "shopping_items_insert" ON shopping_items FOR INSERT
  WITH CHECK (list_id IN (
    SELECT id FROM shopping_lists WHERE is_family_member(family_id)
  ));

CREATE POLICY "shopping_items_update" ON shopping_items FOR UPDATE
  USING (list_id IN (
    SELECT id FROM shopping_lists WHERE is_family_member(family_id)
  ));

CREATE POLICY "shopping_items_delete" ON shopping_items FOR DELETE
  USING (list_id IN (
    SELECT id FROM shopping_lists WHERE is_family_member(family_id)
  ));
```

**После:** `npx supabase db push`

---

### C-02 · Real-time список покупок

**Файл:** `apps/web/app/dashboard/shopping/page.tsx`

**Ключевая фича:** изменения видны всем участникам семьи **мгновенно** без перезагрузки страницы.

**Реализация real-time через Supabase:**

```typescript
// hooks/useShoppingList.ts
import { useEffect, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/browser'

export function useShoppingList(listId: string) {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const supabase = createBrowserClient()

  useEffect(() => {
    // Первичная загрузка
    supabase
      .from('shopping_items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at')
      .then(({ data }) => setItems(data ?? []))

    // Подписка на изменения
    const channel = supabase
      .channel(`shopping:${listId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shopping_items',
        filter: `list_id=eq.${listId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT')
          setItems(prev => [...prev, payload.new as ShoppingItem])
        if (payload.eventType === 'UPDATE')
          setItems(prev => prev.map(i => i.id === payload.new.id ? payload.new as ShoppingItem : i))
        if (payload.eventType === 'DELETE')
          setItems(prev => prev.filter(i => i.id !== payload.old.id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [listId])

  return { items }
}
```

**UI страницы:**

1. **Добавить товар** — input в топе страницы (Enter для добавления)
    - Поле: название товара
    - Поле: количество (опционально)
    - Select: категория (опционально)

2. **Список товаров** — сгруппированный по категориям:
```
🥛 Молочное
  ☐ Молоко 1л
  ☐ Творог 200г
  ✅ ~~Сыр~~ (зачёркнуто, добавил: Папа)

🥦 Овощи
  ☐ Помидоры 1кг
```

3. **Кнопка "Очистить купленное"** — удаляет все checked items

4. **Индикатор онлайн** — показывает сколько участников сейчас смотрят список (опционально, nice-to-have)

**Компоненты:**
- `components/shopping/ShoppingItem.tsx`
- `components/shopping/AddItemForm.tsx`
- `hooks/useShoppingList.ts`

---

## 📝 БЛОК D — Модуль Заметки

---

### D-01 · Миграция БД для заметок

**Файл:** `supabase/migrations/20260217220000_notes.sql`

```sql
CREATE TABLE notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID REFERENCES families(id) ON DELETE CASCADE NOT NULL,
  created_by  UUID REFERENCES profiles(id),
  title       TEXT NOT NULL,
  content     TEXT,              -- markdown
  is_shared   BOOLEAN DEFAULT false,
  pinned      BOOLEAN DEFAULT false,
  color       TEXT DEFAULT '#ffffff',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Видит заметку: если она общая (is_shared) ИЛИ ты её создал
CREATE POLICY "notes_select" ON notes FOR SELECT
  USING (
    is_family_member(family_id) AND (
      is_shared = true OR created_by = auth.uid()
    )
  );

CREATE POLICY "notes_insert" ON notes FOR INSERT
  WITH CHECK (is_family_member(family_id));

CREATE POLICY "notes_update" ON notes FOR UPDATE
  USING (created_by = auth.uid() OR is_family_admin(family_id));

CREATE POLICY "notes_delete" ON notes FOR DELETE
  USING (created_by = auth.uid() OR is_family_admin(family_id));
```

**После:** `npx supabase db push`

---

### D-02 · UI страницы заметок

**Файл:** `apps/web/app/dashboard/notes/page.tsx`

**Что реализовать:**

1. **Два таба:** "Мои заметки" / "Общие"

2. **Сетка карточек** (как Google Keep):
```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ 📌 Рецепт   │ │ Список дел  │ │  Идеи       │
│ борща        │ │             │ │             │
│              │ │ · Позвонить │ │ Текст       │
│ Текст...     │ │ · Купить... │ │ заметки...  │
│              │ │             │ │             │
│   👁 Общая  │ │             │ │  Личная     │
└──────────────┘ └──────────────┘ └──────────────┘
```
- Цветной фон карточки (из поля `color`)
- Иконка 📌 если pinned
- Превью текста (первые 100 символов)
- Бейдж "Общая" / "Личная"
- Hover: кнопки редактировать / удалить

3. **Кнопка "Создать заметку"** → открывает полноэкранный редактор

4. **Редактор заметки** (отдельная страница `/dashboard/notes/[id]`):
    - Поле заголовка (крупный текст)
    - Textarea для контента (с поддержкой markdown — библиотека `react-markdown`)
    - Toggle: Личная / Общая
    - Toggle: Закрепить
    - Color picker (8 пастельных цветов)
    - Автосохранение через debounce (1 сек после последнего изменения)

**Компоненты:**
- `components/notes/NoteCard.tsx`
- `components/notes/NoteEditor.tsx`
- `components/notes/ColorPicker.tsx`

---

## 👨‍👩‍👧 БЛОК E — Страница Семья (рефакторинг)

---

### E-01 · Переделать страницу /dashboard в /dashboard/family

**Файл:** `apps/web/app/dashboard/family/page.tsx`

**Что сделать:**
Перенести текущий функционал дашборда (управление инвайтами, список участников) на отдельную страницу `/dashboard/family`. Текущий `/dashboard/page.tsx` становится виджет-сеткой (задача A-04).

**UI страницы семьи:**

1. **Секция "Участники"** — карточки участников:
```
┌─────────────────────────────┐
│  👤  Иван Иванов            │
│      Папа · Admin           │
│      ivan@mail.com          │
│                   [Изменить]│
└─────────────────────────────┘
```
- Аватар (инициалы если нет фото)
- Имя + nickname + роль + email
- Цветной индикатор (из `family_members.color`)
- Для admin: кнопка изменить роль

2. **Секция "Приглашения"** — текущий UI из dashboard (перенести без изменений)

3. **Секция "Настройки семьи"** (только для admin):
    - Изменить название семьи
    - Тариф (Free/Premium/Family+) с кнопкой "Обновить"

---

## 🔧 БЛОК F — Технические задачи

---

### F-01 · TypeScript типы для всех таблиц

**Файл:** `packages/types/src/database.ts`

Сгенерировать типы из Supabase:
```bash
npx supabase gen types typescript --project-id sadibgrhgljcpbotumfu > packages/types/src/database.ts
```

Затем создать удобные алиасы:
```typescript
// packages/types/src/index.ts
import type { Database } from './database'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Family = Database['public']['Tables']['families']['Row']
export type FamilyMember = Database['public']['Tables']['family_members']['Row']
export type FamilyInvite = Database['public']['Tables']['family_invites']['Row']
export type Task = Database['public']['Tables']['tasks']['Row']
export type ShoppingList = Database['public']['Tables']['shopping_lists']['Row']
export type ShoppingItem = Database['public']['Tables']['shopping_items']['Row']
export type Note = Database['public']['Tables']['notes']['Row']
```

---

### F-02 · Хук useFamily — текущая семья в контексте

**Файл:** `apps/web/lib/hooks/useFamily.ts`

```typescript
// Возвращает данные текущей семьи и участников
// Используется во всех виджетах для получения family_id
export function useFamily() {
  // family, members, currentMember, isAdmin
}
```

Реализовать через React Context (`FamilyProvider`) который оборачивает `dashboard/layout.tsx`. Данные загружаются один раз при маунте layout'а.

---

### F-03 · Toast-уведомления

**Файл:** `apps/web/components/providers/ToastProvider.tsx`

Подключить shadcn/ui `Sonner` для красивых уведомлений. Использовать во всех actions:
- ✅ "Задача создана"
- ✅ "Товар добавлен в список"
- ❌ "Ошибка при сохранении"
- ℹ️ "Приглашение отправлено на email@example.com"

---

## 📋 Порядок выполнения

```
A-01 → A-02 → A-03     # сначала дизайн-система
    ↓
F-01 → F-02 → F-03     # потом типы и хуки (нужны всем модулям)
    ↓
B-01 → B-02 → B-03     # задачи
    ↓
C-01 → C-02            # покупки (real-time)
    ↓
D-01 → D-02            # заметки
    ↓
E-01                   # рефакторинг страницы семьи
    ↓
A-04                   # главная с виджетами (последней — нужны данные)
```

---

## ✅ Definition of Done для спринта

- [x] `npm run check-types -w web` — 0 ошибок
- [x] `npm run lint -w web` — 0 ошибок
- [x] Все миграции применены: `local == remote`
- [x] Задачи: создать, назначить, изменить статус, удалить
- [x] Покупки: добавить, отметить, удалить — real-time между вкладками
- [x] Заметки: создать личную и общую, редактировать, удалить
- [x] Дашборд: виджет-сетка показывает данные из всех модулей
- [x] Layout: sidebar + header работает на десктопе и мобиле
- [x] Dark mode работает

### Примечание по smoke-test (2026-02-17)
- Автоматический CRUD smoke для `tasks`, `shopping`, `notes` выполнен через Supabase API (service role) с setup/teardown тестовой семьи.
- Для realtime добавлена миграция `20260217223000_shopping_realtime.sql` (публикация `shopping_items` в `supabase_realtime`).
- CLI-подписка в node-runtime закрывается со статусом `CLOSED`, поэтому финальная пользовательская проверка realtime остаётся браузерной (2 вкладки `/dashboard/shopping`).

---

*После завершения спринта обновить ARCHITECTURE.md — отметить выполненные пункты роадмапа.*
