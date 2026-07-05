# Prompt para Stitch - Rediseño del Asistente de Skelly

> Listo para copiar/pegar en Stitch. Adjuntar además una captura del estado
> actual del Header de Skelletary (la sección donde aparece la mascota Skelly
> arriba y debajo el modulo "Cerebro de Skelly" / Asistente de informes).

---

## PROMPT

Soy el fundador de **Skelletary**, una app web chilena para radiólogos que les
permite buscar, completar y copiar plantillas de informes radiológicos sin
fricción. El producto ya está en producción.

Necesito que me diseñes el rediseño del **módulo Asistente de Skelly**, que es
el corazón "IA" del producto. Es el módulo donde el radiólogo escribe en
lenguaje natural ("eco abdomen normal agrega: esteatosis") y recibe un
informe radiológico listo para copiar y pegar.

**Concepto importante: Skelly no es solo una mascota.** Skelly es el concepto
unificado del personaje + la IA de la app. En la UI actual, la mascota aparece
arriba (video chico con burbuja de mensaje) y debajo está el "cerebro" de
Skelly, que es el módulo Asistente. Ambas son la misma Skelly, vista desde dos
ángulos. La mascota es la cara, el cerebro es donde se hace el trabajo.

---

### OBJETIVO DEL REDISEÑO

1. **Quitar el dropdown "Plantilla base (opcional)"**: ya no aporta, el
   asistente elige la plantilla por sí solo según el input. Esto libera
   espacio vertical y reduce ruido cognitivo.

2. **Rediseñar el botón "Enviar"**: el actual es un botón ancho con texto e
   icono ("Enviar"). Se quiere un **botón flotante pequeño dentro del
   textarea**, esquina inferior derecha, solo el icono de avión de papel
   (send). Mucho más limpio, similar al patrón de Notion / ChatGPT.

3. **Centrar el panel del Asistente**: hoy está alineado a la izquierda del
   card. Se quiere centrado, con un ancho máximo razonable (no estirado de
   más en pantallas grandes).

4. **Agregar sistema de feedback al output**: cuando el Asistente entrega un
   informe, el radiólogo debe poder:
   - Decir "👍 Sirvio tal cual, guardar" (un click).
   - Decir "✏️ Lo retoque" y editar el texto en el mismo lugar (el output
     se vuelve editable), para guardar la versión final corregida. Esto
     alimenta el aprendizaje del modelo.

---

### PANTALLAS / ESTADOS A DISEÑAR (3 vistas)

Diseña las tres vistas del módulo Asistente. Cada vista debe verse
autosuficiente y clara. Usa el idioma español en todos los textos visibles.

#### ESTADO 1 - Inicial (sin output aún)

- Header del módulo: icono cerebro + label "Skelly · Redactor" + título
  "Cerebro de Skelly". A la derecha un contador discreto tipo
  "X/300 envíos libres".
- Un único campo de texto (textarea de 3-4 líneas) con placeholder:
  `Ej: "eco abdomen normal agrega: esteatosis"`.
- Contador `0/2000` en la esquina inferior izquierda del textarea.
- Botón send flotante en la esquina inferior derecha del textarea, solo
  icono (avión de papel). Estado disabled cuando el textarea está vacío.
- Sin dropdown de plantilla.
- Sin bloque de output visible (no aparece hasta que haya resultado).

#### ESTADO 2 - Con output generado (modo lectura)

- Mismos elementos del estado 1, con el textarea conteniendo lo que se
  escribió (puede estar en read-only mientras se muestra el output, o
  seguir editable, tu decides qué se ve mejor).
- Debajo aparece el bloque **"Resultado"** con:
  - Etiqueta "RESULTADO" + botón "Copiar" a la derecha.
  - Caja de texto monoespaciada con el informe generado. Texto blanco
    sobre fondo oscuro.
  - Debajo de la caja del informe: dos botones:
    - `👍 Sirvio tal cual, guardar` (botón secundario, outlined).
    - `✏️ Lo retoque y guardo versión final` (botón primario, con icono
      lápiz).
- Placeholder del output mientras se genera: skeleton o spinner discreto.

#### ESTADO 3 - Output en modo edición

- El bloque "Resultado" del estado 2 entra en modo edición.
- La caja monoespaciada se vuelve un textarea editable con el contenido
  prellenado.
- Los dos botones de feedback se reemplazan por:
  - `Cancelar` (secondary).
  - `Guardar versión final` (primary, con icono check).
- Un mensaje sutil arriba del editor: "Edita el informe. Skelly va a
  aprender de tu versión para futuros informes."

---

### ESTILO VISUAL

Referencia: el resto de la app usa **dark mode + glassmorphism + acentos
cyan/violeta**. No me cambies el lenguaje visual.

- **Fondo**: degradado oscuro (slate-950 a slate-900), con un radial
  gradient sutil cyan/violeta arriba a la derecha.
- **Card contenedor**: bordes redondeados grandes (24-28px), borde sutil
  blanco/10, sombra inset + drop shadow.
- **Acentos**: cyan (#7BDFF6 o similar) para elementos interactivos y
  focus, violeta/lavanda para highlights suaves.
- **Texto**: blanco para títulos, slate-300/400 para texto secundario,
  slate-500 para labels en mayúsculas tracked.
- **Tipografía**: una sans-serif moderna para UI (Inter o equivalente),
  monoespaciada para el output del informe.
- **Botones primary**: fondo cyan con texto oscuro.
- **Botones secondary**: fondo blanco/5 con borde blanco/10, texto slate-200.
- **Iconos**:线条 (lucide-style), 1.5-2px stroke. Iconos clave: Brain
  (header del módulo), Send (botón flotante), ThumbsUp, Pencil, Check,
  Copy, X.

**Vibe**: profesional pero con personalidad. La mascota Skelly es la única
parte "juguetona" (un personaje animado simpático pero NO infantil). El
módulo Asistente se siente como una herramienta seria, tipo ChatGPT o
Notion AI.

---

### RESTRICCIONES

- **NO uses colores brillantes saturados** fuera del acento cyan/violeta.
- **NO uses emojis** en la UI (los iconos son线条/lucide).
- **NO infantilices el módulo Asistente**. Esto es para profesionales.
- **NO agregues scroll horizontal** en ninguna de las vistas.
- **NO agregues un dropdown de plantilla**. Punto.
- **NO cambies la tipografía** drásticamente (mantén sans-serif moderna).
- **Mantén el módulo en español natural**. Cero traducciones literales.
- **El botón send flotante debe verse claramente dentro del textarea**, no
  como botón separado abajo.
- **El contador de envíos debe ser discreto**, no protagonista.

---

### LO QUE SÍ PUEDES MEJORAR LIBREMENTE

- Layout interno del header del módulo (posición del título, el contador,
  el icono).
- Estilo exacto del botón send flotante (color, tamaño, sombra).
- Cómo se ve el estado de "cargando" del output (spinner, skeleton,
  shimmer, lo que se vea más premium).
- Cómo se ve la transición de "modo lectura" a "modo edición" (puede ser
  instantánea o con una micro-animación).
- Cómo separas visualmente "esto es lo que escribí" vs "esto es lo que
  Skelly generó".
- Pequeños detalles delight (un pulso sutil en el icono cerebro cuando
  está procesando, por ejemplo).

---

### TEXTOS OBLIGATORIOS (en español)

Estos textos van tal cual en la UI, no traducir ni reformular:

- Etiqueta header: "Skelly · Redactor"
- Título header: "Cerebro de Skelly"
- Contador: "X/300 envíos libres"
- Placeholder textarea: `Ej: "eco abdomen normal agrega: esteatosis"`
- Label resultado: "RESULTADO"
- Botones feedback (estado 2): "Sirvio tal cual, guardar" y "Lo retoque y
  guardo versión final"
- Botones feedback (estado 3): "Cancelar" y "Guardar versión final"
- Mensaje modo edición: "Edita el informe. Skelly va a aprender de tu
  versión para futuros informes."

---

### OUTPUT ESPERADO

Entrégame:

1. **Mockup en alta resolución** de las 3 vistas (estado 1, 2 y 3).
2. **Vista desktop** (1440px o similar) y **vista mobile** (375px) de al
   menos el estado 1 y el estado 2.
3. Si puedes, una **vista de los 3 estados lado a lado** para comparar el
   flujo completo.
4. Especificación breve de cada componente interactivo (botones,
   textarea, feedback) con sus estados (default, hover, focus, disabled).

---

## NOTAS PARA MÍ

- Voy a implementar todo esto en React + Tailwind + lucide-react. El
  estado dark/glass ya está en el resto de la app, mantén consistencia.
- Los iconos específicos que usa el código hoy (puedes mantenerlos o
  proponer equivalentes): Brain, Send, Sparkles, ThumbsUp, Pencil, Check,
  Copy, X.
- La mascota Skelly está arriba del módulo y NO se toca en este
  rediseño. Solo el módulo Asistente debajo.
- Cuando el output se está generando, debe haber feedback visual claro
  (skeleton, shimmer, spinner). El usuario no puede quedar mirando un
  espacio en blanco durante 10 segundos.