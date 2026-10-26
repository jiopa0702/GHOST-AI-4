"use client";

import dynamic from "next/dynamic";
import { AlertCircle, Check, LoaderCircle, PanelLeftClose, PanelLeftOpen, Save, Share2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CanvasSaveStatus } from "@/hooks/use-canvas-auto-save";
import { StarterTemplatesModal } from "@/components/editor/starter-templates-modal";
import type { CanvasTemplate } from "@/components/editor/starter-templates";

const ClientUserButton = dynamic(
  () => import("@clerk/nextjs").then(({ UserButton }) => UserButton),
  {
    ssr: false,
    loading: () => <span aria-hidden="true" className="size-8 rounded-full bg-subtle" />,
  }
);

type EditorNavbarProps = {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  projectName?: string;
  isAiSidebarOpen?: boolean;
  onToggleAiSidebar?: () => void;
  onShare?: () => void;
  saveStatus?: CanvasSaveStatus;
  onSaveCanvas?: () => void;
  onImportTemplate?: (template: CanvasTemplate) => void;
  showUserButton?: boolean;
};

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName = "Workspace",
  isAiSidebarOpen = true,
  onToggleAiSidebar,
  onShare,
  saveStatus,
  onSaveCanvas,
  onImportTemplate,
  showUserButton = true,
}: EditorNavbarProps) {
  const saveStatusLabel = {
    idle: "Save",
    loading: "Save",
    saving: "Saving...",
    saved: "Saved",
    error: "Error",
  };

  return (
    <header className="fixed inset-x-0 top-0 z-30 h-14 border-b border-border/80 bg-base/95 backdrop-blur-sm">
      <div className="flex h-full w-full items-center justify-between px-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onToggleSidebar}
            className="shrink-0 rounded-md border border-transparent hover:border-border/80"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="size-4" />
            ) : (
              <PanelLeftOpen className="size-4" />
            )}
          </Button>

          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-accent text-[10px] font-semibold text-foreground">
              AI
            </span>
            <span className="truncate text-sm font-medium text-copy-primary">
              Ghost AI
            </span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <span className="truncate text-sm text-copy-secondary">{projectName}</span>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          {saveStatus && onSaveCanvas && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSaveCanvas}
              disabled={saveStatus === "loading" || saveStatus === "saving"}
              aria-live="polite"
              className="gap-1.5"
              title={saveStatusLabel[saveStatus]}
            >
              {saveStatus === "saving" || saveStatus === "loading" ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : saveStatus === "error" ? (
                <AlertCircle className="size-3.5 text-error" />
              ) : saveStatus === "saved" ? (
                <Check className="size-3.5 text-success" />
              ) : (
                <Save className="size-3.5" />
              )}
              <span className={saveStatus === "error" ? "text-error" : undefined}>
                {saveStatusLabel[saveStatus]}
              </span>
            </Button>
          )}
          {onImportTemplate && (
            <StarterTemplatesModal onImport={onImportTemplate} />
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onShare}
            disabled={!onShare}
            className="gap-2"
          >
            <Share2 className="size-4" />
            Share
          </Button>

          {onToggleAiSidebar && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onToggleAiSidebar}
              className="gap-2"
            >
              <Sparkles className="size-4" />
              {isAiSidebarOpen ? "Hide AI" : "AI sidebar"}
            </Button>
          )}

          {showUserButton && <ClientUserButton />}
        </div>
      </div>
    </header>
  );
}
