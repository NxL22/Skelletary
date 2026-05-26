# Plantillas de correo de Skelletary

Estas plantillas estan pensadas para proyectos alojados en Supabase.

## Donde se pegan

1. Abre tu proyecto en Supabase.
2. Ve a `Authentication > Email Templates`.
3. Copia el HTML del archivo correspondiente.
4. Ajusta el asunto sugerido.

## Archivos

- `invite.html`
  Asunto sugerido: `Tu cuenta de Skelletary ya esta lista`
- `recovery.html`
  Asunto sugerido: `Cambia tu contraseña de Skelletary`

## Variables usadas

- `{{ .ConfirmationURL }}`
- `{{ .Email }}`
- `{{ .Data.display_name }}`

## Notas

- `invite.html` acompana el script `npm run user:create`.
- `recovery.html` se usa cuando el usuario pulsa "Olvide mi contraseña".
- Si luego quieres una version aun mas editorial, puedes cambiar textos y colores sin tocar la app.
