import { X } from "lucide-react";

const TONE_CLASSES = {
  info: "border-cyan/30 bg-cyan/10 text-cyan",
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-50",
  error: "border-rose/30 bg-rose/10 text-rose",
};

export default function ToastStack({ toasts = [], onDismiss }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(92vw,24rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto animate-rise rounded-2xl border px-4 py-3 text-sm shadow-card backdrop-blur ${TONE_CLASSES[toast.tone] || TONE_CLASSES.info}`}
        >
          <div className="flex items-start gap-3">
            <p className="min-w-0 flex-1 leading-6">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss?.(toast.id)}
              aria-label="Cerrar notificacion"
              className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-white/10 bg-slate-950/25 text-current/75 transition hover:scale-105 hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <X size={14} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
