# Prompts used

These are the four prompts that built this project, one per task and per chat, in the order they were run.
Each prompt is transcribed verbatim from the Word file in [`prompts/`](prompts/), starting right after the line
"PROMPT: copiar desde aquí" (the part above that line was a preparation checklist for the operator and was not
sent to the agent). Word headings and lists are rendered as Markdown headings and lists; the words are unchanged.

> **Language note.** The prompts are in Spanish on purpose and are kept exactly as written. Each one told the
> agent to talk to the author in Spanish but to write everything in the repository (code, UI text, documentation
> and commit messages) in English. Apart from the prompts, only the debt register views that Forge generates in
> `deuda tecnica/` are in Spanish.

After each prompt, a short note in English records how the task actually ran: branch or worktree, agent mode and
the decisions the author made when the agent asked. Facts come from `git log`, the Forge records in
[`.forge/`](../../.forge/) and the task 4 chat; anything else is marked *not recorded*. How the workflow works is
described in [`WORKFLOW.md`](WORKFLOW.md).

| # | Task (Word file) | Branch | Where | Agent mode | Forge task |
|---|------------------|--------|-------|------------|------------|
| 1 | [Foundation, contract and architecture](<prompts/Prompt 1 - Fundacion, contrato y arquitectura.docx>) | `feat/foundation` | main folder | none | `5a595807` |
| 2 | [Go backend](<prompts/Prompt 2 - Backend Go.docx>) | `feat/backend-api` | worktree `../AssessmentSezzle.worktrees/feat-backend-api` | simple | `54a148d4` |
| 3 | [React frontend](<prompts/Prompt 3 - Frontend React.docx>) | `feat/frontend-ui` | worktree `../AssessmentSezzle.worktrees/feat-frontend-ui` | simple | `ac3c786e` |
| 4 | [Integration and delivery](<prompts/Prompt 4 - Integracion y entrega.docx>) | `feat/delivery` | main folder | simple | `490b37cc` |

## Prompt 1 · Foundation, contract and architecture

fullhouse:: Fundación del proyecto Sezzle Calculator: spec, contrato de API, arquitectura, ADRs, skills del repositorio y reglas para agentes. En esta tarea no se escribe código de aplicación. Háblame en español en el chat; todo lo que quede en el repositorio va en inglés.

### 1. Contexto

Estoy resolviendo la prueba técnica de Sezzle. El enunciado pide una calculadora full-stack con un frontend en React que consume un microservicio backend con API REST. Requisitos:

- Operaciones: suma, resta, multiplicación y división. Opcionales: potencia, raíz cuadrada y porcentaje (las vamos a incluir).
- Frontend en React, preferiblemente TypeScript: UI intuitiva para ingresar datos y ver resultados, validación de entrada y manejo de errores, diseño responsive con soporte móvil básico.
- Backend REST, preferiblemente en Go: endpoints para las operaciones, validación de entrada, manejo de bordes (división por cero, datos inválidos) y respuestas en JSON.
- No funcionales: código limpio, legible e idiomático en ambas capas; tests unitarios de la funcionalidad clave en ambas capas; documentación de setup, uso de la API y razones de diseño. Opcional: Dockerfile para levantar todo junto.
- Entregables: repositorio Git con front y back, README con setup, cómo correr cada parte, ejemplos de llamadas a la API y decisiones o supuestos de diseño, tests y reporte de cobertura, Dockerfile opcional y los prompts usados.
- Tiempo sugerido de 2 a 4 horas. Prioridad explícita: corrección, claridad y mantenibilidad por encima de features extra.

El trabajo se divide en 4 tareas. Cada una tiene su propio chat y su propia rama, y las que corren en paralelo tienen además su propio worktree:

1. Tarea 1 (esta): rama feat/foundation en la carpeta principal. Documentación base y contrato. Se integra en main antes de abrir las demás.
2. Tarea 2: rama feat/backend-api en el worktree C:\Users\joshe\Desktop\AssessmentSezzle.worktrees\feat-backend-api. Backend en Go.
3. Tarea 3: rama feat/frontend-ui en el worktree C:\Users\joshe\Desktop\AssessmentSezzle.worktrees\feat-frontend-ui. Frontend en React. Corre en paralelo con la tarea 2.
4. Tarea 4: rama feat/delivery en la carpeta principal. Integración con forge\_integration, Docker, CI, cobertura, README final y documentación del flujo con IA.

Las tareas 2 y 3 no se ven entre sí. El contrato que definas aquí es lo único que comparten, así que tiene que ser completo y sin ambigüedades.

### 2. Protocolo Forge (obligatorio y en este orden)

1. Preparación del host, antes de Forge: la carpeta todavía no es un repositorio. Ejecuta git init -b main y luego git commit --allow-empty -m "chore: initialize repository" para que exista la rama base. No crees ningún otro archivo todavía. Si Git no tiene user.name o user.email configurados, detente y pídemelos; no los configures por tu cuenta.
2. Lee C:\Users\joshe\plugins\forge\skills\forge-core\SKILL.md y síguelo durante toda la tarea.
3. Llama forge\_task\_preflight con projectRoot=C:\Users\joshe\Desktop\AssessmentSezzle, host="claude", level="fullhouse" y este mensaje como task. Sigue execution.nextSteps en orden y lleva gitTaskId, knownPreflightVersion y knownEvidenceVersion en las llamadas siguientes.
4. Modo de agentes: hazme la pregunta nativa (execution.agentModeQuestion) y espera mi respuesta. Voy a responder sin subagentes, porque la arquitectura y el contrato se quedan en el coordinador. Regístralo con forge\_workflow y no delegues nada.
5. Git: hazme la pregunta nativa (execution.git.question). Voy a elegir rama nueva feat/foundation en esta carpeta. Regístralo con forge\_git\_workflow action=choose, con mi respuesta explícita y el snapshotVersion.
6. Ejecuta forge\_graph action=refresh si el grafo no está al día. El proyecto está vacío; si no aplica, dilo.
7. Ejecuta forge\_workflow action=start con level fullhouse, el intent, el scope (los archivos de la sección 4) y los checks de la sección 6.
8. Lee estas skills desde C:\Users\joshe\plugins\forge\skills\\: spec-driven-development, planning-and-task-breakdown, api-and-interface-design, documentation-and-adrs, git-workflow-and-versioning y ponytail.
9. Escribe el spec y el plan de esta tarea, muéstramelos y espera mi aprobación antes de crear archivos.
10. Edita de forma nativa y vuelve a ejecutar forge\_graph action=refresh. Registra en forge\_workflow: implementation; check, uno por cada check planeado y con la salida real; review; y delivery con el bloque de arquitectura (dataModel, dataStructures, patterns, flow, contracts, state).
11. Ejecuta forge\_development\_check con rutas explícitas, la disposición de la documentación y los IDs de deuda revisados.
12. Ejecuta forge\_git\_workflow action=ready, hazme la pregunta de entrega y haz stage y commit solo de lo que yo apruebe. Usa Conventional Commits en inglés.
13. Después del commit, pregúntame antes de integrar feat/foundation en main con git merge --no-ff. Nunca hagas push, rebase, reset ni stash, y nunca borres ramas.

Si Forge MCP no está disponible, sigue el mismo orden manualmente y dímelo explícitamente. Nunca reportes checks que no ejecutaste. Si el contexto se acerca al límite, termina el paso actual, ejecuta forge\_handoff action=write y avísame.

### 3. Decisiones de arquitectura ya tomadas

Documéntalas tal cual. Si ves un problema real en alguna, avísame antes de cambiarla.

#### Estructura y estilo

- Monorepo con backend/ (Go), frontend/ (React, TypeScript y Vite) y docs/.
- Contract-first: docs/api/openapi.yaml (OpenAPI 3.1) más ejemplos ejecutables en docs/api/examples/. Los tests de ambos lados usan esos ejemplos como fixtures.
- El backend usa solo la librería estándar de Go: net/http con patrones de método (Go 1.22 o superior), encoding/json, log/slog y math. Sin frameworks ni dependencias externas.
- Capas del backend: internal/calculator es el dominio puro (operaciones, aridad y errores de dominio) y no conoce HTTP. internal/httpapi es el transporte (decodificación estricta, validación, mapeo de errores a HTTP y middleware). cmd/server es la configuración y el arranque.
- Patrón strategy: un registro de operaciones que mapea cada id a su aridad y su función. Agregar una operación es una entrada en el registro más sus tests.

#### Endpoints

- GET /healthz responde 200 con {"status":"ok"}.
- POST /api/v1/calculations con Content-Type: application/json. Cuerpo {"operation":"divide","operands":\[10,4\]}. Respuesta 200: {"operation":"divide","operands":\[10,4\],"result":2.5}.

#### Operaciones (id, aridad y semántica)

- add 2: a + b. subtract 2: a − b. multiply 2: a × b. divide 2: a ÷ b.
- power 2: a elevado a b. sqrt 1: raíz cuadrada de a. percentage 2: a por ciento de b, es decir a × b / 100.

#### Modelo de errores

Formato RFC 9457 application/problem+json: {"type":"about:blank","title":"...","status":422,"detail":"...","code":"DIVISION\_BY\_ZERO"}. El campo code es estable y es lo que usa el frontend; detail es texto para humanos.

- 400 INVALID\_JSON: JSON mal formado, campos desconocidos, más de un objeto en el cuerpo o tipos incorrectos a nivel de objeto.
- 400 UNSUPPORTED\_OPERATION: la operación no está en el registro.
- 400 INVALID\_OPERANDS: cantidad distinta a la aridad, null, valor no numérico o fuera del rango de float64.
- 413 PAYLOAD\_TOO\_LARGE: cuerpo mayor a 4 KiB.
- 415 UNSUPPORTED\_MEDIA\_TYPE: Content-Type distinto de application/json; se acepta el parámetro charset.
- 422 DIVISION\_BY\_ZERO: divisor 0 o -0.
- 422 DOMAIN\_ERROR: raíz de un negativo, base negativa con exponente fraccionario, 0 elevado a un exponente negativo.
- 422 RESULT\_OUT\_OF\_RANGE: el resultado sería ±Inf con entradas finitas.
- 404 NOT\_FOUND y 405 METHOD\_NOT\_ALLOWED bajo /api/, también en problem+json. El 405 incluye el header Allow.
- 500 INTERNAL\_ERROR: sin detalles internos en la respuesta; el detalle va al log.

#### Modelo numérico

float64 IEEE-754. El backend nunca devuelve NaN ni ±Inf, porque JSON no puede representarlos, y normaliza -0 a 0. El frontend formatea solo para mostrar (máximo 12 dígitos significativos y notación exponencial fuera de rango) para no mostrar 0.30000000000000004. El ADR debe explicar por qué no usamos decimal: raíz y potencia no son exactas en decimal. También debe dejar claro que en un sistema de pagos real usaríamos enteros en unidades menores (centavos) o un tipo decimal. Quiero que se note que conozco el contexto fintech.

#### Puertos y configuración

- Backend en el puerto 8080 (variable PORT). Variable opcional STATIC\_DIR: si está definida, el backend sirve el build del frontend.
- Frontend en desarrollo en el puerto 5173, con proxy de Vite para /api y /healthz hacia http://localhost:8080. Así el navegador siempre habla con el mismo origen y no hace falta CORS.
- Docker: una sola imagen donde Go sirve el SPA y la API en el puerto 8080, en el mismo origen. No se habilita CORS; queda documentado.

#### Interfaz

Formulario con operandos explícitos (operando A, selector de operación y operando B, que se oculta en operaciones unarias) en lugar de un teclado de calculadora clásica. Razones: mapea 1 a 1 con el contrato, hace visible la validación, es accesible por teclado y evita escribir un parser de expresiones en el cliente. Sin historial ni features extra.

#### Convenciones

- Código, identificadores, comentarios, textos de la UI, README, documentación técnica y commits en inglés.
- TDD y tests unitarios en ambas capas con cobertura reportada. Metas: dominio ≥ 95 %, httpapi ≥ 85 % y frontend ≥ 85 % de líneas.
- Ponytail: el cambio coherente más pequeño, primero la librería estándar y la plataforma nativa, sin quitar nunca validación, seguridad, accesibilidad ni manejo de errores.
- Ningún archivo mantenido a mano supera 500 líneas. La deuda técnica se registra en deuda tecnica/ con forge\_debt.

### 4. Archivos a crear

- .gitignore: node\_modules, dist, coverage, coverage.out, binarios de Go, .env y .env.\*, y .forge/tmp/. Muéstrame qué creó Forge dentro de .forge/ y decidimos juntos qué se versiona como evidencia y qué se ignora.
- .gitattributes con \* text=auto eol=lf. Estamos en Windows y esto evita diffs falsos y problemas con gofmt.
- .editorconfig (tabs en Go, 2 espacios en TS, JSON, YAML y CSS).
- AGENTS.md: guía para cualquier agente que trabaje en el repo. Debe incluir propósito, estructura, comandos (los que existirán, marcados como tales), el contrato como fuente de verdad, las reglas (Forge, Ponytail, TDD, 500 líneas, deuda técnica, una rama por tarea, worktrees para tareas paralelas, Conventional Commits, nunca push automático) y qué skills de .claude/skills/ usar en cada área.
- CLAUDE.md con una sola línea, @AGENTS.md, para no duplicar instrucciones.
- docs/spec.md con los campos del spec de Forge: goal, users, problem, scope, outOfScope, stack, features, quality, security, deployment, acceptanceCriteria (verificables, uno por requisito del enunciado), risks, decisions y openQuestions.
- docs/architecture.md: contexto; diagrama de componentes y diagrama de secuencia de un cálculo en Mermaid; capas y responsabilidades; estructura de carpetas objetivo del backend y del frontend; tabla de puertos y variables de entorno; modelo de errores; modelo numérico; estrategia de pruebas por capa con metas de cobertura; plan de ramas y worktrees de las 4 tareas.
- docs/api/openapi.yaml: OpenAPI 3.1 completo y válido, con schemas, ejemplos y todas las respuestas de error.
- docs/api/examples/: un archivo JSON por caso con la forma {"name":"...","request":{"method":"...","path":"...","headers":{},"body":...},"response":{"status":200,"contentType":"...","body":...}}. En el caso de JSON mal formado, body es un string. Cubre: cada operación con éxito, división por cero, raíz de negativo, potencia fuera de rango, operación no soportada, aridad incorrecta, operando null, campo desconocido, JSON mal formado y media type incorrecto.
- docs/api/README.md: cómo leer el contrato y cómo usan los ejemplos como fixtures el backend (test de contrato en Go) y el frontend (handlers de MSW).
- docs/adr/ en formato corto (Context, Decision, Alternatives considered, Consequences): 0001 monorepo y contract-first; 0002 un endpoint de cálculos con problem+json (la alternativa era un endpoint por operación); 0003 modelo numérico float64 con formateo en el cliente; 0004 Go con stdlib y sin framework; 0005 UI de operandos explícitos; 0006 un solo contenedor con Go sirviendo el SPA y proxy de Vite en desarrollo, sin CORS.
- .claude/skills/: copia sin modificar, con la carpeta completa de cada una, estas 15 skills desde C:\Users\joshe\plugins\forge\skills\\: forge-core, ponytail, spec-driven-development, planning-and-task-breakdown, git-workflow-and-versioning, documentation-and-adrs, api-and-interface-design, test-driven-development, security-and-hardening, code-review-and-quality, frontend-ui-engineering, accessible-ui-engineering-wcag22, antislop, antislop-ui y ci-cd-and-automation.
- .claude/skills/README.md: una tabla con la skill, para qué se usa en este proyecto, en qué tarea se usa, su origen y su licencia. Si una skill tiene enlaces relativos que apuntan fuera de su carpeta, no la edites; anótalo en este README.
- THIRD\_PARTY\_NOTICES.md en la raíz: atribución, revisión y licencia de cada skill copiada. Toma los datos de C:\Users\joshe\plugins\forge\THIRD\_PARTY\_NOTICES.md y de C:\Users\joshe\plugins\forge\LICENSE. No supongas ninguna licencia que no esté escrita ahí.
- docs/ai/WORKFLOW.md, en inglés y de una página: qué es Forge; el ciclo de cada tarea (preflight, modo de agentes, Git o worktree, spec, plan, build con TDD, check, review, delivery, development check, ready); cómo se eligen subagentes y modelos; por qué una rama por tarea y worktrees para el trabajo paralelo; qué son Ponytail y AntiSlop; y dónde está la evidencia en el repo. Se completa en la tarea 4.
- README.md en inglés, como esqueleto con las secciones que exige el enunciado: Overview, Quick start, Running the backend, Running the frontend, Tests and coverage, API usage, Design decisions, Assumptions, Project structure y How this was built. Marca las secciones pendientes con "Completed in task 4" y no inventes comandos que todavía no existen.
- No crees backend/ ni frontend/. Cada tarea paralela los crea en su propio worktree para evitar conflictos.

### 5. Supuestos a documentar en el spec y en el README

- percentage significa a por ciento de b.
- Se usa float64 con su precisión documentada.
- No hay autenticación ni persistencia: la calculadora no tiene estado.
- El cuerpo de las peticiones tiene un límite de 4 KiB.
- No hay CORS porque todo se sirve desde el mismo origen.
- La UI está en inglés.

### 6. Checks de esta tarea

- openapi.yaml es válido. Valídalo con una herramienta ejecutada sin instalarla en el proyecto, por ejemplo npx @redocly/cli@\<versión fija\> lint docs/api/openapi.yaml. Si no hay red o no se puede, dilo y valida la estructura manualmente.
- Cada archivo de docs/api/examples/ es JSON válido y es consistente con el contrato: el status y el code coinciden con la tabla de errores.
- Ningún archivo mantenido a mano supera 500 líneas.
- Las 15 skills están copiadas completas: compara la cantidad de archivos con el origen.
- Después del merge, git status está limpio y git log --graph --oneline muestra el commit inicial y el merge de feat/foundation.

### 7. Cierre

Termina con el bloque Arquitectura de Forge (Modelo de datos, Estructuras de datos, Patrones, Flujo e integraciones, Contratos, Estado y persistencia), la lista de checks con su resultado real y la confirmación de que el repo está listo para abrir las tareas 2 y 3 en paralelo.

### How task 1 ran

- **Branch:** `feat/foundation`, created from `main` in the main folder (Forge Git record, choice `create`);
  merged into `main` with `--no-ff` as `f155105`.
- **Agent mode:** none (Forge workflow record `5a595807`): the coordinator did all the work.
- **Author decisions:** approved the spec and plan as presented, including accepting only `charset=utf-8` as a
  `Content-Type` parameter; version `.forge/changes/` and `.forge/workflow/` as evidence and ignore the rest of
  `.forge/`. Recorded deviations: 17 examples instead of 16 (`healthz` added) and vendored skills marked `-text`
  in `.gitattributes` because the upstream files are CRLF.

## Prompt 2 · Go backend

fullhouse:: Backend en Go de Sezzle Calculator según el contrato del repositorio. Se trabaja en la rama feat/backend-api dentro de su propio worktree, en paralelo con el frontend. Háblame en español en el chat; el código, los comentarios, los docs y los commits van en inglés.

### 1. Contexto

Es la prueba técnica de Sezzle (calculadora full-stack). La tarea 1 ya dejó en main: docs/spec.md, docs/architecture.md, docs/api/openapi.yaml, docs/api/examples/, docs/adr/, AGENTS.md y las skills en .claude/skills/. Otra sesión construye el frontend al mismo tiempo en el worktree de feat/frontend-ui. Tu alcance es solo backend/, más tus entradas de deuda técnica.

### 2. Protocolo Forge (obligatorio y en este orden)

1. Lee AGENTS.md y .claude/skills/forge-core/SKILL.md, y sigue forge-core durante toda la tarea.
2. Llama forge\_task\_preflight con projectRoot=C:\Users\joshe\Desktop\AssessmentSezzle, host="claude", level="fullhouse" y este mensaje como task. Sigue execution.nextSteps en orden y lleva gitTaskId, knownPreflightVersion y knownEvidenceVersion.
3. Modo de agentes: hazme la pregunta nativa y espera. Voy a responder agentes sencillos. No delegues nada hasta registrarlo con forge\_workflow.
4. Git: hazme la pregunta nativa. Como hay otra tarea activa en paralelo, voy a elegir worktree con la rama feat/backend-api creada desde main. Regístralo con forge\_git\_workflow action=choose, con mi respuesta explícita y el snapshotVersion. Ejecuta el worktreeCommand que devuelve Forge; la ruta esperada es C:\Users\joshe\Desktop\AssessmentSezzle.worktrees\feat-backend-api. Desde ese momento, usa esa carpeta como projectRoot en todas las llamadas de Forge y en todas las rutas absolutas. Nunca edites la carpeta principal.
5. Ejecuta forge\_graph action=refresh si el grafo no está al día y luego forge\_workflow action=start con el scope (backend/ y tus entradas en deuda tecnica/) y los checks de la sección 6.
6. Lee las skills de .claude/skills/: api-and-interface-design, test-driven-development, security-and-hardening, code-review-and-quality, planning-and-task-breakdown y ponytail. Lee también docs/api/openapi.yaml, docs/api/examples/, docs/architecture.md y los ADR 0002, 0003, 0004 y 0006. Revisa la deuda relacionada que devuelve el preflight.
7. Escribe el spec de la tarea y el plan con el reparto de subagentes de la sección 7. Muéstramelos y espera mi aprobación antes de editar.
8. Construye con TDD: primero el test que falla, luego el mínimo para que pase, luego el refactor.
9. Ejecuta forge\_graph action=refresh y registra implementation; check, uno por cada check con su salida real; review; y delivery con el bloque de arquitectura (dataModel, dataStructures, patterns, flow, contracts, state).
10. Ejecuta forge\_development\_check con rutas explícitas, la disposición de la documentación y los IDs de deuda revisados. Luego forge\_git\_workflow action=ready, hazme la pregunta de entrega y haz stage y commit solo de lo que yo apruebe (Conventional Commits).
11. No integres en main: eso lo hace la tarea 4 con forge\_integration. Nunca hagas push, rebase, reset ni stash, y nunca borres ramas ni worktrees.

Si Forge MCP no está disponible, sigue el mismo orden manualmente y dímelo. Nunca reportes checks que no ejecutaste. Si el contexto se acerca al límite, termina el paso actual, ejecuta forge\_handoff action=write y avísame.

### 3. Regla del contrato

docs/api/ es de solo lectura en esta rama. Si encuentras un error o una ambigüedad en el contrato, detente, explícamelo y regístralo con forge\_debt. No lo cambies por tu cuenta: el frontend se está construyendo en paralelo contra ese mismo contrato.

### 4. Diseño de backend/

#### Módulo

- go.mod con el módulo github.com/\<usuario\>/sezzle-calculator/backend. Pregúntame el usuario de GitHub antes de crearlo.
- Versión de Go: la instalada, como mínimo 1.22 por los patrones de método de net/http. Fíjala en go.mod.
- Sin dependencias externas: no debe aparecer ningún módulo de terceros.

#### cmd/server

- main.go delgado. La lógica va en una función testeable, por ejemplo run(ctx, getenv, stdout) error.
- Configuración desde variables de entorno: PORT, 8080 por defecto, y STATIC\_DIR opcional.
- Logger log/slog en formato JSON.
- http.Server con ReadHeaderTimeout, ReadTimeout, WriteTimeout e IdleTimeout explícitos, y apagado ordenado con signal.NotifyContext y un timeout de shutdown.

#### internal/calculator (dominio puro, sin HTTP)

- Tipo Operation con las 7 operaciones del contrato.
- Registro de operaciones (patrón strategy): un map de Operation a {arity, fn}.
- Errores centinela: ErrUnsupportedOperation, ErrInvalidOperandCount, ErrDivisionByZero, ErrDomain y ErrOutOfRange.
- Calculate(op Operation, operands \[\]float64) (float64, error): valida la aridad, aplica la operación, detecta división entre cero y 0 elevado a un negativo antes de calcular, convierte NaN en ErrDomain y cualquier otro ±Inf en ErrOutOfRange, y normaliza -0 a 0.

#### internal/httpapi (transporte)

- NewHandler(logger, staticDir) http.Handler registra las rutas: GET /healthz; POST /api/v1/calculations; cualquier otro método sobre /api/v1/calculations devuelve 405 en problem+json con el header Allow; el catch-all /api/ devuelve 404 en problem+json; y si hay STATIC\_DIR, / sirve los archivos estáticos.
- Decodificación estricta: http.MaxBytesReader con 4 KiB; mime.ParseMediaType para el Content-Type; json.Decoder con DisallowUnknownFields; rechazo de datos después del primer objeto; y operands decodificados como \[\]\*float64 para que un null no se convierta en 0 sin avisar.
- Mapeo de errores de dominio a status y code con errors.Is, según la tabla del contrato, y una sola función writeProblem.
- Middleware: recover que devuelve 500 en problem+json y registra el panic; log de cada request con slog (método, ruta, status y duración); y el header X-Content-Type-Options: nosniff.
- Archivos pequeños, uno por responsabilidad: routes.go, calculations.go, decode.go, problem.go y middleware.go.
- backend/README.md corto, en inglés: requisitos, cómo correr, cómo testear, cómo sacar cobertura y la estructura. Si la implementación difiere de docs/architecture.md, actualiza solo la sección del backend de ese archivo.

### 5. Pruebas

- calculator: tests table-driven por operación, con casos normales y bordes: división entre 0 y entre -0, raíz de un negativo, 0 elevado a -1, (-8) elevado a 1/3, 1e308 × 10, normalización de -0 y percentage.
- calculator: un fuzz test, FuzzCalculate, que verifique que Calculate nunca devuelve NaN ni ±Inf sin error.
- httpapi: tests con httptest para cada status y code de la tabla, el Content-Type de cada respuesta, un cuerpo de 4 KiB + 1 byte y un panic recuperado.
- Test de contrato: recorre docs/api/examples/\*.json, ejecuta cada request contra el handler y compara status, Content-Type y body. Ese test es la prueba de que el backend cumple el contrato.
- cmd/server: test de run y de la configuración (puerto por defecto, STATIC\_DIR), siempre que se mantenga simple.
- Metas de cobertura: calculator ≥ 95 % y httpapi ≥ 85 %. Reporta los números observados, no estimados.

### 6. Checks (cada uno con su salida real)

- gofmt -l . no devuelve nada.
- go vet ./...
- go test ./... -race -count=1. Si -race no funciona en Windows por falta de CGO o gcc, dilo y córrelo sin -race; la CI lo correrá en Linux.
- go test ./... -coverprofile=coverage.out y luego go tool cover -func=coverage.out.
- Fuzz corto: go test -fuzz=FuzzCalculate -fuzztime=20s ./internal/calculator.
- Smoke: levanta el servidor en 8080 y haz curl a /healthz, a un cálculo exitoso y a una división por cero. Apágalo al terminar.
- Ningún archivo supera 500 líneas.

### 7. Subagentes (modo agentes sencillos)

Máximo 3 workers en paralelo, sin delegación anidada y con un reintento como máximo por tarea. Antes de delegar, el coordinador fija en el plan las firmas públicas (Operation, Calculate, los errores centinela y NewHandler) para que los workers trabajen sobre archivos disjuntos.

- Worker 1, forge-sonnet-high: internal/calculator con sus tests y el fuzz test.
- Worker 2, forge-sonnet-high: internal/httpapi con sus tests y el test de contrato, contra las firmas acordadas.
- Worker 3, forge-haiku-high: después de integrar, corre los checks de la sección 6 y reporta las salidas. No edita código.
- Revisor, forge-sonnet-max: revisión independiente del diff completo con code-review-and-quality y security-and-hardening. Reporta hallazgos y no edita.
- Coordinador: cmd/server, la integración del trabajo de los workers, la resolución de hallazgos y la verificación final.

Cada asignación lleva: el projectRoot absoluto del worktree, el objetivo, los archivos permitidos, el contexto mínimo, las rutas de las skills, los criterios de aceptación y la evidencia esperada. Cada worker lee forge-core y llama forge\_task\_preflight con su asignación y host="claude". Reporta el modelo y el esfuerzo de cada worker solo si el host los muestra; no los deduzcas del nombre del perfil.

### 8. Cierre

Termina con el bloque Arquitectura de Forge (Modelo de datos, Estructuras de datos, Patrones, Flujo e integraciones, Contratos, Estado y persistencia), la tabla de checks con sus resultados y los números de cobertura observados, los IDs de deuda registrados o revisados y el hash del commit aprobado.

### How task 2 ran

- **Branch:** `feat/backend-api` in its own worktree (Forge Git record, choice `worktree`), created from `main`
  at 13:12 on 2026-10-13, in parallel with task 3 (`git reflog`). Merged into `main` with `--no-ff` as `ea24883`
  at 19:25, although the prompt said the merge belonged to prompt 4; who asked for that merge is *not recorded*.
- **Agent mode:** simple (Forge workflow record `54a148d4`).
- **Author decisions:** GitHub user `BillyJoe121` for the module path; `go.mod` declares `go 1.27.0`, the
  installed version, instead of the spec's 1.22; approved decoding the body into `map[string]json.RawMessage`
  with an exact key allowlist, and operands one by one, so case-variant keys and out-of-range numbers keep the
  contract's validation order. `-race` could not run on the Windows host (no cgo); CI runs it on Linux.

## Prompt 3 · React + TypeScript frontend

fullhouse:: Frontend en React + TypeScript de Sezzle Calculator según el contrato del repositorio. Se trabaja en la rama feat/frontend-ui dentro de su propio worktree, en paralelo con el backend. Háblame en español en el chat; el código, los textos de la UI, los docs y los commits van en inglés.

### 1. Contexto

Es la prueba técnica de Sezzle (calculadora full-stack). La tarea 1 ya dejó en main: docs/spec.md, docs/architecture.md, docs/api/openapi.yaml, docs/api/examples/, docs/adr/, AGENTS.md y las skills en .claude/skills/. Otra sesión construye el backend en Go al mismo tiempo en el worktree de feat/backend-api, así que el backend no está disponible en esta rama. Tu alcance es solo frontend/, más tus entradas de deuda técnica.

### 2. Protocolo Forge (obligatorio y en este orden)

1. Lee AGENTS.md y .claude/skills/forge-core/SKILL.md, y sigue forge-core durante toda la tarea.
2. Llama forge\_task\_preflight con projectRoot=C:\Users\joshe\Desktop\AssessmentSezzle, host="claude", level="fullhouse" y este mensaje como task. Sigue execution.nextSteps en orden y lleva gitTaskId, knownPreflightVersion y knownEvidenceVersion.
3. Modo de agentes: hazme la pregunta nativa y espera. Voy a responder agentes sencillos. No delegues nada hasta registrarlo con forge\_workflow.
4. Git: hazme la pregunta nativa. Como hay otra tarea activa en paralelo, voy a elegir worktree con la rama feat/frontend-ui creada desde main. Regístralo con forge\_git\_workflow action=choose, con mi respuesta explícita y el snapshotVersion. Ejecuta el worktreeCommand que devuelve Forge; la ruta esperada es C:\Users\joshe\Desktop\AssessmentSezzle.worktrees\feat-frontend-ui. Desde ese momento, usa esa carpeta como projectRoot en todas las llamadas de Forge y en todas las rutas absolutas. Nunca edites la carpeta principal.
5. Ejecuta forge\_graph action=refresh si el grafo no está al día y luego forge\_workflow action=start con el scope (frontend/ y tus entradas en deuda tecnica/) y los checks de la sección 6.
6. Lee las skills de .claude/skills/: frontend-ui-engineering, accessible-ui-engineering-wcag22, antislop, antislop-ui, test-driven-development, api-and-interface-design, code-review-and-quality, planning-and-task-breakdown y ponytail. Lee también docs/api/openapi.yaml, docs/api/examples/, docs/architecture.md y los ADR 0003, 0005 y 0006. Revisa la deuda relacionada que devuelve el preflight.
7. Escribe el spec de la tarea y el plan con el reparto de subagentes de la sección 7 y la lista de dependencias con su justificación. Muéstramelos y espera mi aprobación antes de editar.
8. Construye con TDD: primero el test que falla, luego el mínimo para que pase, luego el refactor.
9. Ejecuta forge\_graph action=refresh y registra implementation; check, uno por cada check con su salida real; review, incluido el gate de AntiSlop; y delivery con el bloque de arquitectura (dataModel, dataStructures, patterns, flow, contracts, state).
10. Ejecuta forge\_development\_check con rutas explícitas, la disposición de la documentación y los IDs de deuda revisados. Luego forge\_git\_workflow action=ready, hazme la pregunta de entrega y haz stage y commit solo de lo que yo apruebe (Conventional Commits).
11. No integres en main: eso lo hace la tarea 4 con forge\_integration. Nunca hagas push, rebase, reset ni stash, y nunca borres ramas ni worktrees.

Si Forge MCP no está disponible, sigue el mismo orden manualmente y dímelo. Nunca reportes checks que no ejecutaste. Si el contexto se acerca al límite, termina el paso actual, ejecuta forge\_handoff action=write y avísame.

### 3. Regla del contrato

docs/api/ es de solo lectura en esta rama. Si encuentras un error o una ambigüedad en el contrato, detente, explícamelo y regístralo con forge\_debt. No lo cambies por tu cuenta: el backend se está construyendo en paralelo contra ese mismo contrato.

### 4. Diseño de frontend/

#### Base del proyecto

- Crea el proyecto con create-vite y la plantilla react-ts dentro de frontend/, sin modo interactivo y sin arrancar el servidor. Usa TypeScript en modo strict.
- Dependencias con versión exacta (.npmrc con save-exact=true) y package-lock.json versionado. Solo se agregan dependencias de desarrollo: vitest, @vitest/coverage-v8, jsdom, @testing-library/react, @testing-library/user-event, @testing-library/jest-dom y msw. Sin librerías de UI, de estado ni de formularios.
- vite.config.ts: puerto 5173 y proxy de /api y /healthz hacia http://localhost:8080. Configuración de Vitest con jsdom, archivo de setup y cobertura v8 con umbral del 85 % de líneas.

#### Estructura de src/

- api/types.ts: tipos espejo del contrato. Operation es una unión de literales; además CalculationRequest, CalculationResponse, Problem y ErrorCode.
- api/calculatorClient.ts: calculate(request, signal) hace POST a /api/v1/calculations con un timeout de 8 segundos y parsea problem+json. Devuelve una unión discriminada: { ok: true, value } o { ok: false, error }, donde error tiene kind (problem, network, timeout o unexpected), code opcional y message. Nunca lanza excepciones hacia la UI.
- features/calculator/operations.ts: catálogo de operaciones con id, label, símbolo, aridad y las etiquetas de los operandos. En percentage las etiquetas son Percent y Of.
- features/calculator/validation.ts: parseOperand hace trim y acepta enteros, decimales con punto, signo y notación exponencial. Rechaza vacío, coma decimal, Infinity, NaN y más de 32 caracteres, con mensajes claros.
- features/calculator/useCalculator.ts: useReducer con los estados idle, submitting, success y error. Aborta la petición anterior cuando se envía otra y cuando el componente se desmonta.
- features/calculator/Calculator.tsx: compone los demás componentes.
- features/calculator/OperationPicker.tsx: grupo de radios con apariencia de botones, navegable con flechas.
- features/calculator/OperandField.tsx: input type="text" inputMode="decimal" con label visible, aria-invalid y aria-describedby apuntando al mensaje de error.
- features/calculator/ResultPanel.tsx: el resultado va en role="status" con aria-live="polite" y los errores del servidor en role="alert". Muestra la expresión completa, por ejemplo 10 ÷ 4 = 2.5.
- features/calculator/errorMessages.ts: mapea cada code del contrato a un mensaje en inglés, claro y que no culpe al usuario.
- lib/formatNumber.ts: hasta 12 dígitos significativos; notación exponencial si el valor absoluto es ≥ 1e15 o está entre 0 y 1e-6. Nunca muestra 0.30000000000000004.
- Estilos: un solo CSS con variables (tokens de color, espacio y tipografía del sistema), sin fuentes externas ni CDNs. Mobile-first en una columna, objetivos táctiles de al menos 44 px, funciona desde 320 px de ancho, foco visible, respeta prefers-reduced-motion y cumple contraste AA.
- frontend/README.md corto, en inglés: requisitos, cómo correr, cómo testear, cómo sacar cobertura y la estructura. Si la implementación difiere de docs/architecture.md, actualiza solo la sección del frontend de ese archivo.

#### Comportamiento

- Enter envía el formulario. Mientras calcula, el botón queda deshabilitado y con aria-busy.
- Al cambiar a sqrt, el operando B se oculta y se limpia su error. Clear vuelve al estado inicial.
- El cliente valida el formato de los operandos, pero no duplica las reglas de dominio: la división por cero la decide el backend, que es la fuente de verdad, y la UI muestra su error.
- Textos en inglés aplicando AntiSlop: sin emojis, sin relleno y sin frases tipo Oops.

### 5. Pruebas

- Unitarias: validation, formatNumber, el reducer y calculatorClient. El cliente se prueba con MSW en estos casos: éxito, cada code de problem, 500 sin cuerpo, red caída, timeout y respuesta que no es JSON.
- Contrato: los handlers de MSW se construyen desde docs/api/examples/\*.json (por ejemplo con import.meta.glob), de modo que el cliente se prueba contra los mismos ejemplos que el backend.
- Componentes con Testing Library, buscando por rol y nombre accesible: flujo feliz, error de validación, error del servidor visible, operación unaria que oculta B, estado de carga y uso solo con teclado (Tab, flechas y Enter).
- Cobertura ≥ 85 % de líneas, con el umbral configurado. Reporta los números observados.

### 6. Checks (cada uno con su salida real)

- npm run lint
- Typecheck con npx tsc -b o el equivalente que deje la plantilla.
- npx vitest run --coverage
- npm run build (anota el tamaño del bundle).
- npm audit --omit=dev
- Revisión visual: si tienes herramientas de navegador, levanta npm run dev y verifica el layout en 375 px y en 1280 px, el estado inicial y los errores de validación (no necesitan backend). Los estados con respuesta del servidor se verifican de punta a punta en la tarea 4. Si no tienes navegador, dilo.
- Ningún archivo supera 500 líneas.

### 7. Subagentes (modo agentes sencillos)

Máximo 3 workers en paralelo, sin delegación anidada y con un reintento como máximo por tarea. Antes de delegar, el coordinador crea la base del proyecto, la configuración y api/types.ts, y fija en el plan las firmas de calculatorClient, parseOperand, formatNumber y useCalculator para que los workers trabajen sobre archivos disjuntos.

- Worker 1, forge-sonnet-high: api/calculatorClient.ts, validation.ts y lib/formatNumber.ts, con sus tests y los handlers de MSW generados desde los ejemplos.
- Worker 2, forge-sonnet-high: componentes, hook, errorMessages.ts y estilos, con sus tests de componentes.
- Worker 3, forge-haiku-high: después de integrar, corre los checks de la sección 6 y reporta las salidas. No edita código.
- Revisor, forge-sonnet-max: revisión independiente con code-review-and-quality, accesibilidad WCAG 2.2 (accessible-ui-engineering-wcag22) y el gate de AntiSlop. Reporta hallazgos y no edita.
- Coordinador: la base del proyecto, App.tsx, main.tsx, la integración del trabajo de los workers, la resolución de hallazgos y la verificación final.

Cada asignación lleva: el projectRoot absoluto del worktree, el objetivo, los archivos permitidos, el contexto mínimo, las rutas de las skills, los criterios de aceptación y la evidencia esperada. Cada worker lee forge-core y llama forge\_task\_preflight con su asignación y host="claude". Reporta el modelo y el esfuerzo de cada worker solo si el host los muestra.

### 8. Cierre

Termina con el bloque Arquitectura de Forge (Modelo de datos, Estructuras de datos, Patrones, Flujo e integraciones, Contratos, Estado y persistencia), la tabla de checks con sus resultados, la cobertura observada, el tamaño del bundle, los IDs de deuda registrados o revisados y el hash del commit aprobado.

### How task 3 ran

- **Branch:** `feat/frontend-ui` in its own worktree (Forge Git record, choice `worktree`), created from `main`
  at 13:13 on 2026-10-13 (`git reflog`). Before its first commit the branch was fast-forwarded to `main`, which
  by then contained the backend merge, so `git log --graph` draws it after the backend branch even though both
  were worked on in parallel. Merged into `main` with `--no-ff` as `90cc92f` after `forge_integration` verified
  the merged tree; the merge was done at the author's explicit request (task 3 handoff), although the prompt said
  this task would not merge.
- **Agent mode:** simple (Forge workflow record `ac3c786e`).
- **Author decisions:** approved the spec, plan and dependency list; display formatting uses the spec's
  `[1e-6, 1e12)` range rather than the prompt's 1e15 (the spec wins); the Percent/Of labels stay as the prompt
  required. Review fixes: field errors use `role="alert"`, and Calculate uses `aria-disabled` while pending so
  keyboard focus stays on it.

## Prompt 4 · Integration and delivery

fullhouse:: Integración y entrega de Sezzle Calculator: unir backend y frontend, verificar de punta a punta, agregar Docker, CI y el reporte de cobertura, y terminar el README y la documentación del flujo con IA. Háblame en español en el chat; todo lo que quede en el repositorio va en inglés, salvo los prompts originales.

### 1. Contexto

Es la prueba técnica de Sezzle. En main está la fundación (spec, contrato, arquitectura, ADRs, AGENTS.md y skills). En ramas aparte, cada una desde su worktree, están feat/backend-api (Go) y feat/frontend-ui (React). Esta tarea las integra y deja el repositorio listo para entregar.

El enunciado exige: React (TypeScript preferido) y Go; las 4 operaciones básicas (las opcionales ya están incluidas); validación y manejo de errores en ambas capas; diseño responsive; respuestas JSON; tests unitarios en ambas capas; reporte de cobertura; README con setup, cómo correr front y back, ejemplos de llamadas a la API y decisiones o supuestos de diseño; Dockerfile opcional; y los prompts usados. Prioriza corrección, claridad y mantenibilidad por encima de features extra.

### 2. Protocolo Forge (obligatorio y en este orden)

1. Lee AGENTS.md y .claude/skills/forge-core/SKILL.md, y sigue forge-core durante toda la tarea.
2. Llama forge\_task\_preflight con projectRoot=C:\Users\joshe\Desktop\AssessmentSezzle, host="claude", level="fullhouse" y este mensaje como task. Sigue execution.nextSteps en orden y lleva gitTaskId, knownPreflightVersion y knownEvidenceVersion.
3. Modo de agentes: hazme la pregunta nativa y espera. Voy a responder agentes sencillos. La integración y la arquitectura se quedan en el coordinador; los workers solo revisan y corren checks.
4. Git: hazme la pregunta nativa. Voy a elegir rama nueva feat/delivery desde main en esta carpeta. Si Forge reporta como activas las tareas del backend o del frontend, dímelo antes de elegir; no cambies a worktree por tu cuenta. Regístralo con forge\_git\_workflow action=choose, con mi respuesta explícita y el snapshotVersion.
5. Ejecuta forge\_graph action=refresh y luego forge\_workflow action=start con el scope de la sección 4 y los checks de la sección 5.
6. Lee las skills de .claude/skills/: ci-cd-and-automation, security-and-hardening, documentation-and-adrs, code-review-and-quality, git-workflow-and-versioning, ponytail y antislop (para los textos del README). Revisa toda la deuda registrada por las tareas 2 y 3.
7. Escribe el spec de la tarea y el plan. Muéstramelos y espera mi aprobación antes de editar.
8. Integra feat/backend-api y feat/frontend-ui en feat/delivery con forge\_integration, una rama a la vez y con merge --no-ff para que el historial muestre el trabajo paralelo. Decide los conflictos según el contrato y los requisitos, preservando el comportamiento de ambas ramas; los más probables son deuda tecnica/ y docs/architecture.md. Si dos requisitos se contradicen, pregúntame.
9. Haz el resto de los cambios, ejecuta forge\_graph action=refresh y registra implementation; check, uno por cada check con su salida real; review; y delivery con el bloque de arquitectura (dataModel, dataStructures, patterns, flow, contracts, state).
10. Ejecuta forge\_development\_check con rutas explícitas, la disposición de la documentación y los IDs de deuda revisados. Luego forge\_git\_workflow action=ready, hazme la pregunta de entrega y haz stage y commit solo de lo que yo apruebe (Conventional Commits).
11. Después del commit, pregúntame antes de integrar feat/delivery en main con git merge --no-ff.
12. Nunca hagas push, rebase, reset ni stash, y nunca borres ramas ni worktrees. Al final dame los comandos para que yo los ejecute.

Si Forge MCP no está disponible, sigue el mismo orden manualmente y dímelo. Nunca reportes checks que no ejecutaste. Si el contexto se acerca al límite, termina el paso actual, ejecuta forge\_handoff action=write y avísame.

### 3. Verificación de punta a punta

- Después de integrar, corre todos los checks del backend y del frontend sobre el árbol unido.
- Levanta el backend en 8080 y el frontend en 5173. Haz curl a la API directamente y también a través del proxy de 5173. Guarda las salidas reales: con ellas se escriben los ejemplos del README.
- Si tienes herramientas de navegador, verifica en 375 px y en 1280 px: un cálculo exitoso, un error de validación, la división por cero que devuelve el servidor, la raíz con un solo operando y el uso completo solo con teclado. Si no tienes navegador, dilo.
- Apaga todos los procesos al terminar.

### 4. Entregables de esta tarea

#### Docker

- Dockerfile multi-stage en la raíz. Etapa 1: node con versión LTS fija, npm ci y build del frontend. Etapa 2: golang con la misma versión que go.mod, CGO\_ENABLED=0, build con -trimpath y -ldflags "-s -w". Etapa final: gcr.io/distroless/static-debian12:nonroot con el binario y el build del frontend en /app/web, STATIC\_DIR=/app/web, PORT=8080, EXPOSE 8080 y usuario nonroot.
- .dockerignore que excluya node\_modules, dist, coverage, .git, .forge y deuda tecnica.
- Verifica con docker build -t sezzle-calculator . y docker run --rm -p 8080:8080 sezzle-calculator, más curl a la API y a la página. Si Docker no está disponible, dilo y no lo marques como verificado.

#### CI

- .github/workflows/ci.yml que corre en push y en pull\_request, con permissions: contents: read y concurrency con cancel-in-progress.
- Job backend: setup-go con la versión de go.mod, chequeo de gofmt, go vet, go test -race con coverprofile y subida del reporte de cobertura como artifact.
- Job frontend: setup-node con cache de npm, npm ci, lint, typecheck, tests con cobertura, build y subida de la cobertura como artifact.
- Job docker: solo build, después de los otros dos.
- Fija las versiones de las actions. La CI no se puede verificar hasta que yo haga push; dilo así en el reporte.

#### Reporte de cobertura

- docs/coverage.md con tablas de los números observados: backend por paquete, sacado de go tool cover -func, y frontend del text-summary de Vitest. Incluye la fecha, el commit y los comandos para regenerarlo.
- Los reportes HTML no se versionan (quedan ignorados) y se publican como artifacts de la CI.

#### README.md final (en inglés)

- Overview breve y Quick start con Docker.
- Desarrollo local del backend y del frontend, con comandos para Windows PowerShell y para macOS o Linux donde difieran.
- Tests y cobertura, con enlace a docs/coverage.md.
- API usage con ejemplos curl reales (éxito y errores) y la tabla de códigos de error.
- Design decisions con un resumen y enlaces a los ADRs. Assumptions. Project structure.
- How this was built, con enlaces a docs/ai/WORKFLOW.md y docs/ai/PROMPTS.md.
- Nada inventado: cada comando del README se ejecutó o se marca como no verificado.

#### Documentación del flujo con IA

- docs/ai/PROMPTS.md: transcribe textualmente los 4 prompts desde los .docx de docs/ai/prompts/, en orden. Usa pandoc si está disponible; si no, extrae el texto de word/document.xml con un script de la librería estándar en .forge/tmp/. Agrega una nota en inglés que diga que los prompts están en español a propósito.
- En docs/ai/PROMPTS.md, después de cada prompt, agrega una nota corta con la rama o el worktree, el modo de agentes y las decisiones que tomé en las preguntas. Incluye solo lo que puedas verificar en git log, en los registros de .forge/ o en este chat; lo demás márcalo como not recorded.
- Los .docx originales se quedan versionados en docs/ai/prompts/.
- docs/ai/WORKFLOW.md final, con un mapa de evidencia: dónde ver cada práctica (git log --graph, ramas, ADRs, deuda tecnica/, cobertura, CI, skills y contrato con sus tests).
- Actualiza docs/architecture.md y los ADRs donde la implementación se haya desviado, y cierra o actualiza la deuda de documentación que registraron las tareas 2 y 3.

### 5. Checks de esta tarea (cada uno con su salida real)

- Backend: gofmt -l ., go vet ./..., go test ./... -count=1 con cobertura.
- Frontend: lint, typecheck, npx vitest run --coverage y npm run build.
- Smoke de punta a punta de la sección 3 y smoke de la imagen Docker.
- Ningún archivo mantenido a mano supera 500 líneas.
- git log --graph --oneline --all muestra la fundación, las dos ramas paralelas y sus merges.

### 6. Subagentes (modo agentes sencillos)

- Revisor, forge-sonnet-max: revisión independiente de git diff main...feat/delivery, es decir, del producto completo, con code-review-and-quality y security-and-hardening. Además verifica cada requisito del enunciado contra el repositorio usando la lista de la sección 1. Reporta hallazgos y no edita.
- Worker de checks, forge-haiku-high: después de que el coordinador resuelva los hallazgos, corre todos los checks de la sección 5 y reporta las salidas. No edita código.
- El coordinador clasifica los hallazgos: corrige en esta tarea lo que está dentro del alcance y registra el resto con forge\_debt, sin ampliar la tarea por su cuenta.

Cada asignación lleva: el projectRoot absoluto, el objetivo, los archivos permitidos, el contexto mínimo, las rutas de las skills, los criterios de aceptación y la evidencia esperada. Cada worker lee forge-core y llama forge\_task\_preflight con su asignación y host="claude". Reporta el modelo y el esfuerzo de cada worker solo si el host los muestra.

### 7. Cierre

- El bloque Arquitectura de Forge (Modelo de datos, Estructuras de datos, Patrones, Flujo e integraciones, Contratos, Estado y persistencia).
- Una lista de verificación final que relacione cada requisito del enunciado con el archivo o la evidencia que lo cumple.
- Los comandos exactos para que yo cree el repositorio en GitHub y haga push de main (gh repo create o git remote add más git push -u origin main), y para quitar los worktrees (git worktree remove). Yo los ejecuto.
- Los riesgos conocidos y la deuda abierta, con sus IDs.

### How task 4 ran

- **Branch:** `feat/delivery`, created from `main` (`90cc92f`) in the main folder (author's answer to the Git
  question; Forge Git record, choice `create`).
- **Agent mode:** simple (author's answer): one reviewer and one checks worker; integration and architecture
  stayed with the coordinator.
- **Author decisions:** both feature branches were already merged into `main`, so there was nothing left to
  integrate and the step became verification of the merged tree; transcribe the desktop copies of the Word files
  starting after "PROMPT: copiar desde aquí"; no project license for now; enforce the Go coverage targets in CI;
  stop the task 3 Vite server and, for the smoke tests, a local Jenkins container that held port 8080.
