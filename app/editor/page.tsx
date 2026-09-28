import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { EditorShell } from "@/components/editor/editor-shell";

export default async function EditorPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return <EditorShell />;
}
