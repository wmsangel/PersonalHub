# PersonalHub — AUTH PAGE Redesign
> **Для:** Cursor AI Agent  
> **Файл:** `apps/web/app/auth/page.tsx`  
> **Задача:** Полностью переписать страницу входа/регистрации  
> **Проверка:** `npm run check-types -w web` + `npm run lint -w web`

---

## Что исправить

Текущие проблемы:
- Весь контент без отступов, прижат к краям
- Поля ввода без padding и стилей
- Нет label над полями
- Кнопка не выделяется
- Нет "Забыли пароль?"
- Нет Google OAuth кнопки
- Индикатор "Connected" — просто текст без стиля
- Форма регистрации — дублирует те же проблемы

---

## Полный код — переписать файл целиком

```tsx
'use client'

import { useState } from 'react'
import { signInAction, signUpAction } from '@/actions'
import { cn } from '@/lib/utils'

export default function AuthPage() {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn(formData: FormData) {
    setLoading(true)
    setError(null)
    try {
      await signInAction(formData)
    } catch (e: any) {
      setError(e.message ?? 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(formData: FormData) {
    setLoading(true)
    setError(null)
    try {
      await signUpAction(formData)
    } catch (e: any) {
      setError(e.message ?? 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#080809]">

      {/* ── Левая панель ───────────────────────────── */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-[#0f0f11]
                      border-r border-white/[0.06] relative overflow-hidden">

        {/* Сетка на фоне */}
        <div className="absolute inset-0 pointer-events-none"
             style={{
               backgroundImage: `
                 linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                 linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
               `,
               backgroundSize: '48px 48px'
             }} />

        {/* Свечение снизу */}
        <div className="absolute -bottom-32 -left-20 w-[500px] h-[500px] rounded-full
                        bg-indigo-600/[0.08] blur-3xl pointer-events-none" />

        <div className="relative z-10">

          {/* Лого */}
          <div className="flex items-center gap-2.5 mb-16">
            <div className="h-8 w-8 rounded-[9px] bg-gradient-to-br from-indigo-500 to-violet-600
                            flex items-center justify-center text-white text-xs font-bold
                            shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              P
            </div>
            <span className="text-[15px] font-semibold text-white tracking-tight">
              PersonalHub
            </span>
          </div>

          {/* Лейбл */}
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1.5
                          bg-cyan-500/[0.08] border border-cyan-500/[0.15] rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[11px] font-medium text-cyan-400 tracking-widest uppercase">
              Семейный органайзер
            </span>
          </div>

          {/* Заголовок */}
          <h1 className="text-[42px] font-semibold leading-[1.12] tracking-[-0.03em]
                         text-white mb-5"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>
            Все договорённости<br />
            <span className="text-white/45 italic">семьи в одном месте</span>
          </h1>

          <p className="text-[14px] leading-relaxed text-white/45 max-w-[340px] mb-10">
            Согласовывайте планы, делегируйте задачи и ведите
            общие списки — без хаоса в мессенджерах.
          </p>

          {/* Фичи */}
          <div className="space-y-2.5">
            {[
              { icon: '👥', title: 'Роли и доступ',           desc: 'Гибкое управление правами для каждого участника' },
              { icon: '⚡', title: 'Realtime синхронизация',   desc: 'Списки и задачи обновляются мгновенно у всех'   },
              { icon: '🔒', title: 'Безопасность в БД',        desc: 'RLS-политики изолируют данные между семьями'    },
            ].map(f => (
              <div key={f.title}
                   className="flex items-start gap-3 p-3.5 rounded-xl
                              bg-white/[0.02] border border-white/[0.06]
                              hover:bg-white/[0.035] hover:border-white/[0.10]
                              transition-all duration-200">
                <span className="text-base mt-0.5 shrink-0">{f.icon}</span>
                <div>
                  <p className="text-[13px] font-medium text-white mb-0.5">{f.title}</p>
                  <p className="text-[12px] text-white/30 leading-snug">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Нижние теги */}
        <div className="relative z-10 flex gap-2 flex-wrap">
          {['Supabase', 'Next.js 15', 'Realtime', 'TypeScript'].map(t => (
            <span key={t}
                  className="text-[11px] font-medium text-white/25 px-2.5 py-1
                             bg-white/[0.03] border border-white/[0.06] rounded-md
                             tracking-wide">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* ── Правая панель — форма ───────────────────── */}
      <div className="flex items-center justify-center p-8 md:p-12 bg-[#080809]">
        <div className="w-full max-w-[380px]">

          {/* Табы */}
          <div className="flex gap-1 p-1 bg-[#0f0f11] border border-white/[0.07]
                          rounded-xl mb-8">
            {(['signin', 'signup'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null) }}
                className={cn(
                  'flex-1 py-2.5 text-[13px] font-medium rounded-[9px] transition-all duration-150',
                  tab === t
                    ? 'bg-[#1a1a1e] text-white shadow-sm'
                    : 'text-white/35 hover:text-white/60'
                )}
              >
                {t === 'signin' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          {/* Форма входа */}
          {tab === 'signin' && (
            <form action={handleSignIn} className="space-y-0">
              <div className="mb-7">
                <h2 className="text-[22px] font-semibold text-white tracking-tight mb-1.5">
                  С возвращением
                </h2>
                <p className="text-[13px] text-white/30 leading-relaxed">
                  Войдите, чтобы продолжить работу<br />с семейным пространством
                </p>
              </div>

              {/* Email */}
              <div className="mb-3.5">
                <label className="block text-[12px] font-medium text-white/45 mb-2 tracking-wide">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="ivan@example.com"
                  required
                  className="w-full px-4 py-3 bg-[#0f0f11] border border-white/[0.07]
                             rounded-[10px] text-[14px] text-white
                             placeholder:text-white/20
                             hover:border-white/[0.12] hover:bg-[#141416]
                             focus:border-indigo-500/50 focus:bg-[#141416]
                             focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]
                             outline-none transition-all duration-150"
                />
              </div>

              {/* Пароль */}
              <div className="mb-2">
                <label className="block text-[12px] font-medium text-white/45 mb-2 tracking-wide">
                  Пароль
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••••"
                  required
                  className="w-full px-4 py-3 bg-[#0f0f11] border border-white/[0.07]
                             rounded-[10px] text-[14px] text-white
                             placeholder:text-white/20
                             hover:border-white/[0.12] hover:bg-[#141416]
                             focus:border-indigo-500/50 focus:bg-[#141416]
                             focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]
                             outline-none transition-all duration-150"
                />
              </div>

              {/* Забыли пароль */}
              <div className="flex justify-end mb-6">
                <button type="button"
                        className="text-[12px] text-white/25 hover:text-white/50 transition-colors">
                  Забыли пароль?
                </button>
              </div>

              {/* Ошибка */}
              {error && (
                <div className="mb-4 px-4 py-3 bg-rose-500/[0.08] border border-rose-500/20
                                rounded-[10px] text-[13px] text-rose-400">
                  {error}
                </div>
              )}

              {/* Кнопка входа */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600
                           hover:from-indigo-400 hover:to-violet-500
                           text-white text-[14px] font-semibold rounded-[10px]
                           shadow-[0_0_24px_rgba(99,102,241,0.25)]
                           hover:shadow-[0_4px_28px_rgba(99,102,241,0.35)]
                           hover:-translate-y-px
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-150 mb-5"
              >
                {loading ? 'Входим...' : 'Войти в аккаунт'}
              </button>

              {/* Разделитель */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[11px] text-white/20 tracking-wider">или</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Google */}
              <button
                type="button"
                className="w-full py-3 bg-[#0f0f11] border border-white/[0.07]
                           hover:bg-[#141416] hover:border-white/[0.12]
                           text-white/50 hover:text-white/80
                           text-[13px] font-medium rounded-[10px]
                           flex items-center justify-center gap-2.5
                           transition-all duration-150 mb-6"
              >
                {/* Google SVG */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Продолжить с Google
              </button>

              {/* Статус */}
              <div className="flex items-center justify-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-white/20">Supabase подключён</span>
              </div>
            </form>
          )}

          {/* Форма регистрации */}
          {tab === 'signup' && (
            <form action={handleSignUp} className="space-y-0">
              <div className="mb-7">
                <h2 className="text-[22px] font-semibold text-white tracking-tight mb-1.5">
                  Создать аккаунт
                </h2>
                <p className="text-[13px] text-white/30 leading-relaxed">
                  Зарегистрируйтесь, чтобы создать<br />семейное пространство
                </p>
              </div>

              <div className="mb-3.5">
                <label className="block text-[12px] font-medium text-white/45 mb-2 tracking-wide">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  placeholder="ivan@example.com"
                  required
                  className="w-full px-4 py-3 bg-[#0f0f11] border border-white/[0.07]
                             rounded-[10px] text-[14px] text-white
                             placeholder:text-white/20
                             hover:border-white/[0.12] hover:bg-[#141416]
                             focus:border-indigo-500/50 focus:bg-[#141416]
                             focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]
                             outline-none transition-all duration-150"
                />
              </div>

              <div className="mb-3.5">
                <label className="block text-[12px] font-medium text-white/45 mb-2 tracking-wide">
                  Пароль
                </label>
                <input
                  name="password"
                  type="password"
                  placeholder="Минимум 8 символов"
                  required
                  className="w-full px-4 py-3 bg-[#0f0f11] border border-white/[0.07]
                             rounded-[10px] text-[14px] text-white
                             placeholder:text-white/20
                             hover:border-white/[0.12] hover:bg-[#141416]
                             focus:border-indigo-500/50 focus:bg-[#141416]
                             focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]
                             outline-none transition-all duration-150"
                />
              </div>

              <div className="mb-6">
                <label className="block text-[12px] font-medium text-white/45 mb-2 tracking-wide">
                  Повторите пароль
                </label>
                <input
                  name="confirm_password"
                  type="password"
                  placeholder="••••••••••"
                  required
                  className="w-full px-4 py-3 bg-[#0f0f11] border border-white/[0.07]
                             rounded-[10px] text-[14px] text-white
                             placeholder:text-white/20
                             hover:border-white/[0.12] hover:bg-[#141416]
                             focus:border-indigo-500/50 focus:bg-[#141416]
                             focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]
                             outline-none transition-all duration-150"
                />
              </div>

              {error && (
                <div className="mb-4 px-4 py-3 bg-rose-500/[0.08] border border-rose-500/20
                                rounded-[10px] text-[13px] text-rose-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-violet-600
                           hover:from-indigo-400 hover:to-violet-500
                           text-white text-[14px] font-semibold rounded-[10px]
                           shadow-[0_0_24px_rgba(99,102,241,0.25)]
                           hover:shadow-[0_4px_28px_rgba(99,102,241,0.35)]
                           hover:-translate-y-px
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-150 mb-5"
              >
                {loading ? 'Создаём...' : 'Создать аккаунт'}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[11px] text-white/20 tracking-wider">или</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              <button
                type="button"
                className="w-full py-3 bg-[#0f0f11] border border-white/[0.07]
                           hover:bg-[#141416] hover:border-white/[0.12]
                           text-white/50 hover:text-white/80
                           text-[13px] font-medium rounded-[10px]
                           flex items-center justify-center gap-2.5
                           transition-all duration-150 mb-6"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Продолжить с Google
              </button>

              <div className="flex items-center justify-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-white/20">Supabase подключён</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## Что изменилось vs текущая версия

| Было | Стало |
|------|-------|
| Контент без отступов | `p-8 md:p-12` на правой панели, `p-12` на левой |
| Поля без label | Label над каждым полем, `text-white/45` |
| Поля без padding | `px-4 py-3` внутри каждого input |
| Нет focus-стиля | Focus-ring indigo + glow эффект |
| Кнопка без акцента | Gradient indigo→violet + glow + hover lift |
| "Connected" — просто текст | Пульсирующая зелёная точка + мелкий текст |
| Нет "Забыли пароль?" | Добавлено справа под полем пароля |
| Нет Google кнопки | Добавлена с SVG иконкой |
| Нет отображения ошибок | Rose-400 блок с текстом ошибки |
| Заголовок одинаковый | Разный для signin/signup |

---

## Зависимости

Если `Instrument Serif` нет в проекте — добавить в `layout.tsx`:

```tsx
import { Instrument_Serif, Geist } from 'next/font/google'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
})
```

И применить переменную там где нужен serif шрифт:
```tsx
<h1 style={{ fontFamily: 'var(--font-serif)' }}>...</h1>
// или через className если настроен в tailwind.config.ts
```
