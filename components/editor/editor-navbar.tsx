"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeftOpen, Share2, Sparkles } from "lucide-react";

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
};

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName = "Workspace",
  isAiSidebarOpen = true,
  onToggleAiSidebar,
  onShare,
}: EditorNavbarProps) {
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

          <ClientUserButton />
        </div>
      </div>
    </header>
  );
}
