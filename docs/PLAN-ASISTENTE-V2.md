# Plan: Skelletary - Modulo Asistente V2 + Rediseño visual + Perfil editable

> Documento de diseno completo. Integra todo lo decidido en esta conversacion.
> Supersede el plan original `PLAN-ASSISTANT-FEEDBACK.md`.
>
> **STATUS (julio 2026)**: Plan ejecutado completo en el codigo del repo.
> Sprint 1, 2, 3, 4 y 5 completados. Build limpio (1665 modulos, ~5s).
> Faltan solo pasos de deploy en Supabase (crear bucket `assistant-feedback`,
> re-desplegar Edge Functions, correr migracion SQL `display_name`).

---

## 1. Resumen ejecutivo

El producto pasa por una evolucion grande en cuatro frentes simultaneos:

1. **Rediseno visual completo**: paleta nueva (turquesa + violeta + azul
   oscuro) y tipografia nueva (Manrope + JetBrains Mono).
2. **Perfil editable**: el usuario puede cambiarse el nombre desde Ajustes.
3. **UI del Asistente renovada**: layout horizontal full width que
   aprovecha el espacio vacio del lado izquierdo del dashboard. Sin
   dropdown de plantilla, send flotante en el textarea, sistema de
   feedback visible.
4. **Sistema de retroalimentacion**: cada informe editado se guarda y vuelve
   al prompt para que Skelly aprenda el estilo del owner. Solo del owner.

Como bonus transversales: **streaming SSE** (latencia percibida), **defense
in depth** para que Skelly solo responda a informes radiologicos, y la
**knowledge base resumida** para ahorrar tokens.

**Contexto v2 (NO ahora, documentado)**: Skelly podra ver imagenes y habra
cosas configurables por el owner. Anotados al final, no se implementan.

---

## 2. Sistema de diseno nuevo (alta prioridad, afecta todo)

### 2.1 Paleta de colores

Stitch entrego esta paleta. La tomamos como nueva guia del producto:

| Token | Color | Uso |
|---|---|---|
| `--color-primary` | `#4FD1C5` | Acentos interactivos, focus, CTAs primarios |
| `--color-secondary` | `#B794F4` | Highlights suaves, separadores, badges |
| `--color-tertiary` | `#203748` | Fondos profundos, bordes, separadores |
| `--color-neutral` | `#0A0F18` | Fondo base de la app |
| `--color-primary-soft` | `#4FD1C5/15` (con alpha) | Fondo de chips, iconos circulares primary |
| `--color-secondary-soft` | `#B794F4/15` | Fondo de chips secondary |
| `--color-error` | `#F87171` | Errores, validacion fallida |
| `--color-warning` | `#FBBF24` | Rate limit, validacion |
| `--color-success` | `#34D399` | Feedback positivo, exito |

**Mapeo desde la paleta actual** (para migrar de a poco sin romper):

| Antes (Tailwind class) | Despues |
|---|---|
| `cyan` (`#7bdff6`) | `primary` (`#4FD1C5`) |
| `lavender` (`#b8b5ff`) | `secondary` (`#B794F4`) |
| `rose` (`#f6abc8`) | Eliminar; usar `error` o `secondary` segun caso |
| `ink` / `panel` / `night` | `tertiary` (`#203748`) |
| `bg-slate-950` | `bg-neutral` |
| `text-slate-100/200/300/400/500` | Escala neutral nueva (slate-50 a slate-500 mapeada a neutral-*) |
| `border-white/10` | `border-primary/15` o `border-tertiary/30` segun caso |

### 2.2 Tipografia

Stitch entrego:

| Rol | Familia | Pesos |
|---|---|---|
| Headline | **Manrope** | 500, 600, 700 |
| Body | **Manrope** | 400, 500, 600 |
| Label / code | **JetBrains Mono** | 400, 500 |

**Migracion desde la actual**:

| Antes | Despues |
|---|---|
| `font-display` (`Space Grotesk`) | `font-display` (`Manrope`) |
| `font-body` (`IBM Plex Sans`) | `font-body` (`Manrope`) |
| `font-mono` (`IBM Plex Mono`) | `font-mono` (`JetBrains Mono`) |
| `font-comic` (`Fredoka`) | Se mantiene solo para Skelly mascota |

Carga via Google Fonts en `src/index.css` (linea 1):

```css
@import url("https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap");
```

### 2.3 Tailwind config actualizado

Archivo: `tailwind.config.js`

- Reemplazar el bloque `colors` extendiendo con la paleta nueva.
- Reemplazar `fontFamily` con las nuevas familias.
- Agregar `boxShadow` para el "glow turquesa" sutil:
  `glow-primary: "0 0 24px rgba(79, 209, 197, 0.25)"`.

### 2.4 index.css actualizado

- Agregar CSS variables en `:root` para la paleta.
- Actualizar las clases globales:
  - `.button-primary` -> fondo `var(--color-primary)`, texto neutral oscuro, **rounded-full o rounded-2xl** (decidir; recomendacion: `rounded-full` para CTAs chicos, `rounded-2xl` para grandes).
  - `.button-secondary` -> outlined con borde `var(--color-primary)`, fondo transparente, texto blanco.
  - `.badge-soft` -> fondo `var(--color-primary-soft)`, texto `var(--color-primary)`.
- Actualizar el body background para usar la nueva paleta:
  `linear-gradient(180deg, #0A0F18 0%, #203748 100%)` + radial turquesa arriba derecha.

### 2.5 Iconografia

Stitch propone iconos en **circulos con fondo turquesa o violeta** (chip-style).
Esto reemplaza el patron actual de iconos sueltos con fondo `cyan/10`.

Nueva clase reutilizable `.icon-chip`:

```css
.icon-chip {
  @apply inline-flex h-9 w-9 items-center justify-center rounded-full
         bg-primary/15 text-primary;
}
.icon-chip--secondary {
  @apply bg-secondary/15 text-secondary;
}
```

Aplicar a: header del modulo Asistente (Brain), botones de feedback
(ThumbsUp, Pencil), estado de cargando (Loader2).

### 2.6 Impacto del rediseno

**Todos los componentes que usan colores/tipografia se ven afectados.**
Lista preliminar de archivos a tocar (ademas de los del Asistente):

- `tailwind.config.js`
- `src/index.css`
- `src/components/Header.jsx`
- `src/components/AuthScreen.jsx`
- `src/components/SettingsModal.jsx`
- `src/components/SearchBar.jsx`, `SearchField.jsx`
- `src/components/TemplateCard.jsx`, `TemplateContent.jsx`
- `src/components/TemplateDetailModal.jsx`, `TemplateEditorModal.jsx`
- `src/components/CategorySidebar.jsx`
- `src/components/HelpModal.jsx`
- `src/components/PinModal.jsx`, `PasswordChangeModal.jsx`, `PasswordField.jsx`
- `src/components/AnimatedLockIcon.jsx`
- `src/components/ToastStack.jsx`
- `src/components/ScrollToTopButton.jsx`
- `src/components/PaginationControls.jsx`
- `src/components/EmptyState.jsx`
- `src/components/ModalShell.jsx`

Recomendacion: **migrar de a un componente por vez, testeando en browser
despues de cada cambio**. No hacer "find & replace" global porque hay
casos donde el color tiene semantica (errores en rojo, exito en verde).

### 2.7 Mascota Skelly

NO se toca el personaje Skelly. Sigue usando `font-comic` (Fredoka) y sus
colores originales. Solo el modulo "Cerebro de Skelly" (Asistente) y el
resto de la UI adoptan el nuevo lenguaje visual.

---

## 3. Cambio de nombre del usuario (Perfil editable)

### 3.1 Comportamiento

El usuario puede editar su nombre visible desde Ajustes. Hoy se muestra
en el Header y en el SettingsModal pero viene del backend; no es editable.

- Campo persistido: `profiles.display_name` (ya existe en el schema).
- Fuente de verdad: backend. Cache local solo para perfilar rapido.
- Validacion: 2-60 caracteres, sin caracteres de control ni solo espacios.
- Trimea automaticamente al guardar.
- Si el usuario deja vacio, vuelve al fallback del email.

### 3.2 Backend (RLS)

Hoy `profiles_update_own` esta deshabilitada por seguridad
(comentario en schema.sql: "decisiones sensibles del owner").

Solucion: **policy especifica que solo permite update de `display_name`**.

Nueva migracion `supabase/migrations/2026XXXX_profile_display_name.sql`:

```sql
set search_path = public;

drop policy if exists "profiles_update_own_display_name" on public.profiles;
create policy "profiles_update_own_display_name"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
```

Ademas agregar un trigger o CHECK que valide longitud server-side:

```sql
create or replace function public.validate_display_name()
returns trigger
language plpgsql
as $$
begin
  if new.display_name is not null then
    new.display_name = btrim(new.display_name);
    if length(new.display_name) < 2 or length(new.display_name) > 60 then
      raise exception 'display_name debe tener entre 2 y 60 caracteres'
        using errcode = '22000';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_validate_display_name on public.profiles;
create trigger profiles_validate_display_name
before update of display_name on public.profiles
for each row execute function public.validate_display_name();
```

### 3.3 Frontend

- Nueva `ActionCard` en `SettingsModal.jsx` llamada **"Mi perfil"** (la
  primera, antes de "Cuenta y acceso").
- Input controlado + boton "Guardar nombre".
- Al guardar: `supabase.from('profiles').update({ display_name })` + toast.
- Mostrar el email abajo del input como referencia.
- Si falla por validacion del trigger (longitud), mostrar el error que
  viene de Supabase (en espanol).

Cliente: helper en `src/lib/profile.js`:
```js
export async function updateDisplayName(supabase, newName) {
  const cleaned = newName.trim();
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: cleaned })
    .eq("id", (await supabase.auth.getUser()).data.user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

Y refrescar el `profile` en `App.jsx` despues de update (similar a como
se hace despues de cambiar password).

### 3.4 Archivos tocados

- `supabase/migrations/2026XXXX_profile_display_name.sql` (nuevo)
- `src/lib/profile.js` (nuevo)
- `src/components/SettingsModal.jsx` (nueva ActionCard)
- `src/App.jsx` (handler + refresh)

---

## 4. UI del Asistente renovada

### 4.0 Layout general del dashboard (decisión grande)

Hoy el dashboard tiene 2 columnas en el Header:
- Izquierda: logo + título + tarjeta "Flujo recomendado" + tarjeta "Cuenta"
  + **hueco gigante sin uso**.
- Derecha: mascota Skelly + Asistente (vertical, angosto).

**Problema**: la columna izquierda desperdicia mucho espacio vertical.

**Solución adoptada**: el Asistente se vuelve **una pieza horizontal full
width** que vive debajo de la fila superior (logo + tarjetas + mascota).
La mascota Skelly se mantiene arriba a la derecha, pero más compacta.

Nuevo layout del dashboard:

```
┌──────────────────────────────────────────────────────────────────┐
│ Logo + título       │ Tarjeta Flujo │ Tarjeta Cuenta │ Skelly    │
│                     │               │                │ mascota   │
│                     │               │                │ (compacta)│
├──────────────────────────────────────────────────────────────────┤
│ 🧠 SKELLY · REDACTOR · Cerebro de Skelly            280/300     │
├─────────────────────────────────────┬────────────────────────────┤
│ MENSAJE PARA SKELLY                 │ RESULTADO         [Copiar] │
│                                     │                            │
│ [textarea .................]         │ [informe renderizado...]   │
│ [textarea .................]         │                            │
│                                     │                            │
│ 0/2000                         [▶]  │ [👍 Sirvio tal cual]       │
│                                     │ [✏️ Lo retoque]            │
└─────────────────────────────────────┴────────────────────────────┘
```

- **Fila superior**: 3-4 columnas. Logo+título a la izquierda, Flujo
  y Cuenta en columnas intermedias, Skelly mascota a la derecha.
- **Fila inferior (full width)**: el Asistente en modo horizontal,
  con input a la izquierda y output a la derecha.

**Mobile (<768px)**: el layout colapsa. Fila superior apilada, Asistente
también apilado (input arriba, output abajo) pero el card contenedor
se mantiene.

### 4.1 Quitar el dropdown de plantilla

- Archivo: `src/components/AssistantPanel.jsx`
- Quitar el bloque `<label>` + `<select>` de "Plantilla base (opcional)".
- Quitar state `templateCode`, `useMemo` de `groupedTemplates`, `categories`.
- Quitar la prop `templates` del componente.
- Caller en `src/components/Header.jsx`: dejar de pasar `templates={assistantTemplates}`.
- Mantener compat del body: el Edge Function sigue aceptando
  `templateCode` por si se quiere re-enganchar mas adelante.

### 4.2 Send flotante en el textarea

- El boton "Enviar" actual (boton ancho con texto) **se elimina de la fila
  inferior**.
- En su lugar: un **boton circular chico** (32x32px) con icono `Send`,
  posicionado en la esquina inferior derecha **dentro del textarea**.
- Estilo: fondo `var(--color-primary)`, texto neutral oscuro, sombra sutil.
- Estado disabled: opacidad 0.4, sin hover.
- Estado loading: spinner (`Loader2` animado).
- El contador `123/2000` se mantiene en la **esquina inferior izquierda**
  del textarea.
- El boton "Limpiar" se queda como boton secundario fuera del textarea,
  solo visible si hay input u output.

### 4.3 Botones de feedback

Debajo del bloque "Resultado" aparecen dos botones:

```
[👍 Sirvio tal cual, guardar]  [✏️ Lo retoque y guardo version final]
```

- **👍 Sirvio tal cual, guardar**: un click registra feedback donde
  `skelly_output == human_output`. Util para reforzar aciertos. Persistir.
- **✏️ Lo retoque y guardo version final**: el bloque "Resultado" entra
  en modo edicion (ver 4.4).

Ambos botones con estilo "icon-chip" + label:
- 👍: fondo `bg-primary/15`, texto primary, icono ThumbsUp.
- ✏️: fondo `bg-secondary/15`, texto secondary, icono Pencil.

### 4.4 Modo edicion in-place

Cuando el usuario apreta "✏️ Lo retoque y guardo version final":

- El `<pre>` monoespaciado con el output se reemplaza por un `<textarea>`
  con el contenido prellenado (mismo font-mono, mismo ancho).
- Mensaje sutil arriba del editor:
  "Edita el informe. Skelly va a aprender de tu version para futuros informes."
- Los botones de feedback se reemplazan por:
  - `Cancelar` (secondary, outlined) -> vuelve a modo lectura sin guardar.
  - `Guardar version final` (primary turquesa, icono Check) -> guarda el par.
- Al guardar: toast de exito + vuelve a modo lectura con el nuevo texto.

### 4.5 Estados del Asistente (resumen visual)

3 vistas:

1. **Estado 1 - Inicial**: panel horizontal con input + send flotante
   disabled, output vacio con placeholder.
2. **Estado 2 - Con output (modo lectura)**: input con lo escrito +
   bloque Resultado renderizado + botones feedback.
3. **Estado 3 - Modo edicion**: input bloqueado o igual que estado 2,
   output editable + mensaje contextual + botones Cancelar/Guardar.

### 4.6 Implementación del modo horizontal

Dentro del Asistente, el layout es un grid de 2 columnas:

```jsx
<div className="grid gap-4 lg:grid-cols-2">
  {/* Columna izquierda: input */}
  <div>
    <label>MENSAJE PARA SKELLY</label>
    <textarea ... />
    <SendButton flotante />
  </div>
  {/* Columna derecha: output */}
  <div>
    <label>RESULTADO</label>
    <pre>{output}</pre>
    <FeedbackButtons />
  </div>
</div>
```

- En desktop: `grid-cols-2` lado a lado.
- En mobile: `grid-cols-1` apilado.
- El `<header>` del Asistente (icono Brain + título + contador) va en la
  parte de arriba, full width, separado del grid.
- El footer (botón Limpiar) va debajo del grid, alineado a la derecha.

### 4.7 Archivos tocados

- `src/components/AssistantPanel.jsx` (cambios principales: layout
  horizontal, sin dropdown, send flotante, feedback, modo edicion,
  consumir stream)
- `src/components/Header.jsx` (refactor del grid: mascota compacta arriba,
  Asistente sale del card derecho y va full width abajo)
- `src/index.css` (clases `.assistant-grid` si vale la pena extraer)

---

## 5. Sistema de retroalimentacion (backend)

### 5.0 Decision clave: Storage en vez de Postgres

**Por que NO guardar en la DB de Supabase:**

1. **PHI fuera de la DB**. Los informes radiologicos son datos clinicos.
   Mantenerlos en Postgres de Supabase gratis es un riesgo de compliance
   innecesario. En Storage como texto plano es mas facil de mover,
   encriptar, descargar y borrar.
2. **Storage es 2x mas generoso en Supabase free** (1 GB vs 500 MB).
3. **Texto plano legible**. El owner puede descargar su archivo como
   backup, abrirlo en VS Code, entender que esta aprendiendo Skelly.

**Trazabilidad**: cada feedback ES el informe completo. No necesitamos
un id externo. El triplete `(user_input, skelly_output, human_output)`
mas timestamp y template_code es suficiente para reconstruir todo.

**Tamano acotado por tres mecanismos**:

- **Deduplicacion por hash del input**: SHA256 del `user_input`. Si ya
  existe, no se guarda de nuevo.
- **Retencion de ultimos 50**: cada append trunca a las ultimas 50
  entradas. Tope duro: **150 KB por usuario** activo.
- **Trimeo de whitespace**: input y output se limpian antes de guardar.

Con esos 3 mecanismos, **1 GB de Storage nos da para 6.000+ usuarias
activas**. No es un problema hoy ni en 5 anos.

### 5.1 Bucket y archivo

- Bucket privado nuevo: `assistant-feedback` (separado del de knowledge).
- Path por usuario: `feedback/{user_id}.md`
- Formato: markdown estructurado, una entrada por feedback.

### 5.2 Estructura del archivo .md

```markdown
---
## 2026-07-04T15:30:00Z | template: eco_abdomen | hash: a1b2c3d4

### Input del usuario
eco abdomen normal agrega: esteatosis

### Informe aprobado
ANTECEDENTES CLINICOS: ...
HALLAZGOS: ...
IMPRESION: ...
---
```

- Cada entrada separada por `---`.
- Header con timestamp ISO, template code opcional, hash del input.
- Cuerpo con input literal + informe final aprobado.

### 5.3 Edge Function nuevo

`supabase/functions/assistant-feedback/index.ts`

- POST. Body: `{ originalInput, skellyOutput, humanOutput, templateCode? }`.
- Validaciones: sesion + acceso + `has_assistant_access` + longitud
  maxima de cada campo (2000 chars).
- Operacion `appendFeedback(userId, entry)` (FIFO con tope):

```
1. Descargar feedback/{user_id}.md actual (si existe).
2. Calcular SHA256 del originalInput.
3. ¿El hash ya esta en el archivo?
   → SI: skip silencioso (deduplicacion, no se cuenta).
   → NO: sigue al paso 4.
4. Append la nueva entrada al final del markdown.
5. ¿Quedaron mas de 50 entradas?
   → SI: truncar, dejar solo las ultimas 50 (la mas vieja se va).
   → NO: dejar como esta.
6. Sobrescribir el archivo en Storage.
```

- No incrementa el rate limit del Asistente.
- Si el archivo queda corrupto (no parsea), se loguea y se crea uno
  nuevo con solo la entrada actual (fail-safe).
- **Tamano maximo garantizado**: 50 entradas x ~3 KB = ~150 KB por
  usuario. Nunca crece mas alla de eso.

### 5.4 Modificar Edge Function existente

`supabase/functions/assistant-report/index.ts` y `lib/prompt.js`

Antes de armar el prompt, leer los K pares mas relevantes del usuario:

```js
// lib/feedback.js (nuevo)
export async function loadRecentFeedback(adminClient, userId, { limit = 10 } = {}) {
  const path = `feedback/${userId}.md`;
  const { data, error } = await adminClient.storage
    .from("assistant-feedback")
    .download(path);
  if (error || !data) {
    // El usuario aun no tiene feedback guardado. OK.
    return [];
  }
  const text = await data.text();
  return parseFeedbackMarkdown(text, limit);
}

function parseFeedbackMarkdown(text, limit) {
  // Divide por '---', parsea cada bloque, devuelve los ultimos N.
  // Devuelve [{ userInput, humanOutput, templateCode, createdAt, hash }, ...]
}
```

En `lib/prompt.js`, agregar bloque nuevo entre el diccionario y la
plantilla base opcional:

```
EJEMPLOS PREVIOS DEL USUARIO (estilo a imitar, no copies literal):

[Input del usuario]: eco abdomen normal agrega: esteatosis
[Informe final aprobado]:
ANTECEDENTES CLINICOS: ...
HALLAZGOS: ...
IMPRESION: ...
---
[Input del usuario]: eco hombro completa variables: lado=derecho
[Informe final aprobado]:
...
```

### 5.5 Estrategia de seleccion

Fase 1 (MVP):
- Traer los **ultimos 10 pares en orden cronologico** (DESC).
- Sin filtros ni ranking. Simple y efectivo para el caso del owner.

Fase 2 (cuando haya >50 pares): query por `template_code` primero,
fallback a los ultimos N globales. Sin embeddings todavia.

Fase 3 (futuro, v2): pgvector + embeddings para matching semantico real.

### 5.6 Defensa contra contaminacion

- Feedback por user_id (cada quien aprende de lo suyo).
- El usuario debe poder **borrar un feedback** si se arrepintio (futuro:
  boton "olvidar este ejemplo" o endpoint DELETE).
- Deduplicacion automatica: no se acumula el mismo input dos veces.
- Retencion automatica: no crece mas alla de 50 por usuario.

### 5.7 Concurrencia

Storage no tiene transacciones ACID como Postgres. Riesgo de que dos
escrituras simultaneas se pisen. Mitigaciones:

- Como el owner es el unico usuario hoy y la UI espera el response
  antes de mandar otro, las escrituras son seriales en la practica.
- Si en el futuro hay varias cuentas, agregar lock optimista:
  read-modify-write con verificacion de version (Storage no lo soporta
  nativamente, pero se puede simular con un campo `version` en un
  archivo de metadata paralelo).

### 5.8 Archivos tocados

- `supabase/functions/assistant-feedback/index.ts` (nuevo)
- `supabase/functions/assistant-report/index.ts` (lee feedback)
- `supabase/functions/assistant-report/lib/prompt.js` (nuevo bloque)
- `supabase/functions/assistant-report/lib/feedback.js` (nuevo helper,
  parsea markdown)
- `src/lib/assistant.js` (cliente `submitAssistantFeedback`)
- **No hay migracion SQL**: el bucket `assistant-feedback` se crea
  desde la consola de Supabase o con `supabase storage` CLI.

---

## 6. Velocidad y robustez

### 6.1 Streaming SSE

Hoy el Edge Function devuelve el response completo en un solo JSON. Para
que Skelly se sienta rapido, hay que pasarlo a stream.

- Modificar `assistant-report/index.ts` para devolver `text/event-stream`.
- Cada token que llega del LLM se envia como evento SSE.
- Frontend (`AssistantPanel.jsx`) acumula los tokens en `output` con
  `setOutput(prev => prev + chunk)` para efecto "typing".
- El boton send se reemplaza por un boton "Detener" mientras streamea
  (opcional, no bloqueante).

**Impacto**: el usuario ve aparecer palabra por palabra desde el segundo
1. Un informe de 12 segundos "se siente" como 3 segundos.

### 6.2 Knowledge base resumida

Hoy `lib/prompt.js` inyecta `guia-estilo.md` y `diccionario-plantillas.md`
**verbatim**. Si pesan 5k tokens cada uno, son 10k tokens de input que
se pagan en cada pedido.

Accion: **resumir ambos a "lo esencial"** (reglas duras + sinonimos
claves + estructura canonica). El detalle verbatim queda disponible si
alguna vez hace falta (modo "avanzado" del prompt, no para MVP).

### 6.3 Cap de tokens de salida

En `callLlm` (lib/llm.js), agregar `max_tokens: 1000`. Un informe
radiologico raramente pasa de 800 tokens. Esto evita que un modelo
verboso gaste 3k tokens en un informe de 500.

### 6.4 Temperature ajustada

En `callLlm`, setear `temperature: 0.3`. Mas bajo = mas consistente para
el formato estructurado de 3 secciones, y marginalmente mas rapido.

### 6.5 Cache de respuestas identicas

Si el owner manda dos veces el mismo input, la segunda deberia servirse
de cache. Implementacion: hash del input (sha256), guardar en memoria
del Edge Function con TTL de 1h.

**No es prioridad alta** (es optimization). Va al final.

### 6.6 Defense in depth para limitar a informes

Tres capas, en orden:

1. **System prompt**: ya tiene la regla "solo informes radiologicos".
   Reforzar con: "Si el pedido NO es un informe radiologico, responder
   EXACTAMENTE: 'Solo puedo ayudar a redactar informes radiologicos.'"
2. **Validacion de input en el Edge Function**: si el input tiene <10
   caracteres o no contiene ninguna palabra clave de modalidad (eco, rx,
   tac, rm, doppler, mamografia, scanner, ultrasonido, rayos, tomografia,
   resonancia), rechazar con codigo `BAD_INPUT` antes de gastar tokens
   en el LLM.
3. **Validacion de output** (ya existe en `sanitize.js`): si la respuesta
   no tiene ninguna de las 3 secciones, descartar y devolver mensaje
   "no parece un informe radiologico".

Con estas 3 capas se cubre el 99% de los casos. No hace falta classifier
dedicado.

### 6.7 Archivos tocados

- `supabase/functions/assistant-report/index.ts` (streaming + validacion input)
- `supabase/functions/assistant-report/lib/llm.js` (max_tokens + temperature)
- `supabase/functions/assistant-report/lib/prompt.js` (knowledge resumida)
- `supabase/functions/assistant-report/lib/sanitize.js` (rechazo explicito)
- `src/components/AssistantPanel.jsx` (consumir stream)

---

## 7. Contexto v2 (NO ahora, documentado)

Para que no se pierdan en futuras conversaciones:

### 7.1 Skelly con imagenes

- Idea: el owner podria subir una imagen del examen y Skelly tendria que
  interpretarla / hacer hallazgos / ajustar el informe segun lo que ve.
- Implicancias: requiere LLM con vision (no MiniMax/M3 actual), Storage
  para las imagenes, sanitizacion reforzada (PHI), costos mas altos.
- Estado: **anotado, no para implementar**.

### 7.2 Cosas configurables

- Idea: el owner (no las usuarias) puede ajustar parametros del Asistente
  desde un panel admin: temperatura, max_tokens, K ejemplos en prompt,
  prompt template custom, modelos permitidos.
- Implicancias: nueva tabla `assistant_config`, nueva UI admin, versionado
  de prompts.
- Estado: **anotado, no para implementar**.

### 7.3 Multi-tenant (varias cuentas con acceso)

- Hoy el flag `has_assistant_access` puede activarse para varias cuentas
  con `scripts/create-user.mjs --ai-access=true`.
- El feedback esta aislado por user_id, asi que cada cuenta aprende de
  lo suyo. Esto es lo correcto (cada quien su estilo).
- Si en el futuro queres que las cuentas **compartan** la knowledge
  base del Asistente (no el feedback), se discute en v2.

---

## 8. Archivos tocados (resumen total)

| Archivo | Cambio |
|---|---|
| `tailwind.config.js` | Paleta + tipografia nueva |
| `src/index.css` | Fuentes + variables CSS + clases globales |
| `src/components/AssistantPanel.jsx` | Layout horizontal, sin dropdown, send flotante, feedback, modo edicion, consumir stream |
| `src/components/Header.jsx` | Refactor grid del dashboard: mascota compacta + Asistente full width abajo; remover prop templates |
| `src/components/SettingsModal.jsx` | Nueva ActionCard "Mi perfil" |
| `src/lib/profile.js` | Helper `updateDisplayName` (nuevo) |
| `src/lib/assistant.js` | Cliente `submitAssistantFeedback` |
| `src/App.jsx` | Handler cambio nombre + refresh profile |
| Resto de componentes UI | Migrar colores/tipografia al nuevo lenguaje |
| `supabase/migrations/2026XXXX_profile_display_name.sql` | Policy + trigger display_name (nuevo) |
| Bucket Supabase `assistant-feedback` | Crear bucket privado nuevo (sin migracion SQL, via consola o CLI) |
| `supabase/functions/assistant-feedback/index.ts` | Edge Function nuevo |
| `supabase/functions/assistant-report/index.ts` | Stream + lee feedback + validacion input |
| `supabase/functions/assistant-report/lib/prompt.js` | Bloque EXAMPLES_BLOCK |
| `supabase/functions/assistant-report/lib/feedback.js` | Helper loadRecentFeedback (nuevo) |
| `supabase/functions/assistant-report/lib/llm.js` | max_tokens + temperature |
| `supabase/functions/assistant-report/lib/sanitize.js` | Rechazo explicito no-informes |
| `docs/ARQUITECTURA.md` | Documentar feedback + stream + sistema de diseno |
| `docs/GUIA-HUMANA.md` | Documentar feedback buttons + cambio nombre |
| `docs/SKELLY.md` | Confirmar que Skelly mascota NO se toca |

---

## 9. Plan de ejecucion (orden recomendado)

El orden minimiza retrabajo y maximiza valor visible rapido.

### Sprint 1 - Sistema de diseno + cambio de nombre (1-2 dias)

1. Actualizar `tailwind.config.js` con la paleta y tipografia nueva.
2. Actualizar `src/index.css` con las variables CSS y fuentes.
3. Migrar componente por componente testeando en browser.
4. Migracion SQL de `display_name` (policy + trigger).
5. `src/lib/profile.js` (helper).
6. `ActionCard` de perfil en `SettingsModal.jsx`.
7. Verificar: cambiar el nombre se refleja en el Header en tiempo real.

### Sprint 2 - UI del Asistente + layout horizontal (1-2 dias)

8. Refactor del grid del Header: mascota Skelly pasa a la esquina superior
   derecha (compacta). Tarjetas Flujo y Cuenta mantienen su lugar.
9. El Asistente sale del card derecho y pasa a ser una pieza horizontal
   full width debajo de la fila superior.
10. Quitar dropdown de plantilla del Asistente.
11. Send flotante en el textarea (esquina inferior derecha del input).
12. Layout horizontal interno: grid de 2 columnas (input | output).
13. Botones de feedback (UI, sin persistir todavia).
14. Modo edicion in-place del output.
15. Verificar: el dashboard no tiene huecos vacios, el Asistente se ve
    espacioso y los 3 estados funcionan bien.

### Sprint 3 - Backend de retroalimentacion (1-2 dias)

14. Migracion SQL de `assistant_feedback`.
15. Edge Function nuevo `assistant-feedback`.
16. Modificar `assistant-report` para leer feedback e inyectar en prompt.
17. Cliente `submitAssistantFeedback` en `src/lib/assistant.js`.
18. Conectar UI con backend.
19. Verificar: editar un informe, guardarlo, pedir algo similar,
    Skelly refleja el estilo.

### Sprint 4 - Velocidad y robustez (1 dia)

20. Streaming SSE en `assistant-report`.
21. Consumir stream en `AssistantPanel.jsx` (typing effect).
22. Knowledge base resumida en el prompt.
23. `max_tokens` capado + `temperature` 0.3.
24. Validacion de input (rechazo no-informes).
25. Verificar: el sistema se siente rapido y responde solo a informes.

### Sprint 5 - Documentacion + QA (0.5 dia)

26. Actualizar `docs/ARQUITECTURA.md`.
27. Actualizar `docs/GUIA-HUMANA.md`.
28. Smoke test completo del flujo end-to-end.

**Total estimado**: 5-7 dias de trabajo.

---

## 10. Como verificamos que funciona

Despues de cada sprint:

- **Sprint 1**: visualmente toda la app usa la paleta y tipografia nuevas.
  Cambiar el nombre en Ajustes se refleja en el Header inmediatamente.
- **Sprint 2**: el Asistente se ve limpio, centrado, con send flotante y
  botones de feedback visibles (aunque todavia no persistan).
- **Sprint 3**: editar un informe y guardar crea una fila en
  `assistant_feedback` (visible en Supabase Studio). Un nuevo pedido
  refleja el estilo del informe editado.
- **Sprint 4**: el usuario ve aparecer el texto palabra por palabra.
  Latencia percibida <3 segundos para empezar a leer. Pedir algo no
  relacionado a informes radiologicos devuelve el mensaje canonico.
- **Sprint 5**: documentacion al dia, smoke test pasa.

---

## 11. Decisiones tomadas en esta conversacion

| Decision | Default elegido |
|---|---|
| Alcance del feedback | Solo del owner, por user_id |
| Filtro de ejemplos | Ultimos 10 pares cronologicos (Fase 1) |
| Boton "Sirvio tal cual" | Si, desde el dia 1 |
| Streaming SSE | Si, prioridad alta |
| Cambio de modelo LLM | No, quedarse con MiniMax/M3 |
| Defense in depth | 3 capas (prompt + keywords input + output) |
| Knowledge base resumida | Si |
| Imagenes (vision) | v2, no ahora |
| Cosas configurables | v2, no ahora |
| Multi-tenant | Por user_id, aislado por cuenta |

---

## 12. Next step

Confirmame este plan completo (o dame cambios). Despues arrancamos por el
**Sprint 1** (sistema de diseno + cambio de nombre) que es lo mas
visible y lo que dejara toda la app con la nueva cara. Mientras
migramos visualmente, vamos planificando los siguientes sprints.