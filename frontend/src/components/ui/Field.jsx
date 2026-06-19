// A labeled field that shows a validation error underneath. `error` is a
// string or null. The red ring only appears when there's an error, so the
// form reads calm until something is actually wrong.
export function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-zinc-700">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

export function Input({ error, className = "", ...props }) {
  return (
    <input
      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 ${
        error
          ? "border-rose-300 focus:ring-rose-400"
          : "border-zinc-300 focus:border-brand-600 focus:ring-brand-600"
      } ${className}`}
      {...props}
    />
  );
}

export function Select({ error, className = "", children, ...props }) {
  return (
    <select
      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 ${
        error
          ? "border-rose-300 focus:ring-rose-400"
          : "border-zinc-300 focus:border-brand-600 focus:ring-brand-600"
      } ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
