Read `AGENTS.md` before starting.

we're adding the design system and UI primitive components.

install and configure `shadcn/ui`.

Add these shadcn components:
-Button
-Card
-Dialog
-Input
-Tabs
-Textare
-ScrollArea

Do not modify the generated `components/ui/*` files after installation.

Also install `lucide-react`.

Create `lib/utils.ts` with a reusable `cn()` helper for merging tailwind classes.

Ensure all omponents match the existing dark theme in `globals.css`.

### Check when done
-' All components import without errors
- `cn()` works properly
- No default light styling appears