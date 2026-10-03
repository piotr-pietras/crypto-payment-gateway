interface Props {
  type?: "horizontal" | "vertical";
  className?: string;
}
export function Divider({ type = "horizontal", className }: Props) {
  if (type === "horizontal") {
    return <div className={`w-full h-[1px] bg-border my-4 ${className}`} />;
  }

  return <div className={`h-12 w-px bg-warning-border ${className}`} />;
}
