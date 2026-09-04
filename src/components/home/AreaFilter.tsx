import { useRegions } from "@/hooks/useConcepts";
import { useSpotFilters } from "@/hooks/useSpotFilters";

export default function AreaFilter() {
  const { data: regions } = useRegions();
  const { area, setArea } = useSpotFilters();

  return (
    <div className="mx-auto max-w-[1180px] px-4 pt-[clamp(24px,3vw,36px)] sm:px-6 lg:px-8">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-2">Areas</div>
      <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <Chip label="All Korea" active={!area} onClick={() => setArea(undefined)} />
        {(regions ?? []).map((r) => (
          <Chip key={r.key} label={r.name} active={area === r.key} onClick={() => setArea(r.key)} />
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
