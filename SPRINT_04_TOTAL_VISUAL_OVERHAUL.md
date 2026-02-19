# PersonalHub — Sprint 04: Total Visual Overhaul
> **Для:** Cursor AI Agent  
> **Цель:** Довести ВЕСЬ интерфейс до уровня страницы входа — красиво, с дыханием, продуманно  
> **Философия:** Каждый пиксель имеет значение. Каждый отступ обоснован. Каждая анимация уместна.

---

## 🎨 ВИЗУАЛЬНЫЙ ЯЗЫК ПРОЕКТА (bible — соблюдать везде)

### Цвета (точные значения)
```css
--bg-primary:    #080809    /* основной фон */
--bg-elevated:   #0f0f11    /* карточки, sidebar */
--bg-elevated-2: #1a1a1e    /* hover состояния */
--border:        rgba(255,255,255,0.06)   /* дефолтные границы */
--border-hover:  rgba(255,255,255,0.12)   /* hover границы */
--text:          #f0f0f2    /* основной текст */
--text-muted:    rgba(240,240,242,0.45)   /* вторичный текст */
--text-dim:      rgba(240,240,242,0.25)   /* tertiary текст */

/* Акценты модулей */
--tasks:      #6366f1   /* indigo */
--shopping:   #10b981   /* emerald */
--notes:      #f59e0b   /* amber */
--calendar:   #8b5cf6   /* violet */
--finances:   #06b6d4   /* cyan */
--wishlists:  #ec4899   /* pink */
--family:     #f43f5e   /* rose */

/* Градиент кнопок */
--primary-gradient: linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)
```

### Типографика
```
Семейства:
- Display (заголовки):  'Instrument Serif', Georgia, serif
- UI (интерфейс):       'Geist', -apple-system, sans-serif
- Mono (код):           'Geist Mono', monospace

Размеры:
  Hero title:         48px (3rem)     font-weight: 400  letter-spacing: -0.03em
  Page title:         24px (1.5rem)   font-weight: 600  letter-spacing: -0.02em
  Section title:      18px (1.125rem) font-weight: 600  letter-spacing: -0.01em
  Card title:         14px (0.875rem) font-weight: 500
  Body:               14px (0.875rem) font-weight: 400
  Caption:            12px (0.75rem)  font-weight: 400  opacity: 0.45
  Tiny:               11px (0.6875rem)

Межстрочный интервал:
  Заголовки:  1.15 (tight)
  Body:       1.5 (relaxed)
```

### Spacing System (8px base)
```
0.5 =  4px   (тесные элементы)
1   =  8px   (иконка + текст)
2   = 16px   (между элементами)
3   = 24px   (секции внутри карточки)
4   = 32px   (между карточками)
6   = 48px   (между крупными секциями)
8   = 64px   (hero разделы)
```

### Border Radius
```
sm:  6px     (мелкие бейджи, теги)
md:  9px     (инпуты, кнопки)
lg:  12px    (карточки)
xl:  16px    (модальные окна, крупные карточки)
2xl: 20px    (hero секции)
```

### Shadows & Glows
```
Card shadow:
  default: none
  hover:   0 4px 12px rgba(0,0,0,0.3)

Button glow:
  default: 0 0 24px rgba(99,102,241,0.25)
  hover:   0 4px 28px rgba(99,102,241,0.35)

Radial glow (фон):
  radial-gradient(circle 500px at 50% 200%, rgba(99,102,241,0.08), transparent)
```

### Transitions
```
Стандарт: transition-all duration-150 ease-out
Hover элементов: duration-200
Модальные окна: duration-300
Никогда не использовать ease-in или linear
```

---

## 📐 LAYOUT — Базовые правила для КАЖДОЙ страницы

### Container Padding
```tsx
// Десктоп
<main className="p-8 lg:p-12">

// Мобиле
<main className="p-4 sm:p-6">

// Max-width контейнера
<div className="max-w-7xl mx-auto">
```

### Page Header (стандарт для всех страниц)
```tsx
<div className="flex items-center justify-between mb-8">
  <div className="flex items-center gap-4">
    {/* Иконка модуля в цветном контейнере */}
    <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20
                    flex items-center justify-center">
      <CheckSquare className="h-6 w-6 text-indigo-400" />
    </div>
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Задачи
      </h1>
      <p className="text-sm text-white/40 mt-0.5">
        3 активных · 1 просрочена
      </p>
    </div>
  </div>
  {/* Action кнопка справа */}
  <Button>
    <Plus className="h-4 w-4 mr-2" />
    Добавить
  </Button>
</div>
```

### Card Standard
```tsx
<div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5
                hover:bg-white/[0.04] hover:border-white/[0.10]
                hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]
                transition-all duration-200">
  {/* content */}
</div>
```

### Empty State Standard
```tsx
<div className="flex flex-col items-center justify-center py-24 text-center">
  <div className="relative mb-6">
    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-600/10
                    border border-indigo-500/10 flex items-center justify-center mx-auto">
      <Icon className="h-9 w-9 text-indigo-400/50" />
    </div>
    {/* Декоративные точки */}
    <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-indigo-500/30" />
    <div className="absolute -bottom-1.5 -left-1.5 h-2 w-2 rounded-full bg-violet-500/30" />
  </div>
  <h3 className="text-lg font-semibold text-white mb-2">
    Заголовок
  </h3>
  <p className="text-sm text-white/40 max-w-sm leading-relaxed mb-6">
    Описание пустого состояния
  </p>
  <Button>Действие</Button>
</div>
```

---

## 🛠️ КОМПОНЕНТЫ — Стандарты

### Button
```tsx
// Primary (градиент)
<button className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600
                   hover:from-indigo-400 hover:to-violet-500
                   text-white text-sm font-medium rounded-lg
                   shadow-[0_0_24px_rgba(99,102,241,0.25)]
                   hover:shadow-[0_4px_28px_rgba(99,102,241,0.35)]
                   hover:-translate-y-px
                   transition-all duration-150">

// Secondary
<button className="px-4 py-2.5 bg-white/[0.05] border border-white/[0.10]
                   hover:bg-white/[0.08] hover:border-white/[0.15]
                   text-white text-sm font-medium rounded-lg
                   transition-all duration-150">

// Ghost
<button className="px-4 py-2.5 hover:bg-white/[0.05]
                   text-white/70 hover:text-white
                   text-sm font-medium rounded-lg
                   transition-all duration-150">
```

### Input
```tsx
<input className="w-full px-4 py-3 bg-[#0f0f11] border border-white/[0.07]
                  rounded-lg text-sm text-white placeholder:text-white/20
                  hover:border-white/[0.12] hover:bg-[#141416]
                  focus:border-indigo-500/50 focus:bg-[#141416]
                  focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]
                  outline-none transition-all duration-150" />
```

### Badge
```tsx
// Статус
<span className="inline-flex items-center gap-1.5 px-2.5 py-1
                 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20
                 rounded-md text-xs font-medium">
  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
  Выполнено
</span>

// Приоритет
<span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20
                 rounded text-[11px] font-medium uppercase tracking-wide">
  Высокий
</span>
```

---

## 🎯 ЗАДАЧИ ПО ЭКРАНАМ

### TASK 1 — Sidebar

**Файл:** `components/layout/Sidebar.tsx`

**Проблемы:**
- Не видно градиентного свечения снизу
- Лого обрезан/мелкий
- Нижние теги не на месте

**Исправить:**
```tsx
<aside className="fixed left-0 top-0 h-full w-60 bg-[#0f0f11] border-r border-white/[0.06]
                  flex flex-col z-30 hidden md:flex overflow-hidden">
  
  {/* Радиальное свечение снизу */}
  <div className="absolute -bottom-32 -left-20 w-[500px] h-[500px] rounded-full
                  bg-indigo-600/[0.08] blur-3xl pointer-events-none" />

  {/* Лого */}
  <div className="relative h-16 flex items-center px-5 border-b border-white/[0.06] shrink-0">
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-[9px] bg-gradient-to-br from-indigo-500 to-violet-600
                      flex items-center justify-center text-white text-xs font-bold
                      shadow-[0_0_20px_rgba(99,102,241,0.3)]">
        P
      </div>
      <span className="text-[15px] font-semibold text-white tracking-tight">
        PersonalHub
      </span>
    </div>
  </div>

  {/* Навигация */}
  <nav className="relative flex-1 px-3 py-4 space-y-1 overflow-y-auto">
    {/* items */}
  </nav>

  {/* Теги внизу */}
  <div className="relative h-14 border-t border-white/[0.06] px-5 flex items-center shrink-0">
    <span className="text-[11px] text-white/20 font-medium tracking-wide">v0.5 · Sprint 04</span>
  </div>
</aside>
```

---

### TASK 2 — Главная страница (Dashboard)

**Файл:** `app/dashboard/page.tsx`

**Проблемы:**
- Виджеты плоские, без глубины
- Нет hover эффектов
- Счётчики не выделены
- Нет иконок модулей

**Переделать виджет:**
```tsx
<div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5
                hover:bg-white/[0.04] hover:border-white/[0.10]
                hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]
                transition-all duration-200 group">
  
  {/* Header виджета */}
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20
                      flex items-center justify-center">
        <CheckSquare className="h-4.5 w-4.5 text-indigo-400" />
      </div>
      <div>
        <h3 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-0.5">
          Задачи
        </h3>
        <p className="text-2xl font-bold text-white tabular-nums">
          12
        </p>
      </div>
    </div>
    <Link href="/dashboard/tasks">
      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="h-4 w-4" />
      </Button>
    </Link>
  </div>

  {/* Preview items */}
  <div className="space-y-2">
    {tasks.slice(0, 3).map(task => (
      <div key={task.id} className="flex items-center gap-2 py-1.5">
        <Checkbox checked={task.status === 'done'} className="h-3.5 w-3.5" />
        <span className="text-xs text-white/70 truncate">{task.title}</span>
      </div>
    ))}
  </div>

  {/* Footer с ссылкой */}
  <Link href="/dashboard/tasks"
        className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between
                   text-xs text-white/40 hover:text-white/70 transition-colors">
    <span>Смотреть все</span>
    <ArrowRight className="h-3 w-3" />
  </Link>
</div>
```

---

### TASK 3 — Страница задач

**Файл:** `app/dashboard/tasks/page.tsx`

**Проблемы:**
- TaskItem'ы без hover
- Фильтры не выделяются
- Нет разделения на секции

**Исправить:**

1. **Page header** по стандарту (см. выше)

2. **Фильтры:**
```tsx
<div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/[0.06]">
  <ToggleGroup value={statusFilter} onValueChange={setStatusFilter}>
    {['all', 'active', 'done'].map(status => (
      <ToggleGroupItem key={status} value={status}
                       className="px-4 py-2 text-xs font-medium
                                  data-[state=on]:bg-white/[0.08] data-[state=on]:text-white">
        {statusLabels[status]}
      </ToggleGroupItem>
    ))}
  </ToggleGroup>
</div>
```

3. **Task Item:**
```tsx
<div className="group flex items-start gap-3 p-3.5 rounded-lg
                bg-white/[0.02] border border-white/[0.06]
                hover:bg-white/[0.04] hover:border-white/[0.10]
                transition-all duration-150">
  
  <Checkbox checked={task.status === 'done'}
            className="mt-0.5 shrink-0 h-4.5 w-4.5" />
  
  <div className="flex-1 min-w-0">
    <p className={cn("text-sm font-medium text-white mb-1 truncate",
                     task.status === 'done' && "line-through text-white/40")}>
      {task.title}
    </p>
    <div className="flex items-center gap-2 text-xs text-white/30">
      {task.due_date && (
        <span className={isPast(task.due_date) ? "text-rose-400" : ""}>
          {formatDate(task.due_date)}
        </span>
      )}
      {task.assigned && (
        <span>· {task.assigned.nickname}</span>
      )}
    </div>
  </div>

  <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
    <Badge priority={task.priority} />
    <DropdownMenu>...</DropdownMenu>
  </div>
</div>
```

---

### TASK 4 — Список покупок

**Файл:** `app/dashboard/shopping/page.tsx`

**Проблемы:**
- Input добавления не выделен
- Items без анимации зачёркивания
- Нет группировки

**Исправить:**

1. **Prominent input:**
```tsx
<div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4 mb-6
                focus-within:border-indigo-500/30 focus-within:bg-white/[0.04]
                transition-all duration-150">
  <div className="flex items-center gap-3">
    <ShoppingCart className="h-5 w-5 text-emerald-400 shrink-0" />
    <input
      placeholder="Добавить в список... (Enter для сохранения)"
      className="flex-1 bg-transparent border-0 text-sm text-white
                 placeholder:text-white/25 outline-none"
      onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
    />
    <Button size="sm" variant="ghost">
      <Plus className="h-4 w-4" />
    </Button>
  </div>
</div>
```

2. **Item с анимацией:**
```tsx
<div className={cn(
  "flex items-center gap-3 py-2.5 group",
  item.is_checked && "opacity-50"
)}>
  <Checkbox
    checked={item.is_checked}
    className="shrink-0"
  />
  <span className={cn(
    "flex-1 text-sm transition-all duration-200",
    item.is_checked && "line-through text-white/40"
  )}>
    {item.title}
  </span>
  {item.quantity && (
    <span className="text-xs text-white/30">{item.quantity}</span>
  )}
</div>

/* CSS для анимации зачёркивания */
@keyframes strikethrough {
  from { text-decoration-color: transparent; }
  to   { text-decoration-color: currentColor; }
}
.line-through {
  animation: strikethrough 0.3s ease-out;
}
```

---

### TASK 5 — Заметки

**Файл:** `app/dashboard/notes/page.tsx`

**Проблемы:**
- Карточки без hover lift
- Масonry может быть кривым
- Кнопки редактирования всегда видны

**Исправить:**
```tsx
<div className="group relative p-4 rounded-xl border border-white/[0.07]
                hover:border-white/[0.10] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]
                hover:-translate-y-0.5
                transition-all duration-200 cursor-pointer"
     style={{ backgroundColor: note.color || 'rgba(255,255,255,0.03)' }}>
  
  {/* Кнопки появляются при hover */}
  <div className="absolute top-2 right-2 flex gap-1
                  opacity-0 group-hover:opacity-100 transition-opacity">
    <Button size="icon" variant="ghost" className="h-7 w-7">
      <Pencil className="h-3.5 w-3.5" />
    </Button>
    <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-400">
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  </div>

  {note.pinned && (
    <Pin className="h-3.5 w-3.5 text-amber-400 mb-2" />
  )}
  
  <h3 className="text-sm font-medium text-white mb-2 pr-16">
    {note.title}
  </h3>
  
  <p className="text-xs text-white/50 line-clamp-4 leading-relaxed">
    {note.content}
  </p>
</div>
```

---

### TASK 6 — Календарь

**Файл:** `app/dashboard/calendar/page.tsx`

**Что добавить:**
- Более чёткие границы дней
- Hover на днях
- События с цветными точками
- Сегодняшний день выделен кольцом

```tsx
{/* День в календаре */}
<div className={cn(
  "h-24 p-2 border border-white/[0.06]",
  "hover:bg-white/[0.02] transition-colors cursor-pointer",
  isToday && "ring-2 ring-indigo-500/30 ring-inset"
)}>
  <span className={cn(
    "text-xs font-medium",
    isToday ? "text-indigo-400" : "text-white/70"
  )}>
    {day}
  </span>
  {/* События */}
  <div className="mt-1 space-y-1">
    {events.slice(0, 2).map(e => (
      <div key={e.id}
           className="text-[10px] px-1.5 py-0.5 rounded truncate"
           style={{ backgroundColor: `${e.color}20`, color: e.color }}>
        {e.title}
      </div>
    ))}
    {events.length > 2 && (
      <span className="text-[9px] text-white/30 px-1.5">
        +{events.length - 2} ещё
      </span>
    )}
  </div>
</div>
```

---

### TASK 7 — Финансы

**Файл:** `app/dashboard/finances/page.tsx`

**Что добавить:**
- Summary cards с градиентами
- Анимация прогресс-баров
- Доход/расход с цветными иконками

```tsx
{/* Summary Card */}
<div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5">
  <div className="flex items-center gap-3 mb-4">
    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20
                    flex items-center justify-center">
      <TrendingUp className="h-5 w-5 text-emerald-400" />
    </div>
    <div>
      <p className="text-xs text-white/40 uppercase tracking-wider">Доходы</p>
      <p className="text-2xl font-bold text-emerald-400 tabular-nums">
        +{formatMoney(income)}
      </p>
    </div>
  </div>
  <p className="text-xs text-white/30">
    +12% к прошлому месяцу
  </p>
</div>
```

---

### TASK 8 — Вишлисты

**Файл:** `app/dashboard/wishlists/page.tsx`

**Что добавить:**
- Карточки как в Pinterest
- Кнопка "Подарю я" с анимацией
- Reserved состояние с замочком

```tsx
{/* Wishlist Item Card */}
<div className="group relative rounded-xl overflow-hidden
                bg-white/[0.03] border border-white/[0.07]
                hover:border-white/[0.10] hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)]
                transition-all duration-200">
  
  {/* Изображение или placeholder */}
  <div className="aspect-square bg-white/[0.02] flex items-center justify-center">
    {item.image_url ? (
      <img src={item.image_url} className="w-full h-full object-cover" />
    ) : (
      <Gift className="h-12 w-12 text-white/10" />
    )}
  </div>

  {/* Reserved overlay */}
  {item.is_reserved && !isOwner && (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm
                    flex items-center justify-center">
      <div className="text-center">
        <Lock className="h-6 w-6 mx-auto mb-2 text-white/60" />
        <p className="text-xs font-medium text-white/80">Уже забронировано</p>
      </div>
    </div>
  )}

  <div className="p-3">
    <p className="text-sm font-medium text-white truncate mb-1">
      {item.title}
    </p>
    {item.price && (
      <p className="text-lg font-bold text-pink-400">
        {formatMoney(item.price)}
      </p>
    )}

    {!isOwner && !item.is_reserved && (
      <Button size="sm" className="w-full mt-2 text-xs">
        🎁 Подарю я
      </Button>
    )}
  </div>
</div>
```

---

### TASK 9 — Семья (onboarding + список)

**Файл:** `app/dashboard/family/page.tsx`

**Onboarding форма уже красивая из прошлого спринта — оставить как есть.**

**Список участников:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {members.map(member => (
    <div key={member.id}
         className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-5
                    hover:border-white/[0.10] transition-all duration-150">
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 shrink-0">
          <AvatarFallback className="bg-indigo-600 text-white font-semibold">
            {getInitials(member.full_name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {member.full_name}
          </p>
          {member.nickname && (
            <p className="text-xs text-white/40">{member.nickname}</p>
          )}
          <Badge variant="outline" className="mt-2 text-[10px]">
            {member.role}
          </Badge>
        </div>
      </div>
    </div>
  ))}
</div>
```

---

## ✅ Порядок выполнения

```
TASK 1 → Sidebar
TASK 2 → Главная (виджеты)
TASK 3 → Задачи
TASK 4 → Покупки
TASK 5 → Заметки
TASK 6 → Календарь
TASK 7 → Финансы
TASK 8 → Вишлисты
TASK 9 → Семья
```

После каждой задачи:
- `npm run check-types -w web`
- `npm run lint -w web`
- Открыть в браузере, проверить визуально

---

## ✅ Definition of Done Sprint 04

- [ ] Все страницы имеют page header по стандарту
- [ ] Все карточки имеют hover эффекты
- [ ] Все empty states оформлены красиво
- [ ] Sidebar с градиентным свечением и правильными отступами
- [ ] Виджеты на главной с иконками, счётчиками, hover
- [ ] Задачи: группировка, hover items, анимированные чекбоксы
- [ ] Покупки: prominent input, анимация зачёркивания
- [ ] Заметки: hover lift, кнопки при hover
- [ ] Календарь: выделение today, цветные события
- [ ] Финансы: градиентные summary cards, анимированные бары
- [ ] Вишлисты: Pinterest-style grid, reserved overlay
- [ ] Семья: красивые карточки участников
- [ ] Нет визуальных багов на мобиле
- [ ] Dark mode работает идеально
- [ ] Нигде нет отсутствующих отступов

---

*После завершения — обновить ARCHITECTURE.md до v0.6 и создать SPRINT_04_CHANGELOG.md*
