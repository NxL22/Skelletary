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

## Como NO documentar

Antes de escribir sobre el modelo comercial, lee el codigo real. Si no
estas seguro de como funciona un flag o un estado, lee primero:

- `scripts/create-user.mjs` (ver que flags acepta y que hace cada uno)
- `src/lib/access.js` (ver como se resuelve cada estado)
- `supabase/schema.sql` (ver que columnas existen y que check hay)

No inventes reglas. Si tienes dudas, pregunta al owner.