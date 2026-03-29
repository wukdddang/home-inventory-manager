"use client";

import { Minus, Plus } from "lucide-react";

type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
};

export function QuantityStepper({
  value,
  min = 1,
  max = 99,
  onChange,
}: QuantityStepperProps) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex size-11 cursor-pointer items-center justify-center rounded-xl border border-zinc-700 text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus className="size-5" />
      </button>
      <span className="min-w-[2.5rem] text-center text-xl font-semibold tabular-nums text-zinc-100">
        {value}
      </span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex size-11 cursor-pointer items-center justify-center rounded-xl border border-zinc-700 text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="size-5" />
      </button>
    </div>
  );
}
