# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Editor home and project dialogs in progress

## Current Goal

- Build the /editor home screen and project dialog interactions using mock data only, without adding API calls or persistence.

## Completed

- Design system: configured the dark-only token set and generated shadcn primitives without breaking the app’s shell styling.
- Editor chrome: implemented the reusable navbar and floating project sidebar, with matching dark token styling and empty states.
- Layout integration: mounted the shared editor shell in the app layout so the navbar and sidebar persist throughout the workspace shell.
- Authentication: wrapped the app in ClerkProvider, used the dark Clerk theme with CSS-variable appearance overrides, created sign-in/sign-up routes, protected all non-auth routes via proxy.ts, redirected / to /editor or /sign-in, and placed the built-in UserButton in the editor navbar.

## In Progress

- Editor home: add the center-of-page project entry experience, wire the New Project button to the create dialog, and keep the layout minimal without wrapping the content in cards.
- Project dialogs: create, rename, and delete project flows with live slug preview, autofocus input behavior, and mock-only data updates.
- Sidebar actions: connect rename and delete controls for owned projects, hide them for shared projects, and add the mobile backdrop close behavior.

## Next Up

- Finish the editor project feature validation: confirm the sidebar actions are wired, the slug preview works, and the TypeScript/lint checks remain clean.

## Open Questions

- None.

## Architecture Decisions

- Clerk sits at the layout level and uses the existing Clerk environment variable names for sign-in and sign-up flows.
- Public auth routes are limited to the sign-in/sign-up flow, while the editor and all other app routes remain protected by default.
- The default Clerk user menu and profile flows remain intact; no custom auth UI replacement or heavy customization is introduced.

## Session Notes

- This app uses the dark token variables already defined in the design system rather than hardcoded colors for Clerk theming.
- The auth flow is intentionally minimal and professional: a left-side brand panel on desktop, a centered Clerk form on the right, and a single-column layout on small screens.
- The app root redirects authenticated users to /editor and unauthenticated users to /sign-in, matching the intended route protection behavior.
- The Clerk route protection is handled with proxy.ts, not middleware.ts, and all routes are protected by default except the public auth paths.
