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

## Donde vive cada cosa en el codigo

Si te toca mantener la app y no recordas donde estaba algo, aca va un
mapa rapido:

| Area | Archivos clave |
|---|---|
| Orquestacion de la app | `src/App.jsx` |
| Pantalla de login/invitacion | `src/components/AuthScreen.jsx` |
| Cabecera del dashboard | `src/components/Header.jsx` |
| Skelly (mascota) | `src/components/SkellyDashboardMascota.jsx` + `src/lib/skellyMensajes.js` + `src/data/skellyMensajes.js` |
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

Para entender los flujos de fondo (login, alta, biblioteca), lee
`docs/ARQUITECTURA.md`. Para reglas de estilo y nombres, `docs/CONVENCIONES.md`.