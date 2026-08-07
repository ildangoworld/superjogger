export function AdminComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="animate-rise max-w-2xl">
      <h2 className="text-pine-900 text-xl font-semibold">{title}</h2>
      <p className="text-muted mt-2 text-sm leading-relaxed">{description}</p>
    </section>
  );
}
