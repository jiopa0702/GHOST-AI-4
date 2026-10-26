import { get } from "@vercel/blob";

import { getApiUserId } from "@/lib/api-auth";
import { getProjectAccessForUser } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type SpecDownloadRouteContext = {
  params: Promise<{ projectId: string; specId: string }>;
};

export async function GET(_request: Request, { params }: SpecDownloadRouteContext) {
  const userId = await getApiUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, specId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const access = await getProjectAccessForUser(userId, projectId);
  if (!access) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const spec = await prisma.projectSpec.findFirst({
    where: { id: specId, projectId },
    select: { id: true, filePath: true },
  });
  if (!spec) {
    return Response.json({ error: "Spec not found" }, { status: 404 });
  }

  try {
    const blob = await get(spec.filePath, {
      access: "private",
      useCache: false,
    });

    if (!blob) {
      return Response.json({ error: "Spec file not found" }, { status: 404 });
    }

    if (blob.statusCode !== 200) {
      console.error(`Spec blob returned status ${blob.statusCode} for spec ${spec.id}.`);
      return Response.json({ error: "Unable to download spec file" }, { status: 502 });
    }

    return new Response(blob.stream, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="spec-${spec.id}.md"`,
        "Content-Type": "text/markdown; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(`Spec download failed for project ${projectId}, spec ${specId}.`, error);
    return Response.json({ error: "Unable to download spec file" }, { status: 502 });
  }
}
