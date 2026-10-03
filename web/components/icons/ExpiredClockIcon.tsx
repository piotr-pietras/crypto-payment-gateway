type Props = {
  size?: number;
};

export function ExpiredClockIcon({ size = 16 }: Props) {
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
        cx="7.5"
        cy="7"
        r="6"
        stroke="var(--color-warning)"
        strokeWidth="1"
      />
      <path
        d="M7.5 4V7.25L10 8.5"
        stroke="var(--color-warning)"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3.5" fill="var(--color-warning)" />
      <path
        d="M10.75 10.75L13.25 13.25M13.25 10.75L10.75 13.25"
        stroke="white"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
