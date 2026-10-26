complete the existing AI sidebar placeholder and turn it into a propper floating chat sidebar component. the sidebar already exists, so keep current floating placement and smooth slide-inbehaviour from righ side. this unit is focused on building out the sidebar UI inside it 

## Implementation

1. separate The AI sidebar into its own component.
   - keep the open/close state controlled by the parent
   - preserve the existing slide animation, Floating position, border , background, and shadow styling 
   - use sidebar surface styles like `bg-base/95`, `border-surface-border`. and the current shadow treatment


2. Add the sidebar header.
   - title: `AI Workspace`
   - subtitle: `collaborative with Ghost AI`
   - SMALL bot icon
   - close button alligned to the right 
   - use `text-primary` for thr title 
   - use `text-muted-text` for the subtitle 


3. Add a tabbed layout with two tabs

   Use shadcn `Tabs`.
   - `AI Architect`
   - `specs`
   - active tab should use the accent styling, like `bg-accent` and `text-accent`
   - inactive tab text should stay muted with `text-muted-text`

4. Build the AI Architect tab.

   use shadcn component where they fit, especially `Button` and Textarea`.
   - scrollable chat area 
   - empty state with bot icon, short descripton, and starter prompt chips
   - starter chips:
     - `Design an e-commerce backend`
     - `Create a chat app architecture`
     - `Build a CI/CD pipeline
 - style starter chips as soft pill using `bg-subtle` and `text-accent-text`
 - user messages should-right alligned with `bg-brand-dim border-brand50 border -2 text-copy-primary`
 - assistant messages should left alligned with `bg-elevated border border-surface-border text-accent-text`
 - input area with an auto-resizing textarea, around 72px min height and 160px max height 
 - send button should use `bg-accent text white`
 - `Enter` submits, `shift+Enter` add a newline


 5. Build the specs tab.
    - show a `Generate Spec` button `bg-accent text-white`
    - show a demo spec card for now 
    - style the card with `bg-elevated` and `border-surface-border`
    - include a file/spec icon, title, short snippet, and disabled download section


6. Use the existing project color tokens.

   check `globals.css`, `ui-context.md` or the tailwind maping before adding direct color values. avoid inventing new colors if a matching token already exists.


## Scope limits

- don't rebuild the existing sidebar open/close behaviour 
- don't add backend logic
- don't add liveblocks or AI generated logic yet 
- keep this focused on the sidebar UI structure 








































