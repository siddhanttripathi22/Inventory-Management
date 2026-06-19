import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-brand-700 text-white shadow-sm hover:bg-brand-800 focus-visible:ring-brand-600",

  secondary:
    "bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-50 focus-visible:ring-zinc-400",

  danger:
    "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500",

  ghost:
    "text-zinc-600 hover:bg-zinc-100 focus-visible:ring-zinc-400",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  children,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-medium
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
        disabled:cursor-not-allowed disabled:opacity-50
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}