import { motion } from 'framer-motion'

// Colombian tricolor in its real 2:1:1 proportion
export default function FlagRule({ height = 6, delay = 0, className = '' }) {
  return (
    <motion.div
      className={`flex w-full origin-left ${className}`}
      style={{ height }}
      initial={{ scaleX: 0 }}
      animate={{ scaleX: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.7, 0, 0.2, 1] }}
      aria-hidden="true"
    >
      <div className="bg-flag-yellow" style={{ flex: 2 }} />
      <div className="bg-flag-blue" style={{ flex: 1 }} />
      <div className="bg-flag-red" style={{ flex: 1 }} />
    </motion.div>
  )
}
