import { auth, currentUser } from "@clerk/nextjs/server";

import { getProjectAccessForUser } from "@/lib/project-access";
import { getLiveblocksClient, getUserCursorColor } from "@/lib/liveblocks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { userId } = await auth();

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
    return Response.json({ error: "Project ID is required" }, { status: 400 });
  }

  const roomId = (body as Record<string, unknown>).room;

  if (typeof roomId !== "string" || !roomId.trim()) {
    return Response.json({ error: "A valid room is required" }, { status: 400 });
  }

  const activeProjectId = roomId.trim();
  const project = await getProjectAccessForUser(userId, activeProjectId);

  if (!project) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const liveblocks = getLiveblocksClient();

  const [, clerkUser] = await Promise.all([
    liveblocks.getOrCreateRoom(activeProjectId, {
      defaultAccesses: [],
      metadata: {
        projectId: activeProjectId,
        ownerId: project.ownerId,
      },
    }),
    currentUser(),
  ]);
  const name =
    clerkUser?.fullName ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    userId;
  const avatar =
    clerkUser?.imageUrl ??
    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
  const color = getUserCursorColor(userId);

  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name,
      avatar,
      color,
    },
  });
  session.allow(activeProjectId, ["*:write"]);

  const authResponse = await session.authorize();

  if (authResponse.status !== 200) {
    return Response.json(
      { error: "Unable to authorize room access" },
      { status: authResponse.status >= 400 ? authResponse.status : 500 }
    );
  }

  return new Response(authResponse.body, {
    status: authResponse.status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
