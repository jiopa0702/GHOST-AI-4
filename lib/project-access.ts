import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export type ClerkIdentity = {
  userId: string;
  primaryEmail: string | null;
};

export async function getCurrentClerkIdentity(): Promise<ClerkIdentity | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { email: true },
  });

  return {
    userId,
    primaryEmail: user?.email ?? null,
  };
}

export async function getProjectAccessForUser(userId: string, projectId: string) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { ownerId: userId },
        { members: { some: { user: { clerkId: userId } } } },
      ],
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
    },
  });
}

export async function hasProjectAccess(userId: string, projectId: string) {
  return Boolean(await getProjectAccessForUser(userId, projectId));
}
