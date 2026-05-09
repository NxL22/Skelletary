import { Bone, SearchX } from "lucide-react";

export default function EmptyState({ title, description, query }) {
  return (
    <div className="glass-panel flex min-h-[320px] flex-col items-center justify-center rounded-[28px] px-6 py-12 text-center shadow-card">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/10 bg-white/5">
        {query ? (
          <SearchX className="h-10 w-10 text-cyan" />
        ) : (
          <Bone className="h-10 w-10 text-rose" />
        )}
      </div>
      <h3 className="font-display text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}
