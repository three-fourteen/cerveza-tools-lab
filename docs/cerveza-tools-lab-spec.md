# Cerveza Tools Lab — WebMCP Challenge Product Specification

**Proposed repository:** `three-fourteen/cerveza-tools-lab`  
**Type:** Standalone web application / hackathon submission  
**Dependency:** `cerveza-tools`  
**Core concept:** A shared brewing workspace where a brewer and an agent can inspect and modify the same current brew while composing trusted brewing calculators exposed through WebMCP.

## 1. Product Statement

Cerveza Tools Lab turns individual brewing calculations into a contextual workflow.

The application has a shared `Current Brew` state. A human can edit that brew through a conventional web interface, while a WebMCP-compatible agent can:

- inspect the same brew,
- use brewing calculators,
- update selected brew values,
- and combine multiple operations to help resolve brewing decisions.

The application MUST remain useful without an agent.

WebMCP enhances the workflow rather than replacing the UI.

---

## 2. Hackathon Story

Existing work:

- `cerveza-tools` already exists as an open-source React/TypeScript brewing calculator library.

Hackathon work:

- optional WebMCP calculator bindings in `cerveza-tools`;
- the new `cerveza-tools-lab` application;
- Current Brew shared state;
- contextual WebMCP tools;
- human-agent collaborative workflows;
- live deployed demo.

This separation should be documented clearly in the submission and README.

---

## 3. Goals

1. Demonstrate meaningful human-agent collaboration using shared application state.
2. Show WebMCP as more than a collection of standalone calculator calls.
3. Compose multiple trusted calculations around one brew context.
4. Keep all important state visible and editable by the human.
5. Ensure agent changes are reflected immediately in the UI.
6. Allow human changes to become immediately visible to the agent.
7. Build a polished vertical slice rather than a full brewing-management platform.
8. Provide a compelling demo that can be understood in under one minute.

---

## 4. Non-goals

MVP MUST NOT include:

- Full Brewfather/BeerSmith-style recipe management.
- Ingredient inventory.
- Supplier/product catalogs.
- Cost tracking.
- Brew calendar.
- Fermentation logging/history.
- Water chemistry suite.
- User accounts.
- Cloud persistence.
- Team collaboration.
- AI chatbot embedded in the app.
- OpenAI API integration.
- Autonomous high-risk actions.
- Complex recipe-style validation.

The browser agent is the AI layer.

---

## 5. Target User

Primary demo persona:

> A home brewer who is in the middle of planning or adjusting a brew and needs to move between several brewing calculations while keeping the current batch context consistent.

Secondary persona:

> A developer evaluating how reusable WebMCP-enabled domain libraries can be composed into an agent-native application.

---

## 6. MVP User Experience

### Main screen

Prefer a single-workspace layout rather than multiple application sections.

Example:

```text
┌─────────────────────────────────────────────────────────┐
│ Cerveza Tools Lab                       WebMCP enabled  │
├─────────────────────────────────────────────────────────┤
│ Current Brew                                            │
│ American IPA                                            │
│                                                         │
│ Batch        20 L        OG target       1.050          │
│ OG measured  1.058       FG expected     1.011          │
│ Mash         67 °C       Boil            60 min         │
├─────────────────────────────────────────────────────────┤
│ Hops                                                    │
│ Citra       12% AA      25g      60 min                 │
│ Mosaic      11% AA      30g      10 min                 │
│ + Add hop                                               │
├─────────────────────────────────────────────────────────┤
│ Calculated                                              │
│ ABV       6.2%       IBU       54                       │
│                                                         │
│ [Hydrometer] [Dilution] [Alcohol] [IBU] [Carbonation]  │
└─────────────────────────────────────────────────────────┘
```

Exact visual design is flexible.

### Key property

There must be ONE obvious source of truth: Current Brew.

Calculator views can use or preview values from Current Brew but should not create competing hidden state.

---

## 7. Current Brew Data Model

MVP TypeScript model:

```ts
type Gravity = number;

type HopAddition = {
  id: string;
  name: string;
  alphaAcidPercent: number;
  amountGrams: number;
  boilMinutes: number;
};

type CurrentBrew = {
  id: string;
  name: string;

  batchVolumeLiters: number;

  targetOriginalGravity?: Gravity;
  originalGravity?: Gravity;
  measuredOriginalGravity?: Gravity;
  gravitySampleTemperatureC?: number;
  hydrometerCalibrationTemperatureC?: number;

  expectedFinalGravity?: Gravity;

  mashTemperatureC?: number;
  boilMinutes?: number;

  hops: HopAddition[];

  targetCarbonationVolumes?: number;
  beerTemperatureC?: number;
};
```

`originalGravity` is the canonical OG used by downstream ABV and IBU calculations. `measuredOriginalGravity` remains the raw hydrometer reading and may be temperature-corrected before explicitly applying the result as canonical OG.

Only include fields that are used by the MVP interactions.

Do not add fields "for completeness."

---

## 8. Derived Values

Derived values should not necessarily be persisted.

Examples:

```ts
type BrewMetrics = {
  correctedOriginalGravity?: number;
  expectedAbvPercent?: number;
  estimatedIbu?: number;
  dilutionWaterLiters?: number;
  primingSugarGrams?: number;
};
```

Where possible, derive these from Current Brew using `cerveza-tools` pure functions.

This reduces synchronization bugs.

---

## 9. Application State

MVP preference:

- React context + reducer, Zustand, or another small client-state solution.
- No backend required.
- Optional `localStorage` persistence only after core WebMCP flow works.

State mutations MUST use shared actions rather than WebMCP directly mutating arbitrary React state.

Example:

```ts
type BrewAction =
  | { type: "UPDATE_BREW"; patch: Partial<CurrentBrew> }
  | { type: "ADD_HOP"; hop: HopAddition }
  | { type: "UPDATE_HOP"; id: string; patch: Partial<HopAddition> }
  | { type: "REMOVE_HOP"; id: string }
  | { type: "RESET_BREW"; brew: CurrentBrew };
```

Human UI and WebMCP tools should use the same state-action layer.

---

## 10. WebMCP Architecture

There are two categories of tools.

### A. Calculator tools

Provided by `cerveza-tools`.

Examples:

```text
brewing_correct_hydrometer
brewing_calculate_alcohol
brewing_calculate_dilution
brewing_calculate_ibu
brewing_calculate_carbonation
```

These are context-free domain primitives.

### B. Lab contextual tools

Provided by this application.

MVP:

```text
get_current_brew
update_current_brew
get_current_brew_metrics
set_temperature_unit
```

Optional:

```text
add_hop_addition
update_hop_addition
remove_hop_addition
```

Avoid implementing high-level magic tools such as `fix_my_beer` for the MVP.

The agent should be able to compose understandable primitives.

---

## 11. `get_current_brew`

Read-only.

Purpose:

Allow the agent to understand exactly what the user is currently working on.

Return normalized structured data, not presentation text.

Example:

```json
{
  "name": "American IPA",
  "batchVolumeLiters": 20,
  "targetOriginalGravity": 1.05,
  "measuredOriginalGravity": 1.058,
  "gravitySampleTemperatureC": 28,
  "expectedFinalGravity": 1.011,
  "boilMinutes": 60,
  "hops": [
    {
      "id": "hop-1",
      "name": "Citra",
      "alphaAcidPercent": 12,
      "amountGrams": 25,
      "boilMinutes": 60
    }
  ]
}
```

---

## 12. `update_current_brew`

Purpose:

Apply explicit, bounded changes to Current Brew.

Preferred input:

```json
{
  "patch": {
    "originalGravity": 1.055
  },
  "reason": "User asked to apply the corrected measurement as canonical OG."
}
```

The tool handler MUST whitelist editable fields.

Do not accept arbitrary object paths.

Return:

- changed fields,
- updated normalized brew,
- derived metrics affected by the change if cheap to compute.

The UI MUST update immediately.

---

## 13. Hop Mutation Tools

If IBU interaction is a central demo, explicit hop tools are preferable to sending an entire `hops` array through `update_current_brew`.

Example:

```text
update_hop_addition
```

Input:

```json
{
  "id": "hop-1",
  "amountGrams": 18
}
```

Benefits:

- safer mutation,
- clearer agent intent,
- better demo trace,
- easier human-agent collaboration.

If time is short, updating the entire hop array via a validated patch is acceptable.

---

## 14. `get_current_brew_metrics`

Purpose:

Expose a deterministic snapshot calculated with `cerveza-tools`.

Possible result:

```json
{
  "correctedOriginalGravity": 1.06,
  "expectedAbvPercent": 6.4,
  "estimatedIbu": 52,
  "targetCarbonationVolumes": 2.4
}
```

Only return metrics for which enough inputs exist.

Missing metrics should be represented explicitly rather than fabricated.

---

## 15. Agent Interaction Scenarios

The MVP should support at least THREE polished scenarios.

### Scenario 1 — Correct measurement → ABV

Initial Current Brew:

- 20 L
- measured OG 1.056
- sample temperature 28 °C
- expected FG 1.011

Prompt:

> My hydrometer reading is 1.056 at 28°C. Correct it and use the corrected value to estimate the ABV.

Expected flow:

```text
get_current_brew
→ brewing_correct_hydrometer
→ update_current_brew
→ brewing_calculate_alcohol
→ UI shows updated gravity and ABV
```

The human then changes FG manually.

Prompt:

> Recalculate with the value I just entered.

The agent MUST observe the new value from Current Brew.

This is the strongest shared-state demonstration.

---

### Scenario 2 — High gravity → Dilution

Initial Current Brew:

- target OG 1.050
- measured/corrected OG 1.058
- 20 L

Prompt:

> I overshot my target gravity. How much water should I add to get close to 1.050?

Expected flow:

```text
get_current_brew
→ brewing_calculate_dilution
```

Preferred UX:

The agent explains the proposed addition before changing volume.

A follow-up prompt can apply the change:

> Apply that adjustment to the current brew.

Then:

```text
update_current_brew
```

This demonstrates read → calculate → human decision → mutation.

---

### Scenario 3 — Adjust IBU without changing a specific hop

Initial hop schedule contains Citra + Mosaic.

Prompt:

> Bring this closer to 45 IBU, but don't change the Mosaic addition.

The agent should:

1. read the current brew,
2. use the IBU tool iteratively or calculate candidate changes,
3. update only the permitted hop addition,
4. leave Mosaic unchanged,
5. cause the UI metric to update.

The user then manually changes the Citra amount.

Follow-up:

> Keep my change and tell me the new IBU.

The agent MUST respect the current UI state.

---

## 16. Human-Agent Interaction Principles

### Shared state

Anything important the agent changes must be visible to the human.

Anything important the human changes must be available to the agent.

### No hidden "AI state"

Do not maintain a separate copy of Current Brew for the agent.

### Explicit mutation

Prefer small typed tools over one generic `set_state`.

### Human control

For calculations that imply a physical brewing action, distinguish between:

- calculation/advice,
- changing the application's planned brew data.

The tool may update the plan only when that action is clearly requested.

### Deterministic calculations

All brewing math should come from `cerveza-tools`, not from model arithmetic.

---

## 17. Calculator UI

The Lab may expose calculators in one of two ways.

### Preferred MVP

Current Brew workspace includes small contextual calculator panels/drawers that import actual `cerveza-tools` components.

Example:

```tsx
<Alcohol
  originalGravity={...}
  finalGravity={...}
/>
```

### Alternative

Keep existing calculator pages accessible in a secondary "Calculators" section.

Do not spend significant time redesigning all twelve calculators for the Lab.

---

## 18. Recipe Book

### Status: stretch goal

Do NOT make recipe management a blocking feature.

If implemented, MVP is only:

```text
Save Current Brew
Load Brew
Duplicate Brew
Delete Brew
```

Persistence:

```text
localStorage
```

No account.

No remote DB.

No sharing.

No recipe import/export unless everything else is complete.

The hackathon demo should work even if Recipe Book is removed entirely.

---

## 19. Suggested Routes

Simplest option:

```text
/               Current Brew
/calculators    Existing calculator collection
```

Stretch:

```text
/recipes
```

An even smaller single-page application is acceptable.

---

## 20. Suggested Tech Stack

Keep implementation boring:

- React
- TypeScript strict
- Vite
- `cerveza-tools`
- Existing preferred CSS solution
- Vitest
- Testing Library

Avoid adopting a backend framework solely for the hackathon.

GitHub Pages, Netlify, Vercel, or another static-capable host is sufficient if WebMCP works correctly in the deployed environment.

---

## 21. WebMCP Support Detection

Show subtle UI status:

```text
WebMCP: Available
```

or:

```text
Agent tools unavailable in this browser
```

Do not make normal human usage dependent on WebMCP support.

---

## 22. Demo Data

Ship one excellent preset:

### American IPA

Contains enough values to exercise:

- hydrometer correction,
- alcohol,
- dilution,
- IBU.

Optionally ship a second simple preset for carbonation.

Do not spend time building a recipe catalog.

---

## 23. Accessibility / UX

Minimum:

- keyboard-operable inputs.
- semantic labels.
- visible focus.
- input units clearly displayed.
- avoid color-only state indicators.
- agent-updated values should have a subtle temporary visual indication.

Strong demo enhancement:

When WebMCP changes a value, briefly show something like:

```text
Updated by agent
1.058 → 1.050
```

This makes the human-agent collaboration visible in the video.

---

## 24. Agent Change History

Nice-to-have, but potentially high-value for the demo.

A small activity strip:

```text
Agent corrected OG: 1.056 → 1.058
Agent calculated ABV: 6.1%
You changed expected FG: 1.011 → 1.014
Agent recalculated ABV: 5.8%
```

This can be derived from normal state mutations.

Do not build a full audit system.

---

## 25. Testing

### State tests

- UI mutation changes Current Brew.
- tool mutation uses the same state action.
- derived metrics recalculate after mutation.
- human edits are visible to subsequent tool reads.

### WebMCP tool tests

- `get_current_brew` returns the exact current state.
- `update_current_brew` rejects non-whitelisted fields.
- hop tools preserve unrelated additions.
- invalid values return structured errors.

### Integration tests

At minimum, codify the three demo scenarios without requiring an actual model:

1. correction → update → ABV,
2. dilution proposal/application,
3. IBU adjustment preserving a hop constraint.

### Manual browser verification

Before submission, test the deployed URL from ChatGPT's in-app browser, because the challenge explicitly supports WebMCP there.

---

## 26. README Requirements

README should include:

### What this is

One-paragraph product description.

### Built for the WebMCP Challenge

Explicit statement.

### Existing work vs hackathon work

Example:

```md
Cerveza Tools predates the challenge and provides the brewing
calculation library. Cerveza Tools Lab, its Current Brew model,
contextual WebMCP tools, and the WebMCP bindings added to the
library were implemented for the challenge.
```

### Architecture

Diagram:

```text
Human
  ↕
Cerveza Tools Lab UI
  ↕
Current Brew
  ↕
Lab WebMCP tools
  +
Cerveza Tools WebMCP calculator tools
  ↕
Agent
```

### WebMCP tools

List all registered tools with descriptions.

### Local development

One-command install/dev path.

### Live demo

Deployed URL.

### Related project

Link to `three-fourteen/cerveza-tools`.

### License

Visible, consistent license.

---

## 27. Submission Positioning

Suggested one-line pitch:

> A shared brewing workspace where humans and agents use the same trusted calculators and modify the same brew state together.

Alternative technical pitch:

> Cerveza Tools Lab demonstrates how reusable domain components can expose agent capabilities through WebMCP and be composed by a host application around shared state.

The first is better for the product page.

The second is better for the technical explanation.

---

## 28. Judging Alignment

### Usefulness

Brewers frequently move between related calculations while planning or correcting a batch.

### Originality

The app is not a chatbot and does not ask an LLM to perform brewing math. It exposes deterministic domain capabilities and shared live state to an external agent.

### Execution

Existing trusted calculator logic allows effort to focus on interaction quality and polish.

### Thoughtful WebMCP use

WebMCP provides:

- direct structured access to application state,
- reliable deterministic calculation tools,
- typed state mutation,
- multi-step tool composition.

### Human-agent experience

The core demo explicitly alternates:

```text
human changes UI
→ agent sees it
→ agent calculates/mutates
→ human sees it
→ human changes it again
→ agent continues from that state
```

---

## 29. Risks and Mitigations

### Risk: Looks like "calculator tools with AI"

Mitigation:

Make Current Brew and shared-state follow-ups the center of the demo.

### Risk: Too much recipe-management scope

Mitigation:

Recipe Book remains optional.

### Risk: Too many WebMCP tools

Mitigation:

Ship 4–5 excellent calculator tools and 2–4 contextual tools.

### Risk: Agent performs its own arithmetic

Mitigation:

Tool descriptions clearly state that brewing calculations should use the provided deterministic tools.

### Risk: Existing library work muddies hackathon eligibility

Mitigation:

Clearly document timestamps, prior repository, hackathon-added WebMCP work, and the new Lab repository.

### Risk: Unsupported environment

Mitigation:

Capability detection + explicit manual verification in ChatGPT's in-app browser.

---

## 30. MVP Acceptance Criteria

The Lab is ready for submission when:

- [ ] It is a separate public repository.
- [ ] It imports `cerveza-tools` rather than copying calculator formulas.
- [ ] Current Brew is the single shared source of truth.
- [ ] Human edits update Current Brew immediately.
- [ ] `get_current_brew` exposes those edits to WebMCP.
- [ ] The agent can mutate whitelisted Current Brew fields.
- [ ] At least four calculator capabilities are available via WebMCP.
- [ ] The correction → ABV scenario works end-to-end.
- [ ] The dilution scenario works end-to-end.
- [ ] The constrained IBU scenario works end-to-end.
- [ ] Agent changes are clearly visible in the UI.
- [ ] The app remains fully usable when WebMCP is unavailable.
- [ ] The deployed live app works in ChatGPT's in-app browser.
- [ ] README clearly separates pre-challenge and challenge work.
- [ ] A license file is present.
- [ ] Demo video can show the core value without explaining internal implementation first.

---

## 31. Stretch Goals — Priority Order

Only after all acceptance criteria pass:

1. Save/load Current Brew to `localStorage`.
2. Agent/human change activity log.
3. Carbonation workflow.
4. Recipe Book UI.
5. More sample brews.
6. WebMCP-enabled standalone calculator views.
7. Additional calculators.
8. Import/export recipes.

---

## 32. Recommended Build Order

### Phase 1 — Foundation

1. Create repo and Vite React/TypeScript app.
2. Install/link `cerveza-tools`.
3. Implement `CurrentBrew` type and store.
4. Build compact Current Brew UI.
5. Implement derived ABV/IBU display without WebMCP.

### Phase 2 — WebMCP context

6. Register `get_current_brew`.
7. Register `update_current_brew`.
8. Verify human edit → agent read.
9. Verify agent update → visible UI change.

### Phase 3 — Calculator composition

10. Integrate `cerveza-tools/webmcp`.
11. Complete Hydrometer → Alcohol workflow.
12. Complete Dilution workflow.
13. Complete IBU constraint workflow.

### Phase 4 — Polish

14. Add WebMCP capability indicator.
15. Add agent-change visual feedback.
16. Add preset IPA.
17. Harden validation/errors.
18. Tests.
19. README.
20. Deploy and test through ChatGPT in-app browser.

### Phase 5 — Only if ahead of schedule

21. `localStorage`.
22. Save/load brew.
23. Carbonation.
24. Activity log.

---

## 33. Definition of Success

A judge should be able to understand the product from one interaction:

1. The brewer edits a value manually.
2. The agent reads the updated brew.
3. The agent calls a trusted brewing calculator.
4. The agent updates the shared plan.
5. The user sees and optionally overrides the change.
6. The agent continues from the user's new state.

If that loop is reliable and visually clear, the project succeeds even without a recipe book, backend, accounts, or a large feature set.
