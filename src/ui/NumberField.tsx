import { useEffect, useId, useState } from 'react'
import type { MutationResult } from '../state/brew-store'

interface NumberFieldProps {
  label: string
  value?: number
  syncVersion?: number
  onCommit: (value: number | undefined) => MutationResult
  optional?: boolean
  min?: number
  max?: number
  step?: number
}

export function NumberField({
  label,
  value,
  syncVersion,
  onCommit,
  optional = false,
  min,
  max,
  step,
}: NumberFieldProps) {
  const inputId = useId()
  const errorId = `${inputId}-error`
  const [draft, setDraft] = useState(value?.toString() ?? '')
  const [error, setError] = useState<string>()

  useEffect(() => {
    setDraft(value?.toString() ?? '')
    setError(undefined)
  }, [syncVersion, value])

  function update(rawValue: string) {
    setDraft(rawValue)

    if (rawValue === '') {
      if (!optional) {
        setError(`${label} is required.`)
        return
      }
      const result = onCommit(undefined)
      setError(result.ok ? undefined : result.message)
      return
    }

    const numericValue = Number(rawValue)
    if (!Number.isFinite(numericValue)) {
      setError(`${label} must be a number.`)
      return
    }
    if (min !== undefined && numericValue < min) {
      setError(`${label} must be at least ${min}.`)
      return
    }
    if (max !== undefined && numericValue > max) {
      setError(`${label} must be at most ${max}.`)
      return
    }

    const result = onCommit(numericValue)
    setError(result.ok ? undefined : result.message)
  }

  return (
    <label className="grid gap-1.5 text-sm font-bold text-stone-700" htmlFor={inputId}>
      {label}
      <input
        id={inputId}
        className={[
          'w-full min-w-0',
          'px-2.5 py-2',
          'rounded-lg border border-stone-500',
          'bg-white',
          'outline-none',
          'focus-visible:border-green-800 focus-visible:ring-2 focus-visible:ring-green-800/30',
        ].join(' ')}
        type="number"
        value={draft}
        min={min}
        max={max}
        step={step}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        onChange={(event) => update(event.target.value)}
      />
      {error && (
        <span id={errorId} className="text-xs font-medium text-red-700" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}
