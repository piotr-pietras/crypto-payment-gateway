type Props = {
  size?: number;
};

export function SuccessCheckIcon({ size = 16 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle
        cx="8"
        cy="8"
        r="7.5"
        stroke="var(--color-success)"
        strokeWidth="1"
      />
      <path
        d="M4 8.25L6.65 11L12 5"
        stroke="var(--color-success)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
