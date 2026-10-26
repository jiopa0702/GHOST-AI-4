import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export type ClerkIdentity = {
  userId: string;
  primaryEmail: string | null;
};

type ProjectAccessClerkUser = {
  id: string;
  emailAddresses: Array<{ emailAddress: string }>;
};

export async function getCurrentClerkIdentity(): Promise<ClerkIdentity | null> {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const clerkUser = await currentUser();

  return {
    userId,
    primaryEmail: clerkUser?.primaryEmailAddress?.emailAddress ?? null,
  };
}

export async function getProjectAccessForUser(
  userId: string,
  projectId: string,
  clerkUserPromise?: Promise<ProjectAccessClerkUser | null>
) {
  const project = await prisma.project.findFirst({
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

  if (project) {
    return project;
  }

  const clerkUser = clerkUserPromise
    ? await clerkUserPromise
    : await currentUser();
  if (clerkUser?.id !== userId) {
    return null;
  }

  const emails = clerkUser.emailAddresses.map(({ emailAddress }) =>
    emailAddress.toLowerCase()
  );
  if (emails.length === 0) {
    return null;
  }

  return prisma.project.findFirst({
    where: {
      id: projectId,
      collaborators: { some: { collaboratorEmail: { in: emails } } },
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
