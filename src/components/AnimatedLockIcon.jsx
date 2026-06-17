import { Lock, Unlock } from "lucide-react";

export default function AnimatedLockIcon({ mode = "unlock", className = "h-4 w-4" }) {
  return (
    <span aria-hidden="true" data-mode={mode} className={`lock-icon-shell ${className}`}>
      <Lock className="lock-icon lock-icon-closed h-full w-full" />
      <Unlock className="lock-icon lock-icon-open h-full w-full" />
    </span>
  );
}
