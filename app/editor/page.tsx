import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { EditorShell } from "@/components/editor/editor-shell";
import { getEditorProjectsForUser } from "@/lib/project-data";

export default async function EditorPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { owned, shared } = await getEditorProjectsForUser(userId);
  const initialProjects = [...owned, ...shared];
  const initialSelectedProjectId = initialProjects[0]?.id ?? "";

  return (
    <EditorShell
      initialProjects={initialProjects}
      initialSelectedProjectId={initialSelectedProjectId}
    />
  );
}
