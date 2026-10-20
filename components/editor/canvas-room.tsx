"use client";

import { useCallback } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react";
import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { Cursors, useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Handle,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  Position,
  useReactFlow,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ErrorBoundary } from "react-error-boundary";

import { ShapePanel } from "@/components/editor/shape-panel";
import type { CanvasEdge, CanvasNode, CanvasNodeData } from "@/types/canvas";

const shapeDragType = "application/x-ghost-canvas-shape";
const allowedShapes = new Set<CanvasNodeData["shape"]>([
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
]);
let nodeCounter = 0;

export function CanvasRoom({ roomId }: { roomId: string }) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{
          cursor: null,
          isThinking: false,
        }}
      >
        <ErrorBoundary
          fallback={
            <div className="flex h-full items-center justify-center text-sm text-copy-secondary">
              Liveblocks canvas connection failed.
            </div>
          }
        >
          <ClientSideSuspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-copy-secondary">
                Loading canvas...
              </div>
            }
          >
            <SharedCanvas />
          </ClientSideSuspense>
        </ErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function SharedCanvas() {
  return (
    <ReactFlowProvider>
      <SharedCanvasContent />
    </ReactFlowProvider>
  );
}

function SharedCanvasContent() {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<CanvasNode, CanvasEdge>({
    suspense: true,
    nodes: {
      initial: [],
    },
    edges: {
      initial: [],
    },
  });
  const { screenToFlowPosition } = useReactFlow<CanvasNode, CanvasEdge>();

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const payload = event.dataTransfer.getData(shapeDragType);
      if (!payload) {
        return;
      }

      let shapeData: unknown;
      try {
        shapeData = JSON.parse(payload);
      } catch {
        return;
      }

      if (typeof shapeData !== "object" || shapeData === null) {
        return;
      }

      const { shape, width, height } = shapeData as Record<string, unknown>;
      if (
        typeof shape !== "string" ||
        !allowedShapes.has(shape as CanvasNodeData["shape"]) ||
        typeof width !== "number" ||
        typeof height !== "number" ||
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width < 40 ||
        width > 600 ||
        height < 40 ||
        height > 600
      ) {
        return;
      }

      const id = `${shape}-${Date.now()}-${++nodeCounter}`;
      const node: CanvasNode = {
        id,
        type: "canvasNode",
        position: screenToFlowPosition({ x: event.clientX, y: event.clientY }),
        data: {
          label: "",
          color: "#60a5fa",
          shape: shape as CanvasNodeData["shape"],
          width,
          height,
        },
        style: { width, height },
      };

      onNodesChange([{ type: "add", item: node }]);
    },
    [onNodesChange, screenToFlowPosition]
  );

  return (
    <div
      className="relative h-full min-h-0 w-full overflow-hidden bg-base"
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <ReactFlow
        nodes={nodes ?? []}
        edges={edges ?? []}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDelete={onDelete}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{ type: "smoothstep", animated: false }}
        connectionLineStyle={{ stroke: "#8b82ff", strokeWidth: 1.5 }}
        nodesDraggable
        nodesConnectable
        edgesFocusable
        proOptions={{ hideAttribution: true }}
        className="h-full w-full rounded-none border-0 bg-base shadow-none"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.25}
          color="var(--border-default)"
        />
        <MiniMap
          pannable
          zoomable
          nodeStrokeColor={(node) => String(node.data?.color ?? "#60a5fa")}
          nodeColor={(node) => String(node.data?.color ?? "#1f2937")}
        />
        <Cursors />
      </ReactFlow>
      <ShapePanel />
    </div>
  );
}

const nodeTypes = { canvasNode: CanvasFlowNode };

function CanvasFlowNode({ data, selected }: NodeProps<CanvasNode>) {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-lg border-2 bg-surface px-3 text-center text-sm text-copy-primary"
      style={{ borderColor: data.color, outline: selected ? `2px solid ${data.color}` : undefined }}
    >
      <Handle type="target" position={Position.Top} className="!border-border !bg-surface" />
      {data.label}
      <Handle type="source" position={Position.Bottom} className="!border-border !bg-surface" />
    </div>
  );
}
