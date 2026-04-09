import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { candidates } from '../data/candidates'
import SourcesPanel from '../components/SourcesPanel'

const suggestedQuestions = [
  '¿Cuál es tu propuesta de seguridad?',
  '¿Qué harás por la educación?',
  '¿Cómo mejorarás la economía?',
  '¿Cuál es tu plan de salud?',
]

export default function Chat() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const candidate = candidates.find(c => c.id === candidateId)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!candidate) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-5">
        <p className="text-text-secondary">Candidato no encontrado</p>
      </div>
    )
  }

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return

    const userMessage = { role: 'user', content: text.trim() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId: candidate.id,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })

      if (!res.ok) throw new Error('Error en la respuesta')

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Lo siento, hubo un error al procesar tu pregunta. Por favor intenta de nuevo.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3 }}
      className="min-h-dvh flex flex-col bg-bg"
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl border-b border-border/60"
        style={{ backgroundColor: 'rgba(245, 240, 232, 0.85)' }}
      >
        <div className="flex items-center gap-3 px-5 py-3.5">
          {/* Back button */}
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full bg-bg-card border border-border flex items-center justify-center
              hover:bg-border/50 transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8L10 12" stroke="#1B2A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Candidate info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2"
              style={{ borderColor: candidate.color }}
            >
              <img src={candidate.photo} alt={candidate.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h2 className="font-heading text-sm font-bold text-navy truncate">{candidate.name}</h2>
              <p className="text-[0.65rem] text-text-secondary truncate">{candidate.party}</p>
            </div>
          </div>

          {/* Sources button */}
          <button
            onClick={() => setSourcesOpen(true)}
            className="flex items-center gap-1.5 px-3 h-9 rounded-full
              border transition-colors flex-shrink-0"
            style={{
              backgroundColor: candidate.colorLight,
              borderColor: candidate.color + '30',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 2.5H6.5L8 4.5H13V12.5H3V2.5Z"
                stroke={candidate.color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M6 8H10M6 10H9" stroke={candidate.color} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span className="text-[0.65rem] font-semibold" style={{ color: candidate.color }}>
              Fuentes
            </span>
          </button>
        </div>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60dvh]">
            {/* Welcome */}
            <div
              className="w-20 h-20 rounded-2xl overflow-hidden mb-5 shadow-lg"
              style={{ boxShadow: `0 4px 20px ${candidate.color}25` }}
            >
              <img src={candidate.photo} alt={candidate.name} className="w-full h-full object-cover" />
            </div>
            <h3 className="font-heading text-xl font-bold text-navy mb-1.5">
              Pregúntale a {candidate.name.split(' ')[0]}
            </h3>
            <p className="text-[0.85rem] text-text-secondary text-center max-w-[270px] mb-10 leading-relaxed">
              Haz cualquier pregunta sobre sus propuestas y plan de gobierno
            </p>

            {/* Suggested questions */}
            <div className="flex flex-col gap-3 w-full max-w-[320px]">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="text-left text-[0.875rem] px-5 py-4 rounded-xl bg-bg-card border border-border
                    hover:border-gold/50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]
                    active:scale-[0.98] transition-all duration-200 text-navy-light"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-2">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div
                    className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mr-2 mt-1 border"
                    style={{ borderColor: candidate.color + '40' }}
                  >
                    <img src={candidate.photo} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] px-4 py-3 text-[0.85rem] leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-2xl rounded-br-md text-white'
                      : 'rounded-2xl rounded-bl-md bg-bg-card border border-border/60 text-navy-light'
                  }`}
                  style={msg.role === 'user' ? { backgroundColor: candidate.color } : {}}
                >
                  {msg.role === 'assistant' ? (
                    <div className="chat-markdown">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 mr-2 mt-1 border"
                  style={{ borderColor: candidate.color + '40' }}
                >
                  <img src={candidate.photo} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="bg-bg-card border border-border/60 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5 items-center h-5">
                    {[0, 1, 2].map(j => (
                      <div
                        key={j}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{
                          backgroundColor: candidate.color,
                          opacity: 0.6,
                          animationDelay: `${j * 0.15}s`,
                          animationDuration: '0.8s',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div
        className="sticky bottom-0 border-t border-border/60 backdrop-blur-xl px-6 py-4"
        style={{ backgroundColor: 'rgba(245, 240, 232, 0.9)' }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu pregunta..."
            disabled={loading}
            className="flex-1 bg-bg-card border border-border rounded-xl px-4 py-3
              text-[0.85rem] text-navy placeholder-text-secondary/50
              focus:border-gold/60 focus:ring-2 focus:ring-gold/10 transition-all
              disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-11 h-11 rounded-xl flex items-center justify-center
              text-white transition-all disabled:opacity-30 active:scale-95 flex-shrink-0"
            style={{ backgroundColor: candidate.color }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 9H15M15 9L10 4M15 9L10 14"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </form>
      </div>

      {/* Sources Panel */}
      <SourcesPanel
        isOpen={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        candidate={candidate}
      />
    </motion.div>
  )
}
