import type { PipelineStep } from "./types";

export default function PipelineStepCard({ step }: { step: PipelineStep }) {
  return (
    <div className="flex-1 basis-[150px] rounded-[14px] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-center gap-[9px]">
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-accent/[0.18] text-accent">
          {step.icon}
        </span>
        <span className="text-[11px] text-white/40">STEP {step.step}</span>
      </div>
      <div className="font-display mb-[3px] mt-[11px] text-[15px] font-bold text-white">
        {step.title}
      </div>
      <div className="text-xs text-white/55">{step.description}</div>
    </div>
  );
}
