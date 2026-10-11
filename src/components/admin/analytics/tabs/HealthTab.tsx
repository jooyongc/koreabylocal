import { HealthList } from "../cards";
import type { HealthCheck } from "../health";

export function HealthTab({ checks }: { checks: HealthCheck[] }) {
  const open = checks.filter((c) => c.severity === "critical" || c.severity === "warning").length;
  return (
    <div className="space-y-4">
      <p className="ga-rise text-[12.5px] text-gray-600">
        {open
          ? `숫자를 정확하게 보려면 살펴볼 것이 ${open}가지 있습니다. 항목마다 원인과 고치는 방법을 적어 두었습니다.`
          : "이 기간에는 숫자를 크게 왜곡하는 문제가 없습니다."}
      </p>
      <HealthList checks={checks} />
    </div>
  );
}
