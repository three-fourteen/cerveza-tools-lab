import { useEffect, useMemo, useState } from 'react'
import { registerBrewingCalculatorTools } from 'cerveza-tools/webmcp'
import { brewPresets } from './domain/brew'
import { calculateBrewMetrics } from './domain/metrics'
import { useBrewStore } from './state/brew-store'
import { registerLabTools } from './webmcp/lab-tools'
import './app.css'

function number(value: string) {
  return value === '' ? undefined : Number(value)
}

function Metric({ label, value, unit }: { label: string; value?: number; unit?: string }) {
  return <div className="metric"><span>{label}</span><strong>{value === undefined ? '—' : value}{value !== undefined && unit ? ` ${unit}` : ''}</strong></div>
}

export default function App() {
  const brew = useBrewStore((state) => state.brew)
  const updateBrew = useBrewStore((state) => state.updateBrew)
  const updateHop = useBrewStore((state) => state.updateHop)
  const loadPreset = useBrewStore((state) => state.loadPreset)
  const [selectedPreset, setSelectedPreset] = useState('american-ipa')
  const [agentToolsAvailable, setAgentToolsAvailable] = useState(false)
  const metrics = useMemo(() => calculateBrewMetrics(brew), [brew])

  useEffect(() => {
    let active = true
    let unregister = () => {}
    void Promise.allSettled([registerLabTools(), registerBrewingCalculatorTools({ calculators: 'all', locale: 'en' })]).then(([labResult, calculatorResult]) => {
      const lab = labResult.status === 'fulfilled' ? labResult.value : undefined
      const calculators = calculatorResult.status === 'fulfilled' ? calculatorResult.value : undefined
      unregister = () => { lab?.unregister(); calculators?.unregister() }
      if (active) setAgentToolsAvailable(Boolean(lab?.supported || calculators?.supported))
    })
    return () => { active = false; unregister() }
  }, [])

  return <main className="workspace">
    <header>
      <div><p className="eyebrow">WEBMCP BREWING WORKSPACE</p><h1>Cerveza Tools Lab</h1></div>
      <span className="status">{agentToolsAvailable ? 'WebMCP: Available' : 'Agent tools unavailable in this browser'}</span>
    </header>

    <section className="recipe-picker" aria-label="Demo recipes">
      <div><h2>Demo recipes</h2><p>Choose a starting point, then load it into the shared brew.</p></div>
      <label>Demo recipe<select value={selectedPreset} onChange={(event) => setSelectedPreset(event.target.value)}>
        {brewPresets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
      </select></label>
      <button onClick={() => loadPreset(selectedPreset)}>Load into Current Brew</button>
    </section>

    <section className="brew-card" aria-labelledby="current-brew-title">
      <div className="section-heading"><div><p className="eyebrow">CURRENT BREW</p><h2 id="current-brew-title">{brew.name}</h2></div><span>Saved locally</span></div>
      <div className="fields">
        <label>Batch volume (L)<input type="number" value={brew.batchVolumeLiters} onChange={(event) => updateBrew({ batchVolumeLiters: Number(event.target.value) })} /></label>
        <label>Target OG<input type="number" step="0.001" value={brew.targetOriginalGravity ?? ''} onChange={(event) => updateBrew({ targetOriginalGravity: number(event.target.value) })} /></label>
        <label>Measured OG<input type="number" step="0.001" value={brew.measuredOriginalGravity ?? ''} onChange={(event) => updateBrew({ measuredOriginalGravity: number(event.target.value) })} /></label>
        <label>Expected FG<input type="number" step="0.001" value={brew.expectedFinalGravity ?? ''} onChange={(event) => updateBrew({ expectedFinalGravity: number(event.target.value) })} /></label>
      </div>
      <div className="metrics" aria-label="Calculated metrics">
        <Metric label="Corrected OG" value={metrics.correctedOriginalGravity} />
        <Metric label="ABV" value={metrics.expectedAbvPercent} unit="%" />
        <Metric label="IBU" value={metrics.estimatedIbu} />
      </div>
    </section>

    <section className="hops" aria-labelledby="hops-title"><h2 id="hops-title">Hop schedule</h2>
      {brew.hops.map((hop) => <div className="hop" key={hop.id}>
        <strong>{hop.name}</strong><span>{hop.alphaAcidPercent}% AA · {hop.boilMinutes} min</span>
        <label>{hop.name} amount (g)<input type="number" value={hop.amountGrams} onChange={(event) => updateHop(hop.id, { amountGrams: Number(event.target.value) })} /></label>
      </div>)}
    </section>
  </main>
}
