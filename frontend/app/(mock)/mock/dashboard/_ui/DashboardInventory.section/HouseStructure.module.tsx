"use client";

import { useId } from "react";
import type { Household } from "@/types/domain";
import { VIEW_BOX } from "../../_lib/dashboard-helpers";

type HouseStructureProps = {
  household: Household;
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  onRoomRename: (roomId: string, nextName: string) => void;
};

export function HouseStructure({
  household,
  selectedRoomId,
  onRoomSelect,
  onRoomRename,
}: HouseStructureProps) {
  const gridId = `him-grid-${useId().replace(/\W/g, "_")}`;

  if (household.rooms.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center text-sm text-zinc-300">
        방을 먼저 추가하면 구조도가 표시됩니다.
      </div>
    );
  }

  return (
    <>
      <svg
        viewBox={VIEW_BOX}
        className="h-80 w-full touch-none"
        role="img"
        aria-label="집 구조 2D"
      >
        <defs>
          <pattern
            id={gridId}
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgb(39 39 42)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#${gridId})`}
          opacity={0.5}
        />
        {household.rooms.map((r) => {
          const active = r.id === selectedRoomId;
          return (
            <g key={r.id}>
              <rect
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                rx={8}
                fill={active ? "rgba(45,212,191,0.25)" : "rgba(63,63,70,0.6)"}
                stroke={active ? "rgb(45,212,191)" : "rgb(82,82,91)"}
                strokeWidth={active ? 2 : 1}
                className="cursor-pointer transition-colors"
                onClick={() => onRoomSelect(r.id)}
                onDoubleClick={() => {
                  const next = window.prompt("방 이름", r.name);
                  if (next != null && next.trim())
                    onRoomRename(r.id, next.trim());
                }}
              />
              <text
                x={r.x + r.width / 2}
                y={r.y + r.height / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none fill-zinc-200 text-xs font-medium"
                style={{ fontSize: 12 }}
              >
                {r.name}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="border-t border-zinc-800 px-3 py-2 text-xs text-zinc-300">
        팁: 방을 클릭해 선택 · 더블클릭으로 이름 편집(목록과 동기)
      </p>
    </>
  );
}
