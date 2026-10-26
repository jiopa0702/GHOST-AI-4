Show active room participants inside the editor canvas view. without changing the editor home navbar.


## implementation

1. keep the existing navbar bahaviour as-is
- do not change the editor home navbar
- do not move or redesign the shared navbar component globally
- if the editor home and editor canvas use the same navbar component, make sure this presence UI only appears in the canvas/editor room view


2. Add the participant avatar group inside the editor canvas area.
- position it in the top right corner of the editor canvas view
- keep it visually separate from the main navbar actions
- get the current user's ID from the active clerk session
- filter the liveblocks presence list to exclude any entry whose user ID matches the current Clerk user ID
- render the filtered list as collaborator avatars only 
- render the current user separately using the existing clerk
  User button -  do not render a second avatar for them from the Liveblocks presence list
- keep collaborator avatars and the clerk userbutton the same size so the group looks visually consistent
- show a divider between the collaborator avatars and the same size so the group looks viaually consistent 
- if no collaborators are present, show only the clerk Userbutton with no divider


3. Render collaborator avatars.
   - use profile photos when available 
   - fall back to initials when there is no image 
   - show up to five collaborator avatars in an overlapping stack
   - show a +N overflow chip when there are more than five 
   - add a subtle ring so avatars stay  readable on the dark canvas 


4. Add live cursors to the canvas.
   - render cursors for other participants only. never the current user
   - use the existing liveblocks presence state to broadcast cursor position 
   - update cursor position on React Flow's onMousemove event
   - clear cursor to null on mouse leave 
   - show a small colored pointer with a name badge attached
   - match the pointer and badge color to the participant's presence color


5. Define the shared presence type in `liveblocks.config.ts`.

  presence should include:
  - `cursor`: { x: number: y: number} l null`
  - `thinking`: boolean


## scope limits

- dont add psrticipant avatars to the shared navbar globally
- dont remove existing navbar actions like save, import, share or AI
- dont replace clerk user/profile/logout bahaviour
- dont make collaborator avatars interactive
- dont change canvas node or edge behaviour