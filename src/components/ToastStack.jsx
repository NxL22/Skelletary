const TONE_CLASSES = {
  info: "border-cyan/30 bg-cyan/10 text-cyan",
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-50",
  error: "border-rose/30 bg-rose/10 text-rose",
};

export default function ToastStack({ toasts = [] }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[60] flex w-[min(92vw,24rem)] flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-rise rounded-2xl border px-4 py-3 text-sm shadow-card backdrop-blur ${TONE_CLASSES[toast.tone] || TONE_CLASSES.info}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
