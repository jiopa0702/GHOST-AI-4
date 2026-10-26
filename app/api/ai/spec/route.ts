import { tasks } from "@trigger.dev/sdk";

import { getApiUserId } from "@/lib/api-auth";
import { getProjectAccessForUser } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import type { generateSpec } from "@/src/trigger/generate-spec";
import { specGenerationRequestSchema } from "@/types/task";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const clerkUserId = await getApiUserId();
  if (!clerkUserId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsedBody = specGenerationRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json(
      { error: "Invalid spec generation request", details: parsedBody.error.flatten() },
      { status: 400 }
    );
  }

  const { roomId, chatHistory, nodes, edges } = parsedBody.data;
  const project = await getProjectAccessForUser(clerkUserId, roomId);
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const user = await prisma.user.upsert({
    where: { clerkId: clerkUserId },
    create: { clerkId: clerkUserId },
    update: {},
    select: { id: true },
  });

  const taskRun = await prisma.taskRun.create({
    data: {
      projectId: project.id,
      userId: user.id,
      type: "spec",
      status: "queued",
      input: { roomId, chatHistory, nodes, edges },
    },
    select: { id: true },
  });

  let runId: string;
  try {
    ({ id: runId } = await tasks.trigger<typeof generateSpec>("generate-spec", {
      projectId: project.id,
      roomId,
      chatHistory,
      nodes,
      edges,
      taskRunId: taskRun.id,
    }));
  } catch (error) {
    console.error("Unable to trigger the spec generation task.", error);
    await prisma.taskRun.update({
      where: { id: taskRun.id },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : "Unable to start the spec task.",
        completedAt: new Date(),
      },
    });
    return Response.json({ error: "Unable to start the spec generation task." }, { status: 502 });
  }

  await prisma.taskRun.update({
    where: { id: taskRun.id },
    data: { runId },
  });

  return Response.json({ runId }, { status: 202 });
}
