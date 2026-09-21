export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(0,200,212,0.12),transparent_35%),linear-gradient(to_bottom,var(--bg-base),var(--bg-surface))]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:24px_24px] opacity-40" />

      <div className="relative flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-8">
        <div className="w-full max-w-3xl rounded-2xl border border-border bg-surface/80 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-copy-muted">
            Workspace
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-copy-primary">
            Editor canvas
          </h1>
          <p className="mt-2 max-w-xl text-sm text-copy-secondary">
            This editor shell provides the chrome for the next chapter and keeps the project list floating above the workspace.
          </p>
        </div>
      </div>
    </div>
  );
}
