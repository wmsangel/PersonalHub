'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles, Users, Zap } from 'lucide-react'
import { signInAction, signUpAction } from '@/app/actions'
import { cn } from '@/lib/utils'

const features = [
  {
    icon: Users,
    title: 'Роли и права',
    description: 'Настройте, кто видит задачи, финансы и события.',
  },
  {
    icon: Zap,
    title: 'Обновления в реальном времени',
    description: 'Изменения сразу видны всем участникам.',
  },
  {
    icon: ShieldCheck,
    title: 'Данные под контролем',
    description: 'Изоляция по семьям на уровне базы данных.',
  },
] as const

const inputClass =
  'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-[14px] text-white transition-all duration-150 placeholder:text-white/22 hover:border-white/[0.12] hover:bg-white/[0.055] focus:border-indigo-400/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)] outline-none'

// Next.js signals a redirect from a server action by throwing a special error.
// The framework intercepts it to perform the navigation — but only if it
// propagates out of the client handler. Catching it would swallow the redirect
// and surface the internal "NEXT_REDIRECT" string to the user, so we detect
// that specific error and rethrow it.
function isRedirectError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false
  const err = e as { message?: unknown; digest?: unknown }
  if (err.message === 'NEXT_REDIRECT') return true
  if (typeof err.digest === 'string' && err.digest.startsWith('NEXT_REDIRECT')) return true
  return false
}

function AuthPageInner() {
  const searchParams = useSearchParams()
  const urlStatus = searchParams.get('status')
  const urlMessage = searchParams.get('message')

  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Surface feedback that a server action passed back through a redirect
  // (e.g. `withStatus` in app/actions.ts).
  useEffect(() => {
    if (!urlStatus || !urlMessage) return
    if (urlStatus === 'error') setError(urlMessage)
    if (urlStatus === 'success') {
      setSuccessMsg(urlMessage)
      setTab('signin')
    }
  }, [urlStatus, urlMessage])

  async function handleSignIn(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    try {
      await signInAction(formData)
    } catch (e: unknown) {
      if (isRedirectError(e)) throw e
      setError(e instanceof Error ? e.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignUp(formData: FormData) {
    setError(null)
    setSuccessMsg(null)
    const password = String(formData.get('password') ?? '')
    const confirm = String(formData.get('confirm_password') ?? '')
    if (password.length < 8) {
      setError('Пароль должен быть не короче 8 символов.')
      return
    }
    if (password !== confirm) {
      setError('Пароли не совпадают.')
      return
    }
    setLoading(true)
    try {
      await signUpAction(formData)
    } catch (e: unknown) {
      if (isRedirectError(e)) throw e
      setError(e instanceof Error ? e.message : 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="grid min-h-screen md:grid-cols-[1fr_480px] lg:grid-cols-[1fr_520px] xl:grid-cols-[1fr_580px] 2xl:grid-cols-[1fr_640px]">

        {/* ── Left: marketing ── */}
        <section className="relative hidden overflow-hidden border-r border-white/[0.07] md:flex md:flex-col">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_15%,rgba(34,211,238,0.13),transparent_40%),radial-gradient(ellipse_at_80%_80%,rgba(99,102,241,0.14),transparent_40%)]" />

          <div className="relative z-10 flex flex-1 flex-col px-10 py-10 lg:px-14 lg:py-12 xl:px-20 2xl:px-32">
            <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col">
              {/* Logo */}
              <div className="mb-14 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-[13px] font-semibold text-white shadow-[0_12px_32px_rgba(99,102,241,0.32)]">
                  PH
                </div>
                <div>
                  <p className="text-[14px] font-semibold tracking-tight text-white">PersonalHub</p>
                  <p className="text-[10px] uppercase tracking-[0.26em] text-cyan-100/50">Family OS</p>
                </div>
              </div>

              {/* Hero */}
              <div className="flex-1">
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/45">
                  <Sparkles className="h-3 w-3 text-cyan-300" />
                  спокойный центр семейной жизни
                </span>

                <h1 className="page-title-display mb-5 text-[2.8rem] leading-[1.05] text-white lg:text-[3.2rem] xl:text-[3.6rem]">
                  Пространство,
                  <br />
                  где семья
                  <br />
                  <span className="text-white/48">движется синхронно</span>
                </h1>

                <p className="mb-10 max-w-[420px] text-[14px] leading-7 text-white/40">
                  Задачи, покупки, заметки, финансы и события — всё в одном месте для всей семьи.
                </p>

                {/* Features */}
                <ul className="max-w-[480px] space-y-4">
                  {features.map(({ icon: Icon, title, description }) => (
                    <li key={title} className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-cyan-200/70">
                        <Icon className="h-[15px] w-[15px]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-white/85">{title}</p>
                        <p className="mt-0.5 text-[12px] leading-5 text-white/36">{description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom modules */}
              <div className="mt-10 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                {['Задачи', 'Покупки', 'Заметки', 'Финансы', 'Календарь', 'Вишлисты'].map((mod, i, arr) => (
                  <span key={mod} className="text-[11px] text-white/22">
                    {mod}{i < arr.length - 1 ? <span className="mx-1.5 text-white/12">·</span> : null}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Right: auth form ── */}
        <section className="relative flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_60%_10%,rgba(99,102,241,0.1),transparent_40%),radial-gradient(ellipse_at_40%_90%,rgba(34,211,238,0.07),transparent_40%)]" />

          <div className="relative z-10 w-full max-w-[400px]">
            {/* Mobile logo */}
            <div className="mb-8 flex items-center justify-center gap-3 md:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-[12px] font-semibold text-white">
                PH
              </div>
              <div>
                <p className="text-[14px] font-semibold tracking-tight text-white">PersonalHub</p>
                <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-100/50">Family OS</p>
              </div>
            </div>

            {/* Tab switcher */}
            <div className="mb-5 flex gap-1 rounded-[1.2rem] border border-white/[0.07] bg-white/[0.025] p-1">
              {(['signin', 'signup'] as const).map((currentTab) => (
                <button
                  key={currentTab}
                  onClick={() => {
                    setTab(currentTab)
                    setError(null)
                    setSuccessMsg(null)
                  }}
                  className={cn(
                    'flex-1 rounded-[0.85rem] px-4 py-2.5 text-[13px] font-medium transition-all duration-200',
                    tab === currentTab
                      ? 'bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                      : 'text-white/32 hover:text-white/60',
                  )}
                >
                  {currentTab === 'signin' ? 'Вход' : 'Регистрация'}
                </button>
              ))}
            </div>

            {/* Form card */}
            <div className="surface-panel overflow-hidden rounded-[1.6rem]">
              <div className="p-6 sm:p-7">
                {tab === 'signin' ? (
                  <form action={handleSignIn}>
                    <div className="mb-6">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-200">
                        <LockKeyhole className="h-5 w-5" />
                      </div>
                      <h2 className="text-xl font-semibold tracking-tight text-white">С возвращением</h2>
                      <p className="mt-1.5 text-sm leading-6 text-white/40">
                        Войдите в ваше семейное пространство.
                      </p>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/38">Email</label>
                        <input name="email" type="email" placeholder="ivan@example.com" required className={inputClass} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/38">Пароль</label>
                        <input name="password" type="password" placeholder="••••••••" required className={inputClass} />
                      </div>
                    </div>

                    <div className="mt-2.5 flex justify-end">
                      <button type="button" className="text-[12px] text-white/28 transition-colors hover:text-white/55">
                        Забыли пароль?
                      </button>
                    </div>

                    {successMsg ? (
                      <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-[13px] text-emerald-200">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{successMsg}</span>
                      </div>
                    ) : null}

                    {error ? (
                      <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.08] px-4 py-3 text-[13px] text-rose-300">
                        {error}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-3 text-[14px] font-semibold text-white shadow-[0_12px_32px_rgba(99,102,241,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(99,102,241,0.32)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? 'Входим...' : 'Войти'}
                      {!loading ? <ArrowRight className="h-4 w-4" /> : null}
                    </button>
                  </form>
                ) : (
                  <form action={handleSignUp}>
                    <div className="mb-6">
                      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 text-violet-200">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <h2 className="text-xl font-semibold tracking-tight text-white">Создать аккаунт</h2>
                      <p className="mt-1.5 text-sm leading-6 text-white/40">
                        Начните, а потом пригласите близких.
                      </p>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/38">Email</label>
                        <input name="email" type="email" placeholder="ivan@example.com" required className={inputClass} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/38">Пароль</label>
                        <input name="password" type="password" placeholder="Минимум 8 символов" minLength={8} required className={inputClass} />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-white/38">Повторите пароль</label>
                        <input name="confirm_password" type="password" placeholder="••••••••" minLength={8} required className={inputClass} />
                      </div>
                    </div>

                    {successMsg ? (
                      <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-[13px] text-emerald-200">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{successMsg}</span>
                      </div>
                    ) : null}

                    {error ? (
                      <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.08] px-4 py-3 text-[13px] text-rose-300">
                        {error}
                      </div>
                    ) : null}

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-3 text-[14px] font-semibold text-white shadow-[0_12px_32px_rgba(99,102,241,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(99,102,241,0.32)] disabled:cursor-not-allowed disabled:opacity-50"
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

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageInner />
    </Suspense>
  )
}
