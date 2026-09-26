type Props = {
  children: React.ReactNode;
};

export default function Card({ children }: Props) {
  return (
    <div className="flex flex-col gap-4 flex-1 bg-surface rounded-lg p-4 shadow-lg border border-border-strong">
      {children}
    </div>
  );
}
