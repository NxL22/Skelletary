# Skelletary

App web para radiologos pensada para buscar, completar y copiar plantillas
de informe con mucha menos friccion que un text expander generico.

Pensada para uso diario en clinica: busqueda inmediata, variables
`{{nombre}}`, biblioteca oficial + personal, guardado en la nube, y una
mascota asistente llamada **Skelly** que te recibe al iniciar sesion.

## Quick start

```bash
# Instalar dependencias (primera vez)
npm.cmd install

# Levantar el servidor de desarrollo
npm.cmd run dev
```

La app queda en `http://localhost:5173` (o el puerto que Vite asigne si
ese esta ocupado).

## Comandos utiles

| Comando | Que hace |
|---|---|
| `npm.cmd run dev` | Levanta Vite en modo desarrollo. |
| `npm.cmd run build` | Compila la version de produccion a `dist/`. |
| `npm run user:create -- --email=... --access=...` | Crea o actualiza un usuario (solo el owner, desde su maquina). |

Mas detalle del script de usuarios en `docs/ALTA-DE-USUARIOS.md`.

## Creacion de usuarios (solo el owner)

**No hay registro publico.** Las cuentas las crea unicamente el owner
usando `scripts/create-user.mjs`. Detalle paso a paso en
`docs/ALTA-DE-USUARIOS.md`. Resumen:

- El owner decide si la cuenta arranca como `active` (entra a la app)
  o como `pending` (la cuenta existe pero todavia no debe entrar).
- El script puede ademas reenviar correos de recuperacion si Supabase
  no reprocesa la invitacion.
- Tambien existe la opcion `--password=...` para crear o reemplazar la
  contrasena sin enviar correo (cuando Supabase limita los envios).

## Que hay en este repo

```
src/
  App.jsx                       <- Orquestador de la app
  components/                   <- Componentes React
  lib/                          <- Modulos de logica
  data/                         <- Catalogos y datos estaticos

supabase/
  schema.sql                    <- Esquema de la base + RLS (referencia)
  email-templates/              <- Plantillas de correo

scripts/
  create-user.mjs               <- Alta manual de usuarios (solo owner)

docs/
  GUIA-HUMANA.md                <- Manual del producto
  ALTA-DE-USUARIOS.md           <- Como dar de alta usuarios
  SKELLY.md                     <- Sistema de la mascota Skelly
  CONVENCIONES.md               <- Reglas de estilo y nombres
  ARQUITECTURA.md               <- Mapa y flujos del proyecto

public/
  audio de skelly/              <- Audios de Skelly
  video de skelly/              <- Videos de Skelly
  imagenes de Skelly/           <- Imagenes de Skelly
  fondo del login/              <- Fondo de la pantalla de login
  favicon/                      <- Favicon
```

## Glosario rapido

- **Skelly**: mascota asistente. Documentacion detallada en `docs/SKELLY.md`.
- **Biblioteca oficial**: plantillas que mantiene el owner desde VS Code y
  que viven en `src/data/defaultTemplates.json`.
- **Biblioteca personal**: plantillas propias de cada usuario, viven en su
  cuenta de Supabase.
- **Variable `{{nombre}}`**: placeholder que se completa una sola vez antes
  de copiar el informe.
- **Acceso vigente**: sesion valida + estado comercial `active` (o `trial`
  dentro de su fecha de vencimiento). `pending` y `expired` no entran.
- **Owner**: el administrador del producto. Es el unico que puede crear
  cuentas, decidir el estado comercial de cada una y mantener la biblioteca
  oficial.

## Para programadores nuevos en el proyecto

1. Lee este README para ubicarte.
2. Lee `docs/ARQUITECTURA.md` para entender los flujos.
3. Lee `docs/CONVENCIONES.md` antes de escribir tu primera linea.
4. Si vas a tocar Skelly, lee `docs/SKELLY.md`.
5. Si vas a tocar el alta de usuarios o el modelo comercial, lee
   `docs/ALTA-DE-USUARIOS.md` antes de inventar reglas.

## Reglas no negociables

- Todo texto visible para el usuario en **espanol natural**.
- No mezclar biblioteca oficial y personal a nivel de almacenamiento.
- No introducir datos identificables de pacientes.
- Importacion y exportacion deshabilitadas para todos por ahora.
- El texto visible de Skelly **no se modifica sin autorizacion del owner**.
- No documentar flujos comerciales que no hayas verificado leyendo el
  codigo real (`scripts/create-user.mjs`, `src/lib/access.js`,
  `supabase/schema.sql`). Si tienes dudas, pregunta antes de escribir.

Ver `AGENTS.md` para la lista completa.