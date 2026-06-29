# Skelly

Skelly es la mascota asistente del dashboard de Skelletary.
Cuando el usuario inicia sesion, Skelly lo recibe con un saludo hablado y
una burbuja de comic que se escribe progresivamente mientras suena el audio.

Este documento explica como funciona el sistema, como mantenerlo y como
agregar nuevos mensajes en el futuro.

## Que hace Skelly al iniciar sesion

1. Espera unos segundos para que el dashboard termine de cargar (constante
   `INTRO_DELAY_MS` en el componente).
2. Pide al selector (`src/lib/skellyMensajes.js`) el mensaje que corresponde
   a esta semana.
3. Carga el MP3 asociado al mensaje y empieza a reproducirlo.
4. Muestra una burbuja de comic con el texto del mensaje. La burbuja se
   "escribe" progresivamente mientras suena el audio.
5. Cuando termina el audio (o pasan ~8 segundos como red de seguridad),
   la burbuja se oculta y Skelly vuelve a su gif normal.

Si el usuario activo el toggle de silencio, no se reproduce audio y la
burbuja no aparece.

## Archivos del sistema

| Archivo | Que vive ahi |
|---|---|
| `src/data/skellyMensajes.js` | Catalogo de mensajes disponibles (id, texto, ruta del audio). |
| `src/lib/skellyMensajes.js` | Selectores: `obtenerMensajeSemanal()`, `obtenerMensajeFallback()`. |
| `src/components/SkellyDashboardMascota.jsx` | UI: video, gif, audio, burbuja, boton de silencio. |
| `public/audio de skelly/vocabulario/*.mp3` | Los audios reales que Skelly reproduce. |
| `public/video de skelly/` | El video que se ve cuando Skelly habla. |
| `src/lib/storage.js` | Persistencia de la preferencia "silenciar a Skelly" por usuario. |

## Como funciona la sincronia audio + burbuja

- La burbuja usa la tecnica del **span fantasma invisible**: hay un `<span>`
  fuera de pantalla con los mismos estilos que el texto visible, y se mide
  con `getBoundingClientRect()`. Esa medida se aplica al contenedor de la
  burbuja, asi crece o se encoge sola para amoldarse al texto.
- La escritura progresiva escribe un caracter cada ~30 ms, suficiente para
  leer con calma sin sentirse apurada.
- El audio corre en paralelo. Si el navegador bloquea el audio (politica de
  autoplay), la burbuja sigue funcionando normalmente sin voz.

## Como funciona el selector semanal

```js
const inicioDeAnio = new Date(fecha.getFullYear(), 0, 1);
const diferenciaMs = fecha.getTime() - inicioDeAnio.getTime();
const semanaDelAnio = Math.floor(diferenciaMs / (7 * 24 * 60 * 60 * 1000)) + 1;
const indice = (semanaDelAnio - 1) % MENSAJES_SEMANALES.length;
return MENSAJES_SEMANALES[indice];
```

- La semana 1 del ano corresponde al primer mensaje del catalogo.
- La semana 2 al segundo, y asi.
- Cuando hay menos mensajes que la semana actual, hace wrap-around y vuelve
  al primero. Ejemplo: con 2 mensajes, la semana 3 vuelve al primero.
- Si por algun motivo la fecha falla, devuelve el primer mensaje disponible
  (`obtenerMensajeFallback()`).

## Como agregar un mensaje nuevo

Paso a paso para cuando quieras grabar mas notas de voz:

1. **Graba el audio**. Formato recomendado MP3, duracion corta (3-10 segundos
   es lo ideal). Usa Audacity, la grabadora del celular o lo que prefieras.
2. **Guarda el archivo** en `public/audio de skelly/vocabulario/` con un
   nombre coherente. Por ejemplo `semana_2.mp3`.
3. **Edita el catalogo** en `src/data/skellyMensajes.js` y agrega la entrada:

   ```js
   {
     id: "semana_2",
     texto: "¡Feliz lunes! Hoy te acompaño en tus informes.",
     audio: "audio de skelly/vocabulario/semana_2.mp3",
   },
   ```

   Manten el texto con la ortografia correcta (tilde en "aqui", exclamaciones
   de apertura y cierre, etc.).
4. **Listo**. No hay que tocar nada mas. La proxima vez que recargues la app,
   la rotacion semanal ira mostrando el mensaje nuevo en la semana
   correspondiente.

Si quieres probar un mensaje sin esperar a su semana, podes temporalmente
forzar el indice en `obtenerMensajeSemanal()` durante el desarrollo, pero
**no dejes eso en produccion**.

## Fallbacks (redes de seguridad)

El sistema esta pensado para que Skelly nunca rompa la app:

- **Catalogo vacio**: `obtenerMensajeSemanal()` devuelve `null`. El componente
  no muestra burbuja en vez de romperse.
- **Fecha invalida**: `obtenerMensajeSemanal()` usa `new Date()` como fallback.
- **Audio falla al cargar**: el componente ignora el audio y muestra solo
  la burbuja con tipeo normal.
- **Audio bloqueado por autoplay**: la burbuja sigue apareciendo, solo no suena.
- **Video o gif no encontrados**: el componente muestra un placeholder
  informativo (`MissingSkellyMedia`).

## Decisiones de diseno que vale la pena recordar

- **El texto vive en datos, no en componentes.** Asi, agregar o cambiar
  mensajes no requiere tocar React.
- **El audio vive en `/public/audio de skelly/vocabulario/`.** Skelletary
  deploya en GitHub Pages, asi que todo asset estatico va ahi.
- **No se usa `speechSynthesis` (Web Speech API).** Antes Skelly sonaba con
  voz sintetica del navegador y el resultado no era consistente. Volvimos
  al MP3 real para que suene siempre con la misma voz (la del owner).
- **El silencio se persiste por usuario** en `localStorage`. Asi cada
  usuario decide si quiere oir a Skelly sin afectar a los demas.
- **El toggle de silencio esta en `src/lib/storage.js`** bajo la clave
  `skellyGreetingMuted.<userId>`. No confundir con la limpieza general
  de cache al cerrar sesion (esa borra casi todo menos esta preferencia).