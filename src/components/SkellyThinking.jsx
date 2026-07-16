import { useId } from "react";

const VIEW_WIDTH = 64;
const VIEW_HEIGHT = 96;
const LOOP_HEIGHT = 96;
const HELIX_AMPLITUDE = 17;
const HELIX_CENTER = VIEW_WIDTH / 2;
const RUNG_SPACING = 8;

function getHelixX(y, phaseOffset = 0) {
  const phase = (Math.PI * 2 * y) / LOOP_HEIGHT;
  return HELIX_CENTER + Math.sin(phase + phaseOffset) * HELIX_AMPLITUDE;
}

function buildStrandPath(phaseOffset = 0) {
  let path = "";

  for (let y = -LOOP_HEIGHT; y <= VIEW_HEIGHT + LOOP_HEIGHT; y += 4) {
    const x = getHelixX(y, phaseOffset);
    path += `${y === -LOOP_HEIGHT ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)} `;
  }

  return path;
}

function splitThinkingText(text) {
  const safeText = (text ?? "").trim() || "Skelly esta pensando el informe";

  // El panel actual ya envia la frase completa. Si manana reutilizamos el
  // componente con solo la cola del mensaje, evitamos duplicar "Skelly".
  if (/^skelly\b/i.test(safeText)) {
    return {
      brandLabel: safeText.slice(0, 6),
      trailingText: safeText.slice(6).trim(),
    };
  }

  return {
    brandLabel: "Skelly",
    trailingText: safeText,
  };
}

function DnaThinkingIcon({ size = 30, wrapperClassName = "" }) {
  const rawId = useId().replace(/:/g, "");
  const glowId = `skelly-dna-glow-${rawId}`;
  const maskId = `skelly-dna-mask-${rawId}`;
  const maskGradientId = `skelly-dna-mask-gradient-${rawId}`;

  const strandA = buildStrandPath(0);
  const strandB = buildStrandPath(Math.PI);
  const rungs = Array.from({ length: 42 }, (_, index) => {
    const y = -LOOP_HEIGHT + index * RUNG_SPACING;

    return {
      index,
      y,
      x1: getHelixX(y, 0),
      x2: getHelixX(y, Math.PI),
    };
  });

  return (
    <span
      className={`skelly-dna-glow relative inline-block shrink-0 ${wrapperClassName}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className="block h-full w-full"
      >
        <defs>
          <linearGradient id={glowId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#31c9d0" />
            <stop offset="45%" stopColor="#7bdff6" />
            <stop offset="100%" stopColor="#c3f6ff" />
          </linearGradient>

          <linearGradient id={maskGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="black" />
            <stop offset="16%" stopColor="white" />
            <stop offset="84%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </linearGradient>

          <mask id={maskId}>
            <rect
              x="0"
              y="0"
              width={VIEW_WIDTH}
              height={VIEW_HEIGHT}
              fill={`url(#${maskGradientId})`}
            />
          </mask>
        </defs>

        <g mask={`url(#${maskId})`}>
          <g className="skelly-dna-rotate">
            <g className="skelly-dna-rise">
              <path
                className="skelly-dna-rail skelly-dna-rail--front"
                d={strandA}
                stroke={`url(#${glowId})`}
              />

              <path
                className="skelly-dna-rail skelly-dna-rail--back"
                d={strandB}
                stroke={`url(#${glowId})`}
              />

              {rungs.map((rung) => (
                <line
                  key={rung.index}
                  className="skelly-dna-rung"
                  x1={rung.x1}
                  y1={rung.y}
                  x2={rung.x2}
                  y2={rung.y}
                  style={{ "--i": rung.index }}
                />
              ))}
            </g>
          </g>
        </g>
      </svg>
    </span>
  );
}

export default function SkellyThinking({
  text = "Skelly esta pensando el informe",
  className = "",
}) {
  const { brandLabel, trailingText } = splitThinkingText(text);

  return (
    <div
      className={[
        "relative mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 px-2 py-2 text-center sm:flex-nowrap sm:gap-3",
        className,
      ].join(" ")}
      role="status"
      aria-live="polite"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-10 inset-y-2 -z-10 rounded-full bg-[radial-gradient(circle,rgba(123,223,246,0.16)_0%,rgba(123,223,246,0.06)_42%,transparent_74%)] blur-xl"
      />

      <DnaThinkingIcon size={22} wrapperClassName="skelly-thinking-dna--lg" />

      <span className="min-w-0 text-[16px] leading-snug text-slate-300 sm:text-base sm:leading-none sm:whitespace-nowrap">
        <span className="font-display font-semibold tracking-[-0.02em] text-cyan [text-shadow:0_0_10px_rgba(123,223,246,0.32)]">
          {brandLabel}
        </span>
        {trailingText ? (
          <span className="ml-1 font-body font-medium tracking-[0.01em] text-slate-300/90">
            {trailingText}
          </span>
        ) : null}
      </span>

      <DnaThinkingIcon size={18} wrapperClassName="skelly-thinking-dna--md" />
    </div>
  );
}
