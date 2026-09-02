import type { CurrentBrew } from '../../../domain/brew'
import type { BrewStore, MutationResult } from '../../../state/brew-store'
import { NumberField } from '../../../ui/NumberField'
import { cardClasses } from './styles'

interface HopScheduleProps {
  hops: CurrentBrew['hops']
  syncVersion: number
  updateHop: BrewStore['updateHop']
}

function required(): MutationResult {
  return { ok: false, code: 'INVALID_INPUT', message: 'Hop amount is required.' }
}

export function HopSchedule({ hops, syncVersion, updateHop }: HopScheduleProps) {
  return (
    <section className={cardClasses} aria-labelledby="hops-title">
      <h2 id="hops-title" className="text-xl font-bold">Hop schedule</h2>
      {hops.length === 0 && <p className="mt-3 text-sm text-stone-600">No hop additions.</p>}
      {hops.map((hop) => (
        <div
          className="grid grid-cols-[1.2fr_1.5fr_1fr] items-end gap-4 border-t border-stone-300 py-4 first:mt-2.5 max-sm:grid-cols-1 max-sm:gap-1.5"
          key={hop.id}
        >
          <strong>{hop.name}</strong>
          <span className="text-sm text-stone-600">
            {hop.alphaAcidPercent}% AA · {hop.boilMinutes} min
          </span>
          <NumberField
            label={`${hop.name} amount (g)`}
            value={hop.amountGrams}
            syncVersion={syncVersion}
            min={0.01}
            onCommit={(value) => value === undefined
              ? required()
              : updateHop(hop.id, { amountGrams: value })}
          />
        </div>
      ))}
    </section>
  )
}
