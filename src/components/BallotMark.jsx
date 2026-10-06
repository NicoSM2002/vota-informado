import { motion } from 'framer-motion'

// Hand-drawn "X", like a voter marking the ballot with a pen
export default function BallotMark({ color = 'var(--color-mark)', strokeWidth = 7, className = '' }) {
  const stroke = {
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" style={{ mixBlendMode: 'multiply' }}>
      <motion.path
        d="M16 18 C 30 30, 44 46, 56 58 S 78 80, 86 85"
        {...stroke}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, ease: [0.6, 0, 0.4, 1] }}
      />
      <motion.path
        d="M82 14 C 70 28, 58 40, 47 53 S 26 76, 18 88"
        {...stroke}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.2, delay: 0.2, ease: [0.6, 0, 0.4, 1] }}
      />
    </svg>
  )
}
