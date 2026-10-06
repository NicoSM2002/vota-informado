import { motion } from 'framer-motion'
import BallotMark from './BallotMark'

function splitName(name) {
  const parts = name.split(' ')
  return [parts[0], parts.slice(1).join(' ')]
}

// One box of the ballot. `marked` draws the X over it.
export default function CandidateCell({ candidate, number, marked, dimmed, onMark }) {
  const [first, rest] = splitName(candidate.name)

  return (
    <motion.button
      onClick={onMark}
      whileTap={{ scale: 0.97 }}
      animate={{ opacity: dimmed ? 0.35 : 1 }}
      transition={{ duration: 0.25 }}
      aria-label={`Conversar con ${candidate.name}`}
      className="group relative flex h-full w-full flex-col bg-paper-light p-3 text-left"
    >
      {/* Number + party emblem */}
      <div className="mb-2.5 flex items-center justify-between">
        <span className="font-mono text-meta font-semibold text-ink">
          {String(number).padStart(2, '0')}
        </span>
        <span
          className="flex h-[22px] min-w-[30px] items-center justify-center px-1.5 font-mono text-meta font-semibold tracking-wider text-white"
          style={{ backgroundColor: candidate.color }}
        >
          {candidate.partyShort}
        </span>
      </div>

      {/* Photo — the area you "mark" */}
      <div className="relative aspect-[4/5] w-full overflow-hidden border border-ink lg:aspect-auto lg:min-h-[120px] lg:flex-1">
        <img
          src={candidate.photo}
          alt=""
          className="h-full w-full object-cover object-top transition-[filter,transform] duration-500 group-hover:scale-[1.04]"
          style={{ filter: marked ? 'grayscale(0)' : 'grayscale(0.15) contrast(1.02)' }}
        />
        {/* Candidate color wash at the base */}
        <div
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{ background: `linear-gradient(to top, ${candidate.color}55, transparent)` }}
        />
        {marked && <BallotMark className="absolute inset-[-6%] h-[112%] w-[112%]" strokeWidth={8} />}
      </div>

      {/* Name */}
      <div className="mt-2.5 flex-1 lg:flex-none">
        <p className="condensed text-body font-semibold uppercase leading-none text-ink-soft">{first}</p>
        <p className="condensed mt-0.5 text-title font-extrabold uppercase leading-[0.92] text-ink">{rest}</p>
      </div>

      <p className="label mt-2 leading-snug text-ink-mute lg:min-h-[2.75em]">
        {candidate.party}
      </p>
    </motion.button>
  )
}
