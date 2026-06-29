# Convenciones del proyecto

Reglas que seguimos en Skelletary para mantener el codigo coherente.
Si vas a contribuir, lee esto primero. Si dudas entre dos opciones,
elije la que coincida con el resto del proyecto.

## Nombres de archivos

- **Componentes React**: `PascalCase` con extension `.jsx`. Ejemplo:
  `TemplateCard.jsx`, `SkellyDashboardMascota.jsx`.
- **Modulos de logica** (funciones puras, helpers): `camelCase` con extension
  `.js`. Ejemplo: `auth.js`, `templates.js`, `skellyMensajes.js`.
- **Datos estaticos** (catalogos, JSON embebido): `camelCase` en `src/data/`.
  Ejemplo: `defaultTemplates.json`, `skellyMensajes.js`.
- **Una pieza por archivo**, salvo casos muy pequenos donde tiene sentido
  agrupar helpers privados.

## Nombres dentro del codigo

- **Componentes**: `PascalCase`. `function SkellySpeechBubble() {...}`.
- **Funciones**: `camelCase`, verbos al frente. `obtenerMensajeSemanal()`,
  `saveSkellyGreetingMuted()`.
- **Constantes de modulo**: `UPPER_SNAKE_CASE` solo cuando son valores
  magicos que merece la pena destacar. Para paths de assets o duraciones,
  usamos `UPPER_SNAKE_CASE` en la parte superior del archivo.
- **Variables de estado**: sustantivos claros. `isMuted`, `mensaje`,
  `showSpeechBubble`.

## Estructura de un componente

Orden recomendado dentro de un archivo `.jsx`:

1. Comentario de cabecera explicando que hace el componente y por que existe.
2. Imports externos (librerias).
3. Imports internos (otros componentes, helpers).
4. Constantes del modulo.
5. Sub-componentes o funciones auxiliares privadas.
6. Componente principal `export default function`.
7. Si hay sub-componientes publicos reutilizables, exportar al final.

## Estilos

- **Todo styling va por Tailwind**. No usamos CSS-in-JS ni styled-components.
- Para estilos globales (animaciones, keyframes) usamos `src/index.css`.
- Los colores y tokens vienen de `tailwind.config.js`. Si necesitas un color
  nuevo, agregalo ahi primero.
- Evita clases utility larguisimas e inline. Si una clase se repite mas de
  tres veces, considera extraer a una constante `const CLASE_X = "..."`
  o a un componente.

## Comentarios

- En **espanol**, sin acronimos raros.
- Explican el **por que**, no el **que**. "Asigna X a Y" no es un comentario
  util; "Usamos este fallback porque el navegador X no soporta la API Y" si.
- Comentar especialmente:
  - Decisiones de persistencia (que va a local y que va a la nube).
  - Reglas de merge entre biblioteca oficial y personal.
  - Logica de acceso, prueba y suscripcion.
  - Sistema Skelly (selector, sincronia audio + burbuja, fallbacks).
  - Decisiones de UX no obvias.

## Estado y efectos

- Preferir `useState` para estado local simple.
- Para estado compartido entre varios componentes, considerar levantarlo
  al `App.jsx` o usar un store. Skelletary todavia no usa Redux/Zustand,
  si aparece la necesidad se evalua.
- Cada `useEffect` debe tener su `return cleanup` cuando aplica.
- Dependencias del `useEffect`: declarar todas, sin adivinanzas.

## Errores y fallbacks

- Cualquier llamada a red o a un asset debe tener un camino de fallback.
- Skelletary nunca debe romperse por un audio que no cargo o un asset que
  falta. Si pasa, el componente debe mostrar un placeholder explicativo,
  no un error en consola sin contexto.

## Assets

- Imagenes, videos y audios viven en `/public/` con nombres descriptivos.
- No commitees binarios enormes. Si necesitas un asset pesado, considera
  cargarlo desde una URL externa o pedirselo al owner.
- Los paths de assets se resuelven con `getPublicAssetPath()` de
  `src/lib/publicAssets.js`. Asi respetamos la configuracion de base path
  para GitHub Pages.

## Deploy

- El deploy oficial va por GitHub Pages.
- Las variables `VITE_APP_URL`, `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
  se cargan como **secrets del repositorio**, no en `.env` local.
- Sin esas variables el build igual corre, pero la app no autenticara bien.

## Glosario rapido

- **Biblioteca oficial**: plantillas que mantiene el owner desde VS Code y
  que la app puede leer/compartir.
- **Biblioteca personal**: plantillas propias de cada usuario, viven en su
  cuenta de Supabase.
- **Promocion**: cuando el usuario edita una plantilla oficial, se copia a
  su biblioteca personal conservando el mismo ID.
- **Acceso vigente**: sesion valida + estado comercial != `expired`.
- **Skelly**: mascota asistente. Su sistema vive en `docs/SKELLY.md`.