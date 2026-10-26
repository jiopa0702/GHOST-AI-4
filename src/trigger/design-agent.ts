import { createGoogle } from "@ai-sdk/google";
import { generateObject, jsonSchema } from "ai";
import { LiveObject, type JsonObject, type Lson } from "@liveblocks/node";
import { task } from "@trigger.dev/sdk";
import { randomUUID } from "node:crypto";

import { getLiveblocksClient } from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";
import { NODE_COLORS, type CanvasNodeData } from "@/types/canvas";
import type { AiDesignStatus, AiDesignStatusEvent } from "@/types/design-agent";

type DesignAction =
  | {
      action: "add_node";
      ref: string;
      label: string;
      shape: CanvasNodeData["shape"];
      color: (typeof NODE_COLORS)[number]["name"];
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | { action: "move_node"; node: string; x: number; y: number }
  | { action: "resize_node"; node: string; width: number; height: number }
  | {
      action: "update_node";
      node: string;
      label?: string;
      shape?: CanvasNodeData["shape"];
      color?: (typeof NODE_COLORS)[number]["name"];
    }
  | { action: "delete_node"; node: string }
  | { action: "add_edge"; source: string; target: string; label?: string };

type DesignPlan = {
  summary: string;
  actions: DesignAction[];
};

type DesignTaskPayload = {
  prompt: string;
  roomId: string;
  projectId: string;
  taskRunId: string;
};

type CanvasNodeSnapshot = {
  id: string;
  label: string;
  shape: string;
  position: { x: number; y: number };
  width: number;
  height: number;
  color: string;
};

type CanvasEdgeSnapshot = {
  id: string;
  source: string;
  target: string;
  label: string;
};

type ResolvedAction =
  | {
      action: "add_node";
      id: string;
      label: string;
      shape: CanvasNodeData["shape"];
      color: (typeof NODE_COLORS)[number];
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | { action: "move_node"; id: string; x: number; y: number }
  | {
      action: "resize_node";
      id: string;
      width: number;
      height: number;
      x: number;
      y: number;
    }
  | {
      action: "update_node";
      id: string;
      label?: string;
      shape?: CanvasNodeData["shape"];
      color?: (typeof NODE_COLORS)[number];
    }
  | { action: "delete_node"; id: string }
  | { action: "add_edge"; id: string; source: string; target: string; label?: string };

type LiveObjectLike = {
  get: (key: string) => unknown;
  set: (key: string, value: Lson | undefined) => void;
};

type LiveMapLike = {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
  delete: (key: string) => unknown;
  entries: () => Iterable<[string, unknown]>;
};

const allowedShapes = [
  "rectangle",
  "diamond",
  "circle",
  "pill",
  "cylinder",
  "hexagon",
] as const;
const maxActions = 80;
const agentColor = "#A78BFA";
const agentUserInfo = { name: "Ghost AI", color: agentColor };
const layoutGrid = 40;
const minimumNodeGap = 100;

const nodeSyncConfig = {
  selected: false,
  dragging: false,
  measured: false,
  resizing: false,
  position: "atomic",
  sourcePosition: "atomic",
  targetPosition: "atomic",
  extent: "atomic",
  origin: "atomic",
  handles: "atomic",
} as const;

const edgeSyncConfig = {
  selected: false,
  markerStart: "atomic",
  markerEnd: "atomic",
  label: "atomic",
  labelBgPadding: "atomic",
} as const;

const designPlanSchema = jsonSchema<unknown>({
  type: "object",
  required: ["summary", "actions"],
  properties: {
    summary: { type: "string" },
    actions: {
      type: "array",
      items: {
        type: "object",
        required: ["action"],
        properties: {
          action: {
            enum: [
              "add_node",
              "move_node",
              "resize_node",
              "update_node",
              "delete_node",
              "add_edge",
            ],
          },
          ref: { type: "string" },
          node: { type: "string" },
          label: { type: "string" },
          shape: { enum: [...allowedShapes] },
          color: { enum: NODE_COLORS.map(({ name }) => name) },
          source: { type: "string" },
          target: { type: "string" },
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" },
        },
      },
    },
  },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isJsonValue(value: unknown): value is JsonObject[string] {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return true;
  }
  if (Array.isArray(value)) return value.every(isJsonValue);
  return isJsonObject(value);
}

function isJsonObject(value: unknown): value is JsonObject {
  return isRecord(value) && Object.values(value).every(isJsonValue);
}

function isLiveObjectLike(value: unknown): value is LiveObjectLike {
  return (
    isRecord(value) &&
    typeof value.get === "function" &&
    typeof value.set === "function"
  );
}

function isLiveMapLike(value: unknown): value is LiveMapLike {
  return (
    isRecord(value) &&
    typeof value.get === "function" &&
    typeof value.set === "function" &&
    typeof value.delete === "function" &&
    typeof value.entries === "function"
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isCanvasShape(value: unknown): value is CanvasNodeData["shape"] {
  return typeof value === "string" && allowedShapes.includes(value as CanvasNodeData["shape"]);
}

function getColor(name: unknown) {
  return NODE_COLORS.find((color) => color.name === name);
}

function parseDesignPlan(value: unknown): DesignPlan {
  if (!isRecord(value) || typeof value.summary !== "string" || !value.summary.trim()) {
    throw new Error("The design model returned an invalid summary.");
  }
  if (!Array.isArray(value.actions) || value.actions.length > maxActions) {
    throw new Error("The design model returned an invalid number of canvas actions.");
  }

  const actions: DesignAction[] = value.actions.map((item): DesignAction => {
    if (!isRecord(item) || typeof item.action !== "string") {
      throw new Error("The design model returned an invalid canvas action.");
    }

    switch (item.action) {
      case "add_node": {
        if (
          typeof item.ref !== "string" ||
          !/^[a-zA-Z0-9_-]{1,60}$/.test(item.ref) ||
          typeof item.label !== "string" ||
          !item.label.trim() ||
          item.label.length > 120 ||
          !isCanvasShape(item.shape) ||
          !getColor(item.color) ||
          !isFiniteNumber(item.x) ||
          !isFiniteNumber(item.y) ||
          !isFiniteNumber(item.width) ||
          !isFiniteNumber(item.height) ||
          Math.abs(item.x) > 20000 ||
          Math.abs(item.y) > 20000 ||
          item.width < 100 ||
          item.width > 360 ||
          item.height < 60 ||
          item.height > 240
        ) {
          throw new Error("The design model returned an invalid node.");
        }
        return {
          action: "add_node",
          ref: item.ref,
          label: item.label.trim(),
          shape: item.shape,
          color: item.color as (typeof NODE_COLORS)[number]["name"],
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height,
        };
      }
      case "move_node":
        if (
          typeof item.node !== "string" ||
          !item.node ||
          !isFiniteNumber(item.x) ||
          !isFiniteNumber(item.y) ||
          Math.abs(item.x) > 20000 ||
          Math.abs(item.y) > 20000
        ) {
          throw new Error("The design model returned an invalid move action.");
        }
        return { action: "move_node", node: item.node, x: item.x, y: item.y };
      case "resize_node":
        if (
          typeof item.node !== "string" ||
          !item.node ||
          !isFiniteNumber(item.width) ||
          !isFiniteNumber(item.height) ||
          item.width < 100 ||
          item.width > 360 ||
          item.height < 60 ||
          item.height > 240
        ) {
          throw new Error("The design model returned an invalid resize action.");
        }
        return {
          action: "resize_node",
          node: item.node,
          width: item.width,
          height: item.height,
        };
      case "update_node": {
        const hasLabel = typeof item.label === "string" && Boolean(item.label.trim());
        const shape = isCanvasShape(item.shape) ? item.shape : undefined;
        const hasShape = shape !== undefined;
        const color = getColor(item.color);
        if (
          typeof item.node !== "string" ||
          !item.node ||
          (!hasLabel && !hasShape && !color) ||
          (item.label !== undefined &&
            (typeof item.label !== "string" || !item.label.trim() || item.label.length > 120)) ||
          (item.shape !== undefined && !hasShape) ||
          (item.color !== undefined && !color)
        ) {
          throw new Error("The design model returned an invalid node update.");
        }
        return {
          action: "update_node",
          node: item.node,
          ...(hasLabel ? { label: (item.label as string).trim() } : {}),
          ...(shape ? { shape } : {}),
          ...(color ? { color: color.name } : {}),
        };
      }
      case "delete_node":
        if (typeof item.node !== "string" || !item.node) {
          throw new Error("The design model returned an invalid delete action.");
        }
        return { action: "delete_node", node: item.node };
      case "add_edge":
        if (
          typeof item.source !== "string" ||
          !item.source ||
          typeof item.target !== "string" ||
          !item.target ||
          (item.label !== undefined &&
            (typeof item.label !== "string" || item.label.length > 100))
        ) {
          throw new Error("The design model returned an invalid edge.");
        }
        return {
          action: "add_edge",
          source: item.source,
          target: item.target,
          ...(typeof item.label === "string" && item.label.trim()
            ? { label: item.label.trim() }
            : {}),
        };
      default:
        throw new Error("The design model returned an unsupported canvas action.");
    }
  });

  return { summary: value.summary.trim(), actions };
}

function readCanvasSnapshot(document: unknown) {
  if (!isRecord(document) || !isRecord(document.flow)) {
    throw new Error("The Liveblocks room does not contain a React Flow document.");
  }

  const nodes = isRecord(document.flow.nodes) ? document.flow.nodes : {};
  const edges = isRecord(document.flow.edges) ? document.flow.edges : {};
  const nodeSnapshots: CanvasNodeSnapshot[] = [];
  const edgeSnapshots: CanvasEdgeSnapshot[] = [];

  for (const [id, value] of Object.entries(nodes)) {
    if (!isRecord(value) || !isRecord(value.position) || !isRecord(value.data)) continue;
    const position = value.position;
    const data = value.data;
    nodeSnapshots.push({
      id,
      label: typeof data.label === "string" ? data.label : "",
      shape: typeof data.shape === "string" ? data.shape : "rectangle",
      position: {
        x: isFiniteNumber(position.x) ? position.x : 0,
        y: isFiniteNumber(position.y) ? position.y : 0,
      },
      width: isFiniteNumber(value.width) ? value.width : 220,
      height: isFiniteNumber(value.height) ? value.height : 100,
      color: typeof data.color === "string" ? data.color : NODE_COLORS[0].background,
    });
  }

  for (const [id, value] of Object.entries(edges)) {
    if (!isRecord(value)) continue;
    const data = isRecord(value.data) ? value.data : {};
    if (typeof value.source !== "string" || typeof value.target !== "string") continue;
    edgeSnapshots.push({
      id,
      source: value.source,
      target: value.target,
      label: typeof data.label === "string" ? data.label : "",
    });
  }

  return { nodes: nodeSnapshots, edges: edgeSnapshots };
}

function resolveActions(plan: DesignPlan, snapshot: ReturnType<typeof readCanvasSnapshot>) {
  const aliases = new Map(snapshot.nodes.map((node) => [node.id, node.id]));
  const activeNodes = new Map(snapshot.nodes.map((node) => [node.id, node.position]));
  const nodeBounds = new Map(
    snapshot.nodes.map((node) => [
      node.id,
      { ...node.position, width: node.width, height: node.height },
    ])
  );
  const activeEdges = new Set(snapshot.edges.map((edge) => edge.id));
  const actions: ResolvedAction[] = [];

  const findAvailablePosition = (
    x: number,
    y: number,
    width: number,
    height: number,
    excludeId?: string
  ) => {
    let candidate = {
      x: Math.round(x / layoutGrid) * layoutGrid,
      y: Math.round(y / layoutGrid) * layoutGrid,
    };
    for (let attempt = 0; attempt < 100; attempt += 1) {
      if (Math.abs(candidate.x) > 20000 || Math.abs(candidate.y) > 20000) {
        throw new Error("The design plan exceeds the canvas layout bounds.");
      }
      const collisions = Array.from(nodeBounds.entries()).filter(
        ([id, bounds]) =>
          id !== excludeId &&
          candidate.x < bounds.x + bounds.width + minimumNodeGap &&
          candidate.x + width + minimumNodeGap > bounds.x &&
          candidate.y < bounds.y + bounds.height + minimumNodeGap &&
          candidate.y + height + minimumNodeGap > bounds.y
      );
      if (collisions.length === 0) return candidate;
      const rightmost = collisions.reduce(
        (right, [, bounds]) => Math.max(right, bounds.x + bounds.width),
        Number.NEGATIVE_INFINITY
      );
      candidate = {
        x: Math.ceil((rightmost + minimumNodeGap) / layoutGrid) * layoutGrid,
        y: candidate.y,
      };
    }
    throw new Error("Unable to find a clear position for a generated node.");
  };

  const resolveNode = (reference: string) => {
    const id = aliases.get(reference);
    if (!id || !activeNodes.has(id)) {
      throw new Error(`The design plan references an unavailable node "${reference}".`);
    }
    return id;
  };

  for (const action of plan.actions) {
    switch (action.action) {
      case "add_node": {
        if (aliases.has(action.ref)) {
          throw new Error(`The design plan reuses the node reference "${action.ref}".`);
        }
        const id = `ai-${randomUUID()}`;
        aliases.set(action.ref, id);
        const position = findAvailablePosition(action.x, action.y, action.width, action.height);
        activeNodes.set(id, position);
        nodeBounds.set(id, { ...position, width: action.width, height: action.height });
        const color = getColor(action.color);
        if (!color) throw new Error("The design plan selected an unsupported node color.");
        actions.push({ ...action, ...position, id, color });
        break;
      }
      case "move_node": {
        const id = resolveNode(action.node);
        const bounds = nodeBounds.get(id);
        if (!bounds) throw new Error(`The design plan references an unavailable node "${action.node}".`);
        const position = findAvailablePosition(action.x, action.y, bounds.width, bounds.height, id);
        activeNodes.set(id, position);
        nodeBounds.set(id, { ...bounds, ...position });
        actions.push({ ...action, ...position, id });
        break;
      }
      case "resize_node": {
        const id = resolveNode(action.node);
        const bounds = nodeBounds.get(id);
        if (!bounds) throw new Error(`The design plan references an unavailable node "${action.node}".`);
        const position = findAvailablePosition(
          bounds.x,
          bounds.y,
          action.width,
          action.height,
          id
        );
        activeNodes.set(id, position);
        nodeBounds.set(id, { ...position, width: action.width, height: action.height });
        actions.push({ ...action, ...position, id });
        break;
      }
      case "update_node": {
        const id = resolveNode(action.node);
        const color = action.color ? getColor(action.color) : undefined;
        if (action.color && !color) throw new Error("The design plan selected an unsupported node color.");
        actions.push({
          action: "update_node",
          id,
          ...(action.label !== undefined ? { label: action.label } : {}),
          ...(action.shape !== undefined ? { shape: action.shape } : {}),
          ...(color ? { color } : {}),
        });
        break;
      }
      case "delete_node": {
        const id = resolveNode(action.node);
        activeNodes.delete(id);
        nodeBounds.delete(id);
        for (const edge of snapshot.edges) {
          if (edge.source === id || edge.target === id) activeEdges.delete(edge.id);
        }
        actions.push({ ...action, id });
        break;
      }
      case "add_edge": {
        const source = resolveNode(action.source);
        const target = resolveNode(action.target);
        if (source === target) throw new Error("The design plan cannot connect a node to itself.");
        const id = `ai-${randomUUID()}`;
        if (activeEdges.has(id)) throw new Error("Unable to create a unique edge ID.");
        activeEdges.add(id);
        actions.push({ ...action, id, source, target });
        break;
      }
    }
  }

  return actions;
}

function getActionCursor(
  action: ResolvedAction,
  positions: Map<string, { x: number; y: number }>
) {
  if (action.action === "add_node") return { x: action.x, y: action.y };
  if (action.action === "move_node") return { x: action.x, y: action.y };
  if (action.action === "resize_node") return { x: action.x, y: action.y };
  if (action.action === "add_edge") {
    const source = positions.get(action.source);
    const target = positions.get(action.target);
    if (source && target) {
      return { x: (source.x + target.x) / 2, y: (source.y + target.y) / 2 };
    }
  }
  if ("id" in action) return positions.get(action.id) ?? { x: 0, y: 0 };
  return { x: 0, y: 0 };
}

function assertStorageFlow(root: LiveObjectLike) {
  const flow = root.get("flow");
  if (!isLiveObjectLike(flow)) {
    throw new Error("The Liveblocks room is missing its collaborative flow.");
  }
  const nodes = flow.get("nodes");
  const edges = flow.get("edges");
  if (!isLiveMapLike(nodes) || !isLiveMapLike(edges)) {
    throw new Error("The Liveblocks flow storage is invalid.");
  }
  return { flow, nodes, edges };
}

function updateNodeData(node: LiveObjectLike, changes: Record<string, string | number>) {
  const currentData = node.get("data");
  if (isLiveObjectLike(currentData)) {
    for (const [key, value] of Object.entries(changes)) currentData.set(key, value);
    return;
  }
  if (isJsonObject(currentData)) {
    const data: JsonObject = { ...currentData, ...changes };
    node.set("data", data);
    return;
  }
  throw new Error("The selected node has invalid data.");
}

async function applyAction(
  roomId: string,
  action: ResolvedAction,
  liveblocks: ReturnType<typeof getLiveblocksClient>
) {
  await liveblocks.mutateStorage(roomId, ({ root }) => {
    const { nodes, edges } = assertStorageFlow(root);
    switch (action.action) {
      case "add_node": {
        const node: JsonObject = {
          id: action.id,
          type: "canvasNode",
          position: { x: action.x, y: action.y },
          width: action.width,
          height: action.height,
          style: { width: action.width, height: action.height },
          data: {
            label: action.label,
            shape: action.shape,
            color: action.color.background,
            textColor: action.color.text,
            width: action.width,
            height: action.height,
          },
        };
        nodes.set(action.id, LiveObject.from(node, nodeSyncConfig));
        break;
      }
      case "move_node": {
        const node = nodes.get(action.id);
        if (!isLiveObjectLike(node)) throw new Error(`Node "${action.id}" no longer exists.`);
        node.set("position", { x: action.x, y: action.y });
        break;
      }
      case "resize_node": {
        const node = nodes.get(action.id);
        if (!isLiveObjectLike(node)) throw new Error(`Node "${action.id}" no longer exists.`);
        node.set("position", { x: action.x, y: action.y });
        node.set("width", action.width);
        node.set("height", action.height);
        node.set("style", { width: action.width, height: action.height });
        updateNodeData(node, { width: action.width, height: action.height });
        break;
      }
      case "update_node": {
        const node = nodes.get(action.id);
        if (!isLiveObjectLike(node)) throw new Error(`Node "${action.id}" no longer exists.`);
        const changes: Record<string, string | number> = {};
        if (action.label !== undefined) changes.label = action.label;
        if (action.shape !== undefined) changes.shape = action.shape;
        if (action.color !== undefined) {
          changes.color = action.color.background;
          changes.textColor = action.color.text;
        }
        updateNodeData(node, changes);
        break;
      }
      case "delete_node": {
        nodes.delete(action.id);
        for (const [edgeId, edge] of edges.entries()) {
          if (!isLiveObjectLike(edge)) continue;
          if (edge.get("source") === action.id || edge.get("target") === action.id) {
            edges.delete(edgeId);
          }
        }
        break;
      }
      case "add_edge": {
        const edge: JsonObject = {
          id: action.id,
          type: "canvasEdge",
          source: action.source,
          target: action.target,
          sourceHandle: `${action.source}-source-right`,
          targetHandle: `${action.target}-target-left`,
          markerEnd: {
            type: "arrowclosed",
            width: 16,
            height: 16,
            color: "#f8fafc",
          },
          data: action.label ? { label: action.label } : {},
        };
        edges.set(action.id, LiveObject.from(edge, edgeSyncConfig));
        break;
      }
    }
  });

}

export const designAgent = task({
  id: "design-agent",
  maxDuration: 3600,
  run: async (payload: DesignTaskPayload, { ctx }) => {
    let liveblocks: ReturnType<typeof getLiveblocksClient> | undefined;
    const runId = ctx.run.id;
    const positions = new Map<string, { x: number; y: number }>();

    const publishStatus = async (status: AiDesignStatus, message: string) => {
      const event: AiDesignStatusEvent = {
        type: "ai-status-feed",
        runId,
        status,
        message,
        timestamp: new Date().toISOString(),
      };
      if (!liveblocks) return;
      try {
        await liveblocks.broadcastEvent(payload.roomId, event);
      } catch (error) {
        console.error(`Unable to publish design status for run ${runId}.`, error);
      }
    };

    const updateAgentPresence = async (
      cursor: { x: number; y: number } | null,
      thinking: boolean,
      status: string | null,
      ttl = 3599
    ) => {
      if (!liveblocks) return;
      try {
        await liveblocks.setPresence(
          payload.roomId,
          {
            userId: "ghost-ai",
            data: { cursor, thinking, status },
            userInfo: agentUserInfo,
            ttl,
          }
        );
      } catch (error) {
        console.error(`Unable to update Ghost AI presence for run ${runId}.`, error);
      }
    };

    try {
      await prisma.taskRun.update({
        where: { id: payload.taskRunId },
        data: { runId, status: "running", startedAt: new Date() },
      });
      liveblocks = getLiveblocksClient();
      await updateAgentPresence({ x: 0, y: 0 }, true, "Starting design");
      await publishStatus("started", "Ghost AI started working on the design.");

      if (!payload.prompt.trim() || payload.roomId !== payload.projectId) {
        throw new Error("The design task received invalid project context.");
      }

      const [project, document] = await Promise.all([
        prisma.project.findUnique({
          where: { id: payload.projectId },
          select: { name: true, description: true },
        }),
        liveblocks.getStorageDocument(payload.roomId, "json"),
      ]);
      if (!project) throw new Error("The project for this design run no longer exists.");

      const snapshot = readCanvasSnapshot(document);
      for (const node of snapshot.nodes) positions.set(node.id, node.position);
      await updateAgentPresence(
        snapshot.nodes[0]?.position ?? { x: 0, y: 0 },
        true,
        "Planning canvas changes"
      );
      await publishStatus("processing", "Ghost AI is planning canvas changes.");

      const apiKey =
        process.env.GEMINI_API_KEY ??
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
        process.env.GEMINI_AI_API_KEY;
      if (!apiKey) {
        throw new Error(
          "Set GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GEMINI_AI_API_KEY in my-app/.env.local to generate a design."
        );
      }

      const model = createGoogle({ apiKey })("gemini-3-flash-preview");
      const currentCanvas = {
        nodes: snapshot.nodes.slice(0, 80),
        edges: snapshot.edges.slice(0, 120),
      };
      const generated = await generateObject({
        model,
        schema: designPlanSchema,
        schemaName: "collaborative_canvas_design_actions",
        schemaDescription:
          "A validated sequence of changes to make to an existing collaborative system architecture canvas.",
        system: [
          "You are Ghost AI, an architecture design agent for a collaborative system design canvas.",
          "Interpret the user request and return only the minimum ordered actions needed to create or modify the requested design.",
          "The canvas only supports node shapes: rectangle, diamond, circle, pill, cylinder, and hexagon.",
          `Choose node colors only by palette name: ${NODE_COLORS.map(({ name }) => name).join(", ")}.`,
          "Use a clear left-to-right architecture layout on a 40px grid. Keep nodes at least 100px apart, use 220x100px as a typical node size, and avoid overlaps.",
          "For a new design, create a readable system with labeled components and meaningful directed connections. For an existing design, preserve unrelated nodes and edges.",
          "Use existing node IDs exactly as given when moving, resizing, updating, or deleting nodes, and when connecting existing nodes. New-node refs must be unique, simple IDs and may be used by later actions in the same plan.",
          "Never invent operations other than add_node, move_node, resize_node, update_node, delete_node, and add_edge.",
          "Do not return markdown or explanations in place of structured actions.",
        ].join("\n"),
        prompt: [
          `Project: ${project.name}`,
          `Project description: ${project.description ?? "Not provided"}`,
          `User request: ${payload.prompt}`,
          `Current canvas JSON: ${JSON.stringify(currentCanvas)}`,
        ].join("\n\n"),
        temperature: 0.2,
      });

      const plan = parseDesignPlan(generated.object);
      const actions = resolveActions(plan, snapshot);
      await prisma.taskRun.update({
        where: { id: payload.taskRunId },
        data: { status: "processing" },
      });
      await publishStatus(
        "processing",
        actions.length
          ? `Applying ${actions.length} canvas change${actions.length === 1 ? "" : "s"}.`
          : "The current canvas already matches the request."
      );

      for (const action of actions) {
        const cursor = getActionCursor(action, positions);
        await updateAgentPresence(cursor, true, "Updating the shared canvas");
        await applyAction(payload.roomId, action, liveblocks);
        if (action.action === "move_node") positions.set(action.id, { x: action.x, y: action.y });
        if (action.action === "add_node") positions.set(action.id, { x: action.x, y: action.y });
        if (action.action === "resize_node") positions.set(action.id, { x: action.x, y: action.y });
        if (action.action === "delete_node") positions.delete(action.id);
      }

      await prisma.taskRun.update({
        where: { id: payload.taskRunId },
        data: {
          status: "completed",
          output: { summary: plan.summary, actionCount: actions.length },
          completedAt: new Date(),
        },
      });
      await publishStatus("complete", plan.summary);

      return { summary: plan.summary, actionCount: actions.length };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Design generation failed.";
      console.error(`Design task run ${runId} failed.`, error);
      try {
        await prisma.taskRun.update({
          where: { id: payload.taskRunId },
          data: { status: "failed", error: message, completedAt: new Date() },
        });
      } catch (updateError) {
        console.error(`Unable to record the failure for design run ${runId}.`, updateError);
      }
      await publishStatus("error", message);
      throw error;
    } finally {
      if (liveblocks) await updateAgentPresence(null, false, null, 2);
    }
  },
});
