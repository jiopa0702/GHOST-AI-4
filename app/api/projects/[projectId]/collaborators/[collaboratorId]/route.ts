import { getApiUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type CollaboratorRouteContext = {
  params: Promise<{ projectId: string; collaboratorId: string }>;
};

export async function DELETE(_request: Request, { params }: CollaboratorRouteContext) {
  const userId = await getApiUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, collaboratorId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.ownerId !== userId) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const result = await prisma.projectCollaborator.deleteMany({
    where: { id: collaboratorId, projectId },
  });

  if (result.count === 0) {
    return Response.json({ error: "Collaborator not found" }, { status: 404 });
  }

  return new Response(null, { status: 204 });
}
