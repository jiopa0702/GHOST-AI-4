Add shared Ai activity indicator so everyone in the room can see when generation is 8n progress.
This unit is only UI, presence ,and real-time status signals. Do not add the actual AI generation flow yet .


## Implementation 

1. Add Ai thinking state to the sidebar.
        - show a small status indicator when Ai is working 
        - make the status visible to everyone in the room 
        - disable the chat input while generation is active 
        - show a loading state in the send button 
        - keep the rest of the sidebar usable 



2. Add a shared AI status feed.
     - check the existing liveblock setup and installed agent-related features first 
     - follow liveblocks best practice for feeds/presence instead if creating parallel realtime state 
      - Create or reuse a liveblocks feed named `ai-status-fees`
       - subscribe to the latest feed message in the sidebar 
       - show only the most recent status messages 
       - keep the feed generic enough for design and soex generation later 



3. Add status messages validation.
      - define the feed payload schema in `types/task.ts`
      - the payload should support an optional `text` filed 
      - validate incoming messages before displaying them 


4. Add thinking indicators to live cursors.
         - when a participant has `thinking: true` in presence, show a small spinner in their cursor name badge 
         - hide the spinner when `thinking` is false or missing 


## scope limits 

   - don't Add actual Ai generation logic 
   - dont trigger background tasks yet 
   - dont block or dim the whole sidebar 
   - don't show full feed history 
   - keep this focused on shared AI activity states only.


## check when done 

   - sidebar can render shared Ai status from `ai-status-feed`.
   - chat input and send button respond to active generation state.
   - cursor badges Read `thinking` from presence 
   - Feed messages are validated through the task schema.
    - `npm run build` passes.