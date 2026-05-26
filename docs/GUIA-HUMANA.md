# Guia Humana de Skelletary

## Que es hoy

Skelletary es una app para radiologos pensada para encontrar, adaptar y copiar plantillas con mucha menos friccion que un text expander generico.

La app ya esta preparada para:

- biblioteca oficial del producto
- biblioteca personal por usuario
- cuenta con acceso controlado
- importacion desde Excel o CSV
- favoritos y recientes
- variables `{{nombre}}`

## Que se vende

Skelletary no se plantea como freemium abierto.

La logica del producto es:

- prueba de 15 dias
- activada manualmente
- luego suscripcion anual

Por ahora nadie puede exportar sus datos desde la app.
Si se puede meter informacion a la biblioteca personal.

## Dos bibliotecas separadas

Siempre deben existir dos capas distintas:

### 1. Biblioteca oficial

- la mantienes tu
- se edita en VS Code
- forma parte del producto
- no se edita desde la web en esta fase
- puede compartirse o no por usuario segun la decision del owner

### 2. Biblioteca personal

- pertenece al usuario
- vive en su cuenta
- puede crearse manualmente
- puede importarse desde Excel o CSV
- puede editarse y borrarse

## Como funciona el backend

La ruta elegida es Supabase:

- Postgres
- Auth con email y contraseña
- Row Level Security

La nube pasa a ser la fuente principal cuando el usuario inicia sesion.

`localStorage` se conserva para:

- cache local
- arranque rapido
- migracion desde la etapa anterior

## Acceso comercial

Las cuentas no se registran libremente desde la web.
El owner las crea o invita de forma manual.

Cada usuario puede estar en uno de estos estados:

- `pending`
- `trial`
- `active`
- `expired`

`pending` significa que la cuenta ya existe, pero todavia no entra a la app.
La activacion de prueba no es automatica.
Se hace manualmente.

## Flujo de acceso

- el owner crea la cuenta
- Supabase envia un correo de invitacion
- el usuario define su contraseña
- luego entra con email y contraseña
- si la olvida, usa recuperacion por correo

## Alta manual de usuarios

La ruta oficial para crear cuentas esta en:

- `scripts/create-user.mjs`

Se ejecuta desde la raiz del proyecto con:

```bash
npm run user:create -- --email=usuario@clinica.com --access=active --share-core=true --name="Dra. Ejemplo"
```

### Si no quieres trial

Tienes dos caminos:

- `--access=active`
  La cuenta entra con acceso activo desde el principio.
- `--access=pending`
  La cuenta existe, pero no entra a la app hasta que decidas activarla despues.

Ejemplos:

```bash
npm run user:create -- --email=usuario@clinica.com --access=active --share-core=true --name="Dra. Ejemplo"
```

```bash
npm run user:create -- --email=usuario@clinica.com --access=pending --share-core=false --name="Dra. Ejemplo"
```

### Compartir o no la biblioteca oficial

- `--share-core=true`
  El usuario recibe la biblioteca oficial.
- `--share-core=false`
  El usuario no recibe la biblioteca oficial y trabaja solo con su biblioteca personal.

### Reenviar correo desde el script

Si la cuenta ya existe, puedes volver a mandar un correo con:

```bash
npm run user:create -- --email=usuario@clinica.com --access=active --share-core=true --name="Dra. Ejemplo" --resend=auto
```

Regla practica:

- `--resend=auto`
  Recomendado. Si la cuenta ya existe, envia recuperacion.
- `--resend=recovery`
  Reenvia acceso por recuperacion.
- `--resend=invite`
  Intenta invitacion y, si no funciona, usa recuperacion.
- `--resend=none`
  No envia correo, solo actualiza el perfil.

### Variables necesarias en `.env`

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

### Despliegue en GitHub Pages

Para que `skelletary.com` publique la misma app que ves localmente, GitHub Actions tambien necesita:

```env
VITE_APP_URL=https://skelletary.com
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Estas variables no se leen desde tu PC cuando Pages compila en GitHub.
Hay que cargarlas como secrets del repositorio y consumirlas en el workflow de deploy.

Si faltan, el deploy igual termina correctamente, pero la app publicada entra en modo local o fabrica enlaces de recuperacion contra el host equivocado y parece que "no tomo" los cambios de acceso, login o biblioteca en la nube.

En `Authentication > URL Configuration` de Supabase, la `Site URL` y las `Redirect URLs` de produccion deben apuntar a `https://skelletary.com`, nunca a `localhost`.

## Importacion para usuarios no tecnicos

La prioridad real del producto es importar sin pedir JSON.

Soportado en esta fase:

- `.csv`
- `.xlsx`

No soportado todavia:

- Word
- PDF
- importaciones magicas raras

## Regla de seguridad

Skelletary guarda plantillas y uso del usuario.

No esta pensada para guardar datos identificables de pacientes.
Si eso cambia algun dia, hay que rediseñar arquitectura y seguridad antes de implementarlo.

## Regla de producto

Si aparece una idea nueva, la pregunta correcta es:

"Esto hace al radiologo mas rapido, mas comodo y mas seguro al redactar?"

Si no, probablemente no es prioridad.
