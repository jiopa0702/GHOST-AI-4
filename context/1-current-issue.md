Review the editor workspace implementation and fix the following issues.
Check `components/editor` first. Do not break existing features.


## Issues 


### 1. Save button in workspace navbar 

**Status: Fixed — browser-verified**

Read the navbar component  and the autosave hook before implementing.

The workspace navbar is missing a save button. The autosave  hook already exists and tracks saving/error states - wire the button to it 

Add rhe save button to the workspace navbar only. The navbar is shared with editor home so conditionally render the button based on workspace context- it must not appear on the editor home navbar.


Button behaviour:

 - default state: shows "save"
 - while saving: shows "saving..."
 - after succesful save: shows "saved" briefly the returns to "save"
 - on error: show "Error" briefly then return to "save"
 - clicking it triggers a manu save through the same save function the autosave uses 


Also fix the canvas save API route. Open the route file at `app/api/projects/[projectId]/canvas/route.ts` and make these two changes:


 - in the PUT handler change `access: "public" to `access: "private"`in the vercwl blob put call 
 - in the Get handler replace any raw fetch call with the vercel blob 50k to retrieve the blob content using the stored URL

Do not change anything else.

### 2. Delete nodes and edges 

**Status: Fixed — browser testing pending**

Read liveblocks agent skills before implementing this. 
Then read the canvas wrapper component and the existing node and edge mutation helpers.


Selected nodes and edges cannot be deleted from the canvas.

 Add a key down event listener to the canvas wrapper that: 

 - listen for delete and backspace keys
 - does not fire when the event target is on input, textarea,
 Or contenditable element
 - gets currently selected nodes using useNodes{ } 
 Filtered 
 By selected state
 - gets currently selected edges using use Edges { } filtered 
 By selecting state 
 - removes them using the existing      Liveblocks collaborative 
 Mutation helpers 
 
Do not use React Flow's built-in deletekeycode or any React Flow keyboard deletion behaviour , All deletions must 
Go through the existing liveblocks collaborative state so
They sync across all connected clients in real time.

Do not change anything else 

### 3. Nodes connection handles 

**Status: Fixed — browser testing pending**

Read liveblocks agents skills before implementing this.

Nodes can only be connected from the top handle. All four
Handles- top, right,bottom, left - should be active and  
Connect able 
Check the existing handle component in the custom node renderer. Verify each handle has the correct position properly and that no css is hiding disabling the non-top handles. C9nnecrion between. Any two handles on any two nodes should work and sync through existing liveblocks edge state.

### 4. Drag position offset

**Status: Fixed — browser testing pending**

Read liveblocks agent skills before implementing this.

When dropping a shape from the panel onto the canvas ,
The node places below where the cursor actually is.

Check the drop handler in the canvas wrapper. The position  calculation must account for:

 - the drag offset from where the user grabbed the shape inside the drag element, not just the elements top left corner 

 - the canvas containers bounding React 
 - the current React Flow pan offset zoom scale via screentoflowposition or project 

The node should appear with its center at the exact cursor position or drop.

### 5. AUTO ZOOM on first node drop

**Status: Fixed — browser testing pending**

Read liveblocks agent skills before implementing this.

Dropping the first node onto a fully empty canvas causes an 
 Automatic zoom-in. This doesn't happen when ither nodes exist. Check the drop handler and the fitview or fitbounds
Calls that mau be triggered after the first node is added.
Disable or guard any automatic fit/zoom behaviour so it does not fire during a drop event . The view port should stay exactly where the user left it after dropping a node.

## 6. Collaborator avatar image error 

**Status: Fixed — browser testing pending**

Check Clerk agent skills before implementing this.

Add implementing.clerk.com to the allowed image host names in next.config.js using the correct remote patterns configuration.

### 7. Remove uservutton from workspace navbar

**Status: Fixed — browser testing pending**

Check Clerk agent skills before implementing this.

Remove rhe userbutto. From the workspace navbar only. The navbar is shared so make sure the user button remain on the editor home navbar. Confitionally render it based on weather the component is being used in the workspace context or the editor home context.

## scope 

 - fix only what is listed above 
 - do not change canvas node or edge rendering behaviour 
 - do not modify the editor home navbar layout 
 - do not break existing autosave , presence, or collaboration 
Logic
- npm run build passes