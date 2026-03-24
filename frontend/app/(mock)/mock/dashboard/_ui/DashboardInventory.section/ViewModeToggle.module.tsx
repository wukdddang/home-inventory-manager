"use client";

export type ViewMode = "structure" | "spreadsheet";

type ViewModeToggleProps = {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: ViewModeToggleProps) {
  return (
    <div className="inline-flex rounded-xl border border-zinc-700 bg-zinc-950 p-1">
      <button
        type="button"
        onClick={() => onViewModeChange("structure")}
        className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition ${
          viewMode === "structure"
            ? "bg-teal-500 text-zinc-950"
            : "text-zinc-300 hover:text-white"
        }`}
      >
        집 구조
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange("spreadsheet")}
        className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition ${
          viewMode === "spreadsheet"
            ? "bg-teal-500 text-zinc-950"
            : "text-zinc-300 hover:text-white"
        }`}
      >
        물품 목록 (표)
      </button>
    </div>
  );
}
