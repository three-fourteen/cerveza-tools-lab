import type { BrewChange } from '../../../state/brew-store'

interface AgentUpdateProps {
  change?: BrewChange
  onDismiss: () => void
}

function display(value: unknown) {
  if (value === undefined) return 'unset'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return JSON.stringify(value)
}

export function AgentUpdate({ change, onDismiss }: AgentUpdateProps) {
  const agentChange = change?.source === 'agent' ? change : undefined
  return (
    <div
      className={agentChange
        ? 'mt-6 rounded-xl border border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-950'
        : 'sr-only'}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {agentChange && (
        <>
          <div className="flex items-start justify-between gap-4">
            <strong>Updated by agent</strong>
            <button
              className="rounded px-2 py-1 font-bold text-blue-900 underline outline-none focus-visible:ring-2 focus-visible:ring-blue-900"
              type="button"
              onClick={onDismiss}
            >
              Dismiss
            </button>
          </div>
          <ul className="mt-1 list-inside list-disc">
            {agentChange.values.map(({ field, previous, next }) => (
              <li key={field}>{field}: {display(previous)} → {display(next)}</li>
            ))}
          </ul>
          {agentChange.reason && <p className="mt-1">{agentChange.reason}</p>}
        </>
      )}
    </div>
  )
}
