"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Check, Copy, LoaderCircle, Plus, Trash2 } from "lucide-react";

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

type Collaborator = {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
};

type CollaboratorsResponse = {
  collaborators: Collaborator[];
  canManage: boolean;
  error?: string;
};

async function fetchCollaborators(projectId: string, signal?: AbortSignal) {
  const response = await fetch(`/api/projects/${projectId}/collaborators`, { signal });
  const result = (await response.json()) as CollaboratorsResponse;
  if (!response.ok) {
    throw new Error(result.error ?? "Unable to load collaborators.");
  }
  return result;
}

export function ShareProjectDialog({
  open,
  onOpenChange,
  projectId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [canManage, setCanManage] = useState(false);
  const [email, setEmail] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const controller = new AbortController();
    void fetchCollaborators(projectId, controller.signal)
      .then((result) => {
      setCollaborators(result.collaborators);
      setCanManage(result.canManage);
      setLoadedProjectId(projectId);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load collaborators.");
        setLoadedProjectId(projectId);
      });
    return () => controller.abort();
  }, [open, projectId]);

  useEffect(() => {
    if (!isCopied) {
      return;
    }
    const timeout = window.setTimeout(() => setIsCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [isCopied]);

  async function refreshCollaborators() {
    setIsRefreshing(true);
    setError(null);
    try {
      const result = await fetchCollaborators(projectId);
      setCollaborators(result.collaborators);
      setCanManage(result.canManage);
      setLoadedProjectId(projectId);
    } catch (refreshError) {
      setError(
        refreshError instanceof Error ? refreshError.message : "Unable to load collaborators."
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  async function inviteCollaborator() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Unable to invite collaborator.");
      }

      setEmail("");
      await refreshCollaborators();
    } catch (inviteError) {
      setError(
        inviteError instanceof Error ? inviteError.message : "Unable to invite collaborator."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removeCollaborator(collaboratorId: string) {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/collaborators/${collaboratorId}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error ?? "Unable to remove collaborator.");
      }

      setCollaborators((current) => current.filter(({ id }) => id !== collaboratorId));
    } catch (removeError) {
      setError(
        removeError instanceof Error ? removeError.message : "Unable to remove collaborator."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyProjectLink() {
    setError(null);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/editor/${projectId}`);
      setIsCopied(true);
    } catch {
      setError("Could not copy the project link. Check your browser clipboard permissions.");
    }
  }

  const isLoading = isRefreshing || (open && loadedProjectId !== projectId);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setError(null);
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share project</DialogTitle>
          <DialogDescription>
            Invite collaborators by email and manage access to this workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex gap-2">
            {canManage && (
              <>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="name@example.com"
                  aria-label="Collaborator email"
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void inviteCollaborator();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => void inviteCollaborator()}
                  disabled={!email.trim() || isSubmitting}
                >
                  <Plus />
                  Invite
                </Button>
              </>
            )}
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-copy-primary">Collaborators</h3>
              <span className="text-xs text-copy-muted">Showing up to 25</span>
            </div>

            {isLoading ? (
              <div className="flex items-center gap-2 py-5 text-sm text-copy-muted">
                <LoaderCircle className="size-4 animate-spin" />
                Loading collaborators...
              </div>
            ) : collaborators.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-copy-muted">
                No collaborators have been invited yet.
              </p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-y-auto">
                {collaborators.map((collaborator) => (
                  <li
                    key={collaborator.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-subtle px-3 py-2"
                  >
                    {collaborator.avatar ? (
                      <span className="relative size-9 shrink-0 overflow-hidden rounded-full bg-muted">
                        <Image
                          src={collaborator.avatar}
                          alt=""
                          fill
                          sizes="36px"
                          unoptimized
                        />
                      </span>
                    ) : (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-copy-secondary">
                        {collaborator.email.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-copy-primary">
                        {collaborator.name ?? collaborator.email}
                      </p>
                      {collaborator.name && (
                        <p className="truncate text-xs text-copy-muted">{collaborator.email}</p>
                      )}
                    </div>
                    {canManage && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove ${collaborator.email}`}
                        disabled={isSubmitting}
                        onClick={() => void removeCollaborator(collaborator.id)}
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => void copyProjectLink()}>
            {isCopied ? <Check /> : <Copy />}
            {isCopied ? "Copied!" : "Copy project link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
