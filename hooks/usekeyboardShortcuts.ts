"use client";

import { useEffect } from "react";
import type { ReactFlowInstance } from "@xyflow/react";

type ZoomableFlowInstance = Pick<ReactFlowInstance, "zoomIn" | "zoomOut">;

function isEditingText(activeElement: Element | null) {
  if (!(activeElement instanceof HTMLElement)) {
    return false;
  }

  return (
    activeElement.isContentEditable ||
    activeElement.matches("input, textarea, [role='textbox']") ||
    activeElement.closest("[contenteditable='true']") !== null
  );
}

export function useKeyboardShortcuts(
  reactFlow: ZoomableFlowInstance,
  onUndo: () => void,
  onRedo: () => void
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditingText(document.activeElement)) {
        return;
      }

      const key = event.key.toLowerCase();
      const hasCommandModifier = event.metaKey || event.ctrlKey;

      if (hasCommandModifier && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
        return;
      }

      if (hasCommandModifier && key === "y") {
        event.preventDefault();
        onRedo();
        return;
      }

      if (hasCommandModifier || event.altKey) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        void reactFlow.zoomIn({ duration: 200 });
      } else if (event.key === "_") {
        event.preventDefault();
        void reactFlow.zoomOut({ duration: 200 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onRedo, onUndo, reactFlow]);
}
