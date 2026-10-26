Add a small floating color toolbar so selected nodes can change both their background and text color directly on the canvas.

## implementation

1. Check `ui-context.md` for the node color palette.
   Each palete option includes:
   - a node background color
   - a matching text color

   reuse existing theme colors if they already exist in the  `globak.css`. otherwise, keep the palette in the canvas types/ constants, such as `typescanvas.ts`.

2. Add a too;bar above selected nodes.
   - only show it when the node is selected 
   - keep it slightly above the node without overlapping it
   - show one swatch per color pair
   - active swatches should feel clearly selected 
   - hovering a swatch should show a subtle glow based on its text color 
   - keep the glow tight and controlled not overly blurred 
   - prevent toolbar interactions from dragging nodes or panning the canvas 

3. when a swatch is selected:
   - update both the node background color and text color
   - update the node UI immediately 
   - keep this inside the existing collaborative canvas state 
   - no server calls 


4. Selected nodes should visually reflect their active color pair
   the node background updates to the selected color, and the text automatically updates to its paired text color.

## scope limits

- don't change drag/drop behaviour 
- don't rebuild node selection logic
- don't add a full color picker
- keep this focused on predefined color themes only

## check when done 

- Nodes use predefined background/text color pairs.
- selected nodes show a floating color tool bar.
- swatch selection updates both node and text colors.
- `npm run build` passes without type errors.








