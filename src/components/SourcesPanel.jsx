import { motion, AnimatePresence } from 'framer-motion'

export default function SourcesPanel({ isOpen, onClose, candidate }) {
  if (!candidate) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-bg-card rounded-t-3xl
              shadow-[0_-4px_24px_rgba(0,0,0,0.1)] max-h-[75dvh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="pb-10" style={{ paddingLeft: '15px', paddingRight: '15px' }}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-heading text-xl font-bold text-navy">Fuentes</h3>
                  <p className="text-[0.8rem] text-text-secondary mt-1">
                    Información de {candidate.name}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-full bg-bg flex items-center justify-center
                    hover:bg-border transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="#5A6B8A" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* Divider */}
              <div
                className="h-0.5 rounded-full mb-6"
                style={{ backgroundColor: candidate.colorLight }}
              />

              {/* Source list */}
              <div className="flex flex-col gap-3">
                {candidate.sources.map((source, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-4 rounded-xl bg-bg border border-border/50"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: candidate.colorLight }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path
                          d="M2.33 3.5V11.67H11.67V5.83H7V3.5H2.33Z"
                          stroke={candidate.color}
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.85rem] font-medium text-navy-light leading-snug">
                        {source.name}
                      </p>
                      <p className="text-[0.75rem] text-text-secondary mt-1">
                        {source.type}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <p className="text-[0.7rem] text-text-secondary text-center mt-8 leading-relaxed opacity-70">
                Las respuestas se generan a partir de los planes de gobierno oficiales publicados por cada candidato.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
