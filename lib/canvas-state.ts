import { NODE_COLORS, type CanvasEdge, type CanvasNode } from "@/types/canvas";

export type CanvasState = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

const canvasShapes = new Set([
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCanvasNode(value: unknown): value is CanvasNode {
  if (!isRecord(value) || typeof value.id !== "string") return false;
  if (value.type !== undefined && typeof value.type !== "string") return false;
  if (!isRecord(value.position) || !isRecord(value.data)) return false;

  return (
    typeof value.position.x === "number" &&
    Number.isFinite(value.position.x) &&
    typeof value.position.y === "number" &&
    Number.isFinite(value.position.y) &&
    typeof value.data.label === "string" &&
    typeof value.data.color === "string" &&
    (value.data.textColor === undefined || typeof value.data.textColor === "string") &&
    typeof value.data.shape === "string" &&
    canvasShapes.has(value.data.shape) &&
    typeof value.data.width === "number" &&
    Number.isFinite(value.data.width) &&
    typeof value.data.height === "number" &&
    Number.isFinite(value.data.height)
  );
}

function isCanvasEdge(value: unknown): value is CanvasEdge {
  if (!isRecord(value)) return false;
  if (typeof value.id !== "string" || typeof value.source !== "string") return false;
  if (typeof value.target !== "string") return false;
  if (value.type !== undefined && typeof value.type !== "string") return false;
  return value.data === undefined || value.data === null || isRecord(value.data);
}

function normalizeCanvasNode(value: unknown): CanvasNode | null {
  if (!isRecord(value) || typeof value.id !== "string") return null;
  if (value.type !== undefined && typeof value.type !== "string") return null;
  if (!isRecord(value.position) || !isRecord(value.data)) return null;

  const { x, y } = value.position;
  if (
    typeof x !== "number" ||
    !Number.isFinite(x) ||
    typeof y !== "number" ||
    !Number.isFinite(y)
  ) {
    return null;
  }

  const { data } = value;
  const style = isRecord(value.style) ? value.style : {};
  const shape =
    typeof data.shape === "string" && canvasShapes.has(data.shape)
      ? data.shape
      : "rectangle";
  const widthValue = data.width ?? style.width ?? value.width;
  const heightValue = data.height ?? style.height ?? value.height;
  const width =
    typeof widthValue === "number" && Number.isFinite(widthValue) && widthValue > 0
      ? widthValue
      : 160;
  const height =
    typeof heightValue === "number" &&
    Number.isFinite(heightValue) &&
    heightValue > 0
      ? heightValue
      : 80;

  return {
    ...value,
    type: typeof value.type === "string" ? value.type : "canvasNode",
    position: { x, y },
    data: {
      ...data,
      label: typeof data.label === "string" ? data.label : "",
      color: typeof data.color === "string" ? data.color : NODE_COLORS[0].background,
      textColor:
        typeof data.textColor === "string" ? data.textColor : NODE_COLORS[0].text,
      shape,
      width,
      height,
    },
  } as CanvasNode;
}

export function normalizeCanvasState(value: unknown): CanvasState | null {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    return null;
  }

  const nodes = value.nodes.map(normalizeCanvasNode);
  if (nodes.some((node) => node === null) || !value.edges.every(isCanvasEdge)) {
    return null;
  }

  return {
    nodes: nodes as CanvasNode[],
    edges: value.edges,
  };
}

export function isCanvasState(value: unknown): value is CanvasState {
  return (
    isRecord(value) &&
    Array.isArray(value.nodes) &&
    Array.isArray(value.edges) &&
    value.nodes.every(isCanvasNode) &&
    value.edges.every(isCanvasEdge)
  );
}
