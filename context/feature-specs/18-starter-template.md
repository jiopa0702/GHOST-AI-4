Add a small starter template library so users can start a canvas from pre-built diagram instead of building from scratch.

## implementation

1. Create `components/editor/starter-templates.ts`.

include:
- a `CanvasTemplate` type
- a `CANVAS_TEMPLATES` array
- at least three templates, such as microservices, CI/CD pipeline, and event-driven system

Each template should include:
- `id`
- `name`
- `description`
- nodes
- edges

use the shared canvas types and existing node color palette. add a small helper functions if needed to keep the template data readable.

2. Create `component/editror/starter-templates-modal.tsx`.

The modal should:
- open as a dialog
- show template cards in a scrollable grid
- show the template name and description
- include an import button for each template
- call `onImport` with the selected template, then close

3. Add a simple diagram preview to each template card.
- fit the preview to a fixed-size viewport
- calculate the preview bounds from the template node positions
- draw edges as simple lines between node centers
- draw nodes using their shape and color data
- keep the preview lightweight, no React Flow instance needed
