import type { Edge, Node } from "@xyflow/react";

export type CanvasNodeData = {
  label: string;
  color: string;
  shape: "rectangle" | "diamond" | "circle" | "pill" | "cylinder" | "hexagon";
  width: number;
  height: number;
};

export type canvasNode = "canvasNode";
export type canvasEdge = "canvasEdge";

export type CanvasNode = Node<CanvasNodeData, canvasNode>;
export type CanvasEdge = Edge<Record<string, unknown>, canvasEdge>;
