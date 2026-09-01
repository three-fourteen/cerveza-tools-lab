# Cerveza Tools Lab

A shared brewing workspace where brewers and browser agents inspect, calculate, and update the same current brew together.

Built for the [OpenAI WebMCP Challenge](https://openai.com/webmcp-challenge/).

## Live demo

[three-fourteen.github.io/cerveza-tools-lab](https://three-fourteen.github.io/cerveza-tools-lab/)

## Why WebMCP

Brewing decisions often span related calculations: hydrometer correction, alcohol estimation, dilution, and hop bitterness. Cerveza Tools Lab gives people and agents one visible source of truth — **Current Brew** — so a brewer can edit a value, an agent can read the updated context, use deterministic tools, and apply an explicit change that the brewer immediately sees and can override.

The application remains useful without WebMCP. When the browser supports it, it adds structured, typed collaboration rather than an embedded chatbot or model arithmetic.

## Human–agent workflow

1. Choose a demo recipe and load it into Current Brew.
2. Edit gravity, volume, final gravity, or a hop addition in the UI.
3. An agent reads the same Current Brew and calls a trusted calculator.
4. The agent applies a small, whitelisted update.
5. The UI reflects the change immediately; the brewer can continue editing from there.

## WebMCP tools

### Contextual Lab tools

| Tool | Description |
| --- | --- |
| `get_current_brew` | Returns the normalized shared brew state. |
| `get_current_brew_metrics` | Returns deterministic calculated metrics when inputs are present. |
| `update_current_brew` | Applies a validated, whitelisted patch to Current Brew. |
| `update_hop_addition` | Updates one named hop addition without replacing the others. |

### Calculator tools from `cerveza-tools`

`brewing_correct_hydrometer`, `brewing_calculate_alcohol`, `brewing_calculate_dilution`, `brewing_calculate_ibu`, and `brewing_calculate_carbonation`.

## Architecture

```text
Brewer UI ─┐
           ├─ Current Brew (Zustand + localStorage)
Agent ─────┘          │
                       ├─ Lab contextual WebMCP tools
                       └─ cerveza-tools calculator WebMCP tools
```

The state is persisted locally so human and agent changes survive a refresh. Derived metrics are recalculated with `cerveza-tools`; they are not stored separately.

## Local development

```bash
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm test
pnpm typecheck
pnpm build
```

## Existing work and hackathon work

[Cerveza Tools](https://github.com/three-fourteen/cerveza-tools) predates the challenge and provides the React/TypeScript brewing calculator library. The Lab application, its Current Brew model and shared state, contextual WebMCP tools, collaborative flows, and GitHub Pages demo were created for the WebMCP Challenge. The calculator WebMCP bindings were added to the library for this challenge.

## License

GPL-3.0-or-later. See [LICENSE](LICENSE).
