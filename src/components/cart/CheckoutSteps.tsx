import { Check } from "lucide-react";

interface CheckoutStepsProps {
  /** 1 = Cart, 2 = Details & payment, 3 = Confirmation */
  current?: number;
}

const STEPS = ["Cart", "Details & payment", "Confirmation"] as const;

/**
 * Purely presentational 3-step progress indicator for the checkout flow.
 * Cart -> Details & payment -> Confirmation.
 */
export default function CheckoutSteps({ current = 2 }: CheckoutStepsProps) {
  return (
    <ol className="flex flex-wrap items-center gap-2.5" aria-label="Checkout progress">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <li key={label} className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-bold",
                  done
                    ? "bg-green text-white"
                    : active
                      ? "bg-accent text-white"
                      : "bg-ink/10 text-muted-2",
                ].join(" ")}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : step}
              </span>
              <span
                className={[
                  "text-[13.5px] font-bold",
                  done || active ? "text-ink" : "font-semibold text-muted-2",
                ].join(" ")}
                aria-current={active ? "step" : undefined}
              >
                {label}
              </span>
            </div>
            {step < STEPS.length && (
              <span
                aria-hidden="true"
                className={[
                  "h-0.5 w-8 shrink-0 sm:w-10",
                  done ? "bg-green" : "bg-ink/15",
                ].join(" ")}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
