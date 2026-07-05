# Deploy del modulo Asistente (Skelly Redactor)

Esta guia explica como llevar el modulo Asistente de informes desde el
codigo que ya esta en el repo hasta que tu esposa pueda usarlo desde
`https://skelletary.com`.

El modulo toca 4 lugares:

1. La base de datos de Supabase (migracion SQL).
2. El Storage de Supabase (knowledge base del LLM).
3. Las Edge Functions de Supabase (la logica del backend).
4. Las variables de entorno de la Edge Function (API key del LLM).

Los pasos estan en orden. Si algo falla, el documento incluye que
revisar antes de seguir.

---

## 1. Correr la migracion SQL en Supabase

### Que hace

Agrega:

- La columna `has_assistant_access` (boolean, default `false`) a
  `public.profiles`.
- La tabla `public.assistant_usage` con su indice, trigger de
  `updated_at` y politica RLS para que cada usuaria lea solo su fila.
- El default `false` protege a usuarias existentes: nadie recibe acceso
  sin que vos lo actives explicitamente.

La migracion es **idempotente**: si la corres dos veces, no rompe nada.

### Como correrla

Opcion A - Desde la consola web (la mas facil):

1. Anda a `https://app.supabase.com/project/<tu-proyecto>/sql/new`.
2. Abre el archivo del repo:
   `supabase/migrations/20260704000000_assistant_module.sql`.
3. Copia todo el contenido y pegalo en el editor SQL de Supabase.
4. Apretas `Run` (o `Cmd/Ctrl + Enter`).
5. Deberias ver `Success. No rows returned` (o algo asi, sin errores).

Opcion B - Con Supabase CLI (si ya lo usas):

```bash
supabase db push
```

### Como verificar que quedo

Anda a `Database > Tables` y deberias ver:

- `public.profiles` con la columna `has_assistant_access` (boolean).
- `public.assistant_usage` (nueva).

Anda a `Database > Policies` y deberias ver la policy
`assistant_usage_read_own` sobre `public.assistant_usage`.

Si todo esta, sigue con el paso 2.

---

## 2. Crear el bucket de Storage y subir la knowledge base

### Que hace

Crea un bucket privado `assistant-knowledge` con 3 archivos Markdown
que el Edge Function lee cada vez que se invoca al Asistente.

### Pasos

1. Anda a `Storage > New bucket`.
2. Nombre: `assistant-knowledge`.
3. Marcado como **Private bucket** (no publico).
4. Crea el bucket.
5. Anda al bucket y sube estos 3 archivos desde la carpeta
   `supabase/knowledge/` del repo:

   - `guia-estilo.md`
   - `diccionario-plantillas.md`
   - `plantillas-corregidas.md`

### Politica RLS del bucket (recomendada)

El Edge Function usa el service role key para descargar, asi que en
principio no necesitarias una policy para usuarios. Pero por las dudas
deja el bucket en `Private` (no `Public`) asi nadie puede leer los
archivos desde la web.

### Como verificar

Anda a `Storage > assistant-knowledge` y deberias ver los 3 archivos.
Click en cada uno, "Get URL" - tiene que fallar o devolver URL firmada
(no una URL publica directa).

---

## 3. Desplegar la Edge Function `assistant-report`

### Que hace

Sube el codigo de `supabase/functions/assistant-report/` a Supabase
como una funcion serverless. La UI de la app la invoca con
`supabase.functions.invoke("assistant-report", {...})`.

### Prerequisito: instalar Supabase CLI

Si todavia no lo tenes:

```bash
# macOS / Linux
brew install supabase/tap/supabase

# Windows (con scoop)
scoop install supabase

# O descarga directa
# https://github.com/supabase/cli#install-the-cli
```

Despues:

```bash
supabase login
supabase link --project-ref <tu-project-ref>
```

El `<tu-project-ref>` esta en la URL de la consola de Supabase
(`https://app.supabase.com/project/<project-ref>`).

### Deploy

Desde la raiz del repo:

```bash
supabase functions deploy assistant-report --no-verify-jwt
```

La opcion `--no-verify-jwt` es importante: la funcion hace su propia
validacion de sesion contra `getUser()`, no queremos que Supabase
rechace el request antes de llegar ahi.

### Como verificar

Anda a `Edge Functions` en la consola. Deberias ver `assistant-report`
con estado "Active".

Probalo con curl reemplazando `<ACCESS_TOKEN>` por un Bearer token
real de una cuenta con `has_assistant_access = true`:

```bash
curl -X POST \
  "https://<project-ref>.supabase.co/functions/v1/assistant-report" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"input": "eco abdomen normal agrega: esteatosis"}'
```

Deberias recibir un JSON con `{ text, usage }`. Si te llega un 401 o
403, revisa la seccion "Que falla si..." al final.

---

## 4. Configurar los secrets de la Edge Function

### Que hace

Guarda las claves sensibles (API key del LLM, etc.) en los secrets de
Supabase. Nunca quedan en el bundle del frontend.

### Variables a setear

```bash
supabase secrets set MINIMAX_API_KEY=<tu-api-key-de-MiniMax>
supabase secrets set MINIMAX_BASE_URL=https://api.minimax.chat/v1
supabase secrets set MINIMAX_MODEL=MiniMax/M3
```

Notas:

- `MINIMAX_BASE_URL` y `MINIMAX_MODEL` tienen defaults razonables en el
  codigo. Solo necesitarias setearlos si tu cuenta de MiniMax usa otro
  endpoint o modelo.
- Si queres usar OpenAI en vez de MiniMax, cambia `MINIMAX_BASE_URL` a
  `https://api.openai.com/v1` y `MINIMAX_MODEL` a `gpt-4o-mini` (o lo
  que prefieras). El codigo del Edge Function usa el formato
  OpenAI-compatible, asi que anda igual.
- Si usas Anthropic, el formato es distinto y tendrias que cambiar
  `supabase/functions/assistant-report/lib/llm.js`.

### Como verificar

```bash
supabase secrets list
```

Deberias ver las 3 variables (o al menos `MINIMAX_API_KEY`).

---

## 5. Activar el modulo a una usuaria

### Que hace

Setea `has_assistant_access = true` para la cuenta que quieras que use
el Asistente. Para empezar, solo tu esposa.

### Como hacerlo

Desde la raiz del repo:

```bash
# Tu esposa, con biblioteca oficial y acceso al Asistente
npm run user:create -- \
  --email=esposa@clinica.com \
  --access=active \
  --share-core=true \
  --ai-access=true \
  --name="Dra. Tu Esposa"
```

El flag `--ai-access=true` actualiza el perfil existente o crea la
cuenta con el flag encendido. Es seguro correrlo varias veces: hace
UPSERT en `profiles`.

Para verificar:

```sql
select email, has_assistant_access, access_status
from public.profiles
where email = 'esposa@clinica.com';
```

Deberias ver `has_assistant_access = true`.

---

## 6. Probar end-to-end

1. Anda a `https://skelletary.com` (o tu dominio) e inicia sesion con
   la cuenta de tu esposa.
2. En el dashboard, debajo del video de Skelly, deberias ver el panel
   **"Skelly · Redactor"**.
3. Escribi `eco abdomen normal agrega: esteatosis` y apreta Enter.
4. La respuesta deberia salir formateada con `ANTECEDENTES CLINICOS:`,
   `HALLAZGOS:` (con la frase sistematica) e `IMPRESION:`.

Si la respuesta sale bien formateada, el modulo esta operativo.

---

## Que falla si... (troubleshooting rapido)

| Sintoma | Causa probable | Solucion |
|---|---|---|
| Panel no aparece | `has_assistant_access = false` | Correr paso 5 con `--ai-access=true` |
| 401 desde la Edge Function | Sesion expirada o token mal armado | Re-login, volver a probar |
| 403 `Tu cuenta no tiene habilitado el asistente` | El flag no llego a Supabase | Verificar `select has_assistant_access` |
| 403 `Tu acceso a Skelletary no esta vigente` | `access_status = expired` o trial vencido | Renovar con el script (`--access=active`) |
| 429 `Has alcanzado el limite` | 300 envios / 12h | Esperar a la ventana o ajustar `LIMIT` en `lib/usage.js` |
| 500 `No pudimos cargar la knowledge base` | Bucket sin subir o sin service role key | Revisar paso 2 y que `SUPABASE_SERVICE_ROLE_KEY` este en secrets |
| 502 `El asistente no pudo generar el informe` | API key del LLM mal o limite del proveedor | Revisar `MINIMAX_API_KEY` en secrets |
| La respuesta sale en markdown | Caso raro del LLM | El backend ya sanea; si pasa, copiar el input exacto y reportar al owner |
| Salida sin la frase sistematica | El sanitizador no detecto modalidad | Reportar al owner con el codigo de plantilla usado |

---

## Resumen de archivos que vas a tocar

En Supabase (varios lugares, no son archivos sino configuraciones):

- SQL Editor: `supabase/migrations/20260704000000_assistant_module.sql`.
- Storage: nuevo bucket `assistant-knowledge` con 3 archivos Markdown.
- Edge Functions: deploy de `supabase/functions/assistant-report/`.
- Secrets: `MINIMAX_API_KEY`, opcionalmente `MINIMAX_BASE_URL` y
  `MINIMAX_MODEL`.

En tu maquina (para activar la usuaria):

```bash
npm run user:create -- --email=esposa@... --access=active --share-core=true --ai-access=true
```

Y con eso ya esta. La UI no necesita redeploy: el frontend ya esta
compilado y listo, y cuando la usuaria refresque, va a ver el panel.

---

## Si en algun momento queres apagar el modulo

1. Desactivar el flag por usuaria:

   ```bash
   npm run user:create -- --email=esposa@clinica.com --access=active --ai-access=false
   ```

   El panel desaparece al siguiente login.

2. (Opcional) Borrar la Edge Function:

   ```bash
   supabase functions delete assistant-report
   ```

3. (Opcional) Borrar el bucket:

   Anda a Storage, click en `assistant-knowledge`, "Delete bucket".

La migracion SQL no necesita rollback salvo que quieras limpiar la
columna `has_assistant_access`. Si queres, podes correr:

```sql
alter table public.profiles drop column has_assistant_access;
drop table if exists public.assistant_usage;
```

Pero normalmente alcanza con dejar el flag en `false`.