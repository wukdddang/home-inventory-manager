"use client";

import { PromptModal } from "@/app/_ui/prompt-modal";
import type { Household, HouseholdStructureDiagramLayout } from "@/types/domain";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

type SlotMini = { id: string; name: string };

type StructureRoomData = {
  kind: "structureRoom";
  roomId: string;
  label: string;
  active: boolean;
};

/** 방 직속 보관 칸 1개 = 노드 1개 */
type DirectSlotData = {
  kind: "directSlot";
  roomId: string;
  storageSlotId: string;
  label: string;
};

type FurniturePlacementData = {
  kind: "furniturePlacement";
  roomId: string;
  furnitureId: string;
  label: string;
  slots: SlotMini[];
};

type StructureNodeData =
  | StructureRoomData
  | DirectSlotData
  | FurniturePlacementData;

const edgeDefaults = {
  type: "smoothstep" as const,
  style: { stroke: "rgb(63 63 70)", strokeWidth: 1.5 },
  animated: false,
};

const StructureRoomNode = memo(function StructureRoomNode({
  data,
}: NodeProps<Node<StructureRoomData>>) {
  return (
    <div
      title="드래그하여 방 묶음 이동 · 더블클릭으로 이름 변경"
      className={`relative flex h-full w-full cursor-grab items-center justify-center rounded-lg border-2 px-2 py-2 text-center active:cursor-grabbing ${
        data.active
          ? "border-teal-400 bg-teal-500/20 text-teal-50"
          : "border-zinc-600 bg-zinc-800/90 text-zinc-200"
      }`}
    >
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2 !border-none !bg-teal-500/80"
      />
      <span className="line-clamp-2 text-[11px] font-semibold leading-tight">
        {data.label}
      </span>
    </div>
  );
});

const DirectSlotNode = memo(function DirectSlotNode({
  data,
}: NodeProps<Node<DirectSlotData>>) {
  return (
    <div
      title="드래그해 배치 · 클릭하면 이 방이 선택됩니다"
      className="relative flex h-full w-full cursor-grab flex-col justify-center overflow-hidden rounded-lg border border-amber-500/40 bg-zinc-900/95 px-2 py-1.5 text-left active:cursor-grabbing"
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2 !border-none !bg-amber-500/70"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!size-2 !border-none !bg-amber-500/70"
      />
      <p className="text-[8px] font-medium text-amber-200/70">직속 보관</p>
      <p
        className="mt-0.5 truncate text-[10px] font-semibold text-amber-100/95"
        title={data.label}
      >
        {data.label}
      </p>
    </div>
  );
});

const FurniturePlacementNode = memo(function FurniturePlacementNode({
  data,
}: NodeProps<Node<FurniturePlacementData>>) {
  return (
    <div
      title="드래그해 배치 · 클릭하면 이 방이 선택됩니다"
      className="relative flex h-full w-full cursor-grab flex-col overflow-hidden rounded-lg border border-teal-600/40 bg-zinc-900/95 text-left active:cursor-grabbing"
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!size-2 !border-none !bg-teal-500/70"
      />
      <div className="shrink-0 border-b border-teal-600/25 bg-teal-950/35 px-2 py-1">
        <p
          className="truncate text-[9px] font-semibold text-teal-200/95"
          title={data.label}
        >
          가구 · {data.label}
        </p>
      </div>
      <div className="nopan nowheel min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-1.5">
        {data.slots.length === 0 ? (
          <p className="text-[9px] text-zinc-500">하위 보관 칸 없음</p>
        ) : (
          <ul className="space-y-0.5 border-l border-teal-500/25 pl-1.5">
            {data.slots.map((s) => (
              <li
                key={s.id}
                className="truncate text-[8px] text-zinc-400"
                title={s.name}
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

const nodeTypes = {
  structureRoom: StructureRoomNode,
  directSlot: DirectSlotNode,
  furniturePlacement: FurniturePlacementNode,
} satisfies NodeTypes;

const ROOM_NODE_H = 52;
const GAP_X = 28;
const SLOT_W = 148;
const SLOT_H = 56;
const FURNITURE_W = 172;
const FURN_HEADER = 28;
const FURN_ROW = 16;
const FURN_PAD = 12;
const FURN_GAP_Y = 14;
const GROUP_GAP_Y = 18;

function estimateFurnitureHeight(slotCount: number): number {
  const body = slotCount === 0 ? 28 : slotCount * FURN_ROW + FURN_PAD;
  return FURN_HEADER + body;
}

function slotLayoutKey(slotId: string) {
  return `slot:${slotId}`;
}

function fpLayoutKey(furnitureId: string) {
  return `fp:${furnitureId}`;
}

function readLayoutPos(
  layout: HouseholdStructureDiagramLayout | undefined,
  key: string,
  fallback: { x: number; y: number },
): { x: number; y: number } {
  const p = layout?.[key];
  return p ? { x: p.x, y: p.y } : fallback;
}

type FurnPrepared = {
  id: string;
  label: string;
  anchorDirectStorageId?: string | null;
  slots: SlotMini[];
};

function buildStructureGraph(
  household: Household,
  selectedRoomId: string | null,
): { nodes: Node<StructureNodeData>[]; edges: Edge[] } {
  const placements = household.furniturePlacements ?? [];
  const storage = household.storageLocations ?? [];
  const layout = household.structureDiagramLayout;
  const nodes: Node<StructureNodeData>[] = [];
  const edges: Edge[] = [];

  for (const r of household.rooms) {
    const directSlots = storage
      .filter(
        (s) =>
          s.roomId === r.id &&
          (s.furniturePlacementId == null || s.furniturePlacementId === ""),
      )
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    const directIdSet = new Set(directSlots.map((s) => s.id));

    const furnPrepared: FurnPrepared[] = placements
      .filter((f) => f.roomId === r.id)
      .sort(
        (a, b) =>
          (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
          a.label.localeCompare(b.label, "ko"),
      )
      .map((fp) => ({
        id: fp.id,
        label: fp.label,
        anchorDirectStorageId: fp.anchorDirectStorageId,
        slots: storage
          .filter((s) => s.furniturePlacementId === fp.id)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
          .map((s) => ({ id: s.id, name: s.name })),
      }));

    const anchoredBySlot = new Map<string, FurnPrepared[]>();
    const unlinked: FurnPrepared[] = [];
    for (const fp of furnPrepared) {
      const a = fp.anchorDirectStorageId;
      if (a && directIdSet.has(a)) {
        const list = anchoredBySlot.get(a) ?? [];
        list.push(fp);
        anchoredBySlot.set(a, list);
      } else {
        unlinked.push(fp);
      }
    }

    const roomW = Math.max(r.width, 120);
    const roomNode: Node<StructureNodeData> = {
      id: r.id,
      type: "structureRoom",
      position: { x: r.x, y: r.y },
      data: {
        kind: "structureRoom",
        roomId: r.id,
        label: r.name,
        active: r.id === selectedRoomId,
      },
      style: { width: roomW, height: ROOM_NODE_H },
      draggable: true,
      selectable: true,
    };
    nodes.push(roomNode);

    const xSlotCol = r.x + roomW + GAP_X;
    const xFurnCol = xSlotCol + SLOT_W + GAP_X;
    let yCursor = r.y;

    for (const slot of directSlots) {
      const slotNodeId = `struct-slot-${slot.id}`;
      const group = anchoredBySlot.get(slot.id) ?? [];
      const sk = slotLayoutKey(slot.id);
      const slotPos = readLayoutPos(layout, sk, {
        x: xSlotCol,
        y: yCursor,
      });

      nodes.push({
        id: slotNodeId,
        type: "directSlot",
        position: slotPos,
        data: {
          kind: "directSlot",
          roomId: r.id,
          storageSlotId: slot.id,
          label: slot.name,
        },
        style: { width: SLOT_W, height: SLOT_H },
        draggable: true,
        selectable: true,
      });
      edges.push({
        id: `e-${r.id}-${slotNodeId}`,
        source: r.id,
        target: slotNodeId,
        ...edgeDefaults,
      });

      let yF = slotPos.y;
      let maxFurnBottom = slotPos.y;
      for (const fp of group) {
        const fh = estimateFurnitureHeight(fp.slots.length);
        const fpNodeId = `struct-fp-${fp.id}`;
        const fk = fpLayoutKey(fp.id);
        const fpPos = readLayoutPos(layout, fk, { x: xFurnCol, y: yF });
        nodes.push({
          id: fpNodeId,
          type: "furniturePlacement",
          position: fpPos,
          data: {
            kind: "furniturePlacement",
            roomId: r.id,
            furnitureId: fp.id,
            label: fp.label,
            slots: fp.slots,
          },
          style: { width: FURNITURE_W, height: fh },
          draggable: true,
          selectable: true,
        });
        edges.push({
          id: `e-${slotNodeId}-${fpNodeId}`,
          source: slotNodeId,
          target: fpNodeId,
          ...edgeDefaults,
        });
        maxFurnBottom = Math.max(maxFurnBottom, fpPos.y + fh);
        yF = fpPos.y + fh + FURN_GAP_Y;
      }

      const blockBottom = Math.max(slotPos.y + SLOT_H, maxFurnBottom);
      yCursor = blockBottom + GROUP_GAP_Y;
    }

    const xUnlinkedFurn =
      directSlots.length > 0 ? xFurnCol : xSlotCol;
    let yUnlinked = yCursor;
    for (const fp of unlinked) {
      const fh = estimateFurnitureHeight(fp.slots.length);
      const fpNodeId = `struct-fp-${fp.id}`;
      const fk = fpLayoutKey(fp.id);
      const fpPos = readLayoutPos(layout, fk, {
        x: xUnlinkedFurn,
        y: yUnlinked,
      });
      nodes.push({
        id: fpNodeId,
        type: "furniturePlacement",
        position: fpPos,
        data: {
          kind: "furniturePlacement",
          roomId: r.id,
          furnitureId: fp.id,
          label: fp.label,
          slots: fp.slots,
        },
        style: { width: FURNITURE_W, height: fh },
        draggable: true,
        selectable: true,
      });
      edges.push({
        id: `e-${r.id}-${fpNodeId}-unlinked`,
        source: r.id,
        target: fpNodeId,
        ...edgeDefaults,
      });
      yUnlinked = fpPos.y + fh + FURN_GAP_Y;
    }
  }

  return { nodes, edges };
}

export type StructureDiagramCommitPayload = {
  room?: { roomId: string; x: number; y: number };
  layoutPatch: HouseholdStructureDiagramLayout;
};

function StructureDiagramGetNodesBridge({
  getNodesRef,
}: {
  getNodesRef: MutableRefObject<(() => Node<StructureNodeData>[]) | null>;
}) {
  const { getNodes } = useReactFlow();
  useLayoutEffect(() => {
    getNodesRef.current = () => getNodes() as Node<StructureNodeData>[];
  }, [getNodes, getNodesRef]);
  return null;
}

export type HouseStructureFlowProps = {
  household: Household;
  selectedRoomId: string | null;
  onRoomSelect: (roomId: string) => void;
  onRoomRename: (roomId: string, nextName: string) => void;
  onStructureDiagramCommit: (payload: StructureDiagramCommitPayload) => void;
};

type ClusterDragRef = {
  roomId: string;
  roomStart: { x: number; y: number };
  others: Record<string, { x: number; y: number }>;
};

function HouseStructureFlowInner({
  household,
  selectedRoomId,
  onRoomSelect,
  onRoomRename,
  onStructureDiagramCommit,
}: HouseStructureFlowProps) {
  const { nodes: layoutNodes, edges: layoutEdges } = useMemo(
    () => buildStructureGraph(household, selectedRoomId),
    [household, selectedRoomId],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutEdges);
  const nodesRef = useRef(nodes);
  const getNodesRef = useRef<(() => Node<StructureNodeData>[]) | null>(null);
  const clusterDragRef = useRef<ClusterDragRef | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    const { nodes: n, edges: e } = buildStructureGraph(
      household,
      selectedRoomId,
    );
    setNodes(n);
    setEdges(e);
  }, [household, selectedRoomId, setNodes, setEdges]);

  const [rename, setRename] = useState<{ id: string; name: string } | null>(
    null,
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<StructureNodeData>) => {
      const d = node.data;
      onRoomSelect(d.roomId);
    },
    [onRoomSelect],
  );

  const onNodeDragStart = useCallback(
    (_: React.MouseEvent, node: Node<StructureNodeData>) => {
      if (node.data.kind !== "structureRoom") return;
      const roomId = node.data.roomId;
      const others: Record<string, { x: number; y: number }> = {};
      for (const n of nodesRef.current) {
        if (n.id === node.id) continue;
        const d = n.data as StructureNodeData;
        if (d.roomId === roomId) {
          others[n.id] = { ...n.position };
        }
      }
      clusterDragRef.current = {
        roomId,
        roomStart: { ...node.position },
        others,
      };
    },
    [],
  );

  const onNodeDrag = useCallback(
    (_: React.MouseEvent, node: Node<StructureNodeData>) => {
      if (node.data.kind !== "structureRoom") return;
      const ref = clusterDragRef.current;
      if (!ref || ref.roomId !== node.data.roomId) return;
      const dx = node.position.x - ref.roomStart.x;
      const dy = node.position.y - ref.roomStart.y;
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) return n;
          const orig = ref.others[n.id];
          if (!orig) return n;
          return {
            ...n,
            position: { x: orig.x + dx, y: orig.y + dy },
          };
        }),
      );
    },
    [setNodes],
  );

  const onNodeDragStop = useCallback(
    (_: React.MouseEvent, node: Node<StructureNodeData>) => {
      clusterDragRef.current = null;
      const all =
        getNodesRef.current?.() ??
        (nodesRef.current as Node<StructureNodeData>[]);
      const d = node.data;

      if (d.kind === "structureRoom") {
        const layoutPatch: HouseholdStructureDiagramLayout = {};
        for (const n of all) {
          const nd = n.data;
          if (nd.roomId !== d.roomId) continue;
          if (nd.kind === "directSlot") {
            layoutPatch[slotLayoutKey(nd.storageSlotId)] = {
              x: Math.round(n.position.x),
              y: Math.round(n.position.y),
            };
          } else if (nd.kind === "furniturePlacement") {
            layoutPatch[fpLayoutKey(nd.furnitureId)] = {
              x: Math.round(n.position.x),
              y: Math.round(n.position.y),
            };
          }
        }
        onStructureDiagramCommit({
          room: {
            roomId: node.id,
            x: Math.round(node.position.x),
            y: Math.round(node.position.y),
          },
          layoutPatch,
        });
        return;
      }

      if (d.kind === "directSlot") {
        onStructureDiagramCommit({
          layoutPatch: {
            [slotLayoutKey(d.storageSlotId)]: {
              x: Math.round(node.position.x),
              y: Math.round(node.position.y),
            },
          },
        });
        return;
      }

      if (d.kind === "furniturePlacement") {
        onStructureDiagramCommit({
          layoutPatch: {
            [fpLayoutKey(d.furnitureId)]: {
              x: Math.round(node.position.x),
              y: Math.round(node.position.y),
            },
          },
        });
      }
    },
    [onStructureDiagramCommit],
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node<StructureNodeData>) => {
      if (node.data.kind !== "structureRoom") return;
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
      <div className="relative z-0 isolate min-h-[min(60vh,520px)] w-full min-w-0 flex-1 overflow-hidden [&_.react-flow]:h-full [&_.react-flow]:min-h-[min(60vh,520px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          nodesConnectable={false}
          nodesDraggable
          nodeDragThreshold={6}
          panOnScroll
          zoomOnScroll
          minZoom={0.25}
          maxZoom={1.6}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
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
            nodeColor={(n) => {
              const d = n.data as StructureNodeData | undefined;
              if (!d) return "rgb(82,82,91)";
              if (d.kind === "structureRoom" && d.active) {
                return "rgb(45,212,191)";
              }
              if (d.kind === "directSlot") return "rgb(251,191,36)";
              if (d.kind === "furniturePlacement") return "rgb(20,184,166)";
              return "rgb(82,82,91)";
            }}
          />
          <StructureDiagramGetNodesBridge getNodesRef={getNodesRef} />
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
        팁:{" "}
        <span className="text-zinc-400">
          방 → 직속 보관 칸(각각) → 그 칸에 연결된 가구 → 가구 아래 칸
        </span>
        . 방·직속·가구 블록을 각각 드래그해 배치할 수 있으며 위치는 저장됩니다.
        방을 드래그하면 같은 방의 직속·가구가 함께 움직입니다.
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
