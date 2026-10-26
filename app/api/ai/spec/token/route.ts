import { auth } from "@trigger.dev/sdk";

import { getApiUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

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

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const runId = (body as Record<string, unknown>).runId;
  if (typeof runId !== "string" || !runId.trim()) {
    return Response.json({ error: "A valid runId is required" }, { status: 400 });
  }

  const taskRun = await prisma.taskRun.findFirst({
    where: {
      runId: runId.trim(),
      type: "spec",
      user: { clerkId: clerkUserId },
    },
    select: { runId: true },
  });

  if (!taskRun?.runId) {
    return Response.json({ error: "Run not found" }, { status: 404 });
  }

  let publicAccessToken: string;
  try {
    publicAccessToken = await auth.createPublicToken({
      scopes: { read: { runs: [taskRun.runId] } },
      expirationTime: "1h",
      realtime: { skipColumns: ["payload"] },
    });
  } catch (error) {
    console.error(`Unable to create a public token for spec run ${taskRun.runId}.`, error);
    return Response.json(
      { error: "Unable to create a token for this spec run." },
      { status: 502 }
    );
  }

  return Response.json({ publicAccessToken });
}
