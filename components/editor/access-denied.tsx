import Link from "next/link";
import { Lock } from "lucide-react";

export function AccessDenied() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 text-center shadow-2xl shadow-black/20">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-subtle text-copy-primary">
          <Lock className="size-6" />
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-copy-primary">Access denied</h1>
        <p className="mt-3 text-sm leading-6 text-copy-secondary">
          You do not have access to this project or the workspace no longer exists.
        </p>

        <Link
          href="/editor"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/90"
        >
          Back to workspace
        </Link>
      </div>
    </div>
  );
}
