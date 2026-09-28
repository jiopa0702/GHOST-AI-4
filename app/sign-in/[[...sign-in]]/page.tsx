import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base px-4 py-6 text-copy-primary sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl overflow-hidden rounded-[28px] border border-surface-border bg-base shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="grid min-h-[720px] grid-cols-1 lg:grid-cols-2">
          <aside className="hidden items-center justify-center border-b border-surface-border bg-subtle/90 p-8 lg:flex lg:border-b-0 lg:border-r">
            <div className="w-full max-w-md">
              <div className="mb-10 flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-sm font-semibold text-copy-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                  AI
                </span>
                <div>
                  <p className="text-[0.62rem] uppercase tracking-[0.22em] text-copy-muted">Ghost AI</p>
                  <h1 className="text-2xl font-semibold text-copy-primary">Workspace access</h1>
                </div>
              </div>

              <div className="space-y-5">
                <p className="max-w-sm text-sm leading-6 text-copy-secondary">
                  Create, refine, and ship work from a single place built for focused AI collaboration.
                </p>

                <ul className="space-y-4 text-sm text-copy-secondary">
                  {[
                    "Fast project context and workspace switching",
                    "Secure team collaboration with account controls",
                    "Clean AI workflows without leaving the editor shell",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 inline-block h-2.5 w-2.5 rounded-full bg-brand" />
                      <span className="leading-6">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          <section className="flex items-center justify-center bg-base p-6 sm:p-8">
            <div className="w-full max-w-md rounded-[24px] border border-surface-border bg-surface/80 p-4 shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
              <SignIn
                path="/sign-in"
                routing="path"
                signUpUrl="/sign-up"
                appearance={{
                  elements: {
                    rootBox: "mx-auto w-full font-sans",
                    card: "border-0 bg-transparent shadow-none",
                    socialButtonsBlockButton: "border border-surface-border bg-subtle hover:bg-elevated text-copy-primary",
                    formButtonPrimary: "bg-brand text-primary-foreground hover:bg-[var(--accent-primary)] rounded-xl",
                    formFieldInput: "bg-subtle border border-surface-border text-copy-primary placeholder:text-copy-muted",
                    headerTitle: "text-copy-primary font-sans",
                    headerSubtitle: "text-copy-secondary font-sans",
                    identityPreviewText: "text-copy-secondary",
                    formFieldLabel: "text-copy-secondary font-sans",
                    footerActionLink: "text-brand",
                    footerActionText: "text-copy-secondary font-sans",
                    dividerText: "text-copy-muted",
                    dividerLine: "bg-surface-border",
                  },
                }}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
