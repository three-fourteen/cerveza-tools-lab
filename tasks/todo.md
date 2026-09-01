# Cerveza Tools Lab — tareas de implementación

## Task 1: Preparar la aplicación y las herramientas de calidad

**Description:** Crear el proyecto Vite React TypeScript con pnpm, configuración estricta, Vitest/Testing Library y la dependencia publicada `cerveza-tools`.

**Acceptance criteria:**
- [ ] `pnpm dev`, `pnpm test` y `pnpm build` están disponibles.
- [ ] La app importa `cerveza-tools` desde npm y no copia sus fórmulas.
- [ ] Existe una base de pruebas para módulos de dominio y componentes.

**Verification:**
- [ ] `pnpm test` pasa.
- [ ] `pnpm build` finaliza correctamente.

**Dependencies:** None

**Estimated scope:** Medium

## Task 2: Crear Current Brew y métricas derivadas

**Description:** Definir el modelo mínimo, cinco recetas predefinidas (American IPA por defecto) y el store Zustand persistido con acciones centralizadas, validación y métricas calculadas mediante `cerveza-tools`.

**Acceptance criteria:**
- [ ] Toda mutación pasa por una acción tipada del store.
- [ ] ABV, OG corregida e IBU sólo se devuelven cuando hay datos suficientes.
- [ ] El IBU total suma cada adición de lúpulo sin modificar el brew.
- [ ] “Load into Current Brew” crea una copia nueva del preset y no permite modificar el catálogo.
- [ ] El Current Brew activo, incluidos cambios de agente, se restaura desde localStorage tras recargar; un valor inválido recupera American IPA.

**Verification:**
- [ ] Pruebas unitarias cubren las acciones, validación y métricas.
- [ ] `pnpm test` pasa.

**Dependencies:** Task 1

**Estimated scope:** Medium

## Task 3: Construir el workspace humano

**Description:** Implementar una biblioteca mínima de recetas, el flujo de cargar una en Current Brew y la pantalla accesible para editar el brew, gestionar dos o más lúpulos y ver métricas en tiempo real.

**Acceptance criteria:**
- [ ] Todos los inputs tienen etiqueta, unidad, foco visible y manejo por teclado.
- [ ] Una edición humana recalcula métricas y no crea estado de calculadora duplicado.
- [ ] Seleccionar una receta no modifica Current Brew hasta usar “Load into Current Brew”.
- [ ] La app es útil aunque el navegador no admita WebMCP.

**Verification:**
- [ ] Pruebas de interacción cubren edición de gravedad, FG y lúpulo.
- [ ] `pnpm build` finaliza correctamente.

**Dependencies:** Task 2

**Estimated scope:** Large

## Checkpoint: Foundation

- [ ] Todas las pruebas pasan y el build es limpio.
- [ ] El flujo humano modifica el preset y actualiza ABV/IBU.

## Task 4: Registrar WebMCP y herramientas contextuales de Lab

**Description:** Registrar las calculadoras publicadas y exponer lectura, métricas, parche validado y actualización puntual de lúpulo contra el store compartido.

**Acceptance criteria:**
- [ ] Se registran las cinco herramientas de `cerveza-tools/webmcp` si hay soporte.
- [ ] `get_current_brew` y `get_current_brew_metrics` devuelven el snapshot actual normalizado.
- [ ] Las mutaciones rechazan campos no autorizados y errores con formato estructurado.

**Verification:**
- [ ] Pruebas con `ModelContext` simulado cubren soporte, registro y errores.
- [ ] `pnpm test` pasa.

**Dependencies:** Task 2

**Estimated scope:** Medium

## Task 5: Hacer visible la colaboración humano-agente

**Description:** Añadir indicador de capacidad WebMCP y feedback temporal, accesible y no dependiente sólo del color, para cambios efectuados por las herramientas del agente.

**Acceptance criteria:**
- [ ] La UI diferencia WebMCP disponible de no disponible sin bloquear el uso normal.
- [ ] Una mutación del agente refleja el cambio de valor y su origen de inmediato.
- [ ] UI y herramientas usan exactamente las mismas acciones del store.

**Verification:**
- [ ] Pruebas demuestran edición humana → lectura de herramienta y herramienta → UI actualizada.
- [ ] Revisión manual con teclado y lector de pantalla básico.

**Dependencies:** Tasks 3, 4

**Estimated scope:** Medium

## Task 6: Consolidar los tres flujos de demostración

**Description:** Implementar pruebas de integración para corrección→ABV, dilución y ajuste de IBU que preserva Mosaic.

**Acceptance criteria:**
- [ ] Corrección de densímetro usa calculadora, guarda el valor explícito y permite calcular ABV.
- [ ] Dilución calcula antes de cambiar el volumen y sólo lo actualiza ante solicitud explícita.
- [ ] Ajustar IBU actualiza sólo Citra y conserva Mosaic.

**Verification:**
- [ ] Las tres pruebas de integración pasan sin modelo real.
- [ ] `pnpm test` pasa.

**Dependencies:** Tasks 4, 5

**Estimated scope:** Medium

## Checkpoint: Core flow

- [ ] Los tres escenarios pasan de extremo a extremo en pruebas.
- [ ] La aplicación conserva una única fuente de verdad y funciona sin WebMCP.

## Task 7: Documentar, desplegar y validar la entrega

**Description:** Preparar README y licencia, publicar la SPA en GitHub Pages y comprobar el uso en el navegador integrado de ChatGPT.

**Acceptance criteria:**
- [ ] README explica propósito, arquitectura, todas las herramientas, desarrollo, demo y la diferencia entre trabajo previo y hackathon.
- [ ] Hay una licencia coherente, un workflow de GitHub Pages y una URL pública funcional bajo el subpath del repositorio.
- [ ] La demo muestra el ciclo humano → agente → humano en menos de un minuto.

**Verification:**
- [ ] `pnpm test` y `pnpm build` pasan antes de publicar.
- [ ] Prueba manual de la URL desplegada desde ChatGPT confirma registro WebMCP y tres flujos.

**Dependencies:** Task 6

**Estimated scope:** Medium

## Checkpoint: Complete

- [ ] Se cumplen todos los criterios MVP de la especificación.
- [ ] El despliegue y el demo están listos para revisión.
