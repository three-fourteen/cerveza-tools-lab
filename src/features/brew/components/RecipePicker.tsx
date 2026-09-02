import { brewPresets } from '../../../domain/brew'
import { cardClasses } from './styles'

interface RecipePickerProps {
  selectedPreset: string
  onSelect: (presetId: string) => void
  onLoad: () => void
}

export function RecipePicker({ selectedPreset, onSelect, onLoad }: RecipePickerProps) {
  return (
    <section
      className={`${cardClasses} flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-stretch`}
      aria-label="Demo recipes"
    >
      <div>
        <h2 className="text-xl font-bold">Demo recipes</h2>
        <p className="mt-1 text-sm text-stone-600">
          Choose a starting point, then load it into the shared brew.
        </p>
      </div>
      <label className="grid gap-1.5 text-sm font-bold text-stone-700">
        Demo recipe
        <select
          className={[
            'w-full min-w-0',
            'px-2.5 py-2',
            'rounded-lg border border-stone-500',
            'bg-white',
            'outline-none',
            'focus-visible:border-green-800 focus-visible:ring-2 focus-visible:ring-green-800/30',
          ].join(' ')}
          value={selectedPreset}
          onChange={(event) => onSelect(event.target.value)}
        >
          {brewPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>{preset.name}</option>
          ))}
        </select>
      </label>
      <button
        className={[
          'px-3.5 py-2.5',
          'rounded-lg',
          'bg-green-800',
          'font-extrabold text-white',
          'outline-none',
          'hover:bg-green-900 focus-visible:ring-2 focus-visible:ring-green-800 focus-visible:ring-offset-2',
        ].join(' ')}
        onClick={onLoad}
      >
        Load into Current Brew
      </button>
    </section>
  )
}
