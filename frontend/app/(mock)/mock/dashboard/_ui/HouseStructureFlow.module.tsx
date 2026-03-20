"use client";

import { PromptModal } from "@/app/_ui/prompt-modal";
import type { Household } from "@/types/domain";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { memo, useCallback, useEffect, useState } from "react";

type StructureDiagramSlot = { id: string; name: string };

type StructureDiagramFurniture = {
  id: string;
  label: string;
  slots: StructureDiagramSlot[];
};

type RoomNodeData = {
  label: string;
  active: boolean;
  directSlots: StructureDiagramSlot[];
  furnitures: StructureDiagramFurniture[];
};

const RoomNode = memo(function RoomNode({ data }: NodeProps<Node<RoomNodeData>>) {
  const hasInner =
    data.directSlots.length > 0 || data.furnitures.length > 0;

  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden rounded-lg border-2 text-left ${
        data.active
          ? "border-teal-400 bg-teal-500/20 text-teal-50"
          : "border-zinc-600 bg-zinc-800/85 text-zinc-200"
      }`}
    >
      <div className="shrink-0 border-b border-zinc-600/40 px-1 py-0.5 text-center text-[11px] font-semibold leading-tight tracking-tight">
        <span className="line-clamp-2">{data.label}</span>
      </div>
      <div
        className={`nodrag nopan min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-1 ${
          hasInner ? "" : "flex items-center justify-center"
        }`}
      >
        {hasInner ? (
          <div className="space-y-1.5">
            {data.directSlots.length > 0 ? (
              <div>
                <p className="mb-0.5 text-[8px] font-semibold uppercase tracking-wide text-zinc-500">
                  방 직속
                </p>
                <ul className="space-y-0.5">
                  {data.directSlots.map((s) => (
                    <li
                      key={s.id}
                      className="truncate rounded border border-zinc-600/50 bg-zinc-950/60 px-1 py-px text-[9px] text-zinc-300"
                      title={s.name}
                    >
                      {s.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {data.furnitures.map((fp) => (
              <div
                key={fp.id}
                className="rounded border border-teal-600/25 bg-zinc-950/35 pl-1.5 pr-0.5 pt-0.5 pb-1"
              >
                <p
                  className="truncate text-[9px] font-semibold text-teal-200/95"
                  title={fp.label}
                >
                  가구 · {fp.label}
                </p>
                {fp.slots.length > 0 ? (
                  <ul className="mt-0.5 space-y-0.5 border-l border-teal-500/20 pl-1.5">
                    {fp.slots.map((s) => (
                      <li
                        key={s.id}
                        className="truncate text-[8px] text-zinc-400"
                        title={s.name}
                      >
                        {s.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-0.5 pl-0.5 text-[8px] text-zinc-600">
                    보관 칸 없음
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="px-1 text-center text-[8px] leading-snug text-zinc-500">
            가구·보관
            <br />
            미등록
          </p>
        )}
      </div>
    </div>
  );
});

const nodeTypes = { room: RoomNode } satisfies NodeTypes;

function roomsToNodes(
  household: Household,
  selectedRoomId: string | null,
): Node<RoomNodeData>[] {
  const placements = household.furniturePlacements ?? [];
  const storage = household.storageLocations ?? [];

  return household.rooms.map((r) => {
    const directSlots = storage
      .filter(
        (s) =>
          s.roomId === r.id &&
          (s.furniturePlacementId == null || s.furniturePlacementId === ""),
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((s) => ({ id: s.id, name: s.name }));

    const furnitures: StructureDiagramFurniture[] = placements
      .filter((f) => f.roomId === r.id)
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          a.label.localeCompare(b.label, "ko"),
      )
      .map((fp) => ({
        id: fp.id,
        label: fp.label,
        slots: storage
          .filter((s) => s.furniturePlacementId === fp.id)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((s) => ({ id: s.id, name: s.name })),
      }));

    return {
      id: r.id,
      type: "room",
      position: { x: r.x, y: r.y },
      data: {
        label: r.name,
        active: r.id === selectedRoomId,
        directSlots,
        furnitures,
      },
      style: { width: r.width, height: r.height },
      draggable: true,
      selectable: true,
    };
  });
}

export type HouseStructureFlowProps = {
  household: Household;
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  onRoomRename: (roomId: string, nextName: string) => void;
  onRoomPositionChange: (roomId: string, x: number, y: number) => void;
};

function HouseStructureFlowInner({
  household,
  selectedRoomId,
  onRoomSelect,
  onRoomRename,
  onRoomPositionChange,
}: HouseStructureFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<RoomNodeData>>(
    [],
  );
  const [rename, setRename] = useState<{ id: string; name: string } | null>(
    null,
  );

  useEffect(() => {
    setNodes(roomsToNodes(household, selectedRoomId));
  }, [household, selectedRoomId, setNodes]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<RoomNodeData>) => {
      onRoomSelect(node.id);
    },
    [onRoomSelect],
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node<RoomNodeData>) => {
      onRoomPositionChange(
        node.id,
        Math.round(node.position.x),
        Math.round(node.position.y),
      );
    },
    [onRoomPositionChange],
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node<RoomNodeData>) => {
      const room = household.rooms.find((r) => r.id === node.id);
      if (room) setRename({ id: room.id, name: room.name });
    },
    [household.rooms],
  );

  if (household.rooms.length === 0) {
    return (
      <div className="flex min-h-80 flex-1 items-center justify-center text-sm text-zinc-500">
        방을 먼저 추가하면 구조도가 표시됩니다.
      </div>
    );
  }

  return (
    <>
      {/*
        isolate + overflow-hidden: React Flow 내부 레이어가 인접 컬럼으로 퍼져
        포인터/스크롤을 가로채는 경우 방지
      */}
      <div className="relative z-0 isolate min-h-[min(60vh,520px)] w-full min-w-0 flex-1 overflow-hidden [&_.react-flow]:h-full [&_.react-flow]:min-h-[min(60vh,520px)]">
        <ReactFlow
          nodes={nodes}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          nodesConnectable={false}
          panOnScroll
          zoomOnScroll
          minZoom={0.35}
          maxZoom={1.6}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          fitView
          className="rounded-lg bg-zinc-950"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Lines}
            gap={20}
            size={1}
            color="rgb(39 39 42)"
          />
          <Controls
            className="[&_button]:border-zinc-600! [&_button]:bg-zinc-800! [&_button]:text-zinc-200! [&_button]:hover:bg-zinc-700!"
            showInteractive={false}
          />
          <MiniMap
            className="rounded-md! border-zinc-700! bg-zinc-900/95!"
            maskColor="rgba(0,0,0,0.45)"
            nodeStrokeWidth={2}
            nodeColor={(n) =>
              (n.data as RoomNodeData | undefined)?.active
                ? "rgb(45,212,191)"
                : "rgb(82,82,91)"
            }
          />
        </ReactFlow>
      </div>
      <PromptModal
        open={rename !== null}
        onOpenChange={(o) => {
          if (!o) setRename(null);
        }}
        title="방 이름"
        description="구조도와 목록에 동시에 반영됩니다."
        label="방 이름"
        defaultValue={rename?.name ?? ""}
        onSubmit={(next) => {
          if (rename) onRoomRename(rename.id, next);
        }}
      />
      <p className="border-t border-zinc-800 px-1 py-2 text-[11px] text-zinc-500">
        팁: 드래그로 방 이동 · 클릭해 선택 · 더블클릭으로 방 이름 편집 · 각 방
        안에 방 직속 보관 칸·가구·가구 아래 칸이 표시됩니다(내부는 스크롤,
        방은 제목 줄에서 드래그).
      </p>
    </>
  );
}

export function HouseStructureFlow(props: HouseStructureFlowProps) {
  return (
    <ReactFlowProvider>
      <HouseStructureFlowInner {...props} />
    </ReactFlowProvider>
  );
}
