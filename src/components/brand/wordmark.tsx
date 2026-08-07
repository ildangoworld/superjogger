export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display text-pine-900 font-semibold tracking-tight ${className}`}
    >
      Super<span className="text-pine-500">Jogger</span>
    </span>
  );
}
