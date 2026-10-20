import { getApiUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getEditorProjectsForUser } from "@/lib/project-data";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getApiUserId();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { owned, shared } = await getEditorProjectsForUser(userId);
  const projects = [...owned, ...shared];

  return Response.json({ projects });
}

export async function POST(request: Request) {
  const userId = await getApiUserId();
  if (!userId) {
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

  const nameValue = (body as Record<string, unknown>).name;
  if (nameValue !== undefined && typeof nameValue !== "string") {
    return Response.json({ error: "Project name must be a string" }, { status: 400 });
  }

  const name = typeof nameValue === "string" ? nameValue.trim() : "untitled project";
  if (!name) {
    return Response.json({ error: "Project name cannot be empty" }, { status: 400 });
  }

  const idValue = (body as Record<string, unknown>).id;
  if (
    idValue !== undefined &&
    (typeof idValue !== "string" ||
      idValue.length > 120 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(idValue))
  ) {
    return Response.json({ error: "Project ID must be a valid lowercase slug" }, { status: 400 });
  }

  await prisma.user.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId },
    update: {},
  });

  const project = await prisma.project.create({
    data: {
      ...(typeof idValue === "string" ? { id: idValue } : {}),
      name,
      ownerId: userId,
    },
  });

  return Response.json({ project }, { status: 201 });
}