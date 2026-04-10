import { motion } from 'framer-motion'
import { candidates } from '../data/candidates'
import CandidateCard from '../components/CandidateCard'

const colombianFlag = (
  <div className="flex justify-center gap-1.5 mb-6">
    <div className="w-8 h-1 rounded-full bg-[#FCD116]" />
    <div className="w-8 h-1 rounded-full bg-[#003893]" />
    <div className="w-8 h-1 rounded-full bg-[#CE1126]" />
  </div>
)

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-dvh pb-14 pt-14"
      style={{ paddingLeft: '15px', paddingRight: '15px' }}
    >
      {/* Header */}
      <header className="text-center mb-10" style={{ paddingLeft: '20px', paddingRight: '20px' }}>
        {colombianFlag}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="font-heading text-[2.5rem] leading-[1.1] font-bold text-navy tracking-tight mb-5"
        >
          Vota Informado
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="text-text-secondary text-base leading-relaxed mx-auto"
        >
          Conoce a tu candidato,<br />infórmate y&nbsp;vota&nbsp;bien.
        </motion.p>
      </header>

      {/* Candidate label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex items-center gap-3 mb-8 px-1"
      >
        <div className="h-px flex-1 bg-border" />
        <span className="text-[0.7rem] uppercase tracking-[0.2em] text-text-secondary font-semibold whitespace-nowrap">
          Candidatos 2026
        </span>
        <div className="h-px flex-1 bg-border" />
      </motion.div>

      {/* Candidate Cards */}
      <div className="flex flex-col gap-4">
        {candidates.map((candidate, i) => (
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <CandidateCard candidate={candidate} />
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-12 text-center"
      >
        <div className="h-px bg-border mb-5" />
        <p className="text-[0.75rem] text-text-secondary leading-relaxed">
          Información basada en los planes de gobierno<br />oficiales de cada candidato.
        </p>
        <p className="text-[0.7rem] text-text-secondary leading-relaxed mt-1 opacity-70">
          Este proyecto no tiene afiliación política.
        </p>
        <div className="mt-4">
          <p className="text-[0.75rem] text-text-secondary leading-relaxed">
            Creado por: Juan Nicolás Saravia
          </p>
          <p className="text-[0.75rem] text-text-secondary leading-relaxed">
            Correo: juansaravia2002@gmail.com
          </p>
        </div>
      </motion.footer>
    </motion.div>
  )
}
