replace the placeholder node with proper shape rendering and a drag preview.

## Implementation

1. Replace the placeholder node shape rendering.
   - rectangle , pill, and circle should use CSS styling
   - diamond, hexagon, and cylinder should render with SVG shapes
   - SVG shapes should scale with node size
   - keep borders sutle at rest and brighten when selected 


2. Add a shape drag preview.
    - when dragging a shape from the shape panel, show a ghost preview of that shape
    - keep the preview attached to the cursor while dragging 
    - use the same shape type and default size that will be used on the drop 
    - hide the preview after the shape is dropped or the drag is cancelled 
    - keep this limited to drag preview behaviour only


3. Keep node rendering connected to the existing collaborative canvas state.

## Scope limits

- don't rebuild shape panel layout
- don't change how dropped nodes are created
- don't add resize or label editing yet
- keep drag/drop changes limited to the ghost preview only


## Check when done


- Nodes render the correct shape variant for each type.
- CSS shapes render correctly for rectangle, pill, and circle.
- SVG shapes render and scale correctly for diamond, hexagon, and cylinder.
- `npm run build` passes without type errors.
   