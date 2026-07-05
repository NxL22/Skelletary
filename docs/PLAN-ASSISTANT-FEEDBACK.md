# Plan: Refinar Asistente de Skelly con feedback del owner

> **SUPERSEDED**: este plan queda como historico. La version vigente e
> integrada esta en [`PLAN-ASISTENTE-V2.md`](./PLAN-ASISTENTE-V2.md),
> que incluye el sistema de diseno nuevo (paleta + tipografia de Stitch),
> el cambio de nombre del usuario, el rediseño del Asistente y el sistema
> de retroalimentacion. No trabajar contra este archivo.

> Documento de diseno. No es codigo todavia.
> Objetivo: convertir a Skelly (redactor) en un asistente que aprende del
> estilo del owner hasta acercarse lo mas posible a como el ya escribe.

---

## 1. Lo que el owner quiere (resumen ejecutivo)

Hoy el Asistente (panel "Cerebro de Skelly") vive en el Header, tiene un
selector de plantilla y un boton de enviar grande. El owner pide:

1. **Centrar el panel** y darle mas aire, porque es la pieza clave.
2. **Quitar el selector de plantilla**: ya no aporta, el asistente elige solo.
3. **Rediseniar el boton de enviar**: el actual ocupa mucho, se quiere
   algo mas limpio (estilo send flotante dentro del textarea).
4. **Sistema de retroalimentacion**: cuando Skelly entrega un informe y el
   owner lo edita a mano, ese par (input -> informe corregido) tiene que
   quedar guardado y volver a entrar al modelo en futuros pedidos. Asi
   Skelly se va pareciendo cada vez mas al estilo del owner. Meta: 98%
   de parecido a como trabaja el.

---

## 2. Parte A - UI (rapida, sin riesgo)

Cambios solo en el frontend. No tocan backend ni base de datos.

### A1. Quitar el selector de plantilla

- Archivo: `src/components/AssistantPanel.jsx`
- Quitar el bloque `<label>` + `<select>` de "Plantilla base (opcional)".
- Quitar el state `templateCode`, el `useMemo` de `groupedTemplates` y
  el `categories` que ya no se usan.
- Quitar la prop `templates` del componente (ya no se necesita).
- Actualizar el caller en `src/components/Header.jsx` para no pasar mas
  `templates={assistantTemplates}`.
- Mantener la posibilidad de que el Edge Function reciba `templateCode`
  en el body (no romper compat) pero no exponerlo en la UI.

### A2. Rediseniar el boton de enviar

- Mover el boton de "Enviar" a la esquina inferior derecha del `<textarea>`,
  estilo send flotante (icono Send de lucide, solo, sin texto).
- Mantener el contador `123/2000` en la esquina inferior izquierda.
- Quitar el texto "Enter para enviar. Shift+Enter para nueva linea." (se
  sobreentiende; o moverlo a un tooltip discreto en el icono).
- Cuando `submitting`, el icono se reemplaza por `<Loader2>` animado.
- El boton "Limpiar" se mantiene afuera (solo aparece si hay output o input).

Layout propuesto:

```
+----------------------------------------------+
| [textarea ............ ]   <- esquina sup.   |
| [textarea ............ ]                      |
| [textarea ............ ]   <- esquina inf.   |
| 123/2000                            [Send]    |
+----------------------------------------------+
```

### A3. Centrar el AssistantPanel

- En `src/components/Header.jsx`, el panel vive dentro del card derecho
  (`glass-panel`). Agregarle al `AssistantPanel` un wrapper interno con
  `max-w-2xl mx-auto w-full` para que quede centrado y con ancho
  razonable.
- Tambien opcional: subir el `AssistantPanel` a un card propio con mas
  padding (`p-5` o `p-6`) para que se sienta como pieza principal, no como
  apendice de la mascota.
- Revisar en `2xl:` que no se vea estirado de mas.

### Archivos tocados en Parte A

- `src/components/AssistantPanel.jsx`  (cambios principales)
- `src/components/Header.jsx`           (ajustes menores de centrado)

---

## 3. Parte B - Sistema de retroalimentacion (el corazon)

Esta es la pieza grande. La idea es que cada vez que el owner edita un
informe de Skelly, ese par quede guardado y se use como ejemplo en futuros
pedidos.

### Diseno recomendado: RAG-lite sobre historial propio

Tres niveles de complejidad, de menor a mayor:

#### Fase 1 (MVP, recomendado arrancar aca)

- Persistir cada par `(input_original, skelly_output, human_edited)` en
  una tabla nueva `assistant_feedback`.
- Antes de llamar al LLM, leer los ultimos N (5-10) pares del owner y
  meterlos en el system prompt como bloque nuevo:
  `EJEMPLOS PREVIOS DEL OWNER (estilo a imitar)`.
- El match es por `template_code` si esta disponible; si no, los ultimos
  N en orden cronologico.
- Esto es **few-shot in-context**: simple, sin infra nueva, sin
  embeddings, sin reentrenamiento. Solo storage + prompt.

Pros: rapido de implementar, funciona con el LLM actual, efecto inmediato.
Contras: si la tabla crece mucho, los ejemplos se vuelven menos
relevantes. Hay que filtrar.

#### Fase 2 (cuando haya >50 pares)

- Reemplazar la query "ultimos N" por una busqueda por `template_code`
  con ventana de tiempo (ej: ultimos 30 dias para esa plantilla).
- Si no hay para esa plantilla, fallback a los ultimos N globales.
- Sigue sin embeddings. Solo SQL + orden.

Pros: mas preciso, sigue siendo simple.
Contras: aun no maneja sinonimos (eco abdomen = eco abdominal).

#### Fase 3 (futuro, opcional)

- Agregar columna `embedding vector(1536)` con `pgvector`.
- En cada pedido, calcular el embedding del input del owner y traer los
  K mas similares.
- Esto requiere extension `vector` habilitada en Supabase y un modelo de
  embeddings (openai o el del propio MiniMax).

Pros: precisa de verdad, el sistema aprende sinonimos.
Contras: mas infra, mas costo, mas complejidad. No es para el MVP.

### Modelo de datos (Fase 1)

Tabla nueva en Supabase (migracion idempotente):

```sql
create table if not exists public.assistant_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_code text,                         -- opcional, derivado del input
  user_input text not null,                   -- lo que escribio el owner
  skelly_output text not null,                -- lo que entrego Skelly
  human_output text not null,                 -- lo que el owner dejo final
  created_at timestamptz not null default now()
);

create index if not exists assistant_feedback_user_idx
  on public.assistant_feedback(user_id, created_at desc);

create index if not exists assistant_feedback_template_idx
  on public.assistant_feedback(user_id, template_code, created_at desc);

alter table public.assistant_feedback enable row level security;

-- Solo el owner de la fila puede leer/escribir (y el service role del Edge Function).
create policy "own feedback only" on public.assistant_feedback
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Nota importante: esta tabla es **por usuario**, no global. Hoy el flag
`has_assistant_access` puede estar activo para mas cuentas a futuro.
Para Fase 1 los ejemplos son **solo del owner** (la unica cuenta con
acceso hoy). Si despues se activan otras cuentas, cada una tendra sus
propios ejemplos (no se contaminan entre si). Esto es lo correcto.

### Flujo de feedback en la UI

Despues de que Skelly entrega el output, aparece debajo del bloque
"Resultado" una fila de acciones:

```
[👍 Sirvio tal cual]  [✏️ Lo retoque, guardar version final]
```

- **👍 Sirvio tal cual**: registra un feedback donde `skelly_output ==
  human_output`. Util para que el modelo vea "lo que di, esta bien, no lo
  toques". Persistir igual.
- **✏️ Lo retoque**: abre el bloque "Resultado" en modo edicion (el `<pre>`
  se transforma en un `<textarea>` con el contenido cargado). El owner
  edita, y al apretar "Guardar version final" se persiste el par
  `(skelly_output, human_output)` y el bloque vuelve a modo lectura.

Esto evita que el owner tenga que copiar/pegar entre el informe de Skelly
y otro lado. Edita in-place.

### Flujo de feedback en el backend

- Endpoint nuevo: `POST /functions/v1/assistant-feedback`
  Body: `{ originalInput, skellyOutput, humanOutput, templateCode? }`
  Hace upsert en `assistant_feedback` con `user_id` del token.
- Endpoint existente `assistant-report` se modifica para:
  1. Despues de resolver el usuario y antes de armar el prompt, leer los
     K pares mas relevantes de `assistant_feedback` para ese user.
  2. Agregar al prompt un bloque nuevo:
     `EJEMPLOS PREVIOS DEL USUARIO (estilo a imitar, no los copies literal):`
     Cada par se serializa como:
     ```
     Input del usuario: eco abdomen agrega: esteatosis
     Informe final aprobado:
     ANTECEDENTES CLINICOS: ...
     HALLAZGOS: ...
     IMPRESION: ...
     ---
     ```
  3. El LLM ve esos ejemplos antes de generar el nuevo informe y los usa
     como referencia de estilo.

### Consideracion sobre el prompt

- Los ejemplos se meten **antes** de `GUIA DE ESTILO` y `DICCIONARIO`?
  O **despues**? Yo recomendaria **despues**, justo antes del bloque de
  plantilla opcional. Asi el orden es:
  1. Identidad
  2. Formato obligatorio
  3. Reglas clinicas
  4. Sintaxis del input
  5. Como elegir plantilla
  6. Guia de estilo
  7. Diccionario
  8. **Ejemplos del usuario** (NUEVO, entre 7 y 9)
  9. Plantilla base opcional
- Esto mantiene las reglas duras arriba y los ejemplos como referencia
  de estilo.

### Rate limit

- Por ahora: la accion "Guardar version final" no consume rate limit del
  Asistente (es feedback, no un envio).
- Si despues se vuelve un problema, se puede contar como medio envio o
  crear un contador aparte. Para Fase 1 no hace falta.

### Privacidad

- Los pares guardados son PHI tecnicamente (informes radiologicos). La
  tabla vive detras de RLS y solo el usuario dueno puede leerlos. El
  Edge Function los lee con service role por pedido del usuario mismo.
- El bucket de Storage `assistant-knowledge` (reglas duras) no se toca;
  el aprendizaje es por usuario, no global.

---

## 4. Archivos tocados (resumen)

| Archivo | Cambio |
|---|---|
| `src/components/AssistantPanel.jsx` | Quitar dropdown, rediseniar send, agregar botones de feedback y modo edicion |
| `src/components/Header.jsx` | Centrar el panel, quitar prop `templates` |
| `src/lib/assistant.js` | Sumar `submitAssistantFeedback` (cliente del endpoint nuevo) |
| `supabase/migrations/2026XXXX_assistant_feedback.sql` | Crear tabla + RLS + indices |
| `supabase/functions/assistant-report/index.ts` | Leer feedback previo, inyectar en prompt |
| `supabase/functions/assistant-report/lib/prompt.js` | Sumar bloque `EXAMPLES_BLOCK` |
| `supabase/functions/assistant-report/lib/feedback.js` | Helper para leer K pares del usuario |
| `supabase/functions/assistant-feedback/index.ts` | **Nuevo**. Recibe y persiste feedback |
| `docs/ARQUITECTURA.md` | Documentar el nuevo flujo de retroalimentacion |
| `docs/GUIA-HUMANA.md` | Documentar los botones "Sirvio tal cual" / "Lo retoque" |

---

## 5. Decisiones que necesito del owner

Antes de arrancar a tirar codigo, tres preguntas concretas:

1. **Alcance del aprendizaje**: confirmame si los ejemplos son **solo tuyos**
   (la unica cuenta con acceso hoy). Si despues se activan mas cuentas con
   `--ai-access=true`, cada una aprende de su propio feedback o queres que
   aprendan del tuyo tambien?

2. **Ejemplos visibles en el prompt**: arranca con los ultimos 10 pares en
   orden cronologico, o queres algun filtro (por ejemplo: maximo 3 por
   plantilla, descartar pares donde `skelly_output == human_output`)?

3. **El boton "Sirvio tal cual" lo queres desde el dia 1 o es para Fase 2?**
   (es 1 linea de codigo y mucho valor, asi que lo incluiria en Fase 1 salvo
   que prefieras algo mas sobrio al principio).

Defaults que elijo yo si no decis nada:

1. Solo tuyos. Por usuario. Cada quien aprende de lo suyo.
2. Ultimos 10 pares en orden cronologico. Filtros los agregamos cuando
   tengamos datos.
3. Incluyo "Sirvio tal cual" en Fase 1.

---

## 6. Riesgos y cosas a vigilar

- **Costo de tokens**: cada par feedback suma tokens al prompt. 10 pares
  largos pueden ser 3-5k tokens extra. Monitorear y ajustar el K.
- **Filtro de calidad**: si el owner guarda una version apresurada, eso
  ensenia mal al modelo. Por ahora no hay manera de "deshacer" un feedback
  desde la UI. Se puede agregar despues (boton "olvidar este ejemplo").
- **Duplicados**: si el owner edita el mismo informe dos veces, quedan dos
  pares casi identicos. Por ahora OK; Fase 2 puede deduplicar por hash del
  input.
- **Privacidad**: ya esta cubierto con RLS por user_id. Pero recordemos
  que el contenido es PHI. El owner decide.

---

## 7. Como verificamos que funciona

Despues de implementado:

1. UI: visualmente el panel esta centrado, no aparece el dropdown, el boton
   send esta dentro del textarea.
2. Feedback manual: el owner genera un informe, lo edita, le da "Guardar
   version final". Aparece un toast de confirmacion.
3. Persistencia: en Supabase Studio, la tabla `assistant_feedback` tiene
   la fila con los 4 campos llenos.
4. Aprendizaje: el owner vuelve a pedir algo similar. El nuevo informe
   refleja el estilo de la version editada (mas frases similares, mismo
   orden de ideas, etc).
5. Rate limit: el contador "X/300 envios libres" no se incrementa al
   guardar feedback.
6. Edge Function: los logs del Edge Function muestran que el bloque
   `EJEMPLOS PREVIOS DEL USUARIO` aparece en el system prompt cuando
   hay pares guardados.

---

## 8. Plan de ejecucion (orden sugerido)

1. Parte A UI (quitar dropdown, send flotante, centrado). ~1 hora.
2. Migracion SQL de `assistant_feedback`. ~30 minutos.
3. Edge Function nuevo `assistant-feedback`. ~1 hora.
4. Modificar `assistant-report` para leer feedback y meterlo en el prompt.
   ~1.5 horas.
5. UI: botones "Sirvio tal cual" + "Lo retoque" + modo edicion. ~1.5 horas.
6. Cliente JS `submitAssistantFeedback` en `src/lib/assistant.js`. ~20 min.
7. Documentacion (`ARQUITECTURA.md` + `GUIA-HUMANA.md`). ~30 min.
8. Deploy Edge Function + migracion SQL. ~15 min (manual desde CLI de
   Supabase).

Total estimado: ~6-7 horas de trabajo.

---

## 9. Next step

Confirmame las 3 decisiones de la seccion 5 (o dame luz verde con los
defaults). Despues arranco con la Parte A (UI) para tener algo visible
rapido, y mientras lo testeas, voy armando la Parte B (feedback) en
paralelo.