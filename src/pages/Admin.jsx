import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { candidates } from '../data/candidates'
import FlagRule from '../components/FlagRule'

const ease = [0.22, 1, 0.36, 1]
const byId = Object.fromEntries(candidates.map(c => [c.id, c]))
const LOG_LIMIT = 1000 // api/analytics.js reads at most this many logs

const shortDate = (key) =>
  new Date(`${key}T12:00:00Z`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' })

// 14 consecutive days ending on the most recent day with activity
function lastDays(questionsByDay, n = 14) {
  const keys = Object.keys(questionsByDay).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k)).sort()
  if (keys.length === 0) return []
  const end = new Date(`${keys[keys.length - 1]}T00:00:00Z`)
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(end)
    d.setUTCDate(end.getUTCDate() - (n - 1 - i))
    const key = d.toISOString().slice(0, 10)
    return { key, count: questionsByDay[key] || 0 }
  })
}

export default function Admin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [bulletin, setBulletin] = useState(0)
  const [updatedAt, setUpdatedAt] = useState(null)

  const fetchData = useCallback(async (pw) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/analytics', { headers: { 'x-admin-password': pw } })
      if (!res.ok) {
        if (res.status === 401) throw new Error('Contraseña incorrecta')
        throw new Error('Error al cargar datos')
      }
      setData(await res.json())
      setAuthenticated(true)
      setBulletin(n => n + 1)
      setUpdatedAt(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    fetchData(password)
  }

  // Auto-refresh every 30s
  useEffect(() => {
    if (!authenticated) return
    const interval = setInterval(() => fetchData(password), 30000)
    return () => clearInterval(interval)
  }, [authenticated, password, fetchData])

  if (!authenticated) {
    return (
      <div className="guilloche flex h-dvh items-center justify-center overflow-y-auto bg-paper p-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="w-full max-w-[420px] border-2 border-ink bg-paper-light"
        >
          <div className="flex items-center justify-between bg-ink px-5 py-2.5">
            <span className="label text-paper">Acceso restringido</span>
            <span className="label text-paper/60">Mesa Nº 01</span>
          </div>
          <div className="p-6 lg:p-8">
            <h1 className="condensed text-display font-black uppercase leading-[0.9] text-ink">
              Escrutinio<span className="text-mark">.</span>
            </h1>
            <p className="mt-2 font-serif text-read italic text-ink-soft">Panel de seguimiento de Vota Informado</p>
            <FlagRule height={5} delay={0.2} className="mt-5" />

            <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-3">
              <label htmlFor="admin-password" className="label text-ink">Contraseña</label>
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                className="border-[1.5px] border-ink bg-paper px-4 py-3 text-ink focus:bg-white"
              />
              <button
                type="submit"
                disabled={loading || !password}
                className="mt-1 bg-ink py-3.5 text-body font-semibold uppercase tracking-wide text-paper transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {loading ? 'Abriendo…' : 'Abrir escrutinio'}
              </button>
              {error && (
                <p role="alert" className="label text-center text-mark">
                  {error}
                </p>
              )}
            </form>

            <button
              onClick={() => navigate('/')}
              className="group mt-6 flex items-center gap-2 text-ink-mute transition-colors hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:-translate-x-1">
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
              </svg>
              <span className="label">Volver al tarjetón</span>
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const total = data.totalQuestions || 0
  const counts = data.candidateCounts || {}
  const results = candidates
    .map(c => ({ candidate: c, count: counts[c.id] || 0 }))
    .sort((a, b) => b.count - a.count)
  const maxCount = Math.max(...results.map(r => r.count), 1)
  const comparisons = Object.entries(data.comparisonCounts || {}).sort((a, b) => b[1] - a[1])
  const totalComparisons = comparisons.reduce((sum, [, n]) => sum + n, 0)
  const days = lastDays(data.questionsByDay || {})
  const activeDays = Object.keys(data.questionsByDay || {}).length
  const leader = results[0]?.count > 0 ? results[0].candidate : null

  return (
    <div className="h-dvh overflow-y-auto bg-paper">
      <div className="mx-auto max-w-[1280px] px-5 pb-12 pt-6 lg:px-10 lg:pt-8">
        {/* Header */}
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label text-ink-mute">Boletín de escrutinio · Nº {String(bulletin).padStart(2, '0')}</p>
            <h1 className="condensed mt-1 text-display font-black uppercase leading-[0.9] text-ink lg:text-headline">
              Escrutinio<span className="text-mark">.</span>
            </h1>
          </div>
          <div className="flex w-full items-center gap-3 lg:w-auto">
            <div className="mr-auto lg:mr-0 lg:text-right">
              <p className="label flex items-center gap-2 text-ink lg:justify-end">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mark opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-mark" />
                </span>
                En vivo
              </p>
              <p className="label mt-1 text-ink-mute" title="Se actualiza cada 30 segundos">
                {updatedAt?.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}
              </p>
            </div>
            <button
              onClick={() => fetchData(password)}
              disabled={loading}
              className="h-10 border-[1.5px] border-ink px-3 text-ink transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
            >
              <span className="label">{loading ? 'Contando…' : 'Actualizar'}</span>
            </button>
            <button
              onClick={() => navigate('/')}
              className="h-10 border-[1.5px] border-ink bg-ink px-3 text-paper transition-opacity hover:opacity-85"
            >
              <span className="label">Tarjetón</span>
            </button>
          </div>
        </header>

        <FlagRule height={6} delay={0.1} className="mt-5" />

        {/* Headline numbers */}
        <div className="mt-6 grid grid-cols-2 gap-px border-2 border-ink bg-ink lg:grid-cols-4">
          <StatTile label="Total preguntas" value={total.toLocaleString('es-CO')} note={total >= LOG_LIMIT ? `Tope de lectura: ${LOG_LIMIT.toLocaleString('es-CO')} registros` : 'Desde el lanzamiento'} delay={0.15} />
          <StatTile label="Comparaciones" value={totalComparisons.toLocaleString('es-CO')} note={`${comparisons.length} pares distintos`} delay={0.2} />
          <StatTile label="Días con actividad" value={activeDays} note={days.length ? `Último: ${shortDate(days[days.length - 1].key)}` : '—'} delay={0.25} />
          <StatTile
            label="Más consultado"
            value={leader ? leader.shortName : '—'}
            note={leader ? `${Math.round((results[0].count / Math.max(total, 1)) * 100)}% de las preguntas` : 'Sin datos'}
            accent={leader?.color}
            valueClass="text-title lg:text-display"
            delay={0.3}
          />
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-14">
          <div>
            {/* Results by candidate */}
            <SectionLabel>Preguntas por candidato</SectionLabel>
            <ol>
              {results.map(({ candidate, count }, i) => {
                const pct = total ? Math.round((count / total) * 100) : 0
                return (
                  <li key={candidate.id} className="flex items-center gap-3.5 border-b border-rule py-3.5">
                    <span className="w-6 font-mono text-meta font-semibold text-ink-mute">{i + 1}º</span>
                    <div className="h-11 w-11 flex-shrink-0 overflow-hidden border border-ink">
                      <img src={candidate.photo} alt="" className="h-full w-full object-cover object-top" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="condensed truncate text-read font-extrabold uppercase text-ink">{candidate.name}</span>
                        <span className="flex-shrink-0 font-mono text-body font-semibold text-ink">
                          {count.toLocaleString('es-CO')}
                          <span className="ml-1.5 text-small font-normal text-ink-mute">{pct}%</span>
                        </span>
                      </div>
                      <div className="mt-2 h-3 bg-paper-deep" title={`${candidate.name}: ${count} preguntas (${pct}%)`}>
                        <motion.div
                          className="h-full rounded-r-[4px]"
                          style={{ backgroundColor: candidate.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${(count / maxCount) * 100}%` }}
                          transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease }}
                        />
                      </div>
                    </div>
                  </li>
                )
              })}
            </ol>

            {/* Activity by day */}
            <SectionLabel>Actividad · 14 días</SectionLabel>
            {days.length ? <ActivityChart days={days} /> : <Empty>Aún no hay actividad registrada.</Empty>}

            {/* Comparisons */}
            <SectionLabel>Comparaciones más frecuentes</SectionLabel>
            {comparisons.length ? (
              <ol>
                {comparisons.slice(0, 10).map(([pair, count]) => {
                  const [a, b] = pair.split(' vs ').map(id => byId[id])
                  return (
                    <li key={pair} className="flex items-center gap-3 border-b border-rule py-3">
                      <div className="flex flex-shrink-0">
                        {[a, b].map((c, j) => (
                          <div key={j} className={`h-8 w-8 overflow-hidden border border-ink bg-paper ${j ? '-ml-2' : ''}`}>
                            {c && <img src={c.photo} alt="" className="h-full w-full object-cover object-top" />}
                          </div>
                        ))}
                      </div>
                      <span className="condensed flex-1 text-read font-bold uppercase text-ink">
                        {a?.shortName ?? pair.split(' vs ')[0]} <span className="font-mono text-meta font-semibold text-mark">VS</span>{' '}
                        {b?.shortName ?? pair.split(' vs ')[1]}
                      </span>
                      <span className="font-mono text-body font-semibold text-ink">{count}</span>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <Empty>Nadie ha pedido comparaciones todavía.</Empty>
            )}
          </div>

          {/* Recent questions */}
          <div>
            <SectionLabel>Preguntas recientes</SectionLabel>
            {data.recentQuestions?.length ? (
              <ol className="selectable">
                {data.recentQuestions.map((q, i) => {
                  const c = byId[q.candidate_id]
                  return (
                    <li key={i} className="border-b border-rule py-3.5">
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className="h-3 w-3 flex-shrink-0" style={{ backgroundColor: c?.color || 'var(--color-ink-mute)' }} />
                        <span className="label text-ink">{c?.shortName ?? q.candidate_id}</span>
                        {q.is_comparison && (
                          <span className="label text-mark">
                            vs {q.compared_with?.map(id => byId[id]?.shortName ?? id).join(', ')}
                          </span>
                        )}
                        <span className="label ml-auto flex-shrink-0 text-ink-mute">
                          {q.created_at
                            ? new Date(q.created_at).toLocaleString('es-CO', {
                                timeZone: 'America/Bogota',
                                day: 'numeric',
                                month: 'short',
                                hour: 'numeric',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                      <p className="font-serif text-body leading-snug text-ink">{q.question}</p>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <Empty>Aún no hay preguntas registradas.</Empty>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatTile({ label, value, note, accent, valueClass = 'text-display', delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease }}
      className="relative bg-paper-light p-4 lg:p-5"
    >
      {accent && <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} />}
      <p className="label text-ink-mute">{label}</p>
      <p className={`condensed mt-2 font-black uppercase leading-[0.9] text-ink ${valueClass}`}>{value}</p>
      <p className="mt-2 text-small text-ink-soft">{note}</p>
    </motion.div>
  )
}

// Single-series column chart: one bar per day, hover for the exact value
function ActivityChart({ days }) {
  const [hover, setHover] = useState(null)
  const max = Math.max(...days.map(d => d.count), 1)
  const peak = days.reduce((best, d, i) => (d.count > days[best].count ? i : best), 0)

  return (
    <div className="pt-6">
      <div className="relative flex h-44 items-end border-b border-ink">
        {days.map((d, i) => {
          const h = (d.count / max) * 100
          const active = hover === i
          return (
            <div
              key={d.key}
              className="relative flex h-full flex-1 items-end justify-center"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {(i === peak && d.count > 0 && hover === null) && (
                <span className="absolute font-mono text-meta font-semibold text-ink" style={{ bottom: `calc(${h}% + 4px)` }}>
                  {d.count}
                </span>
              )}
              {active && (
                <div
                  className="pointer-events-none absolute z-10 whitespace-nowrap bg-ink px-2.5 py-1.5 text-paper"
                  style={{ bottom: `calc(${h}% + 8px)` }}
                >
                  <p className="label text-paper/70">{shortDate(d.key)}</p>
                  <p className="font-mono text-small font-semibold">{d.count} preguntas</p>
                </div>
              )}
              <motion.div
                className="w-[min(24px,70%)] rounded-t-[4px]"
                style={{ backgroundColor: active ? 'var(--color-mark)' : 'var(--color-ink)' }}
                initial={{ height: 0 }}
                animate={{ height: d.count ? `max(${h}%, 2px)` : 0 }}
                transition={{ delay: 0.4 + i * 0.03, duration: 0.6, ease }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between">
        <span className="label text-ink-mute">{shortDate(days[0].key)}</span>
        <span className="label text-ink-mute">{shortDate(days[days.length - 1].key)}</span>
      </div>

      {/* Table view for screen readers */}
      <table className="sr-only">
        <caption>Preguntas por día</caption>
        <tbody>
          {days.map(d => (
            <tr key={d.key}>
              <th scope="row">{d.key}</th>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="mb-1 mt-9 flex items-center gap-3 first:mt-0">
      <span className="label text-ink">{children}</span>
      <span className="h-[1.5px] flex-1 bg-ink" />
    </div>
  )
}

function Empty({ children }) {
  return <p className="py-6 font-serif text-read italic text-ink-mute">{children}</p>
}
