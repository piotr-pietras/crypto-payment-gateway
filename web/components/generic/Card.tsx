type Props = {
  children: React.ReactNode;
};

export default function Card({ children }: Props) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-lg border border-border-strong bg-surface p-4 shadow-lg">
      {children}
    </div>
  );
}
