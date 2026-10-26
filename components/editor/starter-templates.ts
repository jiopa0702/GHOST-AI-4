import { MarkerType } from "@xyflow/react";

import {
  NODE_COLORS,
  type CanvasEdge,
  type CanvasNode,
  type CanvasNodeData,
} from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

function createNode(
  id: string,
  label: string,
  shape: CanvasNodeData["shape"],
  x: number,
  y: number,
  width: number,
  height: number,
  colorIndex: number
): CanvasNode {
  const colors = NODE_COLORS[colorIndex];

  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: {
      label,
      shape,
      width,
      height,
      color: colors.background,
      textColor: colors.text,
    },
    style: { width, height },
  };
}

function createEdge(
  id: string,
  source: string,
  target: string,
  sourceSide: "top" | "right" | "bottom" | "left" = "right",
  targetSide: "top" | "right" | "bottom" | "left" = "left",
  label?: string
): CanvasEdge {
  return {
    id,
    type: "canvasEdge",
    source,
    target,
    sourceHandle: `${source}-source-${sourceSide}`,
    targetHandle: `${target}-target-${targetSide}`,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: "#f8fafc",
    },
    data: label ? { label } : {},
  };
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description: "An API gateway routes requests to independent services and shared data storage.",
    nodes: [
      createNode("gateway", "API Gateway", "hexagon", 0, 130, 170, 100, 1),
      createNode("users", "User Service", "pill", 250, 0, 160, 80, 2),
      createNode("orders", "Order Service", "pill", 250, 140, 160, 80, 3),
      createNode("payments", "Payment Service", "pill", 250, 280, 160, 80, 4),
      createNode("database", "Database", "cylinder", 500, 130, 150, 100, 7),
    ],
    edges: [
      createEdge("gateway-users", "gateway", "users", "right", "left", "routes"),
      createEdge("gateway-orders", "gateway", "orders", "right", "left", "routes"),
      createEdge("gateway-payments", "gateway", "payments", "right", "left", "routes"),
      createEdge("users-database", "users", "database", "right", "left"),
      createEdge("orders-database", "orders", "database", "right", "left"),
      createEdge("payments-database", "payments", "database", "right", "left"),
    ],
  },
  {
    id: "ci-cd-pipeline",
    name: "CI/CD Pipeline",
    description: "Automate source checks, builds, tests, and deployment to production.",
    nodes: [
      createNode("source", "Source", "cylinder", 0, 100, 130, 100, 1),
      createNode("build", "Build", "rectangle", 190, 100, 140, 100, 2),
      createNode("tests", "Tests", "diamond", 390, 80, 150, 140, 3),
      createNode("deploy", "Deploy", "pill", 600, 100, 140, 100, 6),
      createNode("production", "Production", "circle", 810, 90, 120, 120, 7),
    ],
    edges: [
      createEdge("source-build", "source", "build"),
      createEdge("build-tests", "build", "tests"),
      createEdge("tests-deploy", "tests", "deploy", "right", "left", "pass"),
      createEdge("deploy-production", "deploy", "production"),
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description: "Publish events to a shared broker for independent consumers to process.",
    nodes: [
      createNode("api", "API", "rectangle", 0, 140, 140, 90, 1),
      createNode("broker", "Event Broker", "hexagon", 220, 120, 170, 130, 3),
      createNode("orders", "Order Worker", "pill", 480, 0, 160, 80, 2),
      createNode("notifications", "Notifications", "pill", 480, 180, 160, 80, 6),
      createNode("event-store", "Event Store", "cylinder", 740, 100, 150, 110, 7),
    ],
    edges: [
      createEdge("api-broker", "api", "broker"),
      createEdge("broker-orders", "broker", "orders", "right", "left", "events"),
      createEdge("broker-notifications", "broker", "notifications", "right", "left", "events"),
      createEdge("orders-store", "orders", "event-store", "right", "left"),
      createEdge("notifications-store", "notifications", "event-store", "right", "left"),
    ],
  },
];
