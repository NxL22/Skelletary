# Alta de usuarios en Skelletary

## Idea general

Las cuentas no se crean desde la web.
El owner las invita desde su propia maquina usando un script local con permisos de administrador de Supabase.

## Antes de crear la primera cuenta

En tu `.env` deben existir:

```env
VITE_APP_URL=https://skelletary.com
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SECRET_KEY=...
# o, si usas claves legacy:
SUPABASE_SERVICE_ROLE_KEY=...
SKELLETARY_APP_URL=https://skelletary.com
```

Y en Supabase:

1. `Authentication > General > Allow new users to sign up` debe estar apagado.
2. `Authentication > Sign In / Providers` debe tener email + password activo.
3. `Authentication > URL Configuration` debe incluir la URL local y la URL final de tu app, pero la `Site URL` de produccion debe quedar en `https://skelletary.com`, no en localhost.
4. `Authentication > Email Templates` puede usar las plantillas de `supabase/email-templates/`.

## Crear una cuenta en prueba

```bash
npm run user:create -- --email=usuario@clinica.com --access=trial --share-core=true --name="Dra. Ejemplo"
```

Eso hace tres cosas:

1. invita al usuario por correo
2. deja el perfil de la app listo
3. configura el acceso inicial

Ademas puedes decidir si esa cuenta recibe o no la biblioteca oficial:

- `--share-core=true`
- `--share-core=false`

## Otras variantes

Sin trial pero con acceso inmediato:

```bash
npm run user:create -- --email=usuario@clinica.com --access=active --share-core=true --name="Dra. Ejemplo"
```

Cuenta pendiente:

```bash
npm run user:create -- --email=usuario@clinica.com --access=pending --share-core=false
```

Cuenta activa por un ano:

```bash
npm run user:create -- --email=usuario@clinica.com --access=active --subscription-days=365 --share-core=true
```

## Reenviar un correo al usuario

Si la cuenta ya existe y quieres volver a mandar un correo desde el script, puedes usar:

```bash
npm run user:create -- --email=usuario@clinica.com --access=active --share-core=true --name="Dra. Ejemplo" --resend=auto
```

Modos disponibles:

- `--resend=auto`
  Si la cuenta ya existe, envia un correo de recuperacion para que el usuario cree o cambie su contraseña.
- `--resend=recovery`
  Fuerza el correo de recuperacion.
- `--resend=invite`
  Intenta reenviar invitacion; si Supabase no la reprocesa, el script cae a recuperacion.
- `--resend=none`
  No manda correo si la cuenta ya existia. Solo actualiza el perfil en Skelletary.

## Crear o reemplazar una contrasena sin correo

Si Supabase tiene rate limit de correos, el owner puede definir una contrasena temporal desde el script:

```bash
npm run user:create -- --email=usuario@clinica.com --password="ContrasenaTemporal123" --access=active --share-core=true --name="Dra. Ejemplo"
```

Con `--password`, el script no envia correo por defecto. Si la cuenta no existe, la crea con email confirmado. Si ya existe, reemplaza su contrasena.

Como no se manda correo, este modo no necesita `SKELLETARY_APP_URL` ni `VITE_APP_URL` si usas el reenvio por defecto.

Usa este camino solo como solucion operativa temporal y comunica la contrasena por un canal seguro.

## Lo que recibe el usuario

El usuario recibe un correo de invitacion.
Ese enlace lo lleva a la app con `?auth_mode=invite`.
En esa pantalla solo crea su contraseña y luego ya puede entrar con email + contraseña.

Si `--share-core=false`, el usuario entra sin la biblioteca oficial y trabaja solo con su biblioteca personal.

## Si olvida la contraseña

Desde la pantalla de login usa `Olvide mi contraseña`.
Supabase envia el correo de recuperacion y el usuario define una nueva contraseña al volver a la app.
