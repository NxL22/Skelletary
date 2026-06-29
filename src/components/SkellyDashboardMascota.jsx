// SkellyDashboardMascota
// =========================
// Skelly es la mascota asistente del dashboard. Al iniciar sesion:
//   1. Reproduce una nota de voz (MP3) elegida por el selector semanal.
//   2. Muestra una burbuja de comic que se escribe sincronizada con el audio.
//   3. La burbuja crece sola para amoldarse a cualquier longitud de texto.
//
// Toda la complejidad del calculo de tamano vive en `SkellySpeechBubble`:
// usa la tecnica del "span fantasma invisible" (mide el texto fuera de pantalla
// y aplica las mismas medidas a la burbuja visible). Asi no necesitamos
// limites magicos de max-w ni padding adivinando.
//
// Detalle clave: el tipeo de la burbuja usa un `useRef` para guardar el
// id del `setInterval`, asi evitamos que en modo desarrollo (StrictMode)
// o por re-renders del padre se acumulen intervals en paralelo que
// terminen escribiendo el texto mas de una vez.

import { Bone, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { obtenerMensajeSemanal, obtenerMensajeFallback } from "../lib/skellyMensajes";
import { getPublicAssetPath } from "../lib/publicAssets";
import { loadSkellyGreetingMuted, saveSkellyGreetingMuted } from "../lib/storage";

// Antes de lanzar la animacion de Skelly esperamos a que el dashboard
// termine de pintar. Asi la entrada se siente organica y no compite
// con la primera carga de la biblioteca.
const INTRO_DELAY_MS = 3000;

// Tiempo que la burbuja permanece visible despues de terminar de escribir.
// 3 segundos es suficiente para leer el mensaje sin sentirse apurado.
const BUBBLE_HOLD_MS = 3000;

// Tamano del contenedor donde vive Skelly. Ajustado para que el video
// del saludo ocupe todo el ancho sin recortes feos.
const SKELLY_FRAME_RATIO = "aspect-[904/902]";

// Estilos comunes al video y al gif: ambos comparten posicion para que
// el cross-fade entre ellos durante el saludo se vea limpio.
const SKELLY_MEDIA_FRAME_CLASS = "absolute inset-0 z-10 overflow-hidden bg-transparent";

// El video se estira un poco mas que el contenedor y se sube algunos pixeles
// para que el cuerpo de Skelly cubra todo el area visible y el fondo blanco
// del video no se vea como una linea debajo. El translate-y es modesto a
// proposito: si fuera agresivo, la coleta rosada se veia "picada".
const SKELLY_MEDIA_CLASS =
  "absolute left-1/2 top-0 h-[calc(100%+40px)] min-w-full w-auto -translate-x-1/2 -translate-y-[22px] object-cover object-center drop-shadow-[0_24px_35px_rgba(85,120,155,0.35)] transition-opacity duration-300 sm:h-[calc(100%+46px)] sm:-translate-y-[26px] lg:h-[calc(100%+52px)] lg:-translate-y-[30px]";

// Centralizamos las rutas multimedia para que el dashboard no dependa de
// strings sueltos. Si alguna cambia, Skelly sigue teniendo un solo lugar de ajuste.
const SKELLY_IDLE_GIF = getPublicAssetPath("video de skelly/skelly_normal.gif");
const SKELLY_SPEAKING_VIDEO = getPublicAssetPath("video de skelly/skelly_habla.mp4");

// Padding interno de la burbuja. Lo sumamos al tamano del texto medido
// para que el contenido no quede pegado al borde.
const BUBBLE_PADDING_X = 32; // px a cada lado en total
const BUBBLE_PADDING_Y = 28;

// Ancho maximo razonable de la burbuja. Aunque crezca con el texto,
// no la dejamos invadir todo el ancho del panel.
const BUBBLE_MAX_WIDTH = 360;

// Estilos compartidos del texto visible y del span fantasma.
// Es CRITICO que coincidan exactamente: si el span mide con otra fuente
// o tamano, la burbuja queda mal calibrada.
const BUBBLE_TEXT_CLASS =
  "text-[14px] font-semibold leading-[1.42] tracking-tight sm:text-[15px] lg:text-[16px]";

function stopMedia(mediaElement) {
  if (!mediaElement) {
    return;
  }
  mediaElement.pause();
  try {
    mediaElement.currentTime = 0;
  } catch {
    // Algunos navegadores no dejan cambiar currentTime antes de cargar metadata.
  }
}

/**
 * Fallback visual cuando falta el video o el gif de Skelly.
 * No deberia verse en produccion, pero queda como red de seguridad
 * para que la UI nunca quede rota ni vacia.
 */
function MissingSkellyMedia() {
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-[24px] border border-dashed border-cyan/20 bg-[linear-gradient(180deg,#f6fbff,#dfe9f4)] px-6 py-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-rose/20 bg-rose/10">
        <Bone className="h-8 w-8 text-rose" />
      </div>
      <p className="font-display text-lg font-semibold text-slate-900">Skelly lista para copiar</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Revisa los archivos en <span className="font-mono text-cyan">/public/video de skelly</span>.
      </p>
    </div>
  );
}

/**
 * Burbuja de comic que se "escribe" progresivamente y crece con el texto.
 *
 * Tecnica:
 *   - Hay un <span> fantasma invisible con los mismos estilos que el texto visible.
 *   - Cada vez que cambia el texto tipeado, medimos ese span y aplicamos
 *     su ancho/alto al contenedor de la burbuja, mas un padding fijo.
 *   - Asi la burbuja se adapta a cualquier longitud sin max-w arbitrarios.
 *
 * Nota tecnica: el `setInterval` del tipeo se guarda en un `useRef` para
 * que cualquier cleanup (incluso el de StrictMode en desarrollo) pueda
 * limpiarlo de forma sincronizada y no queden dos intervals escribiendo
 * el mismo texto en paralelo.
 */
function SkellySpeechBubble({ message, revealKey = 0, holdMs = BUBBLE_HOLD_MS, onHoldEnd }) {
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const [boxSize, setBoxSize] = useState({ width: 0, height: 0 });
  const measureRef = useRef(null);
  const hideTimeoutRef = useRef(null);
  const typingIntervalRef = useRef(null);

  // Callbacks memoizados: el `onHoldEnd` cambia de referencia en cada
  // render si no lo memoizamos, lo que haria que el useEffect de tipeo
  // se reinicie y vuelva a escribir el texto. Con useCallback garantizamos
  // que la funcion tenga una identidad estable mientras no cambien sus deps.
  const stableOnHoldEnd = useCallback(() => {
    onHoldEnd?.();
  }, [onHoldEnd]);

  // Efecto principal: tipea el mensaje UNA sola vez.
  // El tiempo de espera para ocultar la burbuja se maneja aparte para que
  // empiece a contar cuando termina realmente el tipeo, no al montar.
  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    // Limpieza preventiva: si por algun motivo quedo un interval activo
    // (StrictMode, doble render, etc.) lo frenamos antes de empezar.
    if (typingIntervalRef.current) {
      window.clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    setTyped("");
    setDone(false);

    if (prefersReducedMotion) {
      // Para usuarios con reduced-motion, mostramos el texto de golpe.
      setTyped(message);
      setDone(true);
    } else {
      // Escritura progresiva: revelamos 1 caracter cada 30 ms.
      // Guardamos el id en un ref para poder limpiarlo de forma sincronizada.
      let index = 0;
      typingIntervalRef.current = window.setInterval(() => {
        index += 1;
        setTyped(message.slice(0, index));

        if (index >= message.length) {
          if (typingIntervalRef.current) {
            window.clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          setDone(true);
        }
      }, 30);
    }

    return () => {
      // Cleanup sincronizado: frenamos interval y timeout en el mismo lugar
      // para que no quede nada vivo entre renders.
      if (typingIntervalRef.current) {
        window.clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [message, revealKey]);

  useEffect(() => {
    if (!done) {
      return undefined;
    }

    // Recién cuando el texto terminó de escribirse damos la ventana extra
    // de lectura. Así los 3 segundos completos se respetan siempre.
    hideTimeoutRef.current = window.setTimeout(() => {
      hideTimeoutRef.current = null;
      stableOnHoldEnd();
    }, holdMs);

    return () => {
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, [done, holdMs, stableOnHoldEnd]);

  // Cada vez que el texto tipeado cambia, recalculamos el tamano
  // midiendo el span fantasma. Asi la burbuja crece en tiempo real.
  useEffect(() => {
    if (!measureRef.current) {
      return;
    }
    const rect = measureRef.current.getBoundingClientRect();
    setBoxSize({
      width: Math.min(BUBBLE_MAX_WIDTH - BUBBLE_PADDING_X, Math.ceil(rect.width)),
      height: Math.ceil(rect.height),
    });
  }, [typed, message]);

  // Si el mensaje es muy corto, forzamos un ancho minimo razonable
  // para que la burbuja no quede aplastada.
  const minWidth = Math.min(BUBBLE_MAX_WIDTH, 180);

  return (
    <div className="skelly-bubble pointer-events-none absolute left-1 right-1 top-1 z-30 flex justify-start font-comic sm:left-1 sm:right-1 lg:left-1 lg:right-1">
      <div
        className="relative"
        style={{
          width: boxSize.width
            ? Math.max(minWidth, boxSize.width + BUBBLE_PADDING_X)
            : minWidth + BUBBLE_PADDING_X,
          minHeight: boxSize.height ? boxSize.height + BUBBLE_PADDING_Y : undefined,
        }}
      >
        {/* Span fantasma: existe solo para medir el texto que vamos a mostrar. */}
        <span
          ref={measureRef}
          aria-hidden="true"
          className={`pointer-events-none invisible absolute left-0 top-0 whitespace-pre-wrap ${BUBBLE_TEXT_CLASS}`}
          style={{ width: `${BUBBLE_MAX_WIDTH - BUBBLE_PADDING_X}px` }}
        >
          {typed || " "}
        </span>

        {/* Halo suave detras de la burbuja para que se lea como comic. */}
        <div
          aria-hidden="true"
          className="absolute -inset-2 -z-10 rounded-[2rem] bg-gradient-to-br from-fuchsia-400/45 via-cyan/30 to-transparent blur-lg"
        />

        <div className="relative rounded-[1.75rem] border-[3px] border-slate-900 bg-[#fdfcff] px-4 pb-3.5 pt-3 shadow-[4px_5px_0_0_rgba(15,23,42,0.92)] sm:px-5 sm:pb-4">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-3 top-1.5 h-1/3 rounded-[1.4rem] bg-gradient-to-b from-white to-transparent opacity-80"
          />

          <div className="relative flex items-center gap-2">
            <span className="skelly-sparkle flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-900 bg-gradient-to-br from-fuchsia-500 to-cyan text-white shadow-[1px_1.5px_0_0_rgba(15,23,42,0.9)]">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.75} />
            </span>
            <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-fuchsia-600">
              Skelly
            </span>
          </div>

          <span className="sr-only">{message}</span>
          <p
            aria-hidden="true"
            className={`relative mt-2 text-pretty text-slate-900 ${BUBBLE_TEXT_CLASS}`}
          >
            {typed}
            <span
              aria-hidden="true"
              className={`ml-0.5 inline-block h-[1.05em] w-[3px] translate-y-[3px] rounded-full bg-fuchsia-500 align-middle ${
                done ? "opacity-0" : "animate-pulse opacity-100"
              }`}
            />
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente principal de Skelly en el dashboard.
 *
 * Flujo:
 *   1. Pide el mensaje al selector semanal (obtenerMensajeSemanal).
 *   2. Carga el MP3 correspondiente y lo reproduce.
 *   3. Muestra la burbuja con tipeo sincronizado.
 *   4. Si el audio falla, muestra la burbuja con tipeo normal sin audio.
 *   5. Respeta el toggle de silencio: si esta activo, no reproduce nada.
 */
export default function SkellyDashboardMascota({ introToken = 0, userId = null }) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const lastPlayedIntroTokenRef = useRef(0);
  const [mediaMissing, setMediaMissing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Mensaje seleccionado por el selector. Vive como estado para que
  // futuros cambios (carga asincrona de catalogo, etc.) sean simples.
  const [mensaje, setMensaje] = useState(() => obtenerMensajeFallback());

  useEffect(() => {
    setIsMuted(loadSkellyGreetingMuted(userId));
  }, [userId]);

  // Si el usuario silencia a Skelly, paramos cualquier audio y ocultamos la burbuja.
  useEffect(() => {
    if (!isMuted) {
      return;
    }
    stopMedia(audioRef.current);
    setShowSpeechBubble(false);
    setIsSpeaking(false);
  }, [isMuted]);

  // Limpieza al desmontar el componente.
  useEffect(() => {
    return () => {
      stopMedia(audioRef.current);
      stopMedia(videoRef.current);
      setShowSpeechBubble(false);
      setIsSpeaking(false);
    };
  }, []);

  // Cada vez que el dashboard nos dispara un nuevo introToken,
  // esperamos INTRO_DELAY_MS y luego lanzamos el saludo.
  useEffect(() => {
    if (!introToken || mediaMissing || lastPlayedIntroTokenRef.current === introToken) {
      return undefined;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (cancelled) {
        return;
      }

      // Pedimos el mensaje al selector en el momento del saludo
      // (asi si en el futuro el catalogo es dinamico, tomamos el mas fresco).
      const mensajeElegido = obtenerMensajeSemanal() ?? obtenerMensajeFallback();
      if (!mensajeElegido) {
        return;
      }

      lastPlayedIntroTokenRef.current = introToken;
      setMensaje(mensajeElegido);

      const video = videoRef.current;
      const audio = audioRef.current;

      if (audio) {
        audio.src = getPublicAssetPath(mensajeElegido.audio);
      }

      setIsSpeaking(true);
      setShowSpeechBubble(!isMuted);

      const videoPlay = video?.play?.();
      if (videoPlay?.catch) {
        videoPlay.catch(() => {
          setIsSpeaking(false);
        });
      }

      // Si el usuario no esta silenciado, intentamos reproducir el MP3.
      if (!isMuted && audio) {
        const audioPlay = audio.play();
        if (audioPlay?.catch) {
          audioPlay.catch(() => {
            // Si el navegador bloquea la reproduccion (autoplay policy),
            // dejamos la burbuja visible sin audio. No rompemos nada.
          });
        }
      }
    }, INTRO_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [introToken, isMuted, mediaMissing]);

  // Memoizamos los handlers para que mantengan identidad estable entre renders.
  // Si no los memoizamos, cada re-render del padre crea referencias nuevas y
  // dispara el useEffect del tipeo en la burbuja, causando un loop de renders
  // que termina con "Maximum update depth exceeded" y la app se queda en blanco.
  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    saveSkellyGreetingMuted(userId, nextMuted);
  }, [isMuted, userId]);

  const handleBubbleHoldEnd = useCallback(() => {
    setShowSpeechBubble(false);
    setIsSpeaking(false);
    stopMedia(videoRef.current);
    stopMedia(audioRef.current);
  }, []);

  const handleAudioEnded = useCallback(() => {
    // Cuando el MP3 termina, dejamos que la burbuja siga visible un momento
    // (lo decide `holdMs` dentro del componente de la burbuja).
    setIsSpeaking(false);
  }, []);

  if (mediaMissing) {
    return <MissingSkellyMedia />;
  }

  return (
    <div
      className={`relative mx-auto flex h-[340px] max-w-full items-end overflow-hidden rounded-[28px] ${SKELLY_FRAME_RATIO} sm:h-[360px] lg:h-[400px] 2xl:h-[420px]`}
    >
      {showSpeechBubble && mensaje ? (
        <SkellySpeechBubble
          message={mensaje.texto}
          revealKey={introToken}
          onHoldEnd={handleBubbleHoldEnd}
        />
      ) : null}

      <button
        type="button"
        onClick={handleToggleMute}
        aria-pressed={isMuted}
        aria-label={isMuted ? "Activar voz de Skelly" : "Silenciar voz de Skelly"}
        title={isMuted ? "Activar voz de Skelly" : "Silenciar voz de Skelly"}
        className="absolute bottom-[3px] left-[10px] z-30 inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-900 bg-[#fdfcff] text-slate-800 shadow-[2px_2.5px_0_0_rgba(15,23,42,0.92)] transition hover:-translate-y-px hover:bg-fuchsia-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/70 active:translate-y-0 active:shadow-none sm:bottom-[7px] sm:left-[14px] lg:bottom-[11px] lg:left-[18px]"
      >
        {isMuted ? <VolumeX className="h-[18px] w-[18px]" /> : <Volume2 className="h-[18px] w-[18px]" />}
      </button>

      <div className={SKELLY_MEDIA_FRAME_CLASS}>
        <img
          src={SKELLY_IDLE_GIF}
          alt="Skelly parpadeando en el dashboard"
          className={`${SKELLY_MEDIA_CLASS} ${isSpeaking ? "opacity-0" : "opacity-100"}`}
          onError={() => setMediaMissing(true)}
        />

        <video
          ref={videoRef}
          src={SKELLY_SPEAKING_VIDEO}
          className={`${SKELLY_MEDIA_CLASS} ${isSpeaking ? "opacity-100" : "opacity-0"}`}
          muted
          playsInline
          preload="auto"
          onEnded={handleAudioEnded}
          onError={() => setMediaMissing(true)}
        />
      </div>

      <audio ref={audioRef} preload="auto" onEnded={handleAudioEnded} />
    </div>
  );
}
