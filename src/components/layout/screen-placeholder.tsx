export function ScreenPlaceholder({
  title,
  description,
  phase,
}: {
  title: string;
  description: string;
  phase: string;
}) {
  return (
    <section className="animate-rise flex flex-col pt-10">
      <h1 className="font-display text-pine-900 text-2xl font-semibold">
        {title}
      </h1>
      <p className="text-muted mt-3 max-w-sm leading-7">{description}</p>
      <div className="pace-line mt-10 w-full max-w-45" />
      <p className="text-fog-500 mt-4 text-xs font-medium tracking-wide">
        {phase}에서 구현될 화면이에요.
      </p>
    </section>
  );
}
