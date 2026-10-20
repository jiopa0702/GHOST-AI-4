import { clerkClient } from "@clerk/nextjs/server";

import { getApiUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type CollaboratorsRouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, { params }: CollaboratorsRouteContext) {
  const userId = await getApiUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true },
  });

  if (!project) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const clerkUser = await (await clerkClient()).users.getUser(userId);
  const userEmails = clerkUser.emailAddresses.map(({ emailAddress }) =>
    emailAddress.toLowerCase()
  );
  const isCollaborator =
    userEmails.length > 0 &&
    (await prisma.projectCollaborator.count({
      where: {
        projectId,
        collaboratorEmail: { in: userEmails },
      },
    })) > 0;

  if (project.ownerId !== userId && !isCollaborator) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const collaborators = await prisma.projectCollaborator.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    take: 25,
    select: { id: true, collaboratorEmail: true, createdAt: true },
  });

  const emails = collaborators.map(({ collaboratorEmail }) => collaboratorEmail);
  const users =
    emails.length > 0
      ? await (await clerkClient()).users.getUserList({ emailAddress: emails, limit: 25 })
      : { data: [] };
  const usersByEmail = new Map(
    users.data.flatMap((user) =>
      user.emailAddresses.map((email) => [
        email.emailAddress.toLowerCase(),
        {
          name: user.fullName ?? [user.firstName, user.lastName].filter(Boolean).join(" "),
          avatar: user.imageUrl,
        },
      ])
    )
  );

  return Response.json({
    collaborators: collaborators.map((collaborator) => {
      const email = collaborator.collaboratorEmail.toLowerCase();
      const user = usersByEmail.get(email);

      return {
        id: collaborator.id,
        email: collaborator.collaboratorEmail,
        name: user?.name || null,
        avatar: user?.avatar || null,
        createdAt: collaborator.createdAt,
      };
    }),
    canManage: project.ownerId === userId,
  });
}

export async function POST(request: Request, { params }: CollaboratorsRouteContext) {
  const userId = await getApiUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return Response.json({ error: "Request body must be an object" }, { status: 400 });
  }

  const emailValue = (body as Record<string, unknown>).email;
  if (
    typeof emailValue !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue.trim())
  ) {
    return Response.json({ error: "A valid collaborator email is required" }, { status: 400 });
  }

  const email = emailValue.trim().toLowerCase();
  const collaborator = await prisma.projectCollaborator.upsert({
    where: {
      projectId_collaboratorEmail: {
        projectId,
        collaboratorEmail: email,
      },
    },
    create: { projectId, collaboratorEmail: email },
    update: {},
    select: { id: true, collaboratorEmail: true, createdAt: true },
  });

  return Response.json(
    {
      collaborator: {
        id: collaborator.id,
        email: collaborator.collaboratorEmail,
        name: null,
        avatar: null,
        createdAt: collaborator.createdAt,
      },
    },
    { status: 201 }
  );
}
