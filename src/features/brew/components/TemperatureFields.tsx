import type { CurrentBrew } from '../../../domain/brew'
import {
  displayTemperature,
  parseTemperatureUnit,
  temperatureRange,
  temperatureSymbol,
  temperatureToCelsius,
  type TemperatureUnit,
} from '../../../domain/temperature'
import type { EditableBrewPatch } from '../../../domain/validation'
import type { MutationResult } from '../../../state/brew-store'
import { NumberField } from '../../../ui/NumberField'

interface TemperatureFieldsProps {
  brew: CurrentBrew
  correctedReading?: number
  temperatureUnit: TemperatureUnit
  syncVersion: number
  onUpdateBrew: (patch: EditableBrewPatch) => MutationResult
  onTemperatureUnitChange: (unit: TemperatureUnit) => void
}

export function TemperatureFields({
  brew,
  correctedReading,
  temperatureUnit,
  syncVersion,
  onUpdateBrew,
  onTemperatureUnitChange,
}: TemperatureFieldsProps) {
  const symbol = temperatureSymbol(temperatureUnit)
  const { minimum, maximum } = temperatureRange(temperatureUnit)

  function displayed(value?: number): number | undefined {
    return value === undefined ? undefined : displayTemperature(value, temperatureUnit)
  }

  function commit(field: 'gravitySampleTemperatureC' | 'hydrometerCalibrationTemperatureC') {
    return (value: number | undefined) => onUpdateBrew({
      [field]: value === undefined
        ? undefined
        : temperatureToCelsius(value, temperatureUnit),
    })
  }

  return (
    <fieldset className="mt-5.5 rounded-xl border border-stone-300 p-4">
      <legend className="px-1 text-sm font-bold text-stone-700">Hydrometer correction</legend>
      <div className="grid grid-cols-4 items-end gap-3.5 max-md:grid-cols-2 max-sm:grid-cols-1">
        <NumberField
          label="Hydrometer reading"
          value={brew.measuredOriginalGravity}
          syncVersion={syncVersion}
          min={0.001}
          max={2}
          step={0.001}
          optional
          onCommit={(value) => onUpdateBrew({ measuredOriginalGravity: value })}
        />
        <NumberField
          label={`Sample temperature (${symbol})`}
          value={displayed(brew.gravitySampleTemperatureC)}
          syncVersion={syncVersion}
          min={minimum}
          max={maximum}
          step={0.1}
          optional
          onCommit={commit('gravitySampleTemperatureC')}
        />
        <NumberField
          label={`Hydrometer calibration (${symbol})`}
          value={displayed(brew.hydrometerCalibrationTemperatureC)}
          syncVersion={syncVersion}
          min={minimum}
          max={maximum}
          step={0.1}
          optional
          onCommit={commit('hydrometerCalibrationTemperatureC')}
        />
        <label className="grid gap-1.5 text-sm font-bold text-stone-700">
          Temperature unit
          <select
            className={[
              'w-full min-w-0',
              'px-2.5 py-2',
              'rounded-lg border border-stone-500',
              'bg-white',
              'outline-none',
              'focus-visible:border-green-800 focus-visible:ring-2 focus-visible:ring-green-800/30',
            ].join(' ')}
            value={temperatureUnit}
            onChange={(event) => {
              const unit = parseTemperatureUnit(event.target.value)
              if (unit) onTemperatureUnitChange(unit)
            }}
          >
            <option value="celsius">Celsius (°C)</option>
            <option value="fahrenheit">Fahrenheit (°F)</option>
          </select>
        </label>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
        <p
          className="text-sm text-stone-600"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {correctedReading === undefined
            ? `Temperatures shown in ${symbol}. Enter a hydrometer reading, sample temperature, and calibration temperature to calculate a correction.`
            : `Temperatures shown in ${symbol}. Corrected reading: ${correctedReading}.${correctedReading === brew.originalGravity ? ' Applied to Current OG.' : ''}`}
        </p>
        <button
          className={[
            'px-3.5 py-2.5',
            'rounded-lg',
            'bg-green-800',
            'font-extrabold text-white',
            'outline-none',
            'hover:bg-green-900 focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:bg-stone-400',
          ].join(' ')}
          type="button"
          disabled={correctedReading === undefined || correctedReading === brew.originalGravity}
          onClick={() => {
            if (correctedReading !== undefined) {
              onUpdateBrew({ originalGravity: correctedReading })
            }
          }}
        >
          {correctedReading === brew.originalGravity
            ? 'Corrected reading applied'
            : 'Apply to Current OG'}
        </button>
      </div>
    </fieldset>
  )
}
