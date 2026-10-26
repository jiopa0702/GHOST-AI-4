Add resizing and inline label editing to canvas nodes.

## implementation

1. Add resizing.
   - selected nodes should show resize handles
   - prevent nodes from being resized below a minimum size
   - keep resize handles subtle and consistent with the dark canvas UI
   

2. Add inline label editing.
   - Keep the node label centered inside the node
   - double-click the center/label area of a node to edit its label
   - show placeholder text in the same centered position when the label is empty
   - keep editing smooth without causing layout shifts
   - show a text area directly over the label while editing
   - update the label as users type
   - close editing on blur or `Escape`
   - prevent text editing interactions from dragging or panning the canvas 


3. keep all nosed updates connected to the existing collaborative canvas state.

## Scope limits

- don't change shape rendering from the previous unit
- don't change the shape panel or drag preview 
- dont change ho dropped nodes are created
- keep this focused on resize and label editing only


## check when done

- selected nodes show resize handles.
- Resizing updates node dimension through the existing node state flow.