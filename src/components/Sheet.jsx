import { useEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'

// Bottom sheet styled as a torn-off annex of the ballot
export default function Sheet({ isOpen, onClose, eyebrow, title, children }) {
  const dragControls = useDragControls()

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-40 bg-ink/40"
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
            className="absolute bottom-0 left-0 right-0 z-50 flex max-h-[82dvh] flex-col bg-paper-light"
            style={{ boxShadow: '0 -20px 50px -10px rgba(22,19,15,0.35)' }}
          >
            {/* Torn perforated edge */}
            <div
              className="absolute -top-[7px] left-0 right-0 h-[8px]"
              style={{
                background:
                  'radial-gradient(circle at 6px 0, transparent 4px, var(--color-paper-light) 4.5px) 0 0 / 12px 8px repeat-x',
              }}
            />

            <div
              className="flex-shrink-0 touch-none px-5 pb-4 pt-5"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="mx-auto mb-4 h-1 w-9 bg-rule" />
              <div className="flex items-start justify-between gap-4">
                <div>
                  {eyebrow && <p className="label mb-1.5 text-mark">{eyebrow}</p>}
                  <h3 className="condensed text-[2rem] font-extrabold uppercase leading-[0.9] text-ink">
                    {title}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center border-[1.5px] border-ink text-ink transition-colors active:bg-ink active:text-paper"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </button>
              </div>
              <div className="mt-4 h-[2px] bg-ink" />
            </div>

            <div className="overflow-y-auto px-5 pb-[max(2rem,env(safe-area-inset-bottom))]">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
