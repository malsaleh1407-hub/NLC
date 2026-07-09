import { getIcon } from "@/lib/icon";
import { PLATFORMS, type PlatformKey } from "@/data/mockData";

/** Inline platform identifier (colored icon + name) for table cells. */
export default function PlatformChip({
  platform,
  label,
}: {
  platform: PlatformKey;
  label?: string;
}) {
  const meta = PLATFORMS.find((p) => p.key === platform);
  const Icon = getIcon(meta?.icon ?? "Target");

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="flex h-6 w-6 items-center justify-center rounded-md text-white"
        style={{ backgroundColor: meta?.color ?? "#24285e" }}
      >
        <Icon size={13} strokeWidth={2.2} />
      </span>
      <span className="font-medium text-navy">{label ?? meta?.name}</span>
    </span>
  );
}
