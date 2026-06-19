import { Loader2, Inbox, AlertTriangle } from "lucide-react";

// Small colored pill used for stock status (in stock / low / out).
export function Badge({ tone = "neutral", children }) {
  const tones = {
    neutral: "bg-zinc-100 text-zinc-600",
    success: "bg-brand-50 text-brand-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-rose-50 text-rose-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

// Monospace chip for SKUs and IDs — makes codes scannable and distinct from prose.
export function CodeChip({ children }) {
  return (
    <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-600">
      {children}
    </span>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
      <Loader2 className="h-5 w-5 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({ title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="mb-3 h-8 w-8 text-zinc-300" />
      <p className="font-medium text-zinc-700">{title}</p>
      {hint && <p className="mt-1 text-sm text-zinc-500">{hint}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <AlertTriangle className="mb-3 h-8 w-8 text-amber-400" />
      <p className="font-medium text-zinc-700">Couldn't load this data</p>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 text-sm font-medium text-brand-700 hover:text-brand-800"
        >
          Try again
        </button>
      )}
    </div>
  );
}
