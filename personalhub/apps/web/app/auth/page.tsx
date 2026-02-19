'use client'

import { useState } from 'react'
import { signInAction, signUpAction } from '@/app/actions'
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
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Ошибка входа'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(formData: FormData) {
    setLoading(true)
    setError(null)
    try {
      await signUpAction(formData)
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Ошибка регистрации'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080809] md:grid md:grid-cols-[56%_44%]">
      <div className="relative hidden overflow-hidden border-r border-white/[0.06] bg-[#0f0f11] md:block">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.045) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.045) 1px, transparent 1px)
            `,
            backgroundSize: '54px 54px',
          }}
        />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-[500px] w-[500px] rounded-full bg-indigo-600/[0.08] blur-3xl" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 lg:p-12">
          <div className="max-w-[680px]">
            <div className="mb-14 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white shadow-[0_0_20px_rgba(99,102,241,0.32)]">
                P
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-white">PersonalHub</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/[0.18] bg-cyan-500/[0.08] px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-cyan-400">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Семейный органайзер
              </span>
            </div>

            <h1
              className="mb-6 text-[56px] leading-[1.06] tracking-[-0.03em] text-white"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}
            >
              Все договорённости
              <br />
              <span className="italic text-white/58">семьи в одном месте</span>
            </h1>

            <p className="mb-10 max-w-[420px] text-[14px] leading-relaxed text-white/42">
              Согласовывайте планы, делегируйте задачи и ведите общие списки - без хаоса в мессенджерах.
            </p>

            <div className="space-y-3">
              {[
                { icon: '👥', title: 'Роли и доступ', desc: 'Гибкое управление правами для каждого участника семьи' },
                { icon: '⚡', title: 'Realtime синхронизация', desc: 'Списки и задачи обновляются мгновенно у всех' },
                { icon: '🔒', title: 'Безопасность в БД', desc: 'RLS-политики изолируют данные между семьями' },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-5 py-4 transition-all duration-200 hover:border-white/[0.12] hover:bg-white/[0.04]"
                >
                  <span className="mt-0.5 text-base">{feature.icon}</span>
                  <div>
                    <p className="mb-0.5 text-[13px] font-medium text-white">{feature.title}</p>
                    <p className="text-[12px] leading-snug text-white/32">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2">
            {['Supabase', 'Next.js 15', 'Realtime', 'TypeScript'].map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium tracking-wide text-white/24"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[#080809] px-6 py-10 sm:px-8 md:px-10 lg:px-14">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex gap-1 rounded-xl border border-white/[0.07] bg-[#0f0f11] p-1">
            {(['signin', 'signup'] as const).map((currentTab) => (
              <button
                key={currentTab}
                onClick={() => {
                  setTab(currentTab)
                  setError(null)
                }}
                className={cn(
                  'flex-1 rounded-[9px] py-2.5 text-[13px] font-medium transition-all duration-150',
                  tab === currentTab ? 'bg-[#1a1a1e] text-white shadow-sm' : 'text-white/35 hover:text-white/60',
                )}
              >
                {currentTab === 'signin' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          {tab === 'signin' && (
            <form action={handleSignIn} className="space-y-0">
              <div className="mb-7">
                <h2 className="mb-1.5 text-[22px] font-semibold tracking-tight text-white">С возвращением</h2>
                <p className="text-[13px] leading-relaxed text-white/30">
                  Войдите, чтобы продолжить работу
                  <br />с семейным пространством
                </p>
              </div>

              <div className="mb-3.5">
                <label className="mb-2 block text-[12px] font-medium tracking-wide text-white/45">Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="ivan@example.com"
                  required
                  className="w-full rounded-[10px] border border-white/[0.07] bg-[#0f0f11] px-4 py-3 text-[14px] text-white placeholder:text-white/20 outline-none transition-all duration-150 hover:border-white/[0.12] hover:bg-[#141416] focus:border-indigo-500/50 focus:bg-[#141416] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]"
                />
              </div>

              <div className="mb-2">
                <label className="mb-2 block text-[12px] font-medium tracking-wide text-white/45">Пароль</label>
                <input
                  name="password"
                  type="password"
                  placeholder="••••••••••"
                  required
                  className="w-full rounded-[10px] border border-white/[0.07] bg-[#0f0f11] px-4 py-3 text-[14px] text-white placeholder:text-white/20 outline-none transition-all duration-150 hover:border-white/[0.12] hover:bg-[#141416] focus:border-indigo-500/50 focus:bg-[#141416] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]"
                />
              </div>

              <div className="mb-6 flex justify-end">
                <button type="button" className="text-[12px] text-white/25 transition-colors hover:text-white/50">
                  Забыли пароль?
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-[10px] border border-rose-500/20 bg-rose-500/[0.08] px-4 py-3 text-[13px] text-rose-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mb-5 w-full rounded-[10px] bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-[14px] font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.25)] transition-all duration-150 hover:-translate-y-px hover:from-indigo-400 hover:to-violet-500 hover:shadow-[0_4px_28px_rgba(99,102,241,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Входим...' : 'Войти в аккаунт'}
              </button>

              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[11px] tracking-wider text-white/20">или</span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              <button
                type="button"
                className="mb-6 flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-white/[0.07] bg-[#0f0f11] py-3 text-[13px] font-medium text-white/50 transition-all duration-150 hover:border-white/[0.12] hover:bg-[#141416] hover:text-white/80"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Продолжить с Google
              </button>

              <div className="flex items-center justify-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-[11px] text-white/20">Supabase подключён</span>
              </div>
            </form>
          )}

          {tab === 'signup' && (
            <form action={handleSignUp} className="space-y-0">
              <div className="mb-7">
                <h2 className="mb-1.5 text-[22px] font-semibold tracking-tight text-white">Создать аккаунт</h2>
                <p className="text-[13px] leading-relaxed text-white/30">
                  Зарегистрируйтесь, чтобы создать
                  <br />
                  семейное пространство
                </p>
              </div>

              <div className="mb-3.5">
                <label className="mb-2 block text-[12px] font-medium tracking-wide text-white/45">Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="ivan@example.com"
                  required
                  className="w-full rounded-[10px] border border-white/[0.07] bg-[#0f0f11] px-4 py-3 text-[14px] text-white placeholder:text-white/20 outline-none transition-all duration-150 hover:border-white/[0.12] hover:bg-[#141416] focus:border-indigo-500/50 focus:bg-[#141416] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]"
                />
              </div>

              <div className="mb-3.5">
                <label className="mb-2 block text-[12px] font-medium tracking-wide text-white/45">Пароль</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Минимум 8 символов"
                  required
                  className="w-full rounded-[10px] border border-white/[0.07] bg-[#0f0f11] px-4 py-3 text-[14px] text-white placeholder:text-white/20 outline-none transition-all duration-150 hover:border-white/[0.12] hover:bg-[#141416] focus:border-indigo-500/50 focus:bg-[#141416] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]"
                />
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-[12px] font-medium tracking-wide text-white/45">Повторите пароль</label>
                <input
                  name="confirm_password"
                  type="password"
                  placeholder="••••••••••"
                  required
                  className="w-full rounded-[10px] border border-white/[0.07] bg-[#0f0f11] px-4 py-3 text-[14px] text-white placeholder:text-white/20 outline-none transition-all duration-150 hover:border-white/[0.12] hover:bg-[#141416] focus:border-indigo-500/50 focus:bg-[#141416] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]"
                />
              </div>

              {error && (
                <div className="mb-4 rounded-[10px] border border-rose-500/20 bg-rose-500/[0.08] px-4 py-3 text-[13px] text-rose-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-[10px] bg-gradient-to-r from-indigo-500 to-violet-600 py-3 text-[14px] font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.25)] transition-all duration-150 hover:-translate-y-px hover:from-indigo-400 hover:to-violet-500 hover:shadow-[0_4px_28px_rgba(99,102,241,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
