import { useEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import useMediaQuery, { DESKTOP_QUERY } from '../hooks/useMediaQuery'

// Torn-off annex of the ballot: a bottom sheet on mobile, a centered card on desktop
export default function Sheet({ isOpen, onClose, eyebrow, title, children }) {
  const dragControls = useDragControls()
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const hidden = isDesktop ? { opacity: 0, y: 28, scale: 0.98 } : { y: '100%' }
  const shown = isDesktop ? { opacity: 1, y: 0, scale: 1 } : { y: 0 }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-40 bg-ink/40 lg:bg-ink/55"
            onClick={onClose}
          />

          <div className="pointer-events-none absolute inset-0 z-50 flex items-end lg:items-center lg:justify-center lg:p-8">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={title}
              initial={hidden}
              animate={shown}
              exit={hidden}
              transition={isDesktop ? { duration: 0.35, ease: [0.22, 1, 0.36, 1] } : { type: 'spring', damping: 32, stiffness: 320 }}
              drag={isDesktop ? false : 'y'}
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) onClose()
              }}
              className="pointer-events-auto relative flex max-h-[82dvh] w-full flex-col bg-paper-light lg:max-w-[560px]"
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
                className="flex-shrink-0 touch-none px-5 pb-4 pt-5 lg:touch-auto lg:px-8 lg:pt-8"
                onPointerDown={(e) => !isDesktop && dragControls.start(e)}
              >
                <div className="mx-auto mb-4 h-1 w-9 bg-rule lg:hidden" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {eyebrow && <p className="label mb-1.5 text-mark">{eyebrow}</p>}
                    <h3 className="condensed text-[2rem] font-extrabold uppercase leading-[0.9] text-ink lg:text-[2.5rem]">
                      {title}
                    </h3>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center border-[1.5px] border-ink text-ink transition-colors hover:bg-ink hover:text-paper active:bg-ink active:text-paper"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M1.5 1.5L10.5 10.5M10.5 1.5L1.5 10.5" stroke="currentColor" strokeWidth="1.8" />
                    </svg>
                  </button>
                </div>
                <div className="mt-4 h-[2px] bg-ink" />
              </div>

              <div className="overflow-y-auto px-5 pb-[max(2rem,env(safe-area-inset-bottom))] lg:px-8 lg:pb-8">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
