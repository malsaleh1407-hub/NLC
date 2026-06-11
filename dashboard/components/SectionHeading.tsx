/** Lightweight heading used to group blocks within a page. */
export default function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 mt-2">
      <div className="flex items-center gap-2.5">
        <span className="h-5 w-1 rounded-full bg-orange" />
        <h2 className="text-lg font-bold text-navy">{title}</h2>
      </div>
      {description && (
        <p className="mt-1 pl-3.5 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}
