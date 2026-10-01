# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Prisma persistence foundation completed; editor project persistence is next

## Current Goal

- Replace mock editor project state with persistence through the Prisma Project and ProjectCollaborator models.

## Completed

- Design system: configured the dark-only token set and generated shadcn primitives without breaking the app’s shell styling.
- Editor chrome: implemented the reusable navbar and floating project sidebar, with matching dark token styling and empty states.
- Layout integration: mounted the shared editor shell in the app layout so the navbar and sidebar persist throughout the workspace shell.
- Authentication: wrapped the app in ClerkProvider, used the dark Clerk theme with CSS-variable appearance overrides, created sign-in/sign-up routes, protected all non-auth routes via proxy.ts, redirected / to /editor or /sign-in, and placed the built-in UserButton in the editor navbar.
- Prisma foundation: added the ProjectStatus enum, Project and email-based ProjectCollaborator models in a multi-file Prisma schema; preserved existing User, ProjectMember, Spec, and TaskRun relations; configured a cached Prisma Client singleton with the PostgreSQL adapter for direct URLs and Accelerate for Prisma Postgres URLs; generated and applied baseline plus project-collaborator migrations; verified migration status, schema validity, TypeScript, and production build.
- Editor project flows: implemented the editor home, create/rename/delete dialogs, slug preview, owned/shared sidebar actions, and mobile sidebar backdrop using mock-only data.

## In Progress

- None.

## Next Up

- Replace the editor's mock project state with persistence backed by the Prisma Project and ProjectCollaborator models.

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
