# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Liveblocks authentication: reduce auth endpoint latency while preserving project-scoped room permissions.

## Current Goal

- Authenticate authorized project members into Liveblocks rooms without the client-side auth request timing out.

## Completed

- Design system: configured the dark-only token set and generated shadcn primitives without breaking the app’s shell styling.
- Editor chrome: implemented the reusable navbar and floating project sidebar, with matching dark token styling and empty states.
- Layout integration: mounted the shared editor shell in the app layout so the navbar and sidebar persist throughout the workspace shell.
- Authentication: wrapped the app in ClerkProvider, used the dark Clerk theme with CSS-variable appearance overrides, created sign-in/sign-up routes, protected all non-auth routes via proxy.ts, redirected / to /editor or /sign-in, and placed the built-in UserButton in the editor navbar.
- Prisma foundation: added the ProjectStatus enum, Project and email-based ProjectCollaborator models in a multi-file Prisma schema; preserved existing User, ProjectMember, Spec, and TaskRun relations; configured a cached Prisma Client singleton with the PostgreSQL adapter for direct URLs and Accelerate for Prisma Postgres URLs; generated and applied baseline plus project-collaborator migrations; verified migration status, schema validity, TypeScript, and production build.
- Editor project flows: implemented the editor home, create/rename/delete dialogs, room ID preview, owned/shared sidebar actions, and mobile sidebar backdrop using mock-only data.
- Project API: added authenticated `GET` and `POST /api/projects` plus owner-checked `PATCH` and `DELETE /api/projects/[projectId]`; anonymous requests return 401, non-owner mutations return 403, and missing projects return 404. Project creation uses the authenticated Clerk ID and upserts the required User relation before creating the project.
- Editor home wiring: moved the page to a server component, fetched owned and shared projects server-side, and connected the sidebar/dialog flows to the real project API for create, rename, and delete actions.
- Workspace shell: added room-scoped route access checks, a dedicated access denied screen, and a project-shell layout with a project navbar, selectable room state, canvas placeholder, and AI sidebar placeholder.
- Canvas visual review: made the workspace canvas full-bleed and consistent with the base theme token, retained the dotted pattern using a theme border token, removed canvas/node elevation styling, converted the AI sidebar to an overlay, and moved the closed project sidebar fully beyond the viewport while disabling hidden interactions. Browser checks confirmed both sidebars move fully off-screen, shape drops create nodes at the expected canvas position, and no test node remains. Documented findings and resolutions in `context/current-issues.md`.
- Canvas validation: focused ESLint, TypeScript, and the production build passed.
- Node shape rendering: replaced the placeholder with CSS-rendered rectangles, pills, and circles plus size-scaling SVG diamonds, hexagons, and cylinders. Selection brightens the outlines; drag previews reuse each shape's drop dimensions and clear on drop or drag cancellation.
- Node shape validation: focused ESLint, TypeScript, and the production build passed. Browser interaction verification was blocked by a Liveblocks authentication timeout in the shared browser session.
- Node editing implementation: added selected-node resize handles with minimum dimensions and centered inline label editing, including an empty-label placeholder and keyboard/pointer handling. Label edits write to the existing Liveblocks node storage.
- Node editing validation: focused ESLint, TypeScript, and the production build passed. Interactive browser verification remains pending because the shared browser session is timing out during Liveblocks authentication.
- Color toolbar implementation: added the eight color pairs from `context/ui-context.md` to `types/canvas.ts`, applied palette background/text colors to nodes, and added a floating toolbar above selected nodes. Swatch choices update both color values in the existing Liveblocks node storage without server calls; hover glow, selected state, and node/pan interaction guards are included.
- Color toolbar validation: focused ESLint, TypeScript, and the production build passed.
- Edge behaviour implementation: added connection handles on all four sides with subtle hover-reveal styling, set a custom default edge type with an arrowhead, created a right-angle custom edge renderer that dims at rest and brightens on hover/selection, and added inline double-click edge label editing with `EdgeLabelRenderer` and auto-growing input sizing.
- Edge behaviour validation: focused ESLint and TypeScript validation passed.
- Canvas ergonomics implementation: added a floating bottom-left pill control bar above the shape panel with animated zoom/fit controls and Liveblocks undo/redo buttons that disable when history is unavailable; added `hooks/usekeyboardShortcuts` for the requested window shortcuts while ignoring editable fields; removed the minimap without changing node/edge rendering or collaboration setup.
- Canvas ergonomics validation: focused ESLint and `npm run build` passed.
- Starter template library: added three typed canvas templates (microservices, CI/CD pipeline, and event-driven system) using the shared node and edge contracts plus the existing color palette. Added a scrollable template-dialog grid with lightweight, fixed-size SVG previews fitted from node bounds; importing remaps node, edge, and handle IDs, appends the diagram to the active Liveblocks room, and fits the view to the imported nodes.
- Starter template validation: focused ESLint and `npm run build` passed.
- Canvas presence implementation: added shared typed Liveblocks cursor/thinking presence and user metadata, a canvas-only collaborator avatar group with the Clerk profile button, and named cursors that exclude the active Clerk user. Cursors are stored in flow coordinates and follow local pan/zoom; mouse leave clears cursor presence. The auth endpoint supplies profile image URLs only when present so the avatar UI can fall back to initials.
- Liveblocks auth timeout fix: run Clerk profile lookup alongside project authorization, reuse that Clerk result for collaborator checks, cache successful room setup per server process, and bound room setup requests to eight seconds. The route still verifies project access and ensures rooms remain private before issuing the session token; authenticated browser retry is pending.
- Canvas presence validation: focused ESLint, TypeScript, and the production build passed. Interactive verification remains pending because the shared browser tab is on sign-in.
- AI workspace sidebar implementation: extracted the existing animated, parent-controlled sidebar into `components/editor/ai-workspace-sidebar.tsx`; added the requested header, AI Architect and Specs tabs, prompt chips, locally submitted chat messages, auto-resizing composer, demo spec card, and disabled download control using existing theme tokens. No AI or backend behavior was added.
- Shared AI presence state: reused the existing Liveblocks room status events and Ghost AI `thinking` presence; mounted the sidebar inside the shared room provider, validated incoming feed messages with the task schema, limited the sidebar to the latest status, disabled only the composer while AI is active, and added a thinking spinner to collaborator cursor badges.
- Shared AI presence validation: focused ESLint, editor diagnostics, and `npm run build` passed.
- Sidebar chat feed: added a separate room-scoped Liveblocks `ai-chat` feed, validated sender/role/content/timestamp payloads with Zod, rendered ordered messages with sender and time, and connected the existing composer to send shared chat while preserving AI design task submission. Feed initialization, message loading, and send failures have visible handling. `context/feature-specs/26-design-agent-frontend.md` is empty; no extra behavior was inferred from it.
- Sidebar chat feed validation: focused ESLint, editor diagnostics, and `npm run build` passed.
- Design-agent frontend: POSTs prompts with the room ID, stores the returned run ID and scoped public token, subscribes via `useRealtimeRun`, appends the final result to `ai-chat`, and resets local run state on completion. The API returns a one-hour run-scoped token that omits the unused task payload. The compact AI status strip is shown only while a run is active; canvas updates continue to arrive through Liveblocks.
- Design-agent frontend validation: focused ESLint, editor diagnostics, and `npm run build` passed.
- Spec generation backend: added authenticated `POST /api/ai/spec`, deriving project ownership from `roomId` rather than trusting client project IDs; added ownership-checked `POST /api/ai/spec/token` issuing one-hour, run-scoped public tokens; added the Zod-validated `generate-spec` Trigger.dev task using Gemini and recording run status/output/errors in `TaskRun`.
- Spec generation backend validation: focused ESLint, editor diagnostics, and `npm run build` passed; the build includes both spec API routes.
- Spec persistence implementation: confirmed `ProjectSpec` contains only the project relation, Blob path, and creation time; `generate-spec` uploads Markdown to private Vercel Blob and transactionally records the metadata plus spec ID in `TaskRun.output`; the authenticated download route returns 401 for anonymous requests, 403 for inaccessible existing projects, 404 for missing projects/specs/files, and streams Markdown without exposing the Blob URL. The existing legacy `Spec` model was retained to avoid an unrelated destructive schema change. Architecture notes now describe the implemented Blob path and storage boundary.
- Spec UI integration: replaced the Specs tab demo controls with a flow that submits the active canvas and room chat to the spec API, requests a scoped run token, subscribes for completion, displays progress and errors, and downloads the generated spec through the authenticated project route. Canvas snapshots are read from the existing Liveblocks flow; Blob URLs are never sent to the UI. The previously empty feature spec now documents this inferred scope.
- Spec persistence validation: Prisma Client regeneration, Prisma schema validation, focused ESLint, and editor diagnostics passed. Production compilation passed, but its TypeScript stage is blocked by malformed pre-existing generated `.next/dev/types/validator.ts`; standalone TypeScript reports the same generated-file parse errors. After runtime reported that `public.ProjectSpec` was missing, applied migration `20261025180000_add_project_specs` to the configured Prisma Postgres database with `prisma migrate deploy`.
- AI workspace sidebar validation: focused ESLint, TypeScript, and production build passed. Interactive browser verification remains pending.
- Canvas auto-save implementation: reused the existing nullable `Project.canvasJsonPath` metadata field to store private Vercel Blob URLs; added access-checked canvas GET/PUT routes with JSON validation, a debounced autosave hook, an empty-Liveblocks-room restore guard, a canvas-loading overlay, and save status in the workspace navbar. Old Blob snapshots are removed after successful replacement. The existing Prisma field required no migration.
- Canvas auto-save validation: focused ESLint, TypeScript, and production build passed. `BLOB_READ_WRITE_TOKEN` is present in local configuration; end-to-end Blob save/restore remains pending authenticated browser verification.
- Workspace Save button implementation: exposed the same save function used by autosave, wired it to a button shown only in workspace context, and added temporary Saved/Error feedback that returns to Save. The canvas Blob route already uses private writes and the Vercel Blob `get` SDK. Manual-save UI testing is pending.
- Canvas save failure fix: the existing Liveblocks room contained legacy node data without label, shape, size, and color fields, causing the API validator to reject every snapshot with HTTP 400. Canvas snapshots are now normalized with the same defaults as newly created nodes before Blob persistence. Save failures update the status without throwing console errors that trigger the Next.js development overlay.
- Canvas save verification: authenticated browser test confirmed the workspace button transitions Saving → Saved → Save, `PUT /api/projects/ci-cd-67cdd686/canvas` returns HTTP 200, and the follow-up GET returns all 5 nodes and 6 edges with normalized data. The Next.js issues overlay is no longer present. Focused ESLint and production build passed.
- Editor issues 2–7 implementation: added Delete/Backspace handling for selected nodes and edges through Liveblocks `onDelete` while ignoring editable fields and disabling React Flow's built-in key deletion; explicitly enabled pointer events on all node connection handles; centered dropped nodes on cursor coordinates converted through `screenToFlowPosition`; removed automatic `fitView` to keep viewport unchanged on node drops; allowed Clerk's named image host and `img.clerk.com`; and hid the navbar UserButton only in workspace mode while preserving it on editor home.
- Editor issues 2–7 validation: focused ESLint, TypeScript, and production build passed. Browser interaction testing is pending because Liveblocks authentication timed out in the shared browser tab.
- Design agent backend foundation: added an access-checked `POST /api/ai/design` endpoint, an ownership-checked run-scoped public-token endpoint, and additive `TaskRun` tracking for Trigger.dev runs.
- Design agent backend validation: Prisma schema and migration checks passed. After a valid ASCII development `TRIGGER_SECRET_KEY` was configured, the authenticated editor successfully dispatched the task to Trigger.dev.
- Live AI design agent: implemented Gemini structured action generation for add/move/resize/update/delete node and add-edge operations; validates supported shapes and palette colors; aligns generated positions to a 40px grid and avoids node overlap with 100px spacing; applies each change through the existing Liveblocks React Flow storage; broadcasts shared start/progress/completion/error events; and updates/clears Ghost AI cursor, thinking, and status presence. TaskRun status/output/error records are updated throughout execution.
- Live AI design agent validation: updated the task to use the available `gemini-3-flash-preview` model and a Google-compatible structured-output schema, retaining strict runtime action validation. Trigger.dev worker build `20261024.12` registered `design-task` and `hello-world`; authenticated run `run_06gmupcn8htlakeehjqf3j94a2` completed successfully with 7 canvas actions, creating Repository, Build, Test, and Deploy nodes and their connections in the shared Liveblocks canvas. Shared start/progress/completion status was visible, and Ghost AI presence cleared after completion. Focused ESLint and the production build passed. The local Gemini variable is `GEMINI_AI_API_KEY`; no secret values were read or recorded.
- Trigger task visibility fix: replaced the empty extensionless `src/trigger/design-agent` placeholder with the restored, exported `src/trigger/design-agent.ts` task, set its task ID to `design-agent`, and updated the authenticated API route to trigger that ID. Trigger.dev local worker build `20261024.15` now lists `design-agent` and `hello-world`, and the Trigger.dev Development Tasks page shows `design-agent` at `src/trigger/design-agent.ts`. TypeScript and focused ESLint checks passed.

## In Progress

- Authenticated browser retry of the Liveblocks room connection is pending. The earlier `prisma migrate deploy` confirmed the additive ProjectSpec migration was applied successfully to the configured database.

## Next Up

- Continue with the next feature in the project roadmap.

## Open Questions

- Spec 29 was empty; implementation assumes the Specs tab shows the latest spec generated during the current workspace session. Decide whether it should also load a persisted history of older specs across reloads.
- The existing ProjectMember user-linked model remains for compatibility alongside the new email-based ProjectCollaborator model; decide whether to consolidate them in a later feature.
- Rotate the exposed database credential in Prisma Postgres and update .env.local.

## Architecture Decisions

- Clerk sits at the layout level and uses the existing Clerk environment variable names for sign-in and sign-up flows.
- Public auth routes are limited to the sign-in/sign-up flow, while the editor and all other app routes remain protected by default.
- The default Clerk user menu and profile flows remain intact; no custom auth UI replacement or heavy customization is introduced.
- Prisma ORM 7.10.0 owns schema validation, generated Prisma Client, and SQL migration history; the earlier Prisma 8 contract artifacts remain historical and are not used by the ORM 7 migration workflow.
- Project ownership stores the Clerk user ID directly; project collaborators are email-based, while the legacy ProjectMember relation is retained without data loss.
- Shared AI activity reuses Liveblocks room events and Ghost AI presence; the sidebar subscribes inside the existing room provider and retains only the latest status message.
- Sidebar chat uses Liveblocks' room-scoped feed API under `ai-chat`; chat payloads are independently validated and kept separate from AI status broadcasts.
- Design-run subscriptions use a scoped public token returned from the authenticated submit endpoint; the client observes run status without manually mutating canvas nodes or edges.
- Spec generation requests resolve the project from the authorized room ID; run ownership is tracked by `TaskRun`, and token issuance is restricted to the initiating user and spec task type.
- Spec task execution validates its payload with Zod and retries transient failures up to three attempts; generated Markdown is stored in private Vercel Blob, while Prisma stores only the project/file metadata and spec ID in `TaskRun.output`.

## Session Notes

- This app uses the dark token variables already defined in the design system rather than hardcoded colors for Clerk theming.
- The auth flow is intentionally minimal and professional: a left-side brand panel on desktop, a centered Clerk form on the right, and a single-column layout on small screens.
- The app root redirects authenticated users to /editor and unauthenticated users to /sign-in, matching the intended route protection behavior.
- The Clerk route protection is handled with proxy.ts, not middleware.ts, and all routes are protected by default except the public auth paths.
- Prisma migrations live under prisma/migrations; the baseline captures the previously initialized empty schema, and the following migration adds project status/indexes and email collaborators.
- The feature does not yet connect editor project create, rename, delete, or share UI to Prisma; those operations are the next persistence task.
- Project API routes are implemented independently of the editor UI as required by `context/feature-specs/06-project-apis.md`; project listing currently includes owned projects only.
- Anonymous GET, PATCH, and DELETE requests to the project API were smoke-tested and returned HTTP 401; production build and lint passed.
