import Sheet from './Sheet'

export function SourcesList({ candidate }) {
  return (
    <ol className="flex flex-col">
      {candidate.sources.map((source, i) => (
        <li key={i} className="flex gap-3.5 border-b border-rule py-3.5 last:border-b-0">
          <span className="pt-0.5 font-mono text-[0.75rem] font-semibold" style={{ color: candidate.color }}>
            [{String(i + 1).padStart(2, '0')}]
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-[1.02rem] leading-snug text-ink">{source.name}</p>
            <p className="label mt-1.5 text-ink-mute">{source.type}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function SourcesPanel({ isOpen, onClose, candidate }) {
  if (!candidate) return null

  return (
    <Sheet isOpen={isOpen} onClose={onClose} eyebrow={`Anexo · ${candidate.name}`} title="Fuentes consultadas">
      <SourcesList candidate={candidate} />

      <p className="mt-5 border-t-2 border-ink pt-4 font-serif text-[0.9rem] italic leading-snug text-ink-mute">
        Las respuestas se generan a partir de los planes de gobierno oficiales publicados por cada candidato.
      </p>
    </Sheet>
  )
}
