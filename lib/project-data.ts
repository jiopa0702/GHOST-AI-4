import { auth } from "@clerk/nextjs/server";

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

  const [ownedProjects, membershipRecord] = await Promise.all([
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
  ]);

  const owned = ownedProjects.map((project) => ({
    id: project.id,
    name: project.name,
    owner: true,
    roomId: project.id,
  }));

  const shared = (membershipRecord?.memberships ?? [])
    .map(({ project }) => ({
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
