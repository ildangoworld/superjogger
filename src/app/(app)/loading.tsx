export default function AppLoading() {
  return (
    <div className="pt-6" aria-busy="true" aria-live="polite">
      <div className="bg-fog-200 h-8 w-28 animate-pulse rounded-lg" />
      <div className="mt-6 flex flex-col gap-3">
        <div className="bg-fog-200 h-24 w-full animate-pulse rounded-xl" />
        <div className="bg-fog-200 h-24 w-full animate-pulse rounded-xl" />
        <div className="bg-fog-200 h-24 w-full animate-pulse rounded-xl" />
      </div>
      <p className="text-muted mt-4 text-sm">불러오는 중…</p>
    </div>
  );
}
