clerk is already installed and connected. wire it intothe next.js app: provider , auth pages, redirects, route protection, and user menu.

## Design

use clerk's `dark` theme from `@clerk/ui/themes` as the base.

override clerk appearance variables using the app's existing CSS variable. Do not hardcore colors

### sign-in and sign-up pages:

- large screens: simple two-panel layout
- left: compact logo, tagline,short text-only feature list
- right: centered clerk form
- small screens: form only
- no gradients
- no oversized hero sections
- no feature cards
- no scroll-heavy layouts

keep the layout minimal and profesional.

## implementation

wrap the root layout with `clerkprovider` using clerk's `dark` theme.

create sign-in and sign-up pages using clerk components.

use `proxy.ts` at the project root, not `middleware.ts`.

define public routes using the existing sign-in and sign-up env vars. protect everything else by default.

update `/`:

- authenticated users redirect to `/editor`
- unauthenticated users redirected to `/sign-in`

add clerk's built-in `UserButton` to the editor navbar right section for profile settings and logout.

keep clerk's default user menu and profile flows intact. do not rebuild or heavily customize clerk internals.

use existing clerk env vars. Do not rename or invent new ones.

## dependencies

install: @clerk/ui.

## check when done

- `proxy.ts` exist at the root
- all routes are protected except public auth paths
- auth  pages use CSS variables with no hardcoded colors
- `clerkprovider` wraps the root layout
- `npm run build` passes