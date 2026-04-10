import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const candidateNames = {
  abelardo: 'Abelardo De la Espriella',
  claudia: 'Claudia López',
  ivan: 'Iván Cepeda',
  paloma: 'Paloma Valencia',
  sergio: 'Sergio Fajardo',
}

const candidateColors = {
  abelardo: '#B91C1C',
  claudia: '#0D7377',
  ivan: '#7C2D12',
  paloma: '#1D4ED8',
  sergio: '#15803D',
}

export default function Admin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async (pw) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/analytics?password=${encodeURIComponent(pw)}`)
      if (!res.ok) {
        if (res.status === 401) throw new Error('Contraseña incorrecta')
        throw new Error('Error al cargar datos')
      }
      const json = await res.json()
      setData(json)
      setAuthenticated(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = (e) => {
    e.preventDefault()
    fetchData(password)
  }

  // Auto-refresh every 30s
  useEffect(() => {
    if (!authenticated) return
    const interval = setInterval(() => fetchData(password), 30000)
    return () => clearInterval(interval)
  }, [authenticated, password])

  if (!authenticated) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center bg-bg" style={{ padding: '20px' }}>
        <h1 className="font-heading text-2xl font-bold text-navy" style={{ marginBottom: '20px' }}>
          Admin Dashboard
        </h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-3 w-full max-w-[300px]">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="bg-bg-card border border-border rounded-xl text-[0.9rem] text-navy"
            style={{ padding: '12px 16px' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-navy text-white rounded-xl font-semibold text-[0.9rem]"
            style={{ padding: '12px 16px' }}
          >
            {loading ? 'Cargando...' : 'Entrar'}
          </button>
          {error && <p className="text-[0.85rem] text-center" style={{ color: '#B91C1C' }}>{error}</p>}
        </form>
      </div>
    )
  }

  const maxCount = Math.max(...Object.values(data.candidateCounts || {}), 1)

  return (
    <div className="h-dvh overflow-y-auto bg-bg" style={{ padding: '20px' }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: '24px' }}>
        <h1 className="font-heading text-xl font-bold text-navy">Dashboard</h1>
        <button
          onClick={() => navigate('/')}
          className="text-[0.8rem] text-text-secondary border border-border rounded-lg"
          style={{ padding: '6px 12px' }}
        >
          Volver
        </button>
      </div>

      {/* Total */}
      <div
        className="bg-bg-card border border-border rounded-2xl text-center"
        style={{ padding: '20px', marginBottom: '16px' }}
      >
        <p className="text-[0.75rem] text-text-secondary uppercase tracking-wider">Total preguntas</p>
        <p className="font-heading text-4xl font-bold text-navy" style={{ marginTop: '4px' }}>
          {data.totalQuestions}
        </p>
      </div>

      {/* Candidate counts */}
      <div
        className="bg-bg-card border border-border rounded-2xl"
        style={{ padding: '20px', marginBottom: '16px' }}
      >
        <p className="text-[0.8rem] font-semibold text-navy" style={{ marginBottom: '14px' }}>
          Preguntas por candidato
        </p>
        <div className="flex flex-col gap-3">
          {Object.entries(candidateNames).map(([id, name]) => {
            const count = data.candidateCounts?.[id] || 0
            const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
            return (
              <div key={id}>
                <div className="flex justify-between items-center" style={{ marginBottom: '4px' }}>
                  <span className="text-[0.8rem] text-navy-light">{name.split(' ')[0]}</span>
                  <span className="text-[0.8rem] font-semibold text-navy">{count}</span>
                </div>
                <div className="h-2 rounded-full bg-border/50 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: candidateColors[id],
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Comparisons */}
      {Object.keys(data.comparisonCounts || {}).length > 0 && (
        <div
          className="bg-bg-card border border-border rounded-2xl"
          style={{ padding: '20px', marginBottom: '16px' }}
        >
          <p className="text-[0.8rem] font-semibold text-navy" style={{ marginBottom: '14px' }}>
            Comparaciones más frecuentes
          </p>
          <div className="flex flex-col gap-2">
            {Object.entries(data.comparisonCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([pair, count]) => (
                <div key={pair} className="flex justify-between items-center">
                  <span className="text-[0.8rem] text-navy-light">{pair}</span>
                  <span
                    className="text-[0.75rem] font-semibold rounded-full"
                    style={{
                      backgroundColor: '#F0E6D0',
                      color: '#C5952E',
                      padding: '2px 10px',
                    }}
                  >
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Activity by day */}
      {Object.keys(data.questionsByDay || {}).length > 0 && (
        <div
          className="bg-bg-card border border-border rounded-2xl"
          style={{ padding: '20px', marginBottom: '16px' }}
        >
          <p className="text-[0.8rem] font-semibold text-navy" style={{ marginBottom: '14px' }}>
            Actividad por día
          </p>
          <div className="flex flex-col gap-1">
            {Object.entries(data.questionsByDay)
              .sort((a, b) => b[0].localeCompare(a[0]))
              .slice(0, 14)
              .map(([day, count]) => (
                <div key={day} className="flex justify-between items-center">
                  <span className="text-[0.75rem] text-text-secondary">{day}</span>
                  <span className="text-[0.8rem] font-semibold text-navy">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent questions */}
      <div
        className="bg-bg-card border border-border rounded-2xl"
        style={{ padding: '20px', marginBottom: '40px' }}
      >
        <p className="text-[0.8rem] font-semibold text-navy" style={{ marginBottom: '14px' }}>
          Preguntas recientes
        </p>
        <div className="flex flex-col gap-3">
          {data.recentQuestions?.map((q, i) => (
            <div key={i} className="border-b border-border/40 last:border-0" style={{ paddingBottom: '10px' }}>
              <div className="flex items-center gap-2" style={{ marginBottom: '4px' }}>
                <span
                  className="text-[0.7rem] font-semibold rounded-full"
                  style={{
                    backgroundColor: (candidateColors[q.candidate_id] || '#666') + '18',
                    color: candidateColors[q.candidate_id] || '#666',
                    padding: '2px 8px',
                  }}
                >
                  {q.candidate_id}
                </span>
                {q.is_comparison && (
                  <span
                    className="text-[0.65rem] rounded-full"
                    style={{
                      backgroundColor: '#F0E6D0',
                      color: '#C5952E',
                      padding: '2px 6px',
                    }}
                  >
                    vs {q.compared_with?.join(', ')}
                  </span>
                )}
                <span className="text-[0.65rem] text-text-secondary ml-auto">
                  {q.created_at ? new Date(q.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : ''}
                </span>
              </div>
              <p className="text-[0.8rem] text-navy-light">{q.question}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
