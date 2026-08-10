import { BackButton } from "@/components/layout/back-button";

export function StickyBackBar({
  fallbackHref,
  label,
}: {
  fallbackHref: string;
  label?: string;
}) {
  return (
    <div className="border-line bg-fog-50/90 sticky top-0 z-10 -mx-5 border-b px-5 py-3 backdrop-blur-sm">
      <BackButton fallbackHref={fallbackHref} label={label} />
    </div>
  );
}
