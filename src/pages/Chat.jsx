import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { candidates } from '../data/candidates'
import SourcesPanel, { SourcesList } from '../components/SourcesPanel'

const suggestedQuestions = [
  '¿Qué harás contra la corrupción y malversación de recursos públicos?',
  '¿Cuál es tu propuesta de seguridad?',
  '¿Qué harás por la educación?',
  '¿Cómo mejorarás la economía?',
  '¿Cuál es tu plan de salud?',
]

const ease = [0.22, 1, 0.36, 1]

const ERROR_MESSAGE = 'Lo siento, hubo un error al procesar tu pregunta. Por favor intenta de nuevo.'

export default function Chat() {
  const { candidateId } = useParams()
  const navigate = useNavigate()
  const candidateIndex = candidates.findIndex(c => c.id === candidateId)
  const candidate = candidates[candidateIndex]

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (messages.length === 0) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role === 'user') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  if (!candidate) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-5">
        <p className="label text-ink-mute">Casilla no encontrada</p>
        <button onClick={() => navigate('/')} className="border-[1.5px] border-ink px-4 py-2 font-semibold uppercase">
          Volver al tarjetón
        </button>
      </div>
    )
  }

  const firstName = candidate.name.split(' ')[0]
  const number = String(candidateIndex + 1).padStart(2, '0')
  const others = candidates.filter(c => c.id !== candidate.id)
  const busy = loading || streaming

  const sendMessage = async (text) => {
    if (!text.trim() || busy) return

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

      // Add empty assistant message that we'll fill via streaming
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      setLoading(false)
      setStreaming(true)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.text) {
              setMessages(prev => {
                const updated = [...prev]
                const last = updated[updated.length - 1]
                updated[updated.length - 1] = { ...last, content: last.content + parsed.text }
                return updated
              })
            }
          } catch {}
        }
      }
    } catch {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        // If we already started streaming, don't add a new message
        if (last?.role === 'assistant' && last.content) return prev
        if (last?.role === 'assistant') {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: ERROR_MESSAGE }
          return updated
        }
        return [...prev, { role: 'assistant', content: ERROR_MESSAGE }]
      })
    } finally {
      setLoading(false)
      setStreaming(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    inputRef.current?.blur()
    sendMessage(input)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 28, transition: { duration: 0.2 } }}
      transition={{ duration: 0.4, ease }}
      className="relative flex h-dvh overflow-hidden bg-paper"
      style={{ '--accent': candidate.color }}
    >
      {/* Desktop sidebar: the candidate's file stays in view */}
      <aside className="hidden w-[400px] flex-shrink-0 flex-col overflow-y-auto border-r-2 border-ink bg-paper-light lg:flex xl:w-[440px]">
        <div className="px-8 pt-7">
          <button
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-ink transition-colors hover:text-mark"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:-translate-x-1">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
            </svg>
            <span className="label">Volver al tarjetón</span>
          </button>
          <div className="perforation mt-5" />
        </div>

        <div className="px-8 pt-7">
          <CandidateFile candidate={candidate} number={number} />
        </div>

        <div className="px-8">
          <SectionLabel delay={0.55}>Compare con</SectionLabel>
          <CompareGrid others={others} onCompare={sendMessage} delay={0.6} />
        </div>

        <div className="px-8 pb-10">
          <SectionLabel delay={0.7}>Fuentes consultadas</SectionLabel>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75, duration: 0.4 }}>
            <SourcesList candidate={candidate} />
          </motion.div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="relative z-30 flex-shrink-0 bg-paper pt-[env(safe-area-inset-top)] lg:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => navigate('/')}
              aria-label="Volver al tarjetón"
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center border-[1.5px] border-ink text-ink transition-colors active:bg-ink active:text-paper"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
              </svg>
            </button>

            <div className="flex min-w-0 flex-1 items-center gap-2.5">
              <div className="h-10 w-10 flex-shrink-0 overflow-hidden border border-ink">
                <img src={candidate.photo} alt="" className="h-full w-full object-cover object-top" />
              </div>
              <div className="min-w-0">
                <h2 className="condensed truncate text-[1.2rem] font-extrabold uppercase leading-none text-ink">
                  {candidate.name}
                </h2>
                <p className="label mt-1 truncate text-ink-mute" style={{ letterSpacing: '0.04em' }}>
                  Nº {number} · {candidate.party}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSourcesOpen(true)}
              className="flex h-10 flex-shrink-0 items-center gap-1.5 border-[1.5px] border-ink px-3 text-ink transition-colors active:bg-ink active:text-paper"
            >
              <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.1em]">Fuentes</span>
              <span
                className="flex h-4 min-w-4 items-center justify-center px-1 font-mono text-[0.6rem] font-semibold text-white"
                style={{ backgroundColor: candidate.color }}
              >
                {candidate.sources.length}
              </span>
            </button>
          </div>
        </header>

        {/* Desktop header */}
        <header className="hidden flex-shrink-0 items-center justify-between px-10 py-5 lg:flex">
          <p className="label text-ink">
            Entrevista <span className="text-ink-mute">· {candidate.name} · Casilla Nº {number}</span>
          </p>
          <p className="label text-ink-mute">Elecciones presidenciales · Colombia 2026</p>
        </header>

        <div className="flex-shrink-0">
          <div className="h-[2px] bg-ink" />
          <motion.div
            className="h-[4px] origin-left"
            style={{ backgroundColor: candidate.color }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.15, duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
          />
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="px-5 pb-8 pt-6 lg:mx-auto lg:max-w-[760px] lg:px-10 lg:pb-12 lg:pt-14">
              <div className="lg:hidden">
                <CandidateFile candidate={candidate} number={number} />
              </div>

              {/* Desktop prompt */}
              <div className="hidden lg:block">
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="label mb-3 text-ink-mute"
                >
                  Usted entrevista a {candidate.name}
                </motion.p>
                <motion.h3
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.6, ease }}
                  className="condensed text-[4rem] font-black uppercase leading-[0.98] text-ink"
                >
                  ¿Qué quiere
                  <br />
                  preguntarle a {firstName}<span style={{ color: candidate.color }}>?</span>
                </motion.h3>
              </div>

              {/* Suggested questions */}
              <SectionLabel delay={0.55}>Pregúntele sobre</SectionLabel>
              <ol>
                {suggestedQuestions.map((q, i) => (
                  <motion.li
                    key={q}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.06, duration: 0.45, ease }}
                  >
                    <button
                      onClick={() => sendMessage(q)}
                      className="group flex w-full items-start gap-3 border-b border-rule py-3.5 text-left transition-colors active:bg-paper-deep lg:-mx-3 lg:w-[calc(100%+1.5rem)] lg:gap-5 lg:px-3 lg:py-4 lg:hover:bg-paper-deep"
                    >
                      <span className="pt-1 font-mono text-[0.7rem] font-semibold text-ink-mute lg:text-[0.75rem]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 font-serif text-[1.08rem] leading-snug text-ink lg:text-[1.3rem]">{q}</span>
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-1.5 flex-shrink-0 text-ink transition-transform group-hover:translate-x-1 lg:mt-2">
                        <path d="M1 7H12M12 7L7.5 2.5M12 7L7.5 11.5" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>
                  </motion.li>
                ))}
              </ol>

              <div className="lg:hidden">
                <SectionLabel delay={0.95}>Compare con</SectionLabel>
                <CompareGrid others={others} onCompare={sendMessage} delay={1} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-7 px-5 pb-6 pt-6 lg:mx-auto lg:max-w-[760px] lg:gap-10 lg:px-10 lg:pb-10 lg:pt-12">
              {messages.map((msg, i) => {
                const isLast = i === messages.length - 1
                return msg.role === 'user' ? (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease }}
                    className="flex flex-col items-end"
                  >
                    <p className="label mb-1.5 text-ink-mute">Tu pregunta</p>
                    <div className="max-w-[86%] bg-ink px-4 py-3 text-[1rem] font-medium leading-snug text-paper lg:max-w-[75%] lg:px-5 lg:py-3.5 lg:text-[1.1rem]">
                      {msg.content}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AnswerLabel candidate={candidate} />
                    <div className="answer-markdown border-l-[3px] pl-4 lg:pl-6" style={{ borderColor: candidate.color }}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                      {isLast && streaming && <span className="caret" style={{ color: candidate.color }} />}
                    </div>
                  </motion.div>
                )
              })}

              {/* Waiting for the first token */}
              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <AnswerLabel candidate={candidate} />
                    <div className="border-l-[3px] pl-4 lg:pl-6" style={{ borderColor: candidate.color }}>
                      <p className="font-serif text-[1.05rem] italic text-ink-mute">Consultando su plan de gobierno</p>
                      <div className="mt-2.5 h-[3px] w-40 overflow-hidden bg-rule">
                        <motion.div
                          className="h-full w-1/3"
                          style={{ backgroundColor: candidate.color }}
                          animate={{ x: ['-100%', '300%'] }}
                          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t-2 border-ink bg-paper px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:px-10 lg:py-5">
          <form onSubmit={handleSubmit} className="flex items-stretch lg:mx-auto lg:max-w-[680px]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Pregúntele a ${firstName}…`}
              aria-label={`Escribe tu pregunta para ${candidate.name}`}
              className="min-w-0 flex-1 border-[1.5px] border-r-0 border-ink bg-paper-light px-4 py-3 text-ink placeholder:text-ink-mute/70 focus:bg-white lg:px-5 lg:py-4"
            />
            <button
              type="submit"
              disabled={!input.trim() || busy}
              aria-label="Enviar pregunta"
              className="flex w-12 flex-shrink-0 items-center justify-center border-[1.5px] border-ink text-paper transition-[background-color,opacity] active:opacity-80 disabled:bg-ink/25 disabled:text-paper lg:w-16"
              style={{ backgroundColor: input.trim() && !busy ? candidate.color : undefined }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 9H15M15 9L9.5 3.5M15 9L9.5 14.5" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <SourcesPanel isOpen={sourcesOpen} onClose={() => setSourcesOpen(false)} candidate={candidate} />
    </motion.div>
  )
}

// Photo, name, party and slogan — the candidate's "file"
function CandidateFile({ candidate, number }) {
  const firstName = candidate.name.split(' ')[0]
  const lastName = candidate.name.split(' ').slice(1).join(' ')

  return (
    <>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="label mb-4 text-ink-mute"
      >
        Ficha del candidato · Casilla Nº {number}
      </motion.p>

      <div className="flex gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6, ease }}
          className="relative h-[136px] w-[108px] flex-shrink-0"
        >
          <div className="h-full w-full overflow-hidden border-[1.5px] border-ink">
            <img src={candidate.photo} alt={candidate.name} className="h-full w-full object-cover object-top" />
          </div>
          {/* Crop marks */}
          {['-left-2 -top-2 border-l border-t', '-right-2 -top-2 border-r border-t', '-left-2 -bottom-2 border-l border-b', '-right-2 -bottom-2 border-r border-b'].map(pos => (
            <span key={pos} className={`absolute h-3 w-3 border-ink-mute ${pos}`} aria-hidden="true" />
          ))}
        </motion.div>

        <div className="flex min-w-0 flex-1 flex-col justify-end">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.5, ease }}
            className="condensed text-[1.3rem] font-semibold uppercase leading-none text-ink-soft"
          >
            {firstName}
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.5, ease }}
            className="condensed mt-1 text-[2.4rem] font-black uppercase leading-[0.85] text-ink"
          >
            {lastName}
          </motion.h3>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-3 self-start px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold uppercase tracking-wider text-white"
            style={{ backgroundColor: candidate.color }}
          >
            {candidate.party}
          </motion.span>
        </div>
      </div>

      {/* Slogan */}
      <motion.blockquote
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6, ease }}
        className="relative mt-7 pl-7"
      >
        <span
          className="absolute -top-3 left-0 font-serif text-[3.2rem] leading-none"
          style={{ color: candidate.color }}
          aria-hidden="true"
        >
          “
        </span>
        <p className="font-serif text-[1.45rem] italic leading-tight text-ink">{candidate.slogan}</p>
      </motion.blockquote>
    </>
  )
}

function CompareGrid({ others, onCompare, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.5 }}
      className="grid grid-cols-4 gap-2.5 pt-2"
    >
      {others.map(other => (
        <button
          key={other.id}
          onClick={() => onCompare(`¿En qué se diferencian tus propuestas de las de ${other.name}?`)}
          aria-label={`Comparar con ${other.name}`}
          className="group flex min-w-0 flex-col items-start text-left active:opacity-70"
        >
          <div className="relative aspect-square w-full overflow-hidden border border-ink">
            <img
              src={other.photo}
              alt=""
              className="h-full w-full object-cover object-top grayscale transition-[filter,transform] duration-300 group-hover:scale-105 group-hover:grayscale-0"
            />
            <span
              className="absolute bottom-0 left-0 px-1 font-mono text-[0.55rem] font-semibold text-white"
              style={{ backgroundColor: other.color }}
            >
              VS
            </span>
          </div>
          <span className="condensed mt-1.5 text-[0.85rem] font-bold uppercase leading-[0.95] text-ink">
            {other.shortName}
          </span>
        </button>
      ))}
    </motion.div>
  )
}

function SectionLabel({ children, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.4 }}
      className="mb-1 mt-9 flex items-center gap-3"
    >
      <span className="label text-ink">{children}</span>
      <span className="h-[1.5px] flex-1 bg-ink" />
    </motion.div>
  )
}

function AnswerLabel({ candidate }) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <div className="h-6 w-6 overflow-hidden border border-ink">
        <img src={candidate.photo} alt="" className="h-full w-full object-cover object-top" />
      </div>
      <p className="label text-ink">
        {candidate.name.split(' ')[0]} <span className="text-ink-mute">responde</span>
      </p>
    </div>
  )
}
