import type { StructureRoom } from "@/types/domain";

export const VIEW_BOX = "0 0 620 380";

export function newEntityId() {
  return crypto.randomUUID();
}

export function defaultRoomGrid(
  index: number,
): Omit<StructureRoom, "id" | "name"> {
  const cols = 3;
  const cellW = 160;
  const cellH = 100;
  const gap = 20;
  const baseX = 24;
  const baseY = 24;
  return {
    x: baseX + (index % cols) * (cellW + gap),
    y: baseY + Math.floor(index / cols) * (cellH + gap),
    width: cellW,
    height: cellH,
  };
}
