# Arquitectura de Skelletary

Documento de referencia para entender como estan conectadas las piezas
de la aplicacion y por que estan organizadas asi.

## Stack tecnologico

- **Build / dev server**: Vite.
- **UI**: React 18 con hooks.
- **Estilos**: Tailwind CSS + estilos globales en `src/index.css`.
- **Iconos**: `lucide-react`.
- **Backend**: Supabase (Postgres + Auth + RLS).
- **Deploy**: GitHub Pages.
- **Lenguaje**: JavaScript moderno (sin TypeScript por ahora).

## Capas de la aplicacion

```
┌──────────────────────────────────────────────────────────────┐
│  App.jsx                                                     │
│  - Estado global: sesion, perfil, biblioteca, modales        │
│  - Decide que vista mostrar (Auth vs Dashboard)              │
│  - Orquesta migracion local -> nube                         │
└──────────────────────────────────────────────────────────────┘
            │                              │
            ▼                              ▼
┌───────────────────────┐    ┌─────────────────────────────┐
│  Componentes UI       │    │  Modulos en src/lib/        │
│  - Header             │    │  - auth                     │
│  - AuthScreen         │    │  - access                   │
│  - SearchBar          │    │  - templates                │
│  - TemplateCard       │    │  - remoteTemplates          │
│  - TemplateEditor...  │    │  - storage                  │
│  - SkellyDashboard... │    │  - skellyMensajes           │
│  - Modales varios     │    │  - etc.                     │
└───────────────────────┘    └─────────────────────────────┘
            │                              │
            ▼                              ▼
┌──────────────────────────────────────────────────────────────┐
│  Capa de datos                                               │
│  - src/data/skellyMensajes.js (catalogo de Skelly)           │
│  - src/data/defaultTemplates.json (biblioteca oficial)       │
│  - Supabase (plantillas del usuario, perfil, auth)           │
│  - localStorage (cache + preferencias)                       │
└──────────────────────────────────────────────────────────────┘
```

## Creacion de usuarios (solo el owner)

Aclaracion importante: **no existe registro publico desde la web**. Las
cuentas las crea unicamente el owner con `scripts/create-user.mjs`. Para
el detalle de flags y ejemplos, ver `docs/ALTA-DE-USUARIOS.md`. Resumen:

```bash
# Cuenta que ya puede usar la app
npm run user:create -- --email=usuario@clinica.com --access=active --share-core=true --name="Dra. Ejemplo"

# Cuenta que existe pero todavia no debe entrar
npm run user:create -- --email=usuario@clinica.com --access=pending --share-core=false

# Crear con contrasena directa (sin correo) cuando Supabase limita envios
npm run user:create -- --email=usuario@clinica.com --password="Temporal123" --access=active
```

El script:

1. Busca la cuenta en Supabase Auth por email.
2. Si no existe, la crea (con invitacion por correo o con contrasena
   directa si se pasa `--password`).
3. Si ya existe, actualiza el perfil en `public.profiles` (estado
   comercial, fecha de vencimiento, biblioteca oficial compartida, etc).
4. Segun el modo de reenvio (`--resend=auto|invite|recovery|none`),
   manda el correo correspondiente.

## Flujo de login normal

1. Usuario entra a la app, no hay sesion valida.
2. Se muestra `AuthScreen`.
3. Usuario ingresa email + contrasena.
4. `lib/auth.js` llama a Supabase Auth.
5. Si es correcto, se carga el perfil del usuario desde Supabase.
6. `App.jsx` evalua el estado comercial (`lib/access.js`):
   - `pending`: muestra mensaje "tu cuenta todavia no esta activa".
   - `active`: deja entrar al dashboard.
   - `trial`: deja entrar al dashboard (si todavia no vencio).
   - `expired`: bloquea y muestra pantalla de renovacion.
7. Si todo OK, monta el dashboard y dispara saludo de Skelly.

## Flujo de Skelly (resumen)

Ver `docs/SKELLY.md` para el detalle completo. Resumen ultra-corto:

1. `Header` dispara `skellyIntroToken` cuando el dashboard esta listo.
2. `SkellyDashboardMascota` recibe el token, espera `INTRO_DELAY_MS`.
3. Pide mensaje a `lib/skellyMensajes.js` (selector semanal).
4. Carga el MP3 correspondiente y lo reproduce.
5. Muestra la burbuja con tipeo sincronizado.
6. Cuando termina el audio, oculta la burbuja.

## Separacion oficial vs personal

Reglas que se cumplen a rajatabla (estan tambien en AGENTS.md):

- La **biblioteca oficial** vive en `src/data/defaultTemplates.json` y la
  mantiene el owner desde VS Code. La app la lee pero jamas la modifica en
  disco.
- La **biblioteca personal** vive en Supabase, una fila por plantilla,
  asociada al `user_id`. Es la unica que el usuario puede crear, editar
  y borrar desde la app.
- Cuando el usuario edita una plantilla oficial, el editor la guarda como
  una entrada nueva en su biblioteca personal **conservando el mismo ID**.
  Asi el merge en la nube la muestra en el mismo lugar que la oficial.
- El storage local (`localStorage`) actua solo como cache para que la app
  arranque rapido y para soportar la migracion desde una version anterior.

## Estados comerciales

Definidos en `lib/access.js` y `supabase/schema.sql`. Cada usuario tiene
exactamente uno:

- `pending`: la cuenta existe pero no esta activa. No entra a la app.
- `active`: suscripcion vigente. Entra al dashboard.
- `trial`: prueba en curso. Entra al dashboard hasta su fecha de
  vencimiento (por defecto 15 dias, ajustable con `--trial-days`).
- `expired`: estado derivado. La suscripcion o prueba ya no esta
  vigente y la cuenta no puede abrir la biblioteca hasta renovacion
  manual del owner.

`pending` es el estado por defecto al crear la cuenta en Supabase. El
owner decide si promover a `active` (o `trial`) desde el script de alta.

## Persistencia: nube vs local

- **Nube (Supabase)**: fuente principal. Toda verdad vive aca.
- **localStorage**: cache + migracion + preferencias persistentes (silenciar
  a Skelly, por ejemplo). No se considera fuente de verdad.
- Al cerrar sesion o perderla por expiracion, `lib/storage.js` limpia
  los artefactos locales de Skelletary. La unica excepcion es la
  preferencia de silenciar a Skelly, que persiste por usuario.

## Sistema Skelly (referencia rapida)

- Catalogo: `src/data/skellyMensajes.js`
- Selector: `src/lib/skellyMensajes.js`
- UI: `src/components/SkellyDashboardMascota.jsx`
- Audio fisico: `public/audio de skelly/vocabulario/*.mp3`
- Documentacion detallada: `docs/SKELLY.md`

## Variables de entorno

```env
VITE_APP_URL=https://skelletary.com          # URL publica de la app
VITE_SUPABASE_URL=https://....supabase.co    # Endpoint del proyecto Supabase
VITE_SUPABASE_ANON_KEY=eyJh...               # Clave anonima (publica)
SUPABASE_SECRET_KEY=...                      # Solo para el script de alta (NO subir a Pages)
SUPABASE_SERVICE_ROLE_KEY=...                # Alternativa legacy al anterior
SKELLETARY_APP_URL=https://skelletary.com    # URL usada por el script
```

`VITE_*` las lee Vite al buildear y deben estar como secrets en GitHub
para que Pages pueda consumirlas. `SUPABASE_SECRET_KEY` (o la legacy
`SUPABASE_SERVICE_ROLE_KEY`) nunca debe llegar al bundle del frontend.

## Modulo Asistente de informes (Skelly Redactor) — v2

Replica la experiencia del Custom GPT original del owner dentro de
Skelletary, usando MiniMax como proveedor de LLM. La mascota Skelly queda
intacta: el modulo Asistente es un panel horizontal full width que vive
**debajo** del card de la mascota Skelly en el Header.

### Layout del dashboard (v2)

```
┌──────────────────────────────────────────────────────────┐
│ Logo + titulo   │ Flujo recomendado   │ Skelly mascota   │
│                 │                     │ (compacta)       │
│                 │ Cuenta + acceso     │ + cuenta a la izq│
├──────────────────────────────────────────────────────────┤
│ 🧠 SKELLY · REDACTOR · Cerebro de Skelly                 │
├─────────────────────────────┬────────────────────────────┤
│ MENSAJE PARA SKELLY         │ RESULTADO                  │
│ [textarea + send flotante]  │ [informe renderizado]      │
│ 0/2000                 [▶]  │ [👍] [✏️ Retoqué]           │
└─────────────────────────────┴────────────────────────────┘
```

- **Fila superior**: logo + tarjetas (Flujo + Cuenta) + Skelly mascota compacta.
- **Fila inferior full width**: Asistente en modo horizontal (input | output).
- El hueco del lado izquierdo del layout anterior ya no existe.

### Componentes

- `src/components/AssistantPanel.jsx`: el panel completo, con send flotante
  en el textarea, botones de feedback (👍 / ✏️) y modo edicion in-place.
- `src/components/Header.jsx`: integra el panel como fila inferior.
- `src/lib/assistant.js`: cliente HTTP con dos modos (JSON y SSE).
- `src/lib/profile.js`: helper para cambiar el `display_name` del usuario.

### Diagrama del sistema completo

```
┌──────────────────────────────────────────────────────────────┐
│  Header.jsx                                                  │
│   ├─ SkellyDashboardMascota (mascota, intacta, compacta)     │
│   ├─ AssistantPanel.jsx (nuevo, horizontal full width)      │
│   │     │                                                   │
│   │     │ supabase.functions.invoke("assistant-report")      │
│   │     │ o fetch directo con ReadableStream (SSE)          │
│   │     ▼                                                   │
│   └─ SettingsModal.jsx -> nueva ActionCard "Mi perfil"       │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│  Edge Function: supabase/functions/assistant-report/         │
│   ├─ index.ts     Entry: valida sesion, flags, rate limit,  │
│   │               streaming SSE opcional (?stream=1)         │
│   ├─ lib/prompt.js   Arma el system prompt (con ejemplos)    │
│   ├─ lib/knowledge.js  Lee Storage con cache de 10 min      │
│   ├─ lib/feedback.js   Lee/escribe feedback del usuario      │
│   ├─ lib/usage.js   Rate limit 300 envios / 12h             │
│   ├─ lib/sanitize.js  Limpia + valida el output              │
│   ├─ lib/llm.js     Cliente MiniMax (max_tokens, temp)       │
│   └─ lib/feedback.js  SHA256, parsea .md, FIFO 50           │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│  Edge Function: supabase/functions/assistant-feedback/       │
│   ├─ index.ts     Entry: persiste feedback al bucket         │
│   └─ lib/feedback.js  (mismo helper que el report)           │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│  Storage buckets privados                                   │
│   ├─ assistant-knowledge                                     │
│   │    ├─ guia-estilo.md            (referencia)             │
│   │    ├─ diccionario-plantillas.md (referencia)             │
│   │    └─ plantillas-corregidas.md (indizado por codigo)     │
│   └─ assistant-feedback                                     │
│        └─ feedback/{user_id}.md (un archivo por usuaria)    │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│  Tablas Supabase                                             │
│   ├─ profiles.display_name  Editable por usuaria            │
│   ├─ profiles.has_assistant_access  Flag opt-in por usuaria │
│   └─ assistant_usage         Contador rate limit             │
└──────────────────────────────────────────────────────────────┘
```

### Validaciones (en orden, falla rapido)

1. **Sesion valida** (`Authorization: Bearer <access_token>`).
2. **Acceso comercial vigente** (`active` o `trial` no vencido).
3. **Flag `has_assistant_access = true`** en `profiles`.
4. **Rate limit**: 300 envios / ventana movil de 12h.
5. **Validacion de input (defense in depth)**: si el input es muy corto o no
   contiene ninguna keyword de modalidad (eco, rx, tac, rm, doppler, etc.),
   se rechaza con `BAD_INPUT` antes de gastar tokens en el LLM.

### Streaming SSE (v2)

Para que Skelly se sienta mas rapido, el Edge Function `assistant-report`
puede devolver los tokens del LLM conforme llegan. El cliente (UI) usa
`fetch` directo con `ReadableStream` (no `supabase.functions.invoke` que
no soporta bien streams).

- Sin stream (`POST /assistant-report`): devuelve JSON completo (compatibilidad).
- Con stream (`POST /assistant-report?stream=1`): devuelve `text/event-stream`.
- Cliente activa el stream automaticamente en `AssistantPanel`.

### Sistema de retroalimentacion (v2)

Cada informe editado se guarda en `assistant-feedback/feedback/{user_id}.md`
como markdown estructurado. Cuando la usuaria pide un nuevo informe, los
ultimos 10 pares del archivo se inyectan en el system prompt como bloque
"EJEMPLOS PREVIOS DEL USUARIO" para que el LLM los use como referencia
de estilo.

**Tres mecanismos para acotar el tamano**:
- **Deduplicacion por SHA256** del input: no se guarda el mismo input dos veces.
- **Retencion de ultimos 50**: cada append trunca el archivo.
- **Trimeo de whitespace**: se normaliza antes de guardar.

Tamano maximo: ~150 KB por usuaria activa. 1 GB de Storage alcanza para
6.000+ usuarias activas.

### Privacidad

- Los pares feedback son PHI. Se guardan en Storage encriptado de Supabase,
  detras de RLS por user_id, descargables como backup, faciles de migrar.
- El system prompt prohibe identificadores de pacientes (nombre, RUT,
  direccion, telefono). Aun asi, el contenido clinico en si mismo es PHI.
- La API key del LLM vive solo en secrets del Edge Function.

### Donde vive cada cosa (v2)

| Archivo | Que hace |
|---|---|
| `src/components/AssistantPanel.jsx` | UI del Asistente (horizontal) |
| `src/components/Header.jsx` | Layout del dashboard, monta la mascota + el Asistente |
| `src/components/SettingsModal.jsx` | ActionCard "Mi perfil" + resto |
| `src/lib/assistant.js` | Cliente HTTP con SSE |
| `src/lib/profile.js` | Helper updateDisplayName |
| `src/lib/assistantSanitize.js` | Defensa adicional en cliente |
| `supabase/functions/assistant-report/index.ts` | Edge Function principal |
| `supabase/functions/assistant-report/lib/prompt.js` | System prompt |
| `supabase/functions/assistant-report/lib/knowledge.js` | Knowledge base |
| `supabase/functions/assistant-report/lib/feedback.js` | SHA256 + parseo + persistencia |
| `supabase/functions/assistant-report/lib/usage.js` | Rate limit |
| `supabase/functions/assistant-report/lib/sanitize.js` | Output cleanup + defense |
| `supabase/functions/assistant-report/lib/llm.js` | Cliente MiniMax |
| `supabase/functions/assistant-feedback/index.ts` | Edge Function de feedback |
| `supabase/migrations/20260704000000_assistant_module.sql` | Migracion inicial |
| `supabase/migrations/20260705000000_profile_display_name.sql` | Policy + trigger |
| `scripts/create-user.mjs` | Flag `--ai-access=true` para activar |

### Diagrama

```
┌──────────────────────────────────────────────────────────────┐
│  Header.jsx                                                  │
│   ├─ SkellyDashboardMascota (mascota, intacta)               │
│   └─ AssistantPanel.jsx (nuevo, debajo del video)            │
│        │                                                     │
│        ▼ supabase.functions.invoke("assistant-report", ...) │
└──────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│  Edge Function: supabase/functions/assistant-report/         │
│   ├─ index.ts     Entry: valida sesion, flags, rate limit    │
│   ├─ lib/prompt.js   Arma el system prompt (6 bloques)      │
│   ├─ lib/knowledge.js  Lee Storage con cache de 10 min      │
│   ├─ lib/usage.js   Rate limit 300 envios / 12h              │
│   ├─ lib/sanitize.js Quita MD, valida formato, frase sist.  │
│   └─ lib/llm.js     Cliente MiniMax (formato OpenAI)        │
└──────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│  Storage bucket privado: assistant-knowledge                 │
│   ├─ guia-estilo.md          (siempre en el prompt)         │
│   ├─ diccionario-plantillas.md (siempre en el prompt)       │
│   └─ plantillas-corregidas.md (indizado por codigo)         │
└──────────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│  Tablas Supabase                                             │
│   ├─ profiles.has_assistant_access  Flag opt-in por usuaria │
│   └─ assistant_usage                Contador rate limit      │
└──────────────────────────────────────────────────────────────┘
```

### Validaciones (en orden, falla rapido)

1. **Sesion valida** (`Authorization: Bearer <access_token>`).
2. **Acceso comercial vigente** (`active` o `trial` no vencido) usando
   la misma funcion `user_has_app_access` que ya usa el frontend.
3. **Flag `has_assistant_access = true`** en `profiles`.
4. **Rate limit**: la usuaria no supero 300 envios en la ventana movil
   de 12h.

Si cualquiera falla, el Edge Function responde con el codigo HTTP
apropiado y un mensaje util para que la UI muestre el error con sentido.

### Prompt del sistema

`lib/prompt.js` arma el system prompt en 6 bloques en este orden:

1. Identidad (Skelly redactor de Skelletary).
2. Formato obligatorio (estructura ANTECEDENTES / HALLAZGOS / IMPRESION,
   espaciado, frase sistematica condicional).
3. Reglas clinicas (no inventar, lenguaje prudente, privacidad).
4. Sintaxis del input ("agrega:", "tambien:", "mas:", etc.).
5. Como elegir plantilla (match por modalidad + nombre + hallazgos).
6. Bloques cargados: guia de estilo + diccionario de plantillas +, si
   la usuaria eligio del dropdown, la plantilla base seleccionada.

El mensaje de la usuaria va como `user` aparte.

### Sanitizacion de salida

`lib/sanitize.js` hace defensa en profundidad sobre la respuesta del LLM:

- Quita code fences, headings markdown, negritas.
- Quita cualquier texto antes del primer header de seccion valido.
- Quita cualquier ruido despues de la ultima linea de IMPRESION.
- Extrae las 3 secciones canonicales y reensambla el informe en el
  formato exacto exigido por la guia de estilo.
- Si la plantilla base es de ecografia y la frase sistematica no esta
  en HALLAZGOS, la inyecta al inicio de esa seccion.

### Knowledge base

Los archivos viven en `supabase/knowledge/` y se suben al bucket privado
`assistant-knowledge` desde la consola de Supabase:

- `guia-estilo.md` (siempre en el prompt).
- `diccionario-plantillas.md` (siempre en el prompt).
- `plantillas-corregidas.md` (NO se inyecta entero: `lib/knowledge.js`
  lo indexa por codigo de plantilla y solo la seleccionada del dropdown
  viaja al prompt, ahorrando tokens).

El cache en memoria dura 10 minutos para no leer Storage en cada request.

### Rate limit

Tabla `assistant_usage` lleva `count` y `window_start` por usuaria.
El Edge Function hace un UPSERT atomico al validar cada request.
La ventana se resetea automaticamente cuando pasaron 12h desde el primer
envio de la ventana actual.

### Privacidad

El system prompt prohibe identificadores de pacientes (nombre, RUT,
direccion, telefono). Aun asi, el contenido clinico en si mismo es PHI:
queda a criterio del owner si acepta el flujo para su caso de uso.
Para evitar exposicion, la API key del LLM vive solo en secrets del
Edge Function, nunca en el bundle del frontend.

### Donde vive cada cosa

| Archivo | Que hace |
|---|---|
| `supabase/functions/assistant-report/index.ts` | Entry point de la Edge Function |
| `supabase/functions/assistant-report/lib/prompt.js` | Arma el system prompt |
| `supabase/functions/assistant-report/lib/knowledge.js` | Lee Storage con cache |
| `supabase/functions/assistant-report/lib/usage.js` | Rate limit 300/12h |
| `supabase/functions/assistant-report/lib/sanitize.js` | Limpia y valida la salida |
| `supabase/functions/assistant-report/lib/llm.js` | Cliente MiniMax (OpenAI-compatible) |
| `supabase/migrations/2026*_assistant*.sql` | Migracion idempotente |
| `supabase/knowledge/*.md` | Origen de la knowledge base |
| `src/components/AssistantPanel.jsx` | UI del modulo |
| `src/lib/assistant.js` | Cliente del endpoint |
| `src/lib/assistantSanitize.js` | Defensa adicional en cliente |
| `scripts/create-user.mjs` | Flag `--ai-access` para activar por usuaria |

### Variables de entorno de la Edge Function

```env
SUPABASE_URL=https://....supabase.co        # la URL del proyecto
SUPABASE_ANON_KEY=eyJh...                   # anon key (publica)
SUPABASE_SERVICE_ROLE_KEY=...               # service role (solo en backend)
MINIMAX_API_KEY=...                         # API key del proveedor LLM
MINIMAX_BASE_URL=https://api.minimax.chat/v1
MINIMAX_MODEL=MiniMax/M3
```

Se configuran como secrets del Edge Function (`supabase functions secrets set`).
Nunca quedan en el bundle del frontend.

## Como NO documentar

Antes de escribir sobre el modelo comercial, lee el codigo real. Si no
estas seguro de como funciona un flag o un estado, lee primero:

- `scripts/create-user.mjs` (ver que flags acepta y que hace cada uno)
- `src/lib/access.js` (ver como se resuelve cada estado)
- `supabase/schema.sql` (ver que columnas existen y que check hay)

No inventes reglas. Si tienes dudas, pregunta al owner.
## Aprendizaje continuo de Skelly Redactor

Skelly conserva su RAG y sus reglas clinicas. Sobre esa base usa una memoria
semantica privada: cada confirmacion registra entrada, salida original y salida
aprobada. Las medidas se sustituyen por variables antes de generalizar, por lo
que un valor de un paciente nunca se convierte en una regla para otro.

- Una memoria nueva se activa solo para consultas con similitud muy alta.
- Confirmaciones repetidas aumentan confianza y alcance; contradicciones la
  debilitan y pueden dejarla en cuarentena automaticamente.
- La memoria es colectiva, con una preferencia pequena por feedback de la misma
  usuaria. Se recuperan como maximo cuatro ejemplos.
- Las tablas tienen RLS sin acceso cliente. Solo las Edge Functions con service
  role pueden usarlas.
- `/#/skelly-lab` permite auditar, desactivar y revertir. El PIN se valida en
  `assistant-admin` con el secreto `ASSISTANT_ADMIN_PIN`; nunca es `VITE_*`.
- La fuente oficial sigue siendo `src/data/defaultTemplates.json`. La tabla
  `assistant_ai_templates` es una copia privada de una sola direccion y se
  sincroniza con `npm run assistant:sync`.
