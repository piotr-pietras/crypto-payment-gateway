import LoadingIndicator from "./LoadingIndicator";

type Variant = "primary" | "ghost";

type Props = {
  variant?: Variant;
  icon?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<"button">, "className">;

const variantClasses: Record<Variant, string> = {
  primary: "rounded-lg bg-text-primary px-5 py-3 text-body text-surface",
  ghost: "text-body text-text-secondary",
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
        : "active:scale-[0.97] active:opacity-80"}
      `}
      {...props}
    >
      {loading ? <LoadingIndicator size={16} thickness={2} /> : icon}
      {children}
    </button>
  );
}
