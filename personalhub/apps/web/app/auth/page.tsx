'use client'

import { useState } from 'react'
import { ArrowRight, LockKeyhole, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react'
import { signInAction, signUpAction } from '@/app/actions'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Users,
    title: 'Роли и права',
    description: 'Настройте, кто видит задачи, финансы, заметки и семейные события.',
  },
  {
    icon: Zap,
    title: 'Обновления в реальном времени',
    description: 'Изменения сразу видны всем, без лишних вопросов и пересылок.',
  },
  {
    icon: ShieldCheck,
    title: 'Данные под контролем',
    description: 'Изоляция по семьям и ограничения доступа на уровне базы данных.',
  },
] as const

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
      setError(e instanceof Error ? e.message : 'Ошибка входа')
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
      setError(e instanceof Error ? e.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden bg-transparent">
      <div className="grid min-h-screen md:grid-cols-[1.12fr_0.88fr]">
        <section className="relative hidden overflow-hidden border-r border-white/8 md:block">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(34,211,238,0.14),transparent_26%),radial-gradient(circle_at_22%_88%,rgba(99,102,241,0.16),transparent_24%),radial-gradient(circle_at_88%_20%,rgba(244,114,182,0.12),transparent_22%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between px-10 py-9 lg:px-14 lg:py-12">
            <div>
              <div className="mb-16 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(99,102,241,0.38)]">
                  PH
                </div>
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-white">PersonalHub</p>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/56">Family OS</p>
                </div>
              </div>

              <div className="max-w-[620px]">
                <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.24em] text-white/52">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                  спокойный центр семейной жизни
                </span>

                <h1 className="page-title-display mb-6 max-w-[620px] text-[4.35rem] leading-[0.95] text-white">
                  Пространство,
                  <br />
                  где семья
                  <br />
                  <span className="text-white/52">движется синхронно</span>
                </h1>

                <p className="max-w-[430px] text-[15px] leading-8 text-white/44">
                  Планируйте задачи, покупки, заметки и семейные договоренности в интерфейсе, который не шумит и не
                  утомляет.
                </p>
              </div>

              <div className="mt-14 grid max-w-[760px] gap-4">
                {features.map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="surface-panel-soft rounded-[1.5rem] px-5 py-4 transition-all duration-200 hover:border-white/12 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-cyan-200">
                        <Icon className="h-[18px] w-[18px]" />
                      </div>
                      <div>
                        <p className="text-[15px] font-medium text-white">{title}</p>
                        <p className="mt-1 text-[13px] leading-6 text-white/40">{description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {['Tasks', 'Notes', 'Calendar', 'Finances', 'Wishlists'].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/8 bg-white/[0.035] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/30"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(99,102,241,0.12),transparent_20%),radial-gradient(circle_at_50%_90%,rgba(34,211,238,0.08),transparent_28%)]" />

          <div className="relative z-10 w-full max-w-[470px]">
            <div className="mb-5 flex items-center justify-center md:hidden">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-sm font-semibold text-white">
                  PH
                </div>
                <div>
                  <p className="text-[15px] font-semibold tracking-tight text-white">PersonalHub</p>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/56">Family OS</p>
                </div>
              </div>
            </div>

            <div className="surface-panel rounded-[2rem] p-3 sm:p-4">
              <div className="mb-4 flex gap-1 rounded-[1.25rem] border border-white/8 bg-black/20 p-1">
                {(['signin', 'signup'] as const).map((currentTab) => (
                  <button
                    key={currentTab}
                    onClick={() => {
                      setTab(currentTab)
                      setError(null)
                    }}
                    className={cn(
                      'flex-1 rounded-[1rem] px-4 py-3 text-[13px] font-medium transition-all duration-200',
                      tab === currentTab
                        ? 'bg-white/[0.09] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                        : 'text-white/34 hover:text-white/68'
                    )}
                  >
                    {currentTab === 'signin' ? 'Вход' : 'Регистрация'}
                  </button>
                ))}
              </div>

              <div className="rounded-[1.5rem] border border-white/8 bg-[#0d1118]/76 p-5 sm:p-6">
                {tab === 'signin' ? (
                  <form action={handleSignIn}>
                    <div className="mb-7">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/22 to-cyan-400/12 text-cyan-100">
                        <LockKeyhole className="h-5 w-5" />
                      </div>
                      <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-white">С возвращением</h2>
                      <p className="mt-2 text-[14px] leading-6 text-white/44">
                        Войдите, чтобы продолжить работу с вашим семейным пространством.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-[12px] font-medium tracking-wide text-white/45">Email</label>
                        <input
                          name="email"
                          type="email"
                          placeholder="ivan@example.com"
                          required
                          className="w-full rounded-[1rem] border border-white/8 bg-white/[0.035] px-4 py-3.5 text-[14px] text-white transition-all duration-200 hover:border-white/14 hover:bg-white/[0.05] focus:border-indigo-400/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[12px] font-medium tracking-wide text-white/45">Пароль</label>
                        <input
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          required
                          className="w-full rounded-[1rem] border border-white/8 bg-white/[0.035] px-4 py-3.5 text-[14px] text-white transition-all duration-200 hover:border-white/14 hover:bg-white/[0.05] focus:border-indigo-400/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button type="button" className="text-[12px] text-white/32 transition-colors hover:text-white/58">
                        Забыли пароль?
                      </button>
                    </div>

                    {error ? (
                      <div className="mt-4 rounded-[1rem] border border-rose-500/20 bg-rose-500/[0.08] px-4 py-3 text-[13px] text-rose-300">
                        {error}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-[1rem] bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 px-4 py-3.5 text-[14px] font-semibold text-white shadow-[0_18px_42px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgba(99,102,241,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? 'Входим...' : 'Войти'}
                      {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                    </button>
                  </form>
                ) : (
                  <form action={handleSignUp}>
                    <div className="mb-7">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/22 to-fuchsia-400/14 text-violet-100">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-white">Создать аккаунт</h2>
                      <p className="mt-2 text-[14px] leading-6 text-white/44">
                        Начните с личного пространства, а затем пригласите близких в один клик.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-[12px] font-medium tracking-wide text-white/45">Email</label>
                        <input
                          name="email"
                          type="email"
                          placeholder="ivan@example.com"
                          required
                          className="w-full rounded-[1rem] border border-white/8 bg-white/[0.035] px-4 py-3.5 text-[14px] text-white transition-all duration-200 hover:border-white/14 hover:bg-white/[0.05] focus:border-indigo-400/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[12px] font-medium tracking-wide text-white/45">Пароль</label>
                        <input
                          name="password"
                          type="password"
                          placeholder="Минимум 8 символов"
                          required
                          className="w-full rounded-[1rem] border border-white/8 bg-white/[0.035] px-4 py-3.5 text-[14px] text-white transition-all duration-200 hover:border-white/14 hover:bg-white/[0.05] focus:border-indigo-400/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-[12px] font-medium tracking-wide text-white/45">Повторите пароль</label>
                        <input
                          name="confirm_password"
                          type="password"
                          placeholder="••••••••"
                          required
                          className="w-full rounded-[1rem] border border-white/8 bg-white/[0.035] px-4 py-3.5 text-[14px] text-white transition-all duration-200 hover:border-white/14 hover:bg-white/[0.05] focus:border-indigo-400/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
                        />
                      </div>
                    </div>

                    {error ? (
                      <div className="mt-4 rounded-[1rem] border border-rose-500/20 bg-rose-500/[0.08] px-4 py-3 text-[13px] text-rose-300">
                        {error}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-[1rem] bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 px-4 py-3.5 text-[14px] font-semibold text-white shadow-[0_18px_42px_rgba(99,102,241,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_56px_rgba(99,102,241,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
                      {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
