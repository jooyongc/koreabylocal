import { HealthList } from "../cards";
import type { HealthCheck } from "../health";

export function HealthTab({ checks }: { checks: HealthCheck[] }) {
  const open = checks.filter((c) => c.severity === "critical" || c.severity === "warning").length;
  return (
    <div className="space-y-4">
      <p className="ga-rise text-[12.5px] text-gray-600">
        {open
          ? `${open} thing${open > 1 ? "s" : ""} to fix so the numbers mean what they say. Each comes with where to fix it.`
          : "Nothing serious skews the numbers in this period."}
      </p>
      <HealthList checks={checks} />
    </div>
  );
}
