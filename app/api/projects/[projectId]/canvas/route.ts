import { del, get, put } from "@vercel/blob";

import { getApiUserId } from "@/lib/api-auth";
import { getProjectAccessForUser } from "@/lib/project-access";
import { normalizeCanvasState } from "@/lib/canvas-state";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const maxCanvasBytes = 10 * 1024 * 1024;

type CanvasRouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, { params }: CanvasRouteContext) {
  const userId = await getApiUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const access = await getProjectAccessForUser(userId, projectId);
  if (!access) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (!project.canvasJsonPath) {
    return Response.json(
      { canvas: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const blob = await get(project.canvasJsonPath, {
      access: "private",
      useCache: false,
    });

    if (!blob) {
      console.error(`Canvas blob is missing for project ${projectId}.`);
      return Response.json({ error: "Saved canvas could not be found" }, { status: 502 });
    }

    if (blob.statusCode !== 200 || blob.blob.size > maxCanvasBytes) {
      return Response.json({ error: "Saved canvas is too large to load" }, { status: 413 });
    }

    const serializedCanvas = await new Response(blob.stream).text();
    const canvas: unknown = JSON.parse(serializedCanvas);

    const normalizedCanvas = normalizeCanvasState(canvas);
    if (!normalizedCanvas) {
      console.error(`Canvas blob has an invalid format for project ${projectId}.`);
      return Response.json({ error: "Saved canvas has an invalid format" }, { status: 502 });
    }

    return Response.json(
      { canvas: normalizedCanvas },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error(`Canvas load failed for project ${projectId}.`, error);
    return Response.json({ error: "Unable to load saved canvas" }, { status: 502 });
  }
}

export async function PUT(request: Request, { params }: CanvasRouteContext) {
  const userId = await getApiUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const access = await getProjectAccessForUser(userId, projectId);
  if (!access) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const serializedCanvas = await request.text();
  if (new TextEncoder().encode(serializedCanvas).byteLength > maxCanvasBytes) {
    return Response.json({ error: "Canvas is too large to save" }, { status: 413 });
  }

  let canvas: unknown;
  try {
    canvas = JSON.parse(serializedCanvas);
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const normalizedCanvas = normalizeCanvasState(canvas);
  if (!normalizedCanvas) {
    return Response.json({ error: "Canvas must include valid nodes and edges" }, { status: 400 });
  }

  const existingProject = await prisma.project.findUnique({
    where: { id: projectId },
    select: { canvasJsonPath: true },
  });

  if (!existingProject) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    const blob = await put(
      `projects/${projectId}/canvas.json`,
      JSON.stringify(normalizedCanvas),
      {
        access: "private",
        addRandomSuffix: true,
        contentType: "application/json",
      }
    );

    await prisma.project.update({
      where: { id: projectId },
      data: { canvasJsonPath: blob.url },
    });

    if (existingProject.canvasJsonPath) {
      try {
        await del(existingProject.canvasJsonPath);
      } catch (error) {
        console.error(`Unable to remove the previous canvas blob for project ${projectId}.`, error);
      }
    }

    return Response.json({ saved: true });
  } catch (error) {
    console.error(`Canvas save failed for project ${projectId}.`, error);
    return Response.json({ error: "Unable to save canvas" }, { status: 502 });
  }
}
