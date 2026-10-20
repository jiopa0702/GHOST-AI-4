import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/editor/access-denied";
import { EditorShell } from "@/components/editor/editor-shell";
import { getCurrentClerkIdentity, getProjectAccessForUser } from "@/lib/project-access";
import { getEditorProjectsForUser } from "@/lib/project-data";

type EditorRoomPageProps = {
  params: Promise<{ roomId: string }>;
};

export default async function EditorRoomPage({ params }: EditorRoomPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const identity = (await getCurrentClerkIdentity()) ?? { userId, primaryEmail: null };
  const { roomId } = await params;

  const project = await getProjectAccessForUser(identity.userId, roomId);

  if (!project) {
    return <AccessDenied />;
  }

  const { owned, shared } = await getEditorProjectsForUser(identity.userId);
  const initialProjects = [...owned, ...shared];

  return (
    <EditorShell
      key={roomId}
      initialProjects={initialProjects}
      initialSelectedProjectId={roomId}
      projectName={project.name}
      isWorkspaceShell
    />
  );
}
