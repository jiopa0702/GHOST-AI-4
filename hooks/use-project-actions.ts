"use client";

import { useCallback, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";

export type ProjectActionProject = {
  id: string;
  name: string;
  owner: boolean;
  roomId?: string;
};

export type ProjectDialogMode = "create" | "rename" | "delete" | null;

export type ProjectDialogState = {
  mode: ProjectDialogMode;
  projectId?: string;
  projectName?: string;
};

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildRoomPreview = (value: string, suffix: string) => {
  const base = slugify(value).slice(0, 100).replace(/-+$/g, "");
  if (!base) {
    return `project-${suffix}`;
  }

  return `${base}-${suffix}`;
};

export function useProjectActions({
  projects,
  setProjects,
  selectedProjectId,
  setSelectedProjectId,
}: {
  projects: ProjectActionProject[];
  setProjects: Dispatch<SetStateAction<ProjectActionProject[]>>;
  selectedProjectId: string;
  setSelectedProjectId: (projectId: string) => void;
}) {
  const router = useRouter();
  const [dialog, setDialog] = useState<ProjectDialogState>({ mode: null });
  const [formValue, setFormValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomIdSuffix, setRoomIdSuffix] = useState("");

  const openCreateDialog = useCallback(() => {
    setDialog({ mode: "create" });
    setFormValue("");
    setIsSubmitting(false);
    setError(null);
    setRoomIdSuffix(crypto.randomUUID().replace(/-/g, "").slice(0, 8));
  }, []);

  const openRenameDialog = useCallback((project: { id: string; name: string }) => {
    setDialog({ mode: "rename", projectId: project.id, projectName: project.name });
    setFormValue(project.name);
    setIsSubmitting(false);
    setError(null);
  }, []);

  const openDeleteDialog = useCallback((project: { id: string; name: string }) => {
    setDialog({ mode: "delete", projectId: project.id, projectName: project.name });
    setFormValue("");
    setIsSubmitting(false);
    setError(null);
  }, []);

  const closeDialog = useCallback(() => {
    setDialog({ mode: null });
    setFormValue("");
    setIsSubmitting(false);
    setError(null);
  }, []);

  const beginSubmit = useCallback(() => setIsSubmitting(true), []);
  const finishSubmit = useCallback(() => setIsSubmitting(false), []);

  const currentSlug = useMemo(
    () => buildRoomPreview(formValue, roomIdSuffix || "project"),
    [formValue, roomIdSuffix]
  );

  const createProject = useCallback(async () => {
    const name = formValue.trim();
    if (!name) {
      return;
    }

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, id: currentSlug }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: "Unable to create project" }))) as {
        error?: string;
      };

      throw new Error(payload.error ?? "Unable to create project");
    }

    const { project } = (await response.json()) as { project: { id: string; name: string } };
    const nextProject: ProjectActionProject = {
      id: project.id,
      name: project.name,
      owner: true,
      roomId: project.id,
    };

    setProjects((current) => [nextProject, ...current]);
    setSelectedProjectId(project.id);
    router.push(`/editor/${project.id}`);
    closeDialog();
  }, [closeDialog, currentSlug, formValue, router, setProjects, setSelectedProjectId]);

  const renameProject = useCallback(async () => {
    const name = formValue.trim();
    if (!dialog.projectId || !name) {
      return;
    }

    const response = await fetch(`/api/projects/${dialog.projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: "Unable to rename project" }))) as {
        error?: string;
      };

      throw new Error(payload.error ?? "Unable to rename project");
    }

    const { project } = (await response.json()) as { project: { id: string; name: string } };

    setProjects((current) =>
      current.map((item) =>
        item.id === project.id
          ? { ...item, name: project.name, roomId: item.roomId ?? project.id }
          : item
      )
    );

    if (selectedProjectId === project.id) {
      setSelectedProjectId(project.id);
    }

    router.refresh();
    closeDialog();
  }, [closeDialog, dialog.projectId, formValue, router, selectedProjectId, setProjects, setSelectedProjectId]);

  const deleteProject = useCallback(async () => {
    if (!dialog.projectId) {
      return;
    }

    const response = await fetch(`/api/projects/${dialog.projectId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: "Unable to delete project" }))) as {
        error?: string;
      };

      throw new Error(payload.error ?? "Unable to delete project");
    }

    const nextProjects = projects.filter((project) => project.id !== dialog.projectId);
    setProjects(nextProjects);

    if (selectedProjectId === dialog.projectId) {
      const nextProjectId = nextProjects[0]?.id ?? "";
      setSelectedProjectId(nextProjectId);

      if (nextProjectId) {
        router.push(`/editor/${nextProjectId}`);
      } else {
        router.push("/editor");
      }
    }

    router.refresh();
    closeDialog();
  }, [closeDialog, dialog.projectId, projects, router, selectedProjectId, setProjects, setSelectedProjectId]);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) {
      return;
    }

    setError(null);
    beginSubmit();

    try {
      if (dialog.mode === "create") {
        await createProject();
      }

      if (dialog.mode === "rename") {
        await renameProject();
      }

      if (dialog.mode === "delete") {
        await deleteProject();
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Unable to complete this action."
      );
    } finally {
      finishSubmit();
    }
  }, [beginSubmit, createProject, deleteProject, dialog.mode, finishSubmit, isSubmitting, renameProject]);

  return {
    dialog,
    formValue,
    setFormValue,
    currentSlug,
    error,
    isSubmitting,
    beginSubmit,
    finishSubmit,
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    handleSubmit,
  };
}
