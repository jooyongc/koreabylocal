import { useSpotFilters } from "@/hooks/useSpotFilters";
import { SPOT_TYPES } from "@/data/spotTypes";

export default function TypeFilter() {
  const { type, setType } = useSpotFilters();

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-3 sm:px-6 lg:px-8">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-2">Type</div>
      <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <Chip label="All" active={!type} onClick={() => setType(undefined)} />
        {SPOT_TYPES.map((t) => (
          <Chip
            key={t.value}
            label={`${t.emoji} ${t.label}`}
            active={type === t.value}
            onClick={() => setType(t.value)}
          />
        ))}
      </div>
    </div>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors ${
        active ? "bg-ink text-white" : "border border-gray-200 bg-white text-gray-600 hover:border-ink/30"
      }`}
    >
      {label}
    </button>
  );
}
