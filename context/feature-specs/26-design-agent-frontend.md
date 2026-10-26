Wire up the Ai sidebar so users can submit design prompts, Track Ai run status in real-time, and reflect Ai-driven canvas updates through liveblocks.


## Implementation 

1. Submit from Ai sidebar 

  - on submit :
     - push the user message to the `ai-chat` feed 
      - call `POST /api/ai/design` with `{ prompt, roomid }` 
      - Read `{runid, Public Token }` from the response 
  - store `runid` and `publicToken` in local state 

2. Run status tracking 


 - Use `useRealtimeRun(runid, {accessToken: public token } )` 
  - While the run is active:
  - disable the chat input 
   - show a loading state (spinner in the button is enough) 
 - when the run completes: 
  - push a final Ai message to `ai-chat`
   - reset loading + run state 


3. Canvas updates (realtime)

    - do not manually update nodes/edges 
    - realt on liveblocks (` useLiveblocksFlow` ) to reflect changes in real time 
     - Ai updates to nodes, edges, and presence should appear automatically 


4. Status display 

   - Read tge latest messages from `ai-status-feed` 
   - show a compact status strip above the input only when a run is active 


### UI details. 
   - use existing design tokens from `global.css` (do not introduce new colors )
   - Follow `ui- context.md` for layout and visual consistency 

Chat bubbles
