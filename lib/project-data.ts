import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export type ProjectListItem = {
  id: string;
  name: string;
  owner: boolean;
  roomId: string;
};

export async function getEditorProjectsForUser(userId?: string | null) {
  const activeUserId = userId ?? (await auth()).userId;

  if (!activeUserId) {
    return { owned: [] as ProjectListItem[], shared: [] as ProjectListItem[] };
  }

  const clerkUser = await currentUser();
  const emails =
    clerkUser?.id === activeUserId
      ? clerkUser.emailAddresses.map(({ emailAddress }) => emailAddress.toLowerCase())
      : [];

  const [ownedProjects, membershipRecord, invitedCollaborations] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: activeUserId },
      select: { id: true, name: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { clerkId: activeUserId },
      select: {
        id: true,
        memberships: {
          select: {
            project: {
              select: { id: true, name: true, ownerId: true },
            },
          },
        },
      },
    }),
    emails.length > 0
      ? prisma.projectCollaborator.findMany({
          where: { collaboratorEmail: { in: emails } },
          select: {
            project: {
              select: { id: true, name: true, ownerId: true },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const owned = ownedProjects.map((project) => ({
    id: project.id,
    name: project.name,
    owner: true,
    roomId: project.id,
  }));

  const sharedProjects = [
    ...(membershipRecord?.memberships ?? []).map(({ project }) => project),
    ...invitedCollaborations.map(({ project }) => project),
  ];
  const shared = Array.from(new Map(sharedProjects.map((project) => [project.id, project])).values())
    .map((project) => ({
      id: project.id,
      name: project.name,
      owner: project.ownerId === activeUserId,
      roomId: project.id,
    }))
    .filter((project) => !project.owner);

  return {
    owned,
    shared,
  };
}
