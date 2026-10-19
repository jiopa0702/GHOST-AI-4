"use client";

import { useEffect, useState } from "react";
import { Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { useProjectActions } from "@/hooks/use-project-actions";

type Project = {
  id: string;
  name: string;
  owner: boolean;
  roomId?: string;
};

type EditorShellProps = {
  initialProjects: Project[];
  initialSelectedProjectId?: string;
  projectName?: string;
  isWorkspaceShell?: boolean;
};

export function EditorShell({
  initialProjects,
  initialSelectedProjectId,
  projectName,
  isWorkspaceShell = false,
}: EditorShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialSelectedProjectId ?? initialProjects[0]?.id ?? ""
  );

  useEffect(() => {
    setProjects(initialProjects);
    setSelectedProjectId(
      initialSelectedProjectId ?? initialProjects[0]?.id ?? ""
    );
  }, [initialProjects, initialSelectedProjectId]);

  const {
    dialog,
    formValue,
    setFormValue,
    currentSlug,
    isSubmitting,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    handleSubmit,
  } = useProjectActions({
    projects,
    setProjects,
    selectedProjectId,
    setSelectedProjectId,
  });

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null;

  const workspaceProjectName = projectName ?? selectedProject?.name ?? "Ghost AI Workspace";

  const closeProjectDialog = () => {
    closeDialog();
  };

  const handleOpenCreateDialog = () => {
    openCreateDialog();
  };

  return (
    <>
      <div className="min-h-screen bg-background text-copy-primary">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          projectName={workspaceProjectName}
          isAiSidebarOpen={isAiSidebarOpen}
          onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
        />

        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close project sidebar backdrop"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          />
        )}

        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          projects={projects}
          onCreateProject={handleOpenCreateDialog}
          onRenameProject={openRenameDialog}
          onDeleteProject={openDeleteDialog}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
        />

        <main className="pt-14">
          {isWorkspaceShell ? (
            <div className="flex min-h-[calc(100vh-3.5rem)]">
              <div className="flex-1 bg-[#0b0d10]">
                <div className="flex h-full items-center justify-center px-6 py-10">
                  <div className="w-full max-w-2xl rounded-2xl border border-border bg-[#12151b] p-8 text-center shadow-2xl shadow-black/20">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Sparkles className="size-5" />
                    </div>
                    <p className="mb-2 text-xs uppercase tracking-[0.22em] text-copy-muted">
                      Workspace
                    </p>
                    <h1 className="text-3xl font-semibold tracking-tight text-copy-primary sm:text-4xl">
                      {workspaceProjectName}
                    </h1>
                    <p className="mt-3 text-sm leading-6 text-copy-secondary">
                      This room is ready for the next editor canvas and collaboration features.
                    </p>
                  </div>
                </div>
              </div>

              {isAiSidebarOpen && (
                <aside className="hidden w-80 border-l border-border bg-subtle lg:block">
                  <div className="flex h-full flex-col">
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-medium text-copy-primary">AI assistant</p>
                    </div>
                    <div className="flex flex-1 items-center justify-center px-6 text-center">
                      <p className="text-sm leading-6 text-copy-muted">
                        AI chat and context panels will appear here soon.
                      </p>
                    </div>
                  </div>
                </aside>
              )}
            </div>
          ) : (
            <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-10">
              <div className="w-full max-w-3xl text-left">
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-copy-muted">
                  Editor
                </p>
                <h1 className="text-3xl font-semibold tracking-tight text-copy-primary sm:text-4xl">
                  Create a project or open an existing one
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-copy-secondary sm:text-base">
                  Start a new architecture workspace, or choose a project from your workspace.
                </p>

                <div className="mt-8 flex items-center gap-3">
                  <Button
                    type="button"
                    onClick={handleOpenCreateDialog}
                    className="inline-flex items-center gap-2"
                  >
                    <Plus className="size-4" />
                    New project
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Dialog
        open={dialog.mode !== null}
        onOpenChange={(open) => {
          if (!open) {
            closeProjectDialog();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          {dialog.mode === "create" && (
            <>
              <DialogHeader>
                <DialogTitle>Create project</DialogTitle>
                <DialogDescription>
                  Start a new architecture workspace and define its project slug.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-copy-primary">
                    Project name
                  </label>
                  <Input
                    autoFocus
                    value={formValue}
                    onChange={(event) => setFormValue(event.target.value)}
                    placeholder="e.g. Platform redesign"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleSubmit();
                      }
                    }}
                  />
                </div>

                <div className="rounded-xl border border-surface-border bg-subtle p-3 text-sm">
                  <p className="text-copy-muted">Room ID preview</p>
                  <p className="mt-1 font-medium text-copy-primary">
                    {currentSlug || "project-slug"}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeProjectDialog}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!formValue.trim() || isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Create project"}
                </Button>
              </DialogFooter>
            </>
          )}

          {dialog.mode === "rename" && (
            <>
              <DialogHeader>
                <DialogTitle>Rename project</DialogTitle>
                <DialogDescription>
                  Update the project name and keep the workspace in sync.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-copy-primary">
                    Project name
                  </label>
                  <Input
                    autoFocus
                    value={formValue}
                    onChange={(event) => setFormValue(event.target.value)}
                    placeholder="Project name"
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        void handleSubmit();
                      }
                    }}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeProjectDialog}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={!formValue.trim() || isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </>
          )}

          {dialog.mode === "delete" && (
            <>
              <DialogHeader>
                <DialogTitle>Delete project</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. The project will be permanently removed.
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-copy-primary">
                <p className="font-medium">Delete &ldquo;{dialog.projectName ?? "this project"}&rdquo;?</p>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeProjectDialog}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Deleting..." : "Delete project"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
