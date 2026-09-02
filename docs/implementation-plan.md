# Plan de implementación: Cerveza Tools Lab

## Resumen

Aplicación Vite + React + TypeScript, independiente de la librería publicada `cerveza-tools`. El MVP es una única pantalla de `Current Brew`: el cervecero modifica datos visibles y un agente WebMCP consulta y modifica ese mismo estado a través de acciones tipadas. Las cinco calculadoras ya expuestas por `cerveza-tools/webmcp` se registrarán desde la app; el Lab añadirá las herramientas contextuales y no duplicará fórmulas.

## Decisiones de arquitectura

- **Dependencia:** instalar `cerveza-tools@^2.0.1` desde npm (no enlace local ni copia de lógica). Importar componentes y funciones puras del paquete publicado.
- **Estado:** usar **Zustand**. Es una dependencia pequeña y está justificada porque los handlers WebMCP viven fuera del árbol React: UI y herramientas podrán invocar el mismo store y sus mismas acciones, sin mantener dos copias del brew.
- **Modelo:** implementar únicamente `CurrentBrew`, `HopAddition` y métricas derivadas necesarios para los tres flujos. Las métricas se calculan al leer el estado; no se persisten.
- **Mutaciones:** acciones explícitas (`updateBrew`, `updateHop`) con validación central. Las herramientas aceptan esquemas cerrados y listas blancas de campos.
- **WebMCP:** un módulo de registro de Lab detecta `document.modelContext`, registra herramientas contextuales y las cancela al desmontar. Las calculadoras se registran mediante `registerBrewingCalculatorTools`.
- **Flujo de recetas de demo:** mostrar una biblioteca mínima de cinco recetas predefinidas y una acción explícita **Load into Current Brew**. Cargar crea una copia nueva en Current Brew; no hay guardar recetas, editar el catálogo, duplicar ni borrar. American IPA será la predeterminada y la usada por los tres guiones.
- **Persistencia:** persistir únicamente el Current Brew activo en localStorage mediante el middleware `persist` de Zustand. Así sobreviven los cambios humanos y de agente tras recargar, sin convertir los presets en recetas guardadas. Si no hay estado válido persistido, cargar American IPA.
- **Despliegue:** GitHub Pages, mediante un workflow que ejecuta `pnpm install --frozen-lockfile` y publica el build de Vite. Configurar `base` para el nombre del repositorio.
- **Idioma:** interfaz y herramientas registradas inicialmente en inglés (`locale: 'en'`); no se añade selector de idioma al MVP.
- **Calidad:** TypeScript estricto, Vitest y Testing Library. Verificar WebMCP con un `ModelContext` simulado en pruebas y manualmente en el navegador integrado de ChatGPT después del despliegue.

## Dependencias

```text
CurrentBrew store + validación
  ├─ UI de workspace y métricas derivadas
  └─ herramientas contextuales WebMCP
       └─ flujos Hydrometer → ABV, Dilution e IBU

cerveza-tools (npm)
  ├─ funciones/componentes de calculadora
  └─ herramientas WebMCP de calculadora
```

## Alcance MVP

- Una SPA con una biblioteca de cinco recetas de demostración y el flujo explícito de cargar una de ellas en Current Brew; **American IPA** será la predeterminada y tendrá datos de batch/gravedad/hervido y dos adiciones de lúpulo editables.
- Métricas derivadas: OG corregida cuando sea posible, ABV esperado e IBU total (suma de las contribuciones por adición).
- Herramientas Lab: `get_current_brew`, `update_current_brew`, `get_current_brew_metrics` y `update_hop_addition`.
- Cinco calculadoras ya publicadas: corrección de densímetro, alcohol, dilución, IBU y carbonatación.
- Estado de disponibilidad WebMCP, accesibilidad básica y feedback visual temporal para cambios de agente.

No incluye backend, cuentas, gestión de recetas persistentes, inventario ni chat incrustado.

## Fases y entregables

### Fase 1 — Base funcional

1. Inicializar el repositorio público con pnpm, Vite, React, TypeScript estricto, Vitest y `cerveza-tools` desde npm.
2. Implementar el dominio, cinco presets, el store Zustand persistido y la capa de métricas derivadas usando funciones de `cerveza-tools`.
3. Construir el selector de recetas y el workspace accesible con edición directa de Current Brew, adiciones de lúpulo y tarjetas de métricas.

**Checkpoint:** el flujo humano completo cambia una gravedad, un FG y un lúpulo; ABV/IBU se recalculan sin WebMCP.

### Fase 2 — Estado compartido mediante WebMCP

4. Añadir el adaptador WebMCP contextual y registrar las cinco calculadoras publicadas.
5. Implementar esquemas, respuestas estructuradas y errores para lectura, parche validado y actualización de una adición de lúpulo.
6. Mostrar disponibilidad y dejar claro en la UI qué campos modificó el agente.

**Checkpoint:** una edición manual es visible para `get_current_brew`; una actualización por herramienta se ve de inmediato en la UI.

### Fase 3 — Tres demostraciones reproducibles

7. Codificar y probar corrección de densímetro → actualización explícita → ABV.
8. Codificar y probar propuesta de dilución y aplicación posterior al volumen planificado.
9. Codificar y probar ajuste de IBU que sólo modifica Citra y conserva Mosaic.

**Checkpoint:** los tres guiones funcionan con el contexto simulado, sin aritmética propia del agente y sin valores ocultos.

### Fase 4 — Cierre para el hackathon

10. Endurecer validaciones, manejo de datos incompletos, foco/etiquetas/unidades y la señal visual de cambios de agente.
11. Documentar arquitectura, separación del trabajo previo, herramientas, desarrollo, licencia y enlace a demo; desplegar estáticamente.
12. Ejecutar pruebas, build de producción y prueba manual en el navegador integrado de ChatGPT; grabar el recorrido de un minuto.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| WebMCP no está disponible en todos los navegadores | Detección explícita; toda la UI funciona sin él; prueba final en ChatGPT. |
| IBU total no coincide con la expectativa del demo | Definir y probar que es la suma de Tinseth por adición, usando la misma gravedad y volumen del brew. |
| Mutaciones genéricas dañan el estado | Esquemas cerrados, lista blanca y herramientas específicas para lúpulos. |
| Alcance de gestión de recetas diluye la demo | Limitarse a cinco presets inmutables, cargar uno en Current Brew y persistir sólo ese brew activo. |
| Diferenciar trabajo previo del hackathon | README y demo separan claramente librería publicada, bindings WebMCP y nueva aplicación Lab. |

## Decisiones acordadas

- Desplegar en GitHub Pages.
- La interfaz inicial será en inglés, sin selector de idioma en el MVP.
- Incluir una biblioteca de cinco presets estáticos. La persona selecciona uno y usa “Load into Current Brew”; no son recetas persistentes ni editables como catálogo.
- Persistir el Current Brew activo con localStorage, incluyendo cambios realizados por WebMCP.
