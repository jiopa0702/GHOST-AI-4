"use client";

import { useCallback, useEffect, useRef } from "react";

import type { CanvasState } from "@/lib/canvas-state";
import type { CanvasEdge, CanvasNode } from "@/types/canvas";

export type CanvasSaveStatus = "idle" | "loading" | "saving" | "saved" | "error";

type UseCanvasAutoSaveOptions = {
  projectId: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  enabled: boolean;
  onStatusChange: (status: CanvasSaveStatus) => void;
};

const saveDebounceMs = 800;

export function useCanvasAutoSave({
  projectId,
  nodes,
  edges,
  enabled,
  onStatusChange,
}: UseCanvasAutoSaveOptions) {
  const latestCanvas = useRef<CanvasState>({ nodes, edges });
  const lastObservedSnapshot = useRef<string | null>(null);
  const isSaving = useRef(false);
  const saveAgain = useRef(false);

  useEffect(() => {
    latestCanvas.current = { nodes, edges };
  }, [edges, nodes]);

  const saveCanvas = useCallback(async () => {
    if (isSaving.current) {
      saveAgain.current = true;
      return;
    }

    isSaving.current = true;

    try {
      do {
        saveAgain.current = false;
        const snapshot = latestCanvas.current;
        const serializedSnapshot = JSON.stringify(snapshot);
        onStatusChange("saving");

        const response = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: serializedSnapshot,
        });

        if (!response.ok) {
          onStatusChange("error");
          return;
        }

        lastObservedSnapshot.current = serializedSnapshot;
        if (JSON.stringify(latestCanvas.current) !== serializedSnapshot) {
          saveAgain.current = true;
        }
      } while (saveAgain.current);

      onStatusChange("saved");
    } catch {
      onStatusChange("error");
    } finally {
      isSaving.current = false;
    }
  }, [onStatusChange, projectId]);

  useEffect(() => {
    if (!enabled) return;

    const snapshot = JSON.stringify({ nodes, edges });
    if (lastObservedSnapshot.current === null) {
      lastObservedSnapshot.current = snapshot;
      return;
    }
    if (lastObservedSnapshot.current === snapshot) return;

    const timeoutId = window.setTimeout(() => {
      void saveCanvas();
    }, saveDebounceMs);

    return () => window.clearTimeout(timeoutId);
  }, [edges, enabled, nodes, saveCanvas]);

  return saveCanvas;
}
