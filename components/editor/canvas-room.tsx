"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  useCanRedo,
  useCanUndo,
  useMutation,
  useRedo,
  useUpdateMyPresence,
  useUndo,
} from "@liveblocks/react";
import { ClientSideSuspense } from "@liveblocks/react/suspense";
import { useLiveblocksFlow } from "@liveblocks/react-flow";
import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  NodeToolbar,
  NodeResizer,
  ReactFlow,
  ReactFlowProvider,
  Position,
  getSmoothStepPath,
  useEdges,
  useNodes,
  useReactFlow,
  type EdgeProps,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ErrorBoundary } from "react-error-boundary";
import { AlertCircle, LoaderCircle, Maximize, Redo2, Undo2, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CanvasNodeVisual } from "@/components/editor/canvas-node-visual";
import { CanvasPresence } from "@/components/editor/canvas-presence";
import { ShapePanel, type ShapePreset } from "@/components/editor/shape-panel";
import type { CanvasTemplate } from "@/components/editor/starter-templates";
import { useKeyboardShortcuts } from "@/hooks/usekeyboardShortcuts";
import { useCanvasAutoSave, type CanvasSaveStatus } from "@/hooks/use-canvas-auto-save";
import { isCanvasState } from "@/lib/canvas-state";
import { NODE_COLORS, type CanvasEdge, type CanvasNode, type CanvasNodeData } from "@/types/canvas";

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

type LiveObjectLike = {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
};

type ShapeDragPreview = ShapePreset & {
  x: number;
  y: number;
};

export type SpecCanvasSnapshot = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

function isLiveObjectLike(value: unknown): value is LiveObjectLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "get" in value &&
    typeof value.get === "function" &&
    "set" in value &&
    typeof value.set === "function"
  );
}

export function CanvasRoom({
  roomId,
  onSaveStatusChange,
  onSaveReady,
  onTemplateImportReady,
  onSpecSnapshotReady,
  children,
}: {
  roomId: string;
  onSaveStatusChange: (status: CanvasSaveStatus) => void;
  onSaveReady: (save: (() => Promise<void>) | null) => void;
  onTemplateImportReady: (importTemplate: ((template: CanvasTemplate) => void) | null) => void;
  onSpecSnapshotReady: (getSnapshot: (() => SpecCanvasSnapshot) | null) => void;
  children?: ReactNode;
}) {
  return (
    <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
      <RoomProvider
        id={roomId}
        initialPresence={{
          cursor: null,
          thinking: false,
          status: null,
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
            <SharedCanvas
              roomId={roomId}
              onSaveStatusChange={onSaveStatusChange}
              onSaveReady={onSaveReady}
              onTemplateImportReady={onTemplateImportReady}
              onSpecSnapshotReady={onSpecSnapshotReady}
            />
          </ClientSideSuspense>
          {children}
        </ErrorBoundary>
      </RoomProvider>
    </LiveblocksProvider>
  );
}

function SharedCanvas({
  roomId,
  onSaveStatusChange,
  onSaveReady,
  onTemplateImportReady,
  onSpecSnapshotReady,
}: {
  roomId: string;
  onSaveStatusChange: (status: CanvasSaveStatus) => void;
  onSaveReady: (save: (() => Promise<void>) | null) => void;
  onTemplateImportReady: (importTemplate: ((template: CanvasTemplate) => void) | null) => void;
  onSpecSnapshotReady: (getSnapshot: (() => SpecCanvasSnapshot) | null) => void;
}) {
  return (
    <ReactFlowProvider>
      <SharedCanvasContent
        roomId={roomId}
        onSaveStatusChange={onSaveStatusChange}
        onSaveReady={onSaveReady}
        onTemplateImportReady={onTemplateImportReady}
        onSpecSnapshotReady={onSpecSnapshotReady}
      />
    </ReactFlowProvider>
  );
}

function SharedCanvasContent({
  roomId,
  onSaveStatusChange,
  onSaveReady,
  onTemplateImportReady,
  onSpecSnapshotReady,
}: {
  roomId: string;
  onSaveStatusChange: (status: CanvasSaveStatus) => void;
  onSaveReady: (save: (() => Promise<void>) | null) => void;
  onTemplateImportReady: (importTemplate: ((template: CanvasTemplate) => void) | null) => void;
  onSpecSnapshotReady: (getSnapshot: (() => SpecCanvasSnapshot) | null) => void;
}) {
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
  const flowNodes = useNodes<CanvasNode>();
  const flowEdges = useEdges<CanvasEdge>();
  const reactFlow = useReactFlow<CanvasNode, CanvasEdge>();
  const { screenToFlowPosition } = reactFlow;
  const canvasRef = useRef<HTMLDivElement>(null);
  const updateMyPresence = useUpdateMyPresence();
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();
  const [shapeDragPreview, setShapeDragPreview] =
    useState<ShapeDragPreview | null>(null);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [isRestoringCanvas, setIsRestoringCanvas] = useState(true);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const restoreStarted = useRef(false);
  const isDraggingShape = shapeDragPreview !== null;

  useKeyboardShortcuts(reactFlow, undo, redo);

  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    const handleDeleteKey = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.closest("input, textarea, select, [contenteditable='true']"))
      ) {
        return;
      }

      const selectedNodes = flowNodes.filter((node) => node.selected);
      const selectedEdges = flowEdges.filter((edge) => edge.selected);
      if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

      event.preventDefault();
      event.stopPropagation();
      onDelete({ nodes: selectedNodes, edges: selectedEdges });
    };

    canvasElement.addEventListener("keydown", handleDeleteKey);
    return () => canvasElement.removeEventListener("keydown", handleDeleteKey);
  }, [flowEdges, flowNodes, onDelete]);

  const handleSaveStatusChange = useCallback(
    (status: CanvasSaveStatus) => {
      if (status === "saving" || status === "saved") {
        setRestoreError(null);
      }
      onSaveStatusChange(status);
    },
    [onSaveStatusChange]
  );

  const saveCanvas = useCanvasAutoSave({
    projectId: roomId,
    nodes: nodes ?? [],
    edges: edges ?? [],
    enabled: isCanvasReady,
    onStatusChange: handleSaveStatusChange,
  });

  useEffect(() => {
    onSpecSnapshotReady(() => ({ nodes: nodes ?? [], edges: edges ?? [] }));
  }, [edges, nodes, onSpecSnapshotReady]);

  useEffect(
    () => () => onSpecSnapshotReady(null),
    [onSpecSnapshotReady]
  );

  useEffect(() => {
    onSaveReady(saveCanvas);
    return () => onSaveReady(null);
  }, [onSaveReady, saveCanvas]);

  useEffect(() => {
    if (restoreStarted.current) return;
    restoreStarted.current = true;

    let cancelled = false;
    let restoreFailed = false;
    onSaveStatusChange("loading");

    const restoreCanvas = async () => {
      try {
        if (
          reactFlow.getNodes().length > 0 ||
          reactFlow.getEdges().length > 0
        ) {
          return;
        }

        const response = await fetch(`/api/projects/${roomId}/canvas`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as {
          canvas?: unknown;
          error?: string;
        };

        if (cancelled) return;

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to load saved canvas");
        }

        if (payload.canvas !== null && payload.canvas !== undefined) {
          if (!isCanvasState(payload.canvas)) {
            throw new Error("Saved canvas has an invalid format");
          }

          if (
            reactFlow.getNodes().length === 0 &&
            reactFlow.getEdges().length === 0
          ) {
            onNodesChange(
              payload.canvas.nodes.map((item) => ({ type: "add" as const, item }))
            );
            onEdgesChange(
              payload.canvas.edges.map((item) => ({ type: "add" as const, item }))
            );
          }
        }
      } catch (error) {
        console.error(`Canvas restore failed for project ${roomId}.`, error);
        restoreFailed = true;
        if (!cancelled) {
          setRestoreError("Could not load the saved canvas. Changes may not be saved.");
        }
      } finally {
        if (!cancelled) {
          setIsRestoringCanvas(false);
          setIsCanvasReady(true);
          onSaveStatusChange(restoreFailed ? "error" : "saved");
        }
      }
    };

    void restoreCanvas();

    return () => {
      cancelled = true;
      restoreStarted.current = false;
    };
  }, [
    onEdgesChange,
    onNodesChange,
    onSaveStatusChange,
    reactFlow,
    roomId,
  ]);

  const handleCanvasMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      updateMyPresence({
        cursor: screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        }),
      });
    },
    [screenToFlowPosition, updateMyPresence]
  );

  const handleCanvasMouseLeave = useCallback(() => {
    updateMyPresence({ cursor: null });
  }, [updateMyPresence]);

  const handleShapeDragStart = useCallback(
    (shape: ShapePreset, x: number, y: number) => {
      setShapeDragPreview({ ...shape, x, y });
    },
    []
  );

  const handleShapeDragEnd = useCallback(() => {
    setShapeDragPreview(null);
  }, []);

  useEffect(() => {
    if (!isDraggingShape) {
      return;
    }

    const updatePreviewPosition = (event: globalThis.DragEvent) => {
      setShapeDragPreview((current) =>
        current ? { ...current, x: event.clientX, y: event.clientY } : current
      );
    };

    document.addEventListener("dragover", updatePreviewPosition, true);
    return () =>
      document.removeEventListener("dragover", updatePreviewPosition, true);
  }, [isDraggingShape]);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setShapeDragPreview(null);
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
      const dropPosition = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const node: CanvasNode = {
        id,
        type: "canvasNode",
        position: {
          x: dropPosition.x - width / 2,
          y: dropPosition.y - height / 2,
        },
        data: {
          label: "",
          color: NODE_COLORS[0].background,
          textColor: NODE_COLORS[0].text,
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

  const handleTemplateImport = useCallback(
    (template: CanvasTemplate) => {
      const templateBounds = template.nodes.reduce(
        (bounds, node) => ({
          minX: Math.min(bounds.minX, node.position.x),
          minY: Math.min(bounds.minY, node.position.y),
          maxX: Math.max(bounds.maxX, node.position.x + node.data.width),
          maxY: Math.max(bounds.maxY, node.position.y + node.data.height),
        }),
        {
          minX: Number.POSITIVE_INFINITY,
          minY: Number.POSITIVE_INFINITY,
          maxX: Number.NEGATIVE_INFINITY,
          maxY: Number.NEGATIVE_INFINITY,
        }
      );
      const existingNodes = reactFlow.getNodes();
      let offsetX: number;
      let offsetY: number;

      if (existingNodes.length > 0) {
        const existingBounds = reactFlow.getNodesBounds(existingNodes);
        offsetX = existingBounds.x + existingBounds.width + 120 - templateBounds.minX;
        offsetY = existingBounds.y - templateBounds.minY;
      } else {
        const canvasBounds = canvasRef.current?.getBoundingClientRect();
        const center = screenToFlowPosition({
          x: canvasBounds
            ? canvasBounds.left + canvasBounds.width / 2
            : window.innerWidth / 2,
          y: canvasBounds
            ? canvasBounds.top + canvasBounds.height / 2
            : window.innerHeight / 2,
        });
        offsetX = center.x - (templateBounds.minX + templateBounds.maxX) / 2;
        offsetY = center.y - (templateBounds.minY + templateBounds.maxY) / 2;
      }

      const nodeIds = new Map(
        template.nodes.map((node) => [node.id, `template-${crypto.randomUUID()}`])
      );
      const importedNodes = template.nodes.map((node) => {
        const id = nodeIds.get(node.id);
        if (!id) {
          throw new Error(`Missing generated ID for template node "${node.id}".`);
        }

        return {
          ...node,
          id,
          position: {
            x: node.position.x + offsetX,
            y: node.position.y + offsetY,
          },
          data: { ...node.data },
          style: node.style ? { ...node.style } : undefined,
        };
      });
      const importedEdges = template.edges.map((edge) => {
        const source = nodeIds.get(edge.source);
        const target = nodeIds.get(edge.target);
        if (!source || !target) {
          throw new Error(`Template edge "${edge.id}" references an unknown node.`);
        }

        return {
          ...edge,
          id: `template-${crypto.randomUUID()}`,
          source,
          target,
          sourceHandle: remapTemplateHandle(edge.sourceHandle, source, "source"),
          targetHandle: remapTemplateHandle(edge.targetHandle, target, "target"),
          data: edge.data ? { ...edge.data } : undefined,
          markerEnd:
            typeof edge.markerEnd === "object"
              ? { ...edge.markerEnd }
              : edge.markerEnd,
        };
      });

      onNodesChange(importedNodes.map((item) => ({ type: "add" as const, item })));
      onEdgesChange(importedEdges.map((item) => ({ type: "add" as const, item })));
      window.requestAnimationFrame(() => {
        void reactFlow.fitView({
          nodes: importedNodes,
          duration: 250,
          padding: 0.2,
        });
      });
    },
    [onEdgesChange, onNodesChange, reactFlow, screenToFlowPosition]
  );

  useEffect(() => {
    onTemplateImportReady(handleTemplateImport);
    return () => onTemplateImportReady(null);
  }, [handleTemplateImport, onTemplateImportReady]);

  return (
    <div
      ref={canvasRef}
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
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        deleteKeyCode={null}
        defaultEdgeOptions={{
          type: "canvasEdge",
          animated: false,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: "#f8fafc",
          },
        }}
        connectionLineStyle={{ stroke: "#8b82ff", strokeWidth: 1.5 }}
        nodesDraggable
        nodesConnectable
        edgesFocusable
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        proOptions={{ hideAttribution: true }}
        className="h-full w-full rounded-none border-0 bg-base shadow-none"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.25}
          color="var(--border-default)"
        />
      </ReactFlow>
      <CanvasPresence />
      {isRestoringCanvas && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-base/70 backdrop-blur-sm">
          <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-4 py-3 text-sm text-copy-secondary shadow-xl">
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-brand" />
            Loading saved canvas...
          </div>
        </div>
      )}
      {restoreError && !isRestoringCanvas && (
        <div
          role="alert"
          className="absolute left-5 top-5 z-30 flex max-w-sm items-center gap-2 rounded-xl border border-error/40 bg-surface px-3 py-2 text-xs text-error shadow-lg"
        >
          <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
          {restoreError}
        </div>
      )}
      <div
        aria-label="Canvas controls"
        className="absolute bottom-20 left-5 z-30 flex items-center gap-1 rounded-full border border-border bg-surface/95 p-1.5 shadow-xl backdrop-blur"
        role="toolbar"
      >
        <div aria-label="Zoom controls" className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom out"
            title="Zoom out"
            className="rounded-full text-copy-secondary hover:text-copy-primary"
            onClick={() => void reactFlow.zoomOut({ duration: 200 })}
          >
            <ZoomOut />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Fit view"
            title="Fit view"
            className="rounded-full text-copy-secondary hover:text-copy-primary"
            onClick={() => void reactFlow.fitView({ duration: 200, padding: 0.2 })}
          >
            <Maximize />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom in"
            title="Zoom in"
            className="rounded-full text-copy-secondary hover:text-copy-primary"
            onClick={() => void reactFlow.zoomIn({ duration: 200 })}
          >
            <ZoomIn />
          </Button>
        </div>
        <div aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
        <div aria-label="History controls" className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Undo"
            title="Undo"
            disabled={!canUndo}
            className="rounded-full text-copy-secondary hover:text-copy-primary"
            onClick={undo}
          >
            <Undo2 />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Redo"
            title="Redo"
            disabled={!canRedo}
            className="rounded-full text-copy-secondary hover:text-copy-primary"
            onClick={redo}
          >
            <Redo2 />
          </Button>
        </div>
      </div>
      <ShapePanel
        onShapeDragStart={handleShapeDragStart}
        onShapeDragEnd={handleShapeDragEnd}
      />
      {shapeDragPreview && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-[60]"
          style={{
            left: shapeDragPreview.x,
            top: shapeDragPreview.y,
            width: shapeDragPreview.width,
            height: shapeDragPreview.height,
            transform: "translate(-50%, -50%)",
          }}
        >
          <CanvasNodeVisual
            shape={shapeDragPreview.shape}
            color="#60a5fa"
            preview
          />
        </div>
      )}
    </div>
  );
}

function remapTemplateHandle(
  handleId: string | null | undefined,
  nodeId: string,
  type: "source" | "target"
) {
  const side = handleId?.slice(handleId.lastIndexOf("-") + 1);
  if (
    side !== "top" &&
    side !== "right" &&
    side !== "bottom" &&
    side !== "left"
  ) {
    return null;
  }

  return `${nodeId}-${type}-${side}`;
}

const nodeTypes = { canvasNode: CanvasFlowNode };
const edgeTypes = { canvasEdge: CanvasEdgeRenderer };

function CanvasEdgeRenderer({
  id,
  data,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
}: EdgeProps<CanvasEdge>) {
  const [isHovering, setIsHovering] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(data?.label ?? "");

  const updateEdgeLabel = useMutation(
    ({ storage }, nextLabel: string) => {
      const flow = storage.get("flow");
      if (!isLiveObjectLike(flow)) return;
      const edgeMap = flow.get("edges");
      if (!isLiveObjectLike(edgeMap)) return;
      const edge = edgeMap.get(id);
      if (!isLiveObjectLike(edge)) return;
      const edgeData = edge.get("data");
      if (typeof edgeData !== "object" || edgeData === null || Array.isArray(edgeData)) return;
      edge.set("data", { ...edgeData, label: nextLabel });
    },
    [id]
  );

  const labelText = isEditing ? labelValue : data?.label ?? "";
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  });
  const inputWidth = Math.max(72, labelText.length * 8 + 28);

  const activeStroke = selected || isHovering ? "#f8fafc" : "rgba(184, 196, 220, 0.9)";
  const activeOpacity = selected || isHovering ? 1 : 0.75;

  return (
    <>
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={18}
        style={{ pointerEvents: "stroke" }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          setIsEditing(true);
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      />
      <path
        d={path}
        fill="none"
        stroke={activeStroke}
        strokeWidth={selected || isHovering ? 2.3 : 1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={activeOpacity}
        markerEnd={markerEnd}
        style={{
          filter: selected || isHovering ? "drop-shadow(0 0 6px rgba(248,250,252,0.35))" : undefined,
        }}
        onDoubleClick={(event) => {
          event.stopPropagation();
          setIsEditing(true);
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      />
      <EdgeLabelRenderer>
        {isEditing ? (
          <div
            style={{
              position: "absolute",
              left: labelX,
              top: labelY,
              transform: "translate(-50%, -50%)",
              pointerEvents: "all",
            }}
          >
            <input
              autoFocus
              aria-label="Edit edge label"
              value={labelValue}
              onChange={(event) => {
                const nextValue = event.currentTarget.value;
                setLabelValue(nextValue);
                updateEdgeLabel(nextValue);
              }}
              onBlur={() => setIsEditing(false)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  setIsEditing(false);
                }
              }}
              className="min-w-[72px] rounded-md border border-border bg-surface px-2 py-1 text-[10px] text-copy-primary shadow-lg outline-none focus:border-brand"
              style={{
                width: `${inputWidth}px`,
              }}
            />
          </div>
        ) : (
          data?.label && (
            <div
              style={{
                position: "absolute",
                left: labelX,
                top: labelY,
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
              }}
              className="rounded-md border border-border-subtle bg-surface/90 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-copy-secondary shadow"
            >
              {data.label}
            </div>
          )
        )}
      </EdgeLabelRenderer>
    </>
  );
}

function CanvasFlowNode({ id, data, selected }: NodeProps<CanvasNode>) {
  const updateColors = useMutation(
    ({ storage }, colors: (typeof NODE_COLORS)[number]) => {
      const flow = storage.get("flow");
      if (!isLiveObjectLike(flow)) return;
      const nodeMap = flow.get("nodes");
      if (!isLiveObjectLike(nodeMap)) return;
      const node = nodeMap.get(id);
      if (!isLiveObjectLike(node)) return;
      const nodeData = node.get("data");
      if (typeof nodeData !== "object" || nodeData === null || Array.isArray(nodeData)) return;
      node.set("data", {
        ...nodeData,
        color: colors.background,
        textColor: colors.text,
      });
    },
    [id]
  );
  const updateLabel = useMutation(
    ({ storage }, label: string) => {
      const flow = storage.get("flow");
      if (!isLiveObjectLike(flow)) return;
      const nodeMap = flow.get("nodes");
      if (!isLiveObjectLike(nodeMap)) return;
      const node = nodeMap.get(id);
      if (!isLiveObjectLike(node)) return;
      const data = node.get("data");
      if (typeof data !== "object" || data === null || Array.isArray(data)) return;
      node.set("data", { ...data, label });
    },
    [id]
  );
  const [isEditing, setIsEditing] = useState(false);
  const handleVisibilityClass = selected
    ? "!opacity-100"
    : "!opacity-0 group-hover:!opacity-100 group-focus-within:!opacity-100";

  return (
    <div className="group relative h-full w-full">
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        offset={12}
        className="nodrag nopan flex items-center gap-1.5 rounded-xl border border-border bg-surface p-1.5 shadow-lg"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {NODE_COLORS.map((colors) => {
          const isActive =
            data.color === colors.background && data.textColor === colors.text;
          return (
            <button
              key={colors.name}
              type="button"
              aria-label={`${colors.name} node colors`}
              aria-pressed={isActive}
              title={colors.name}
              className="nodrag nopan size-5 rounded-full border border-white/20 transition-shadow hover:shadow-[0_0_0_2px_var(--swatch-glow)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-copy-primary"
              style={{
                backgroundColor: colors.background,
                outline: isActive ? `2px solid ${colors.text}` : undefined,
                outlineOffset: isActive ? 2 : undefined,
                "--swatch-glow": `${colors.text}80`,
              } as CSSProperties}
              onClick={(event) => {
                event.stopPropagation();
                updateColors(colors);
              }}
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            />
          );
        })}
      </NodeToolbar>
      <NodeResizer
        isVisible={selected}
        minWidth={80}
        minHeight={60}
        autoScale={false}
        lineStyle={{ borderColor: "var(--border-subtle)", borderWidth: 1 }}
        handleStyle={{
          width: 8,
          height: 8,
          border: "1px solid var(--border-subtle)",
          borderRadius: 2,
          background: "var(--bg-surface)",
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id={`${id}-target-top`}
        className={`${handleVisibilityClass} !pointer-events-auto !z-20 !h-3 !w-3 !border-[1.5px] !border-slate-900 !bg-white`}
        style={{ top: -4 }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id={`${id}-source-top`}
        className={`${handleVisibilityClass} !pointer-events-auto !z-20 !h-3 !w-3 !border-[1.5px] !border-slate-900 !bg-white`}
        style={{ top: 4 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id={`${id}-target-right`}
        className={`${handleVisibilityClass} !pointer-events-auto !z-20 !h-3 !w-3 !border-[1.5px] !border-slate-900 !bg-white`}
        style={{ right: -4 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={`${id}-source-right`}
        className={`${handleVisibilityClass} !pointer-events-auto !z-20 !h-3 !w-3 !border-[1.5px] !border-slate-900 !bg-white`}
        style={{ right: 4 }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id={`${id}-target-bottom`}
        className={`${handleVisibilityClass} !pointer-events-auto !z-20 !h-3 !w-3 !border-[1.5px] !border-slate-900 !bg-white`}
        style={{ bottom: -4 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id={`${id}-source-bottom`}
        className={`${handleVisibilityClass} !pointer-events-auto !z-20 !h-3 !w-3 !border-[1.5px] !border-slate-900 !bg-white`}
        style={{ bottom: 4 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id={`${id}-target-left`}
        className={`${handleVisibilityClass} !pointer-events-auto !z-20 !h-3 !w-3 !border-[1.5px] !border-slate-900 !bg-white`}
        style={{ left: -4 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id={`${id}-source-left`}
        className={`${handleVisibilityClass} !pointer-events-auto !z-20 !h-3 !w-3 !border-[1.5px] !border-slate-900 !bg-white`}
        style={{ left: 4 }}
      />
      <div
        className="h-full w-full"
        onDoubleClick={(event) => {
          event.stopPropagation();
          setIsEditing(true);
        }}
      >
        <CanvasNodeVisual
          shape={data.shape}
          color={data.color}
          textColor={data.textColor}
          selected={selected}
        />
        {isEditing ? (
          <textarea
            autoFocus
            aria-label="Edit node label"
            className="nodrag nopan nowheel absolute left-1/2 top-1/2 z-10 h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2 resize-none overflow-hidden rounded-sm border border-border-subtle bg-surface/90 p-1 text-center text-sm leading-snug outline-none focus:border-brand"
            placeholder="Enter label"
            value={data.label}
            style={{ color: data.textColor ?? "#EDEDED" }}
            onChange={(event) => updateLabel(event.currentTarget.value)}
            onBlur={() => setIsEditing(false)}
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === "Escape") {
                event.currentTarget.blur();
              }
            }}
          />
        ) : (
          <div
            className="pointer-events-none absolute inset-0 z-10 grid place-items-center px-5 text-center text-sm"
            style={{ color: data.textColor ?? "#EDEDED" }}
          >
            {data.label || (
              <span className="text-copy-muted">Double-click to edit</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
