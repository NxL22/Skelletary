# Skelletary Agent Guide

## Proposito

Skelletary es un producto para radiologos centrado en velocidad, claridad y confianza.
La app debe sentirse premium, profesional y extremadamente util para el trabajo diario.

## Estado actual del producto

- Frontend: React + Vite + Tailwind CSS
- Backend objetivo y ya integrado en la app: Supabase
- Auth: email + contrasena y recuperacion por correo
- Creacion de usuarios: **unica y exclusivamente desde `scripts/create-user.mjs`**, ejecutado por el owner en su maquina local. No existe registro publico desde la web.
- Estados comerciales posibles en la base de datos: `pending`, `trial`, `active`, `expired`.
- Flujo comercial actual del owner: crea usuarios directamente con `active` (suscripcion vigente) o `pending` (la cuenta existe pero todavia no debe entrar a la app). El script acepta `trial` como opcion pero no es el camino que se usa en produccion.
- Acceso: la app no puede usarse sin sesion valida y acceso vigente (`active` o `trial` no vencido). Una cuenta `expired` o `pending` no entra.
- Persistencia: nube (Supabase) como fuente principal; `localStorage` solo como cache y migracion dentro de la experiencia autenticada.
- Cierre de sesion: al cerrar sesion o perderla por expiracion, deben limpiarse los artefactos locales de Skelletary en `localStorage`.
- Biblioteca oficial: mantenida por el owner en VS Code y embebida en `src/data/defaultTemplates.json`.
- Biblioteca oficial: puede compartirse o no por usuario, pero siempre se mantiene desde VS Code.
- Biblioteca personal: mantenida por cada usuario dentro de su cuenta.
- Edicion de plantillas oficiales: permitida desde la app. Al guardar una plantilla oficial se promueve automaticamente a la biblioteca personal del usuario conservando el mismo ID, de modo que el merge en la nube la muestre en el mismo lugar.
- Importacion: deshabilitada para todos por ahora (sin CSV, sin Excel, sin JSON).
- Exportacion: deshabilitada para todos por ahora.
- Deploy web: GitHub Pages debe recibir `VITE_APP_URL`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como secrets del repositorio para no publicar la app en modo local ni fabricar enlaces de auth hacia localhost.

## Reglas no negociables

- Todo texto visible para el usuario debe estar en espanol natural.
- No mezclar biblioteca oficial y personal a nivel de almacenamiento.
- La biblioteca oficial se mantiene desde VS Code. La web puede leerla y personalizarla al editarla, pero no reemplaza la fuente original.
- No introducir datos identificables de pacientes.
- No reintroducir importacion ni exportacion para usuarios a menos que el owner lo pida explicitamente.
- **No tocar el texto visible de Skelly sin autorizacion explicita del owner.** Skelly es la mascota del producto y su voz/texto son decisiones de marca.
- **No inventar reglas comerciales.** Si no estas seguro de como funciona un flujo, lee primero `docs/ALTA-DE-USUARIOS.md`, `src/lib/access.js` y `scripts/create-user.mjs`. Si despues de leer hay dudas, pregunta al owner antes de documentar.

## Arquitectura clave del frontend

Mapa del codigo fuente para que cualquier dev nuevo se ubique rapido:

```
src/
  App.jsx                              <- Orquestador de la app: sesion, acceso, biblioteca, modales
  main.jsx                             <- Entry point de Vite (monta App en el DOM)
  index.css                            <- Estilos globales y animaciones (skelly-bubble, skelly-sparkle, etc.)

  components/
    AuthScreen.jsx                     <- Pantalla de login/invitacion/recuperacion
    Header.jsx                         <- Cabecera del dashboard (logo, cuenta, Skelly)
    CategorySidebar.jsx                <- Filtros por categoria
    SearchBar.jsx, SearchField.jsx     <- Buscador (patron canonico segun UX rules)
    TemplateCard.jsx                   <- Tarjeta individual de plantilla en el listado
    TemplateContent.jsx                <- Render del contenido de una plantilla
    TemplateDetailModal.jsx            <- Modal de detalle
    TemplateEditorModal.jsx            <- Modal de edicion (donde ocurre la "promocion" oficial -> personal)
    VariableFillModal.jsx              <- Modal para completar {{variables}} antes de copiar
    PasswordField.jsx, PinModal.jsx,
    PasswordChangeModal.jsx            <- UI de contrasena y PIN
    SkellyDashboardMascota.jsx         <- Mascota animada del dashboard (video, audio, burbuja)
    HelpModal.jsx                      <- Guia rapida "Skelly te explica la app"
    SettingsModal.jsx                  <- Configuracion del usuario
    ScrollToTopButton.jsx              <- Boton flotante para volver arriba
    PaginationControls.jsx             <- Paginacion del listado
    EmptyState.jsx                     <- Estado vacio del listado
    ModalShell.jsx                     <- Wrapper reusable para modales
    VoiceFieldButton.jsx               <- Boton de dictado por voz en campos
    ToastStack.jsx                     <- Sistema de toasts/notificaciones
    AnimatedLockIcon.jsx               <- Icono de candado animado (desbloquear/bloquear)

  data/
    defaultTemplates.json              <- Biblioteca oficial embebida (se mantiene desde VS Code)
    skellyMensajes.js                  <- Catalogo de mensajes/audios para Skelly

  lib/
    supabaseClient.js                  <- Cliente Supabase y deteccion de configuracion
    auth.js                            <- Login, recuperacion, cambios de sesion
    access.js                          <- Estados comerciales (pending, trial, active, expired) y reglas de acceso
    remoteTemplates.js                 <- Lectura/escritura remota de plantillas en Supabase
    templates.js                       <- Reglas de plantillas: normalizacion, atajos, duplicacion
    variables.js                       <- Deteccion y reemplazo de {{variables}}
    voiceInput.js                      <- Integracion con Web Speech API para dictado
    clipboard.js                       <- Copia al portapapeles con fallback
    storage.js                         <- Wrapper de localStorage (cache + preferencias persistentes)
    publicAssets.js                    <- Helper para resolver rutas dentro de /public
    reportFormatting.js                <- Formato del informe final al copiar
    skellyMensajes.js                  <- Selector de mensajes para Skelly (semanal, fallback)

supabase/
  schema.sql                           <- Esquema base + RLS (referencia, fuente de verdad en Supabase)
  email-templates/                     <- Plantillas de correo usadas por Supabase
  README.md                            <- Notas sobre el backend

scripts/
  create-user.mjs                      <- Script del owner para crear usuarios (ver docs/ALTA-DE-USUARIOS.md)
  analizar-plantillas.mjs              <- Utilidad para analizar la biblioteca oficial

docs/
  GUIA-HUMANA.md                       <- Manual de uso del producto (para el owner)
  ALTA-DE-USUARIOS.md                  <- Como dar de alta usuarios paso a paso
  SKELLY.md                            <- Especifico del sistema Skelly (mensajes, audio, sincronia)
  CONVENCIONES.md                      <- Convenciones de codigo y estilo del proyecto
  ARQUITECTURA.md                      <- Mapa detallado y flujos clave de la app
```

## Sistema Skelly (resumen ejecutivo)

Skelly es la mascota asistente del dashboard. El sistema completo se documenta
con detalle en `docs/SKELLY.md`. Aqui va el resumen para que la IA lo tenga
presente al tocar cualquier cosa cercana:

- **Catalogo**: `src/data/skellyMensajes.js`. Lista de mensajes disponibles.
  Cada entrada tiene `id`, `texto` y `audio` (ruta dentro de `/public`).
- **Selector**: `src/lib/skellyMensajes.js`. Decide que mensaje usar.
  Por ahora expone `obtenerMensajeSemanal()` con rotacion automatica segun
  la semana del ano y wrap-around si hay menos mensajes que semanas.
- **Componente**: `src/components/SkellyDashboardMascota.jsx`. Maneja video,
  audio, silencio, burbuja. NO contiene texto hardcodeado: siempre lo pide
  al selector.
- **Audio fisico**: archivos MP3 en `/public/audio de skelly/vocabulario/`.
- **Texto**: viene del campo `texto` del catalogo. **No se modifica salvo
  autorizacion explicita del owner.**
- **Sincronia**: la burbuja se escribe progresivamente. La velocidad de tipeo
  esta calibrada para que termine cerca del final del audio. No se bloquea
  la app si el audio falla: la burbuja sigue apareciendo sin voz.

Para agregar un nuevo mensaje: ver `docs/SKELLY.md > Como agregar un mensaje`.

## Contrato de datos de plantillas

Las plantillas deben preservar estos campos:

- `id`
- `title`
- `category`
- `shortcut`
- `content`
- `favorite`
- `copyCount`
- `createdAt`
- `updatedAt`
- `lastCopiedAt`
- `libraryOrigin`
- `isUserOwned`
- `sourceType`

Variables:

- siguen usando `{{nombre}}`
- se completan una vez aunque aparezcan repetidas

## Regla de comentarios en codigo

Todo codigo nuevo importante debe quedar comentado en espanol cuando la razon del comportamiento no sea obvia.

Comentar especialmente:

- decisiones de persistencia
- reglas de merge entre local y nube
- separacion entre biblioteca oficial y personal
- decisiones de UX no obvias
- logica de acceso, prueba y suscripcion
- sistema Skelly (selector, audio, sincronia, fallbacks)

No agregar comentarios obvios del tipo "asigna valor a variable".
Los comentarios deben ayudar a un humano a entender el por que.

## Reglas UX

- La busqueda debe sentirse inmediata.
- El boton de limpiar del buscador debe verse una sola vez, sin duplicados del navegador.
- Toda barra nueva de busqueda o filtro debe reutilizar el mismo patron visual y funcional de la barra principal: icono con espacio propio, boton de limpiar al escribir y acciones derechas alineadas sin superponer placeholder.
- Skelly debe aportar dopamina suave, no distraer.
- La app no debe verse infantil.
- Los medicos no deben necesitar entender JSON para usar la plataforma.
- Las plantillas oficiales y personales usan el mismo editor y el mismo flujo de atajos; la diferencia aparece al guardar, donde la oficial se promueve a personal.

## Convenciones del proyecto

Ver `docs/CONVENCIONES.md` para el detalle. Resumen rapido:

- Componentes en `PascalCase` y archivos `.jsx`.
- Modulos de logica en `src/lib/` en `camelCase` y archivos `.js`.
- Datos estaticos en `src/data/`.
- Comentarios en espanol, explicando el "por que", no el "que".
- Tailwind para todo el styling; nada de CSS-in-JS.
- Iconos via `lucide-react`.

## Desarrollo futuro

Si se toca backend o acceso, mantener alineados:

- `AGENTS.md`
- `docs/GUIA-HUMANA.md`
- `docs/ALTA-DE-USUARIOS.md`
- `docs/SKELLY.md`
- `docs/CONVENCIONES.md`
- `docs/ARQUITECTURA.md`
- `supabase/schema.sql`

Si se toca el sistema Skelly (mensajes, audio, sincronia), mantener alineados:

- `src/data/skellyMensajes.js`
- `src/lib/skellyMensajes.js`
- `src/components/SkellyDashboardMascota.jsx`
- `public/audio de skelly/vocabulario/`
- `docs/SKELLY.md`

## Comandos

- `npm.cmd run dev`     <- Levanta el servidor de desarrollo (Vite)
- `npm.cmd run build`   <- Compila la version de produccion a `dist/`
- `npm run user:create -- --email=... --access=...` <- Crea/actualiza un usuario desde el script del owner (ver `docs/ALTA-DE-USUARIOS.md`)