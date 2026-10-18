import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "cn"
import { Plus, X } from "lucide-react"

type ProjectSidebarProps = {
  isOpen: boolean
  onClose: () => void
  projects?: string
}

const emptyStateStyles =
  "flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-subtle px-6 text-center"

export function ProjectSidebar({
  isOpen,
  onClose,
  projects = "Projects",
}: ProjectSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-80 border-r border-border bg-surface/95 shadow-2xl shadow-black/20 backdrop-blur-sm transition-transform duration-200 ease-out",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      aria-label="Project sidebar"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-copy-primary">{projects}</h2>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-md hover:bg-muted"
            onClick={onClose}
            aria-label="Close project sidebar"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 px-3 py-3">
          <Tabs defaultValue="my-projects" className="flex h-full flex-col">
            <TabsList className="grid w-full grid-cols-2 bg-[#1a1b20]">
              <TabsTrigger value="my-projects">My Projects</TabsTrigger>
              <TabsTrigger value="shared">Shared</TabsTrigger>
            </TabsList>

            <TabsContent value="my-projects" className="mt-4 flex-1">
              <div className={emptyStateStyles}>
                <p className="text-sm font-medium text-copy-primary">No projects yet</p>
                <p className="mt-2 text-xs text-copy-muted">
                  Start a new project to see it here.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="shared" className="mt-4 flex-1">
              <div className={emptyStateStyles}>
                <p className="text-sm font-medium text-copy-primary">Nothing shared</p>
                <p className="mt-2 text-xs text-copy-muted">
                  Shared workspaces will appear here.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="border-t border-border p-3">
          <Button type="button" className="w-full justify-center gap-2">
            <Plus className="size-4" />
            New Project
          </Button>
        </div>
      </div>
    </aside>
  )
}
