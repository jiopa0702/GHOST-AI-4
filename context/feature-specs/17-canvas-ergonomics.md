Add a floating control bar for zoom and undo/redo, then wire the sam actions to keyboard shortcuts.

## implementation 

1. Add a pill-shaped control bar at the buttom-left of the canvas.

   it should sit above the shape panel and include the groups:
   - zoom controls: zoom out, fit view, zoom in
   - history controls: undo, redo 


   separate the two groups with a thin divider.


2. wire the zoom controls to the React Flow instance.
   - zoom in
   - zoom out
   - fit view 
   - use a short animation so the movement feels smooth 


3. wire undo and redo to liveblocks history.
   - use the existing liveblocks undo/redo hooks
   - disable undowhen there is nothing to undo
   - disable redo when theres nothing to redo 
   - keep disabled buttons visualy dimmed 
  

4. Create a `UseKeyboardShortcuts` hook in `hooks/`.

   The hook should:
   - recieve the React Flow instance 
   - recieve undo and redo handlers
   - listen for keyboards shortcuts on `window`
   - ignore shortcuts while typing in inputs, textareas, or editable text fields


5. supports these shortcuts:
   - '+' or `=` to zoom in 
   - '_' to zoom out
   - `Cmd/Ctrl + Z` to undo
   - `Cmd/Ctrl + Shift + z` to redo
   - `Cmd/Ctrl + y` to redo

6, Remove the minimap at the butom right

## Scope Limits

- don't change the shape panel
- don't change node or edge rendering
- don't add Extra canvas controls 
- don't change the existing collaborative state setup


## Check when done 

- control bar is added to the canvas.
- zoom actions use theReact Flow instance.
- undo and redo use liveblocks history.
- keyboard shortcut are handled in `hooks/usekeyboardShortcuts`.
- shortcut handling skips editable fields.
-`npm run build` passes.





































