# Supabase en Skelletary

## Que hace esta carpeta

Aqui vive la base del backend de Skelletary:

- esquema SQL
- reglas de seguridad
- estructura separada entre biblioteca oficial y biblioteca personal

## Orden recomendado

1. Crear proyecto en Supabase
2. Configurar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
3. Agregar tambien `SUPABASE_SECRET_KEY` y `SKELLETARY_APP_URL` en tu `.env`
4. Ejecutar `supabase/schema.sql`
5. En `Authentication > General`, desactivar `Allow new users to sign up`
6. En `Authentication > Sign In / Providers`, dejar activo email + password
7. En `Authentication > URL Configuration`, agregar la URL local y la URL final de la app
8. Crear usuarios con `npm run user:create`
9. Revisar que el usuario haya quedado en `profiles` con el estado correcto

## Regla editorial importante

La biblioteca oficial no se edita desde la web.

Se mantiene aqui, en VS Code, y luego se publica a la base de datos mediante un flujo interno del producto.

## Flujo de cuentas

- el usuario no puede registrarse desde la web
- el owner invita la cuenta con un script local
- Supabase envia un correo para crear la contraseña
- luego el usuario entra con email y contraseña
- si la olvida, recupera la contraseña por correo

## Estados de acceso

- `pending`
- `trial`
- `active`
- `expired`

`pending` deja creada la cuenta pero sin entrada a la app todavia.
La prueba de 15 dias debe activarse manualmente.

## Crear un usuario desde tu maquina

Ejemplo:

```bash
npm run user:create -- --email=usuario@clinica.com --access=trial --share-core=true --name="Dra. Ejemplo"
```

Si tu proyecto usa claves legacy, el script tambien acepta `SUPABASE_SERVICE_ROLE_KEY`.

Opciones utiles:

- `--access=pending`
- `--access=trial --trial-days=15`
- `--access=active --subscription-days=365`
- `--share-core=true`
- `--share-core=false`
- `--resend=auto`
- `--resend=recovery`
- `--resend=invite`
- `--resend=none`
- `--app-url=https://tu-dominio.com`

El enlace del correo apunta a `?auth_mode=invite` para que el usuario cree su contraseña al abrir la app.

`--share-core=false` deja a ese usuario sin biblioteca oficial compartida.
`--resend=auto` reenvia un correo util si la cuenta ya existia.

## Correos

En `supabase/email-templates/` tienes HTML listo para:

- invitacion de cuenta
- recuperacion de contraseña
