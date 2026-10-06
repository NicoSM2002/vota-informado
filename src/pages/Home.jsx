import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { candidates } from '../data/candidates'
import CandidateCell from '../components/CandidateCell'
import BallotMark from '../components/BallotMark'
import FlagRule from '../components/FlagRule'
import Sheet from '../components/Sheet'

const ease = [0.22, 1, 0.36, 1]

const rise = (delay) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.6, ease },
})

// Deterministic barcode bars for the ballot footer
const barcode = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 1, 2, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2]

export default function Home() {
  const navigate = useNavigate()
  const [marked, setMarked] = useState(null)
  const [blankOpen, setBlankOpen] = useState(false)

  const mark = (id) => {
    if (marked) return
    setMarked(id)
    navigator.vibrate?.(12)
    if (id === 'blanco') {
      setTimeout(() => setBlankOpen(true), 520)
    } else {
      setTimeout(() => navigate(`/chat/${id}`), 640)
    }
  }

  const closeBlank = useCallback(() => {
    setBlankOpen(false)
    setMarked(null)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -16, transition: { duration: 0.25 } }}
      transition={{ duration: 0.3 }}
      className="relative h-dvh"
    >
      <div className="h-full overflow-y-auto lg:flex lg:flex-col lg:p-6">
        {/* On desktop the ballot is a printed sheet lying on the desk, sized to fit the screen */}
        <div className="relative lg:mx-auto lg:my-auto lg:flex lg:min-h-[min(100%,980px)] lg:w-full lg:flex-shrink-0 lg:max-w-[1680px] lg:flex-col lg:bg-paper lg:shadow-[0_1px_0_rgba(22,19,15,0.08),0_30px_70px_-25px_rgba(22,19,15,0.45)]">
          {/* Ballot stub */}
          <motion.div {...rise(0)} className="px-5 pt-[max(1rem,env(safe-area-inset-top))] lg:px-10 lg:pt-3">
            <div className="flex items-center justify-between py-2">
              <span className="label text-ink-mute">Tarjetón informativo</span>
              <span className="label text-ink-mute">Nº 2026—0001</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 text-ink-mute" aria-hidden="true">
                <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8.5 7.5L20 18M8.5 16.5L20 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <div className="perforation flex-1" />
            </div>
          </motion.div>

          {/* Masthead */}
          <header className="guilloche relative mt-4 px-5 pb-6 pt-5 lg:mt-2 lg:px-10 lg:pb-6 lg:pt-5">
            <div className="lg:grid lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
              <div>
                <motion.p {...rise(0.08)} className="label mb-3 text-ink-soft">
                  Elecciones presidenciales · Colombia 2026
                </motion.p>

                {/* Sized to the container so "INFORMADO." always fits the width */}
                <h1 className="condensed @container text-ink">
                  <span className="block text-[20.5cqw] font-black uppercase leading-[0.8] tracking-[-0.01em] lg:text-[min(12.5cqw,7.5rem)] lg:leading-[0.85]">
                    <motion.span {...rise(0.14)} className="block lg:inline-block">
                      Vota
                    </motion.span>{' '}
                    <motion.span {...rise(0.22)} className="block lg:inline-block">
                      Informado<span className="text-mark">.</span>
                    </motion.span>
                  </span>
                </h1>

                <div className="lg:hidden">
                  <FlagRule height={7} delay={0.4} className="mt-5" />
                </div>

                <motion.p
                  {...rise(0.5)}
                  className="mt-4 font-serif text-title italic leading-snug text-ink-soft lg:hidden"
                >
                  Conoce a tu candidato, infórmate y&nbsp;vota&nbsp;bien.
                </motion.p>
              </div>

              {/* Desktop right column */}
              <div className="hidden lg:block">
                <motion.p {...rise(0.4)} className="mb-5 font-serif text-title italic leading-[1.15] text-ink-soft">
                  Conoce a tu candidato, infórmate y&nbsp;vota&nbsp;bien.
                </motion.p>
                <Instructions delay={0.5} />
              </div>
            </div>

            <div className="hidden lg:block">
              <FlagRule height={8} delay={0.45} className="mt-6" />
            </div>
          </header>

          <div className="mx-5 mb-5 lg:hidden">
            <Instructions delay={0.58} />
          </div>

          {/* The ballot grid */}
          <div className="mx-5 border-2 border-ink bg-ink lg:mx-10 lg:flex lg:flex-1 lg:flex-col">
            <div className="grid grid-cols-2 gap-px lg:flex-1 lg:grid-cols-6">
              {candidates.map((candidate, i) => (
                <motion.div
                  key={candidate.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.66 + i * 0.07, duration: 0.55, ease }}
                  className="bg-paper-light lg:min-h-0"
                >
                  <CandidateCell
                    candidate={candidate}
                    number={i + 1}
                    marked={marked === candidate.id}
                    dimmed={marked !== null && marked !== candidate.id}
                    onMark={() => mark(candidate.id)}
                  />
                </motion.div>
              ))}

              {/* Voto en blanco — every Colombian ballot has one */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.66 + candidates.length * 0.07, duration: 0.55, ease }}
                className="bg-paper-light lg:min-h-0"
              >
                <motion.button
                  onClick={() => mark('blanco')}
                  whileTap={{ scale: 0.97 }}
                  animate={{ opacity: marked && marked !== 'blanco' ? 0.35 : 1 }}
                  aria-label="Qué es el voto en blanco"
                  className="relative flex h-full w-full flex-col p-3 text-left"
                >
                  <div className="mb-2.5 flex items-center justify-between">
                    <span className="font-mono text-meta font-semibold text-ink">VB</span>
                    <span className="flex h-[22px] w-[22px] items-center justify-center border border-ink font-mono text-meta">
                      ?
                    </span>
                  </div>
                  <div className="relative flex aspect-[4/5] w-full items-center justify-center border border-dashed border-ink-mute lg:aspect-auto lg:min-h-[120px] lg:flex-1">
                    <span className="condensed text-center text-title font-extrabold uppercase leading-[0.9] text-ink">
                      Voto
                      <br />
                      en blanco
                    </span>
                    {marked === 'blanco' && (
                      <BallotMark className="absolute inset-[-6%] h-[112%] w-[112%]" strokeWidth={8} />
                    )}
                  </div>
                  <p className="mt-2.5 flex-1 font-serif text-small italic leading-snug text-ink-soft lg:flex-none">
                    ¿Qué significa votar en blanco?
                  </p>
                </motion.button>
              </motion.div>
            </div>
          </div>

          {/* Footer */}
          <motion.footer {...rise(1.1)} className="relative px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-10 lg:flex lg:flex-shrink-0 lg:items-center lg:gap-10 lg:px-10 lg:py-5">
            <div
              className="absolute right-6 top-6 rotate-[-8deg] border-2 border-mark px-2.5 py-1.5 text-mark opacity-80 lg:static lg:order-2 lg:flex-shrink-0"
              aria-hidden="true"
            >
              <p className="condensed text-body font-extrabold uppercase leading-none">No válido</p>
              <p className="condensed text-body font-extrabold uppercase leading-none">como voto</p>
            </div>

            <div className="lg:order-1 lg:flex-1">
              <p className="max-w-[230px] font-serif text-body leading-snug text-ink-soft lg:max-w-none">
                Información basada en los planes de gobierno oficiales de cada candidato.
              </p>
              <p className="label mt-3 text-ink-mute lg:mt-1">Sin afiliación política</p>
            </div>

            <div className="mt-8 h-[2px] bg-ink lg:hidden" />

            <div className="mt-4 flex items-end justify-between gap-4 lg:order-3 lg:mt-0 lg:gap-8">
              <div>
                <p className="label text-ink-mute">Creado por</p>
                <p className="mt-1 text-body font-semibold text-ink">Juan Nicolás Saravia</p>
                <a href="mailto:juansaravia2002@gmail.com" className="mt-0.5 block font-mono text-small text-ink-soft underline decoration-rule underline-offset-2">
                  juansaravia2002@gmail.com
                </a>
              </div>
              <div className="flex h-9 items-stretch gap-[1.5px]" aria-hidden="true">
                {barcode.map((w, i) => (
                  <div key={i} className={i % 2 ? 'bg-transparent' : 'bg-ink'} style={{ width: w }} />
                ))}
              </div>
            </div>
          </motion.footer>
        </div>
      </div>

      <Sheet isOpen={blankOpen} onClose={closeBlank} eyebrow="Casilla VB" title="Voto en blanco">
        <div className="font-serif text-read leading-relaxed text-ink-soft">
          <p>
            Votar en blanco es una forma de participar <strong className="font-semibold text-ink">sin apoyar a ningún
            candidato</strong>. Es una opción válida que aparece en todos los tarjetones.
          </p>
          <ul className="mt-5 flex flex-col gap-4 border-l-2 border-ink pl-4">
            <li>
              <p className="label mb-1 text-ink">Cuenta como voto válido</p>
              No es lo mismo que un voto nulo (mal marcado) ni que la abstención (no ir a votar).
            </li>
            <li>
              <p className="label mb-1 text-ink">Puede repetir la elección</p>
              Si en la primera vuelta presidencial el voto en blanco obtiene la mayoría de los votos válidos, la votación
              se repite una sola vez (artículo 258 de la Constitución).
            </li>
            <li>
              <p className="label mb-1 text-ink">Es un mensaje</p>
              Expresa inconformidad con las opciones disponibles, sin dejar de ejercer tu derecho.
            </li>
          </ul>
          <button
            onClick={closeBlank}
            className="mt-7 w-full bg-ink py-3.5 font-display text-body font-semibold uppercase tracking-wide text-paper active:opacity-80"
          >
            Ver candidatos
          </button>
        </div>
      </Sheet>
    </motion.div>
  )
}

function Instructions({ delay }) {
  return (
    <motion.div {...rise(delay)} className="flex border-[1.5px] border-ink bg-paper">
      <div className="flex items-center bg-ink px-2.5">
        <span className="label rotate-180 text-paper [writing-mode:vertical-rl]">Instrucciones</span>
      </div>
      <p className="flex-1 px-3.5 py-3 text-body leading-snug text-ink-soft lg:px-5 lg:py-4">
        Marque con una <strong className="font-bold text-mark">X</strong> la casilla del candidato con quien quiere
        conversar. Responde con base en su plan de gobierno oficial.
      </p>
    </motion.div>
  )
}
