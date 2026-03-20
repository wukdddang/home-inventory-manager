"use client";

import { PromptModal } from "@/app/_ui/prompt-modal";
import type { Household, StructureRoom } from "@/types/domain";
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

type RoomNodeData = { label: string; active: boolean };

const RoomNode = memo(function RoomNode({ data }: NodeProps<Node<RoomNodeData>>) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center rounded-lg border-2 px-2 text-center text-xs font-medium leading-tight ${
        data.active
          ? "border-teal-400 bg-teal-500/25 text-teal-50"
          : "border-zinc-600 bg-zinc-800/80 text-zinc-200"
      }`}
    >
      {data.label}
    </div>
  );
});

const nodeTypes = { room: RoomNode } satisfies NodeTypes;

function roomsToNodes(
  rooms: StructureRoom[],
  selectedRoomId: string | null,
): Node<RoomNodeData>[] {
  return rooms.map((r) => ({
    id: r.id,
    type: "room",
    position: { x: r.x, y: r.y },
    data: { label: r.name, active: r.id === selectedRoomId },
    style: { width: r.width, height: r.height },
    draggable: true,
    selectable: true,
  }));
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
    setNodes(roomsToNodes(household.rooms, selectedRoomId));
  }, [household.rooms, selectedRoomId, setNodes]);

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
        팁: 드래그로 위치 이동 · 클릭해 선택 · 더블클릭으로 이름 편집
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
