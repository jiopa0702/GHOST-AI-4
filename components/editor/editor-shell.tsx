"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import { CanvasRoom, type SpecCanvasSnapshot } from "@/components/editor/canvas-room";
import { AiWorkspaceSidebar } from "@/components/editor/ai-workspace-sidebar";
import { EditorNavbar } from "@/components/editor/editor-navbar";
import { ProjectSidebar } from "@/components/editor/project-sidebar";
import { ShareProjectDialog } from "@/components/editor/share-project-dialog";
import { useProjectActions } from "@/hooks/use-project-actions";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-auto-save";
import type { CanvasTemplate } from "@/components/editor/starter-templates";

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
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [hasSpecSnapshot, setHasSpecSnapshot] = useState(false);
  const [canvasSaveStatus, setCanvasSaveStatus] =
    useState<CanvasSaveStatus>("idle");
  const saveCanvasRef = useRef<(() => Promise<void>) | null>(null);
  const specSnapshotRef = useRef<(() => SpecCanvasSnapshot) | null>(null);
  const importTemplateRef = useRef<((template: CanvasTemplate) => void) | null>(null);
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState(
    initialSelectedProjectId ?? initialProjects[0]?.id ?? ""
  );

  const {
    dialog,
    formValue,
    setFormValue,
    currentSlug,
    error,
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

  const handleCanvasSaveStatusChange = useCallback((status: CanvasSaveStatus) => {
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
      saveStatusTimeoutRef.current = null;
    }

    setCanvasSaveStatus(status);
    if (status === "saved" || status === "error") {
      saveStatusTimeoutRef.current = setTimeout(() => {
        setCanvasSaveStatus("idle");
        saveStatusTimeoutRef.current = null;
      }, 1500);
    }
  }, []);

  const handleSaveReady = useCallback(
    (save: (() => Promise<void>) | null) => {
      saveCanvasRef.current = save;
    },
    []
  );

  const handleTemplateImportReady = useCallback(
    (importTemplate: ((template: CanvasTemplate) => void) | null) => {
      importTemplateRef.current = importTemplate;
    },
    []
  );

  const handleSpecSnapshotReady = useCallback(
    (getSnapshot: (() => SpecCanvasSnapshot) | null) => {
      specSnapshotRef.current = getSnapshot;
      setHasSpecSnapshot(getSnapshot !== null);
    },
    []
  );

  const getSpecCanvasSnapshot = useCallback(
    () => specSnapshotRef.current?.() ?? null,
    []
  );

  const handleTemplateImport = useCallback((template: CanvasTemplate) => {
    importTemplateRef.current?.(template);
  }, []);

  useEffect(
    () => () => {
      if (saveStatusTimeoutRef.current) clearTimeout(saveStatusTimeoutRef.current);
    },
    []
  );

  const closeProjectDialog = () => {
    closeDialog();
  };

  const handleOpenCreateDialog = () => {
    openCreateDialog();
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    router.push(`/editor/${projectId}`);
  };

  return (
    <>
      <div className="h-dvh overflow-hidden bg-base text-copy-primary">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          projectName={workspaceProjectName}
          isAiSidebarOpen={isAiSidebarOpen}
          onToggleAiSidebar={() => setIsAiSidebarOpen((open) => !open)}
          onShare={isWorkspaceShell ? () => setIsShareDialogOpen(true) : undefined}
          saveStatus={isWorkspaceShell ? canvasSaveStatus : undefined}
          onSaveCanvas={
            isWorkspaceShell && selectedProject
              ? () => void saveCanvasRef.current?.()
              : undefined
          }
          onImportTemplate={isWorkspaceShell ? handleTemplateImport : undefined}
          showUserButton={!isWorkspaceShell}
        />

        <ProjectSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          projects={projects}
          onCreateProject={handleOpenCreateDialog}
          onRenameProject={openRenameDialog}
          onDeleteProject={openDeleteDialog}
          selectedProjectId={selectedProjectId}
          onSelectProject={handleSelectProject}
        />

        <main
          className={
            isWorkspaceShell
              ? "fixed inset-x-0 bottom-0 top-14 overflow-hidden bg-base"
              : "fixed inset-x-0 bottom-0 top-14 overflow-y-auto bg-background"
          }
        >
          {isWorkspaceShell ? (
            <div className="absolute inset-0 min-h-0 w-full">
              {selectedProject ? (
                <CanvasRoom
                  roomId={selectedProject.id}
                  onSaveStatusChange={handleCanvasSaveStatusChange}
                  onSaveReady={handleSaveReady}
                  onTemplateImportReady={handleTemplateImportReady}
                  onSpecSnapshotReady={handleSpecSnapshotReady}
                >
                  <AiWorkspaceSidebar
                    isOpen={isAiSidebarOpen}
                    onClose={() => setIsAiSidebarOpen(false)}
                    roomId={selectedProject.id}
                    getCanvasSnapshot={getSpecCanvasSnapshot}
                    canGenerateSpec={hasSpecSnapshot}
                  />
                </CanvasRoom>
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center">
                  <div>
                    <Sparkles className="mx-auto size-6 text-ai-text" />
                    <h1 className="mt-4 text-xl font-semibold text-copy-primary">
                      {workspaceProjectName}
                    </h1>
                    <p className="mt-2 text-sm text-copy-muted">
                      Create a project to start designing on the canvas.
                    </p>
                  </div>
                </div>
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

              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

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

              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

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

              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

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

      {isWorkspaceShell && selectedProject && (
        <ShareProjectDialog
          open={isShareDialogOpen}
          onOpenChange={setIsShareDialogOpen}
          projectId={selectedProject.id}
        />
      )}
    </>
  );
}
