import { Button } from "@/components/ui/button"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"

type EditorNavbarProps = {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  projectName?: string
}

export function EditorNavbar({
  isSidebarOpen,
  onToggleSidebar,
  projectName = "Workspace",
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

        <div className="flex flex-1 justify-end" aria-hidden="true" />
      </div>
    </header>
  )
}
