"use client";

import { useCallback, useMemo, useState } from "react";

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

export function useProjectDialogs() {
  const [dialog, setDialog] = useState<ProjectDialogState>({ mode: null });
  const [formValue, setFormValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateDialog = useCallback(() => {
    setDialog({ mode: "create" });
    setFormValue("");
    setIsSubmitting(false);
  }, []);

  const openRenameDialog = useCallback(
    (project: { id: string; name: string }) => {
      setDialog({ mode: "rename", projectId: project.id, projectName: project.name });
      setFormValue(project.name);
      setIsSubmitting(false);
    },
    []
  );

  const openDeleteDialog = useCallback(
    (project: { id: string; name: string }) => {
      setDialog({ mode: "delete", projectId: project.id, projectName: project.name });
      setFormValue("");
      setIsSubmitting(false);
    },
    []
  );

  const closeDialog = useCallback(() => {
    setDialog({ mode: null });
    setFormValue("");
    setIsSubmitting(false);
  }, []);

  const beginSubmit = useCallback(() => setIsSubmitting(true), []);
  const finishSubmit = useCallback(() => setIsSubmitting(false), []);

  const currentSlug = useMemo(() => slugify(formValue), [formValue]);

  return {
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
  };
}
