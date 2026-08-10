export default function WorkoutDetailLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <div className="border-line bg-fog-50/90 -mx-5 border-b px-5 py-3">
        <div className="bg-fog-200 h-5 w-20 animate-pulse rounded" />
      </div>
      <div className="bg-fog-200 mt-5 h-8 w-36 animate-pulse rounded-lg" />
      <div className="bg-fog-200 mt-3 h-4 w-48 animate-pulse rounded" />
      <div className="mt-8 flex flex-col gap-4">
        <div className="bg-fog-200 h-12 w-full animate-pulse rounded-lg" />
        <div className="bg-fog-200 h-12 w-full animate-pulse rounded-lg" />
        <div className="bg-fog-200 h-12 w-full animate-pulse rounded-lg" />
      </div>
      <p className="text-muted mt-4 text-sm">불러오는 중…</p>
    </div>
  );
}
