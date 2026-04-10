import { useNavigate } from 'react-router-dom'

export default function CandidateCard({ candidate }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(`/chat/${candidate.id}`)}
      className="group w-full bg-bg-card rounded-2xl border border-border
        overflow-hidden flex items-center gap-4 p-4
        shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]
        hover:shadow-[0_2px_8px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]
        active:scale-[0.98] transition-all duration-300 cursor-pointer text-left"
    >
      {/* Photo */}
      <div
        className="relative w-[68px] h-[68px] rounded-xl overflow-hidden flex-shrink-0"
        style={{ boxShadow: `0 2px 12px ${candidate.color}20` }}
      >
        <img
          src={candidate.photo}
          alt={candidate.name}
          className="w-full h-full object-cover"
        />
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${candidate.color}15, transparent 60%)`,
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-heading text-[1.1rem] font-semibold text-navy-light leading-tight mb-1 truncate">
          {candidate.name}
        </h3>
        <p className="text-[0.8rem] text-text-secondary leading-snug truncate">
          {candidate.party}
        </p>
        <p
          className="text-[0.75rem] font-medium mt-1.5 leading-snug truncate italic"
          style={{ color: candidate.color }}
        >
          "{candidate.slogan}"
        </p>
      </div>

      {/* Arrow */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center
          transition-all duration-300 group-hover:translate-x-0.5 ml-1"
        style={{ backgroundColor: candidate.colorLight }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="transition-transform duration-300 group-hover:translate-x-0.5">
          <path
            d="M5.25 3.5L8.75 7L5.25 10.5"
            stroke={candidate.color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </button>
  )
}
