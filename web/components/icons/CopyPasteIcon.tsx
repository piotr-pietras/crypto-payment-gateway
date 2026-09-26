type Props = {
  size?: number;
};

export function CopyPasteIcon({ size = 16 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 16 16`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x="5.5"
        y="5.5"
        width="7"
        height="8"
        rx="1.25"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M3.5 10.5V4.25C3.5 3.56 4.06 3 4.75 3H10"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}
