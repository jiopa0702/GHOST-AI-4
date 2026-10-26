import { auth, currentUser } from "@clerk/nextjs/server";

import { getProjectAccessForUser } from "@/lib/project-access";
import {
  ensureLiveblocksRoom,
  getLiveblocksClient,
  getUserCursorColor,
} from "@/lib/liveblocks";

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
  let clerkUserLookupError: unknown;
  const clerkUserPromise = currentUser().catch((error: unknown) => {
    clerkUserLookupError = error;
    return null;
  });

  let project: Awaited<ReturnType<typeof getProjectAccessForUser>>;
  let clerkUser: Awaited<ReturnType<typeof currentUser>>;
  try {
    [project, clerkUser] = await Promise.all([
      getProjectAccessForUser(userId, activeProjectId, clerkUserPromise),
      clerkUserPromise,
    ]);
  } catch (error) {
    console.error(`Unable to verify Liveblocks project access for ${activeProjectId}.`, error);
    return Response.json(
      { error: "Unable to verify project access" },
      { status: 503 }
    );
  }

  if (!project) {
    if (clerkUserLookupError) {
      console.error(`Unable to load the Clerk user for project ${activeProjectId}.`, clerkUserLookupError);
      return Response.json(
        { error: "Unable to verify project access" },
        { status: 503 }
      );
    }
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const liveblocks = getLiveblocksClient();

  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name:
        clerkUser?.fullName ??
        clerkUser?.emailAddresses[0]?.emailAddress ??
        userId,
      avatar: clerkUser?.imageUrl,
      color: getUserCursorColor(userId),
    },
  });
  session.allow(activeProjectId, ["*:write"]);

  let authResponse: Awaited<ReturnType<typeof session.authorize>>;
  try {
    await ensureLiveblocksRoom(activeProjectId, project.ownerId);
    authResponse = await session.authorize();
  } catch (error) {
    console.error(`Unable to initialize Liveblocks access for ${activeProjectId}.`, error);
    return Response.json(
      { error: "Unable to initialize Liveblocks access" },
      { status: 503 }
    );
  }

  if (authResponse.status !== 200) {
    console.error(
      `Liveblocks rejected authorization for project ${activeProjectId} with status ${authResponse.status}.`,
      authResponse.error
    );
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
