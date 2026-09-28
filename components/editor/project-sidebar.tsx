import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "cn";
import { PencilLine, Plus, Trash2, X } from "lucide-react";

type Project = {
  id: string;
  name: string;
  owner: boolean;
};

type ProjectSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  projects?: Project[];
  onCreateProject: () => void;
  onRenameProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  selectedProjectId?: string;
  onSelectProject: (projectId: string) => void;
};

const emptyStateStyles =
  "flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-subtle px-6 text-center";

export function ProjectSidebar({
  isOpen,
  onClose,
  projects = [],
  onCreateProject,
  onRenameProject,
  onDeleteProject,
  selectedProjectId,
  onSelectProject,
}: ProjectSidebarProps) {
  const ownedProjects = projects.filter((project) => project.owner);
  const sharedProjects = projects.filter((project) => !project.owner);

  const renderProjectList = (items: Project[]) => {
    if (items.length === 0) {
      return (
        <div className={emptyStateStyles}>
          <p className="text-sm font-medium text-copy-primary">No projects yet</p>
          <p className="mt-2 text-xs text-copy-muted">
            Start a new project to see it here.
          </p>
        </div>
      );
    }

    return (
      <ul className="space-y-2">
        {items.map((project) => {
          const isActive = selectedProjectId === project.id;

          return (
            <li
              key={project.id}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-2 py-2 text-left transition-colors",
                isActive
                  ? "border-accent/50 bg-accent/10 text-copy-primary"
                  : "border-transparent bg-transparent text-copy-secondary hover:bg-subtle"
              )}
            >
              <button
                type="button"
                onClick={() => onSelectProject(project.id)}
                className="flex min-w-0 flex-1 items-center justify-between rounded-lg text-left"
              >
                <span className="truncate text-sm font-medium">{project.name}</span>
              </button>

              {project.owner && (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Rename ${project.name}`}
                    onClick={() => onRenameProject(project)}
                  >
                    <PencilLine className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${project.name}`}
                    onClick={() => onDeleteProject(project)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-80 border-r border-border bg-surface/95 shadow-2xl shadow-black/20 backdrop-blur-sm transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Project sidebar"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-medium text-copy-primary">Projects</h2>

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

              <TabsContent value="my-projects" className="mt-4 flex-1 overflow-y-auto">
                {renderProjectList(ownedProjects)}
              </TabsContent>

              <TabsContent value="shared" className="mt-4 flex-1 overflow-y-auto">
                {renderProjectList(sharedProjects)}
              </TabsContent>
            </Tabs>
          </div>

          <div className="border-t border-border p-3">
            <Button
              type="button"
              className="w-full justify-center gap-2"
              onClick={onCreateProject}
            >
              <Plus className="size-4" />
              New Project
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
