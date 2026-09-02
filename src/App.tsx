import { useEffect, useMemo, useState } from 'react'
import { registerBrewingCalculatorTools } from 'cerveza-tools/webmcp'
import { calculateBrewMetrics } from './domain/metrics'
import { AgentUpdate } from './features/brew/components/AgentUpdate'
import { CurrentBrewCard } from './features/brew/components/CurrentBrewCard'
import { HopSchedule } from './features/brew/components/HopSchedule'
import { RecipePicker } from './features/brew/components/RecipePicker'
import { useBrewStore } from './state/brew-store'
import { registerLabTools, unregisterLabTools } from './webmcp/lab-tools'
import './app.css'

export default function App() {
  const brew = useBrewStore((state) => state.brew)
  const syncVersion = useBrewStore((state) => state.syncVersion)
  const lastChange = useBrewStore((state) => state.lastChange)
  const updateBrew = useBrewStore((state) => state.updateBrew)
  const updateHop = useBrewStore((state) => state.updateHop)
  const loadPreset = useBrewStore((state) => state.loadPreset)
  const clearLastChange = useBrewStore((state) => state.clearLastChange)
  const [selectedPreset, setSelectedPreset] = useState('american-ipa')
  const [agentToolsAvailable, setAgentToolsAvailable] = useState(false)
  const metrics = useMemo(() => calculateBrewMetrics(brew), [brew])

  useEffect(() => {
    let active = true
    let unregister = () => { unregisterLabTools() }
    void Promise.allSettled([
      registerLabTools(),
      registerBrewingCalculatorTools({ calculators: 'all', locale: 'en' }),
    ]).then(([labResult, calculatorResult]) => {
      const lab = labResult.status === 'fulfilled' ? labResult.value : undefined
      const calculators = calculatorResult.status === 'fulfilled'
        ? calculatorResult.value
        : undefined
      unregister = () => {
        lab?.unregister()
        calculators?.unregister()
      }
      if (!active) {
        unregister()
        return
      }
      setAgentToolsAvailable(Boolean(lab?.supported && calculators?.supported))
    })
    return () => {
      active = false
      unregister()
    }
  }, [])

  return (
    <main className="min-h-screen bg-stone-100 text-green-950">
      <div className="mx-auto w-full max-w-5xl px-5 pt-10 pb-16">
        <header className="flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-stretch">
          <div>
            <p className="mb-1.5 text-xs font-extrabold tracking-[0.13em] text-amber-900">
              WEBMCP BREWING WORKSPACE
            </p>
            <h1 className="text-[clamp(2rem,5vw,3.4rem)] font-bold">Cerveza Tools Lab</h1>
          </div>
          <span className="rounded-full border border-green-700/40 px-2.5 py-2 text-sm text-green-800">
            {agentToolsAvailable ? 'WebMCP: Available' : 'Agent tools unavailable in this browser'}
          </span>
        </header>

        <AgentUpdate change={lastChange} onDismiss={clearLastChange} />
        <RecipePicker
          selectedPreset={selectedPreset}
          onSelect={setSelectedPreset}
          onLoad={() => loadPreset(selectedPreset)}
        />
        <CurrentBrewCard
          brew={brew}
          metrics={metrics}
          syncVersion={syncVersion}
          updateBrew={updateBrew}
        />
        <HopSchedule hops={brew.hops} syncVersion={syncVersion} updateHop={updateHop} />
      </div>
    </main>
  )
}
