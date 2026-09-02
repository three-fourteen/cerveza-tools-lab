import type { CurrentBrew } from '../../../domain/brew'
import type { BrewMetrics } from '../../../domain/metrics'
import type { BrewStore, MutationResult } from '../../../state/brew-store'
import { NumberField } from '../../../ui/NumberField'
import { cardClasses } from './styles'

interface CurrentBrewCardProps {
  brew: CurrentBrew
  metrics: BrewMetrics
  syncVersion: number
  updateBrew: BrewStore['updateBrew']
}

interface MetricProps {
  label: string
  value?: number
  unit?: string
}

function required(message: string): MutationResult {
  return { ok: false, code: 'INVALID_INPUT', message }
}

function Metric({ label, value, unit }: MetricProps) {
  return (
    <div className="p-4 rounded-xl bg-green-100/70">
      <span className="block text-sm text-green-950/70">{label}</span>
      <strong className="mt-1 block text-2xl">
        {value === undefined ? '—' : value}
        {value !== undefined && unit ? ` ${unit}` : ''}
      </strong>
    </div>
  )
}

export function CurrentBrewCard({
  brew,
  metrics,
  syncVersion,
  updateBrew,
}: CurrentBrewCardProps) {
  return (
    <section className={cardClasses} aria-labelledby="current-brew-title">
      <div className="flex items-center justify-between gap-6">
        <div>
          <p className="mb-1.5 text-xs font-extrabold tracking-[0.13em] text-amber-900">
            CURRENT BREW
          </p>
          <h2 id="current-brew-title" className="text-xl font-bold">{brew.name}</h2>
        </div>
        <span className="rounded-full border border-green-700/40 px-2.5 py-2 text-sm text-green-800">
          Saved locally
        </span>
      </div>
      <div className="mt-5.5 grid grid-cols-5 gap-3.5 max-md:grid-cols-2">
        <NumberField
          label="Batch volume (L)"
          value={brew.batchVolumeLiters}
          syncVersion={syncVersion}
          min={0.01}
          onCommit={(value) => value === undefined
            ? required('Batch volume is required.')
            : updateBrew({ batchVolumeLiters: value })}
        />
        <NumberField
          label="Target OG"
          value={brew.targetOriginalGravity}
          syncVersion={syncVersion}
          min={0.001}
          max={2}
          step={0.001}
          optional
          onCommit={(value) => updateBrew({ targetOriginalGravity: value })}
        />
        <NumberField
          label="Hydrometer reading"
          value={brew.measuredOriginalGravity}
          syncVersion={syncVersion}
          min={0.001}
          max={2}
          step={0.001}
          optional
          onCommit={(value) => updateBrew({ measuredOriginalGravity: value })}
        />
        <NumberField
          label="Current OG"
          value={brew.originalGravity}
          syncVersion={syncVersion}
          min={0.001}
          max={2}
          step={0.001}
          optional
          onCommit={(value) => updateBrew({ originalGravity: value })}
        />
        <NumberField
          label="Expected FG"
          value={brew.expectedFinalGravity}
          syncVersion={syncVersion}
          min={0.001}
          max={2}
          step={0.001}
          optional
          onCommit={(value) => updateBrew({ expectedFinalGravity: value })}
        />
      </div>
      <div
        className="mt-5.5 grid grid-cols-3 gap-3.5 max-sm:grid-cols-1"
        aria-label="Calculated metrics"
      >
        <Metric label="Corrected reading" value={metrics.correctedOriginalGravity} />
        <Metric label="ABV" value={metrics.expectedAbvPercent} unit="%" />
        <Metric label="IBU" value={metrics.estimatedIbu} />
      </div>
    </section>
  )
}
