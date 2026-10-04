import LoadingIndicator from "./LoadingIndicator";

type Variant = "primary" | "secondary" | "ghost" | "soft";

type Props = {
  variant?: Variant;
  icon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<"button">, "className">;

const variantClasses: Record<Variant, string> = {
  primary:
    "w-full rounded-lg bg-text-primary px-5 py-3 text-body text-surface",
  secondary:
    "w-full rounded-lg border border-border-strong bg-surface px-5 py-3 text-body text-text-secondary",
  ghost: "text-body text-text-secondary",
  soft: "w-full rounded-xl bg-background px-5 py-3 text-caption font-bold text-text-primary shadow-md",
};

export default function Button({
  variant = "primary",
  icon,
  loading = false,
  children,
  type = "button",
  disabled,
  ...props
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 cursor-pointer
      touch-manipulation transition-[transform,opacity] duration-150 ease-out
      ${variantClasses[variant]} 
      ${loading || disabled
        ? "opacity-50 cursor-not-allowed"
        : "active:scale-[0.95] active:opacity-80"}
      `}
      {...props}
    >
      {loading ? <LoadingIndicator size={16} thickness={2} /> : icon}
      {children}
    </button>
  );
}
