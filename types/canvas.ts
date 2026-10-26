import type { Edge, Node } from "@xyflow/react";

export const NODE_COLORS = [
  { name: "Neutral", background: "#1F1F1F", text: "#EDEDED" },
  { name: "Blue", background: "#10233D", text: "#52A8FF" },
  { name: "Purple", background: "#2E1938", text: "#BF7AF0" },
  { name: "Orange", background: "#331B00", text: "#FF990A" },
  { name: "Red", background: "#3C1618", text: "#FF6166" },
  { name: "Pink", background: "#3A1726", text: "#F75F8F" },
  { name: "Green", background: "#0F2E18", text: "#62C073" },
  { name: "Teal", background: "#062822", text: "#0AC7B4" },
] as const;

export type CanvasNodeData = {
  label: string;
  color: string;
  textColor?: string;
  shape: "rectangle" | "diamond" | "circle" | "pill" | "cylinder" | "hexagon";
  width: number;
  height: number;
};

export type CanvasEdgeData = {
  label?: string;
};

export type canvasNode = "canvasNode";
export type canvasEdge = "canvasEdge";

export type CanvasNode = Node<CanvasNodeData, canvasNode>;
export type CanvasEdge = Edge<CanvasEdgeData, canvasEdge>;
