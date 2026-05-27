# Skelletary Agent Guide

## Proposito

Skelletary es un producto para radiologos centrado en velocidad, claridad y confianza.
La app debe sentirse premium, profesional y extremadamente util para el trabajo diario.

## Estado actual del producto

- Frontend: React + Vite + Tailwind CSS
- Backend objetivo y ya integrado en la app: Supabase
- Auth: email + contraseña, recuperacion por correo e invitacion creada solo por el owner
- Auth excepcional: el owner puede crear o reemplazar una contraseña desde script local cuando el correo de Supabase este limitado
- Modelo comercial: prueba manual de 15 dias o suscripcion anual activa
- Estado inicial de una cuenta nueva: `pending` hasta activacion manual
- Estados comerciales contemplados: `pending`, `trial`, `active`, `expired`
- Regla comercial vigente: una cuenta `expired` no entra a la app hasta renovacion manual
- Automatizacion futura ya definida: enviar aviso por correo 5 dias antes del vencimiento anual y otro cuando la suscripcion venza; por ahora no esta implementado
- Acceso: la app no debe poder usarse sin sesion valida y acceso vigente
- Persistencia: nube como fuente principal; `localStorage` solo como cache y migracion dentro de la experiencia autenticada
- Cierre de sesion: al cerrar sesion o perderla por expiracion, deben limpiarse los artefactos locales de Skelletary en `localStorage`
- Biblioteca oficial: mantenida por el owner en VS Code
- Biblioteca oficial: puede compartirse o no por usuario, pero siempre se mantiene desde VS Code
- Biblioteca personal: mantenida por cada usuario dentro de su cuenta
- Exportacion: deshabilitada para todos por ahora
- Importacion permitida: CSV y Excel
- Deploy web: GitHub Pages debe recibir `VITE_APP_URL`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como secrets del repositorio para no publicar la app en modo local ni fabricar enlaces de auth hacia localhost

## Reglas no negociables

- Todo texto visible para el usuario debe estar en espanol natural.
- No mezclar biblioteca oficial y personal a nivel de almacenamiento.
- La biblioteca oficial nunca se edita desde la web en esta fase.
- No introducir datos identificables de pacientes.
- No reintroducir exportacion para usuarios a menos que el owner lo pida explicitamente.

## Arquitectura clave

- `src/App.jsx`: orquestacion de sesion, acceso, catalogo, migracion local y modales
- `src/lib/supabaseClient.js`: cliente Supabase y deteccion de configuracion
- `src/lib/auth.js`: login por contraseña, recuperacion, cambio de contraseña y cambios de sesion
- `src/lib/remoteTemplates.js`: lectura/escritura remota y migracion
- `src/lib/importTemplates.js`: parseo y validacion de CSV/XLSX
- `supabase/schema.sql`: esquema base y RLS

## Contrato de datos

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
- reglas de importacion y validacion
- logica de acceso, prueba y suscripcion

No agregar comentarios obvios del tipo "asigna valor a variable".
Los comentarios deben ayudar a un humano a entender el por que.

## Reglas UX

- La busqueda debe sentirse inmediata.
- El boton de limpiar del buscador debe verse una sola vez, sin duplicados del navegador.
- Toda barra nueva de busqueda o filtro debe reutilizar el mismo patron visual y funcional de la barra principal: icono con espacio propio, boton de limpiar al escribir y acciones derechas alineadas sin superponer placeholder.
- Skelly debe aportar dopamina suave, no distraer.
- La app no debe verse infantil.
- Los medicos no deben necesitar entender JSON para usar la plataforma.

## Desarrollo futuro

Si se toca backend o acceso, mantener alineados:

- `AGENTS.md`
- `docs/GUIA-HUMANA.md`
- `supabase/schema.sql`

## Comandos

- `npm.cmd run dev`
- `npm.cmd run build`
