import { z } from "zod";

export const taskFeedMessageSchema = z
  .object({
    type: z.union([z.literal("ai-status-feed"), z.literal("ai-status")]),
    runId: z.string().min(1),
    status: z.enum(["started", "processing", "complete", "error"]),
    message: z.string().optional(),
    text: z.string().optional(),
    timestamp: z.string().min(1),
  })
  .refine(
    (message) =>
      (typeof message.text === "string" && message.text.trim().length > 0) ||
      (typeof message.message === "string" && message.message.trim().length > 0),
    "A task feed message must include text or message."
  );

export type TaskFeedMessage = z.infer<typeof taskFeedMessageSchema>;

export const aiChatFeedMessageSchema = z.object({
  sender: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
  }),
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(10_000),
  timestamp: z.string().datetime(),
});

export type AiChatFeedMessage = z.infer<typeof aiChatFeedMessageSchema>;

export const specCanvasNodeSchema = z.object({
  id: z.string().min(1).max(200),
  position: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
  data: z.object({
    label: z.string().max(500),
    shape: z.enum(["rectangle", "diamond", "circle", "pill", "cylinder", "hexagon"]),
    color: z.string().max(80),
    width: z.number().finite().positive().max(2000),
    height: z.number().finite().positive().max(2000),
  }),
});

export const specCanvasEdgeSchema = z.object({
  id: z.string().min(1).max(200),
  source: z.string().min(1).max(200),
  target: z.string().min(1).max(200),
  data: z.object({ label: z.string().max(500).optional() }).optional(),
});

export const specGenerationRequestSchema = z.object({
  roomId: z.string().trim().min(1).max(200),
  chatHistory: z.array(aiChatFeedMessageSchema).max(100),
  nodes: z.array(specCanvasNodeSchema).max(200),
  edges: z.array(specCanvasEdgeSchema).max(400),
});

export const generateSpecPayloadSchema = specGenerationRequestSchema.extend({
  projectId: z.string().min(1).max(200),
  taskRunId: z.string().min(1).max(200),
});

export type SpecGenerationRequest = z.infer<typeof specGenerationRequestSchema>;
export type GenerateSpecPayload = z.infer<typeof generateSpecPayloadSchema>;
