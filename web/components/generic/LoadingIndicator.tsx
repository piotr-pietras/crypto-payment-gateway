type Props = {
  size?: number;
  thickness?: number;
  label?: string;
} & Omit<React.ComponentPropsWithoutRef<"span">, "children" | "className">;

export default function LoadingIndicator({
  size = 40,
  thickness = 3.6,
  label = "Loading…",
  ...props
}: Props) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <span
      role="status"
      aria-label={label}
      className="inline-flex"
      {...props}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        className="animate-spin"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
        />
      </svg>
    </span>
  );
}
