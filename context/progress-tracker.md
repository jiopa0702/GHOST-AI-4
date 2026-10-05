# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Editor home wiring complete; project API and UI integration are in place

## Current Goal

- Ensure the editor sidebar and dialogs are backed by live project data and continue to pass the full production build.

## Completed

- Design system: configured the dark-only token set and generated shadcn primitives without breaking the app’s shell styling.
- Editor chrome: implemented the reusable navbar and floating project sidebar, with matching dark token styling and empty states.
- Layout integration: mounted the shared editor shell in the app layout so the navbar and sidebar persist throughout the workspace shell.
- Authentication: wrapped the app in ClerkProvider, used the dark Clerk theme with CSS-variable appearance overrides, created sign-in/sign-up routes, protected all non-auth routes via proxy.ts, redirected / to /editor or /sign-in, and placed the built-in UserButton in the editor navbar.
- Prisma foundation: added the ProjectStatus enum, Project and email-based ProjectCollaborator models in a multi-file Prisma schema; preserved existing User, ProjectMember, Spec, and TaskRun relations; configured a cached Prisma Client singleton with the PostgreSQL adapter for direct URLs and Accelerate for Prisma Postgres URLs; generated and applied baseline plus project-collaborator migrations; verified migration status, schema validity, TypeScript, and production build.
- Editor project flows: implemented the editor home, create/rename/delete dialogs, room ID preview, owned/shared sidebar actions, and mobile sidebar backdrop using mock-only data.
- Project API: added authenticated `GET` and `POST /api/projects` plus owner-checked `PATCH` and `DELETE /api/projects/[projectId]`; anonymous requests return 401, non-owner mutations return 403, and missing projects return 404. Project creation uses the authenticated Clerk ID and upserts the required User relation before creating the project.
- Editor home wiring: moved the page to a server component, fetched owned and shared projects server-side, and connected the sidebar/dialog flows to the real project API for create, rename, and delete actions.

## In Progress

- None. The project API and editor home integration are complete and verified.

## Next Up

- Continue with any follow-up workspace features beyond the project lifecycle integration.

## Open Questions

- The existing ProjectMember user-linked model remains for compatibility alongside the new email-based ProjectCollaborator model; decide whether to consolidate them in a later feature.
- Rotate the exposed database credential in Prisma Postgres and update .env.local.

## Architecture Decisions

- Clerk sits at the layout level and uses the existing Clerk environment variable names for sign-in and sign-up flows.
- Public auth routes are limited to the sign-in/sign-up flow, while the editor and all other app routes remain protected by default.
- The default Clerk user menu and profile flows remain intact; no custom auth UI replacement or heavy customization is introduced.
- Prisma ORM 7.10.0 owns schema validation, generated Prisma Client, and SQL migration history; the earlier Prisma 8 contract artifacts remain historical and are not used by the ORM 7 migration workflow.
- Project ownership stores the Clerk user ID directly; project collaborators are email-based, while the legacy ProjectMember relation is retained without data loss.

## Session Notes

- This app uses the dark token variables already defined in the design system rather than hardcoded colors for Clerk theming.
- The auth flow is intentionally minimal and professional: a left-side brand panel on desktop, a centered Clerk form on the right, and a single-column layout on small screens.
- The app root redirects authenticated users to /editor and unauthenticated users to /sign-in, matching the intended route protection behavior.
- The Clerk route protection is handled with proxy.ts, not middleware.ts, and all routes are protected by default except the public auth paths.
- Prisma migrations live under prisma/migrations; the baseline captures the previously initialized empty schema, and the following migration adds project status/indexes and email collaborators.
- The feature does not yet connect editor project create, rename, delete, or share UI to Prisma; those operations are the next persistence task.
- Project API routes are implemented independently of the editor UI as required by `context/feature-specs/06-project-apis.md`; project listing currently includes owned projects only.
- Anonymous GET, PATCH, and DELETE requests to the project API were smoke-tested and returned HTTP 401; production build and lint passed.
