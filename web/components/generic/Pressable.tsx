type Props = {
  children: React.ReactNode;
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<"button">, "className">;

export function Pressable({
  children,
  className = "",
  type = "button",
  disabled,
  ...props
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`cursor-pointer touch-manipulation transition-[transform,opacity] duration-150 ease-out
      ${disabled
        ? "opacity-50 cursor-not-allowed"
        : "active:scale-[0.90] active:opacity-80"}
      ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
