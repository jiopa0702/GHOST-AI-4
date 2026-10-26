import { auth, tasks } from "@trigger.dev/sdk";
import { getApiUserId } from "@/lib/api-auth";
import { getProjectAccessForUser } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import type { designAgent } from "@/src/trigger/design-agent";

export const runtime = "nodejs";

const maxPromptLength = 10_000;

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

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const { prompt, roomId } = body as Record<string, unknown>;
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > maxPromptLength) {
    return Response.json(
      { error: `Prompt must be a non-empty string of at most ${maxPromptLength} characters` },
      { status: 400 }
    );
  }

  if (
    typeof roomId !== "string" ||
    !roomId.trim()
  ) {
    return Response.json(
      { error: "A valid roomId is required" },
      { status: 400 }
    );
  }

  const normalizedRoomId = roomId.trim();
  const projectId = normalizedRoomId;
  const project = await getProjectAccessForUser(clerkUserId, projectId);
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
      projectId,
      userId: user.id,
      type: "design",
      status: "queued",
      input: {
        prompt: prompt.trim(),
        roomId: normalizedRoomId,
      },
    },
    select: { id: true },
  });

  let runId: string;
  try {
    ({ id: runId } = await tasks.trigger<typeof designAgent>("design-agent", {
      prompt: prompt.trim(),
      roomId,
      projectId,
      taskRunId: taskRun.id,
    }));
  } catch (error) {
    console.error("Unable to trigger the design task.", error);
    await prisma.taskRun.update({
      where: { id: taskRun.id },
      data: {
        status: "failed",
        error: error instanceof Error ? error.message : "Unable to start the design task",
        completedAt: new Date(),
      },
    });
    return Response.json({ error: "Unable to start the design task" }, { status: 502 });
  }

  await prisma.taskRun.update({
    where: { id: taskRun.id },
    data: { runId },
  });

  let publicAccessToken: string;
  try {
    publicAccessToken = await auth.createPublicToken({
      scopes: { read: { runs: [runId] } },
      expirationTime: "1h",
      realtime: { skipColumns: ["payload"] },
    });
  } catch (error) {
    console.error(`Unable to create a public token for run ${runId}.`, error);
    return Response.json(
      { error: "The design task started, but its live status token could not be created.", runId },
      { status: 502 }
    );
  }

  return Response.json({ runId, publicAccessToken }, { status: 202 });
}
