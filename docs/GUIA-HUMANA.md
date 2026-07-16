# Guia Humana de Skelletary

## Que es hoy

Skelletary es una app para radiologos pensada para encontrar, adaptar y copiar plantillas con mucha menos friccion que un text expander generico.

La app ya esta preparada para:

- biblioteca oficial del producto
- biblioteca personal por usuario
- cuenta con acceso controlado
- favoritos y recientes
- variables `{{nombre}}`

## Quien puede crear cuentas

**No hay registro publico desde la web.** Las cuentas las crea unicamente
el owner (tu) desde tu propia maquina usando `scripts/create-user.mjs`.
Detalle completo de flags y ejemplos en `docs/ALTA-DE-USUARIOS.md`.

El camino mas usado en produccion es:

- Crear la cuenta directa con `active` para que la persona entre a la app
  y pueda usar la biblioteca oficial desde el primer login.
- Crearla con `pending` cuando la cuenta debe existir pero todavia no
  tiene que entrar a la app.

El script tambien puede reenviar correos (invitacion o recuperacion)
y, cuando Supabase limita los envios, crear la cuenta con contrasena
directa sin mandar correo.

## Que se vende

Skelletary no se plantea como freemium abierto.

- Las cuentas las activas tu, una por una, con el script.
- Cuando una cuenta tiene `active` (o `trial` no vencido), la persona
  puede usar la app.
- Cuando vence, el estado pasa a `expired` derivado y la app la bloquea
  hasta que la reactives desde el script.

Por ahora nadie puede importar plantillas desde la app ni exportar data desde ella. Todo queda dentro de Skelletary en la nube.

## Dos bibliotecas separadas

Siempre deben existir dos capas distintas:

### 1. Biblioteca oficial

- la mantienes tu
- se edita en VS Code
- vive en `src/data/defaultTemplates.json`
- forma parte del producto
- puede compartirse o no por usuario segun la decision del owner
- el usuario la puede ver y editar desde la app; al editarla se promueve a su biblioteca personal con el mismo ID

### 2. Biblioteca personal

- pertenece al usuario
- vive en su cuenta de Supabase
- puede crearse manualmente
- puede editarse y borrarse
- tambien guarda las promociones automaticas de plantillas oficiales que el usuario personalice

## Como funciona el backend

La ruta elegida es Supabase:

- Postgres
- Auth con email y contraseña
- Row Level Security

La nube pasa a ser la fuente principal cuando el usuario inicia sesion.
Sin sesion valida, la app no debe abrir la biblioteca ni permitir uso operativo.

`localStorage` se conserva para:

- cache local
- arranque rapido
- migracion desde la etapa anterior

Cuando la sesion se cierra o deja de ser valida, los artefactos locales de Skelletary deben limpiarse del navegador.

## Acceso comercial

Las cuentas no se registran libremente desde la web. El owner las crea o
invita de forma manual con el script.

Cada usuario puede estar en uno de estos estados comerciales:

- `pending`
- `trial`
- `active`
- `expired`

`pending` significa que la cuenta ya existe, pero todavia no entra a la app.
La activacion no es automatica: la haces tu desde el script.

`expired` es un estado derivado: la suscripcion o prueba ya no esta
vigente y la cuenta no puede abrir la biblioteca hasta que la
reactives desde el script.

### Sobre el estado `trial`

El sistema soporta `trial` como estado valido (el script lo acepta con
`--access=trial` y arranca con 15 dias por defecto, ajustables con
`--trial-days=N`). Esto esta en el codigo y en el esquema de Supabase.

**No es el camino que se usa en produccion.** En la practica creas
usuarios con `active` o `pending`. La opcion `trial` queda disponible
por si en algun momento quieres volver a usarla.

## Flujo de acceso del usuario

1. Tu creas la cuenta con el script (`scripts/create-user.mjs`).
2. Supabase envia un correo de invitacion al usuario.
3. El usuario define su contrasena desde el enlace.
4. Luego entra con email y contrasena.
5. Si olvida la contrasena, usa recuperacion por correo.

Detalle y flags en `docs/ALTA-DE-USUARIOS.md`.

## Alta manual de usuarios (resumen)

Comandos mas usados. Detalle completo en `docs/ALTA-DE-USUARIOS.md`.

```bash
# Cuenta que ya puede usar la app
npm run user:create -- --email=usuario@clinica.com --access=active --share-core=true --name="Dra. Ejemplo"

# Cuenta que existe pero todavia no debe entrar
npm run user:create -- --email=usuario@clinica.com --access=pending --share-core=false
```

`--share-core=true` indica que el usuario recibe la biblioteca oficial.
`--share-core=false` indica que no la recibe y trabaja solo con biblioteca
personal.

Para reenviar un correo cuando la cuenta ya existe:

```bash
npm run user:create -- --email=usuario@clinica.com --access=active --name="Dra. Ejemplo" --resend=auto
```

Modos disponibles:

- `--resend=auto` (recomendado): si la cuenta ya existe, envia recuperacion.
- `--resend=recovery`: fuerza correo de recuperacion.
- `--resend=invite`: intenta reenviar invitacion; si Supabase no la
  reprocesa, cae a recuperacion.
- `--resend=none`: no manda correo, solo actualiza el perfil.

Si Supabase limita los correos, puedes crear o reemplazar la contrasena
directamente con `--password=...`. Este camino es una excepcion operativa
y la contrasena debe compartirse por un canal seguro.

## Variables necesarias en `.env`

```env
VITE_APP_URL=https://skelletary.com
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SECRET_KEY=...
# o, si usas claves legacy:
SUPABASE_SERVICE_ROLE_KEY=...
SKELLETARY_APP_URL=https://skelletary.com
```

Sin `SUPABASE_SECRET_KEY` o `SUPABASE_SERVICE_ROLE_KEY` el script no puede crear usuarios.

## Despliegue en GitHub Pages

Para que `skelletary.com` publique la misma app que ves localmente, GitHub Actions tambien necesita:

```env
VITE_APP_URL=https://skelletary.com
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Estas variables no se leen desde tu PC cuando Pages compila en GitHub.
Hay que cargarlas como secrets del repositorio y consumirlas en el workflow de deploy.

En `Authentication > URL Configuration` de Supabase, la `Site URL` y las `Redirect URLs` de produccion deben apuntar a `https://skelletary.com`, nunca a `localhost`.

## Importacion y exportacion

Por ahora nadie puede importar plantillas desde la app ni exportar data desde ella. Las funciones de carga masiva y de descarga quedaron fuera del producto.

La biblioteca se alimenta de:

- la biblioteca oficial que mantienes en VS Code
- las plantillas que el usuario crea directamente desde el editor
- las promociones automaticas cuando el usuario edita una plantilla oficial

## Regla de seguridad

Skelletary guarda plantillas y uso del usuario.

No esta pensada para guardar datos identificables de pacientes.
Si eso cambia algun dia, hay que rediseñar arquitectura y seguridad antes de implementarlo.

## Regla de producto

Si aparece una idea nueva, la pregunta correcta es:

"Esto hace al radiologo mas rapido, mas comodo y mas seguro al redactar?"

Si no, probablemente no es prioridad.

## Skelly, la mascota asistente

Skelly es la mascota del producto. Vive en el header del dashboard y se
activa cuando el usuario inicia sesion.

### Que hace al iniciar sesion

- Espera unos segundos para que la app termine de cargar.
- Reproduce un saludo hablado (tu MP3, no voz sintetica).
- Muestra una burbuja de comic con el texto que se escribe mientras suena
  el audio.
- Cuando termina, vuelve a su estado normal (gif quieto).

El usuario puede silenciar a Skelly con el boton de altavoz. Esa
preferencia se guarda por usuario y se respeta en futuras sesiones.

### Donde vive cada cosa

| Archivo | Que hay |
|---|---|
| `src/data/skellyMensajes.js` | El catalogo de mensajes (id, texto, ruta del audio). |
| `src/lib/skellyMensajes.js` | El selector: elige que mensaje usar segun la semana del ano. |
| `src/components/SkellyDashboardMascota.jsx` | La UI: video, audio, burbuja, boton de silencio. |
| `public/audio de skelly/vocabulario/*.mp3` | Los audios reales que Skelly reproduce. |

### Como agregar un nuevo saludo semanal

1. Graba el audio (MP3, duracion corta, ideal 3-10 segundos).
2. Guardalo en `public/audio de skelly/vocabulario/` con un nombre como
   `semana_2.mp3`.
3. Abre `src/data/skellyMensajes.js` y agrega una entrada nueva:

   ```js
   {
     id: "semana_2",
     texto: "¡Feliz lunes! Hoy te acompaño en tus informes.",
     audio: "audio de skelly/vocabulario/semana_2.mp3",
   },
   ```

4. Listo. La proxima vez que recargues la app, la rotacion semanal usara
   ese mensaje en la semana 2 del ano. Si tenes menos mensajes que
   semanas, el sistema hace wrap-around automaticamente.

### Reglas del texto de Skelly

- El texto de Skelly **no se toca sin tu autorizacion**. Es decision de
  marca. Si la IA sugiere cambios, los revisas vos antes de aplicarlos.
- Mantene ortografia correcta: tildes donde correspondan, exclamaciones
  de apertura y cierre, etc.
- Si Skelly dice algo nuevo en su MP3, el `texto` del catalogo debe
  coincidir con lo que se escucha (la burbuja se escribe mostrando ese texto).

### Fallbacks (por si algo falla)

El sistema esta pensado para que Skelly nunca rompa la app:

- Si el MP3 no carga, igual aparece la burbuja sin voz.
- Si el video o gif no cargan, aparece un placeholder que explica donde
  revisar los archivos.
- Si la fecha falla, usa el primer mensaje disponible.

Para mas detalle tecnico ver `docs/SKELLY.md`.

## Skelly como asistente de informes (v2)

A partir de la migracion del modulo Asistente, Skelly tambien te ayuda
a redactar informes. La mascota sigue siendo Skelly (no se toca su voz,
su texto, su audio ni su video), pero ahora su "cerebro" - la IA que
produce texto - vive en un panel horizontal full width **debajo** del
card de la mascota en el Header.

El panel aparece unicamente si tu cuenta tiene el flag `has_assistant_access`
activado por el owner al crearte o actualizarte con `--ai-access=true`.

### Como usar el panel

El panel esta dividido en dos columnas lado a lado (en mobile se apilan).

**Columna izquierda — tu mensaje:**
1. Escribi una sola linea en lenguaje natural en el textarea. Ejemplos:
   - `eco abdomen normal agrega: esteatosis`
   - `eco tiroides con niodulo de 8mm en lobulo derecho`
   - `corrige este informe manteniendo mi estilo: <pegar informe>`
   - `doppler carotideo, paciente con ACV previo`
2. Enter (sin Shift) envia la peticion. Shift+Enter agrega una linea.
3. El boton redondo turquesa en la esquina inferior derecha del textarea
   tambien envia. Esta deshabilitado cuando el textarea esta vacio.

**Columna derecha — el resultado (aparece mientras se genera):**
4. El texto aparece palabra por palabra (streaming) desde el primer segundo.
   No hay que esperar a que el informe este completo para verlo aparecer.
5. Cuando termina, se renderiza con el formato canonico:
   `ANTECEDENTES CLINICOS: ... HALLAZGOS: ... IMPRESION: ...`.
6. El boton "Copiar" lo manda al portapapeles.

**Feedback (entrena a Skelly para imitarte):**
- **👍 Sirvio tal cual, guardar**: registra que el informe de Skelly ya
  estaba bien. Skelly aprende de tus aciertos.
- **✏️ Lo retoque y guardo version final**: abre el informe en modo
  edicion in-place. Edita el texto como quieras, apretas "Guardar
  version final" y Skelly aprende de tu correccion.

Despues de unos cuantos feedbacks, Skelly empieza a escribir en un estilo
mas parecido al tuyo.

### Que reglas sigue el Asistente

Las mismas que tu Custom GPT original:

- Siempre entrega texto plano (nunca Markdown).
- Estructura exacta: ANTECEDENTES CLINICOS, HALLAZGOS, IMPRESION.
- Una sola linea en blanco entre secciones, ninguna dentro.
- Frase sistematica al inicio de HALLAZGOS en ecografia.
- "Sin diagnostico" cuando no hay antecedentes.
- No inventa hallazgos, medidas ni identificadores.
- Si la frase sistematica la saltea, el backend la agrega automaticamente.
- **Solo responde a informes radiologicos.** Si le escribis algo que no
  es un informe, devuelve: "Solo puedo ayudar a redactar informes
  radiologicos." Esta limitacion esta implementada con 3 capas
  independientes (prompt, validacion de input, validacion de output).

### Limite de uso

- 300 envios por ventana movil de 12h por usuaria.
- Cuando llegas al limite, el panel muestra un mensaje claro y bloquea
  nuevos envios hasta que la ventana se reinicie.
- El contador visible en el panel muestra cuantos envios te quedan.
- **Guardar feedback NO consume rate limit** — es gratis.

### Privacidad

- El prompt prohibe que la IA incluya nombres, RUT u otros
  identificadores de pacientes.
- El feedback se registra como triplete versionado en las tablas privadas
  `assistant_feedback_triplets` y `assistant_memories`. El archivo Markdown
  del bucket queda solamente como respaldo compatible.
- Antes de guardar, el backend detecta posibles identificadores y bloquea el
  aprendizaje si encuentra nombres, RUT, correos, telefonos o fichas.
- Las medidas, unidades, volumenes y otros valores del caso se convierten en
  variables antes de generalizar una memoria; no se reutilizan como datos
  fijos para otro paciente.
- El contenido clinico se envia al proveedor MiniMax configurado en los
  secrets de Supabase.
  Si en algun momento necesitas guardar evidencia formal de que no se
  filtra PHI, hay que evaluar el proveedor y eventualmente firmar un
  acuerdo (BAA o equivalente).
- La API key del LLM vive solo en los secrets del Edge Function, nunca
  en el navegador.

### Que pasa si algo falla

| Sintoma | Causa probable | Que hacer |
|---|---|---|
| El panel no aparece | `has_assistant_access` esta en `false` | Pedirle al owner que reactive el flag con `--ai-access=true` |
| "Has alcanzado el limite" | 300 envios / 12h | Esperar a que la ventana se reinicie |
| "Solo puedo ayudar a redactar informes radiologicos." | El input no parece un informe (sin keywords de modalidad) | Reformular: incluir "eco", "rx", "tac", "hallazgo", etc. |
| "No pudimos contactar al asistente" | Edge Function sin desplegar o sin secrets | Revisar `docs/ARQUITECTURA.md > Modulo Asistente` |
| "Tu acceso no esta vigente" | Cuenta `expired` o `trial` vencido | Renovar acceso desde el script |
| El streaming queda colgado | Timeout del backend o de la red | Esperar 65s al reintento automatico, o recargar la pagina |
| Salida con markdown o sin secciones | Caso raro del LLM | Reportar al owner con el input exacto |

## Aprendizaje automatico continuo y KOG

El sistema conserva el RAG y las reglas existentes, pero ahora los complementa
con un KOG ligero: conocimiento estructurado sobre plantillas, modalidad,
anatomia, hallazgos, variantes y variables.

Cada feedback validado produce aprendizaje automatico:

- **Sirvio tal cual**: refuerza la salida que genero Skelly.
- **Guardar version final**: registra la entrada, la salida original y la
  correccion humana.
- Una memoria nueva se activa inmediatamente solo para casos muy parecidos.
- Las confirmaciones repetidas aumentan su confianza y alcance.
- Las correcciones contradictorias reducen confianza o mandan la memoria a
  cuarentena; no se sobrescribe el historial silenciosamente.
- El aprendizaje es colectivo, con una pequena preferencia por el estilo de la
  usuaria actual.

No hace falta crear migraciones por cada aprendizaje. La migracion inicial
`20260715000000_assistant_continuous_learning.sql` crea la infraestructura y
los siguientes feedbacks se guardan como datos normales.

## Panel privado de Skelly Lab

La ruta exacta del panel es:

**Produccion:** `https://skelletary.com/#/skelly-lab`

**Desarrollo:** `http://localhost:5173/#/skelly-lab`

El panel requiere una sesion normal de Skelletary y luego el PIN privado. El
PIN se configura con la variable `ASSISTANT_ADMIN_PIN` como secret de la Edge
Function `assistant-admin`; nunca debe tener prefijo `VITE_` ni escribirse en
el repositorio.

Skelly Lab no aprueba manualmente cada aprendizaje. Sirve para:

- revisar cantidad de feedback, memorias, confianza y conflictos;
- activar o desactivar memorias;
- revertir una memoria a una version anterior;
- observar el estado general del aprendizaje.

La ruta usa hash porque GitHub Pages no procesa rutas del servidor. Si el panel
parece quedarse abierto al volver, usar el enlace **Volver a Skelletary**, que
navega a la ruta base real.

## Conexion MCP de Supabase

El proyecto contiene `.mcp.json` con el servidor oficial de Supabase limitado
al proyecto de Skelletary. Para que Codex muestre sus herramientas:

1. Abre el proyecto desde la raiz del repositorio.
2. Recarga o reinicia Codex.
3. Completa la autenticacion OAuth de Supabase en el navegador cuando la pida.
4. Comprueba las herramientas desde el comando `/mcp`.

La conexion MCP permite consultar y administrar el proyecto autorizado, pero no
debe usarse para conectar datos de produccion con informacion identificable de
pacientes. Para el despliegue repetible del repositorio se mantiene tambien la
CLI de Supabase.

## Despliegue y sincronizacion tecnica

Pruebas y build local:

```bash
npm.cmd test
npm.cmd run build
```

Sincronizar la copia privada de las plantillas oficiales:

```bash
npm.cmd run assistant:sync
```

El origen oficial sigue siendo `src/data/defaultTemplates.json`; la copia
privada `assistant_ai_templates` siempre se actualiza en una sola direccion.

El workflow de GitHub Pages se ejecuta al hacer push a `main` y necesita los
secrets `VITE_APP_URL`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

## Tu nombre visible (editable)

Tu cuenta tiene un **nombre visible** (`display_name`) que aparece en el
Header y al pie del dashboard. Lo setea el owner al crearte con
`--name="Dra. Ejemplo"`, pero ahora **vos podes cambiarlo en cualquier
momento**:

1. Apreta "Skelly te guia" -> "Ajustes" en la cabecera (o la opcion
   equivalente segun el menu de tu cuenta).
2. La primera card se llama **"Mi perfil"**.
3. Cambia el texto del input "Nombre para mostrar".
4. Apreta **Guardar nombre**.

El cambio se refleja al instante en el Header. Validaciones: el nombre
debe tener entre 2 y 60 caracteres (validacion server-side via trigger
SQL en `profiles`).

## Donde vive cada cosa en el codigo

Si te toca mantener la app y no recordas donde estaba algo, aca va un
mapa rapido:

| Area | Archivos clave |
|---|---|
| Orquestacion de la app | `src/App.jsx` |
| Pantalla de login/invitacion | `src/components/AuthScreen.jsx` |
| Cabecera del dashboard | `src/components/Header.jsx` |
| Skelly (mascota) | `src/components/SkellyDashboardMascota.jsx` + `src/lib/skellyMensajes.js` + `src/data/skellyMensajes.js` |
| Asistente de informes (UI) | `src/components/AssistantPanel.jsx` |
| Asistente de informes (cliente) | `src/lib/assistant.js` + `src/lib/assistantSanitize.js` |
| Asistente de informes (backend) | `supabase/functions/assistant-report/` |
| Asistente de informes (knowledge) | `supabase/knowledge/*.md` |
| Biblioteca oficial (JSON) | `src/data/defaultTemplates.json` |
| Reglas de plantillas | `src/lib/templates.js` |
| Sincronizacion con la nube | `src/lib/remoteTemplates.js` |
| Estados comerciales | `src/lib/access.js` |
| Login y sesion | `src/lib/auth.js` |
| Cache local y preferencias | `src/lib/storage.js` |
| Variables `{{nombre}}` | `src/lib/variables.js` |
| Copia al portapapeles | `src/lib/clipboard.js` |
| Dictado por voz en campos | `src/lib/voiceInput.js` |
| Alta manual de usuarios (script) | `scripts/create-user.mjs` |
| Paso a paso para crear usuarios | `docs/ALTA-DE-USUARIOS.md` |
| Arquitectura y modulos | `docs/ARQUITECTURA.md` |

Para entender los flujos de fondo (login, alta, biblioteca), lee
`docs/ARQUITECTURA.md`. Para reglas de estilo y nombres, `docs/CONVENCIONES.md`.
