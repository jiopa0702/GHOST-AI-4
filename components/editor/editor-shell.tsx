"use client";

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
import { useProjectDialogs } from "@/components/editor/use-project-dialogs";
import { AlertTriangle, Plus } from "lucide-react";
import { useRef, useState } from "react";

type Project = {
  id: string;
  name: string;
  owner: boolean;
};

const initialProjects: Project[] = [
  { id: "p-1", name: "Ghost AI Workspace", owner: true },
  { id: "p-2", name: "Launch Brief", owner: true },
  { id: "p-3", name: "Design System", owner: false },
  { id: "p-4", name: "Ops Review", owner: false },
];

export function EditorShell() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjects[0].id);
  const createProjectRequestRef = useRef(false);
  const {
    dialog,
    formValue,
    setFormValue,
    currentSlug,
    isSubmitting,
    beginSubmit,
    finishSubmit,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
  } = useProjectDialogs();

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? projects[0] ?? null;

  const closeProjectDialog = () => {
    createProjectRequestRef.current = false;
    closeDialog();
  };

  const handleOpenCreateDialog = () => {
    createProjectRequestRef.current = false;
    openCreateDialog();
  };

  const createProject = () => {
    if (createProjectRequestRef.current) {
      return;
    }

    const name = formValue.trim();
    if (!name) {
      return;
    }

    createProjectRequestRef.current = true;

    const nextProject: Project = {
      id: `p-${Date.now()}`,
      name,
      owner: true,
    };

    setProjects((current) => [nextProject, ...current]);
    setSelectedProjectId(nextProject.id);
    closeProjectDialog();
  };

  const renameProject = () => {
    const name = formValue.trim();
    if (!dialog.projectId || !name) {
      return;
    }

    setProjects((current) =>
      current.map((project) =>
        project.id === dialog.projectId ? { ...project, name } : project
      )
    );

    if (selectedProjectId === dialog.projectId) {
      setSelectedProjectId(dialog.projectId);
    }

    closeProjectDialog();
  };

  const deleteProject = () => {
    if (!dialog.projectId) {
      return;
    }

    const nextProjects = projects.filter((project) => project.id !== dialog.projectId);
    setProjects(nextProjects);

    if (selectedProjectId === dialog.projectId) {
      setSelectedProjectId(nextProjects[0]?.id ?? "");
    }

    closeProjectDialog();
  };

  const handleSubmit = () => {
    if (isSubmitting) {
      return;
    }

    beginSubmit();

    try {
      if (dialog.mode === "create") {
        createProject();
      }

      if (dialog.mode === "rename") {
        renameProject();
      }

      if (dialog.mode === "delete") {
        deleteProject();
      }
    } finally {
      finishSubmit();
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background text-copy-primary">
        <EditorNavbar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
          projectName={selectedProject?.name ?? "Ghost AI Workspace"}
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
                        handleSubmit();
                      }
                    }}
                  />
                </div>

                <div className="rounded-xl border border-surface-border bg-subtle p-3 text-sm">
                  <p className="text-copy-muted">Slug preview</p>
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
                  onClick={handleSubmit}
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
                  Current project name: {dialog.projectName ?? "Untitled project"}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <label className="text-sm font-medium text-copy-primary">
                  Project name
                </label>
                <Input
                  autoFocus
                  value={formValue}
                  onChange={(event) => setFormValue(event.target.value)}
                  placeholder="Enter a project name"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeProjectDialog}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
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
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-5 text-destructive" />
                  <DialogTitle>Delete project</DialogTitle>
                </div>
                <DialogDescription>
                  Are you sure you want to delete {dialog.projectName ?? "this project"}? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeProjectDialog}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
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
