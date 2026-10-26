Add real-time room chat to the Ai sidebar using a separate liveblocks `ai-chat` feed.

This is only for chat messaged. Keep it separate from `ai-status-feed`, which h handles Ai progress and presence updates.


## Implementation 

1. Add tge `ai-chat` feed.
      

        Before implementing, check the existing Liveblocks setup and follow the same feed patterns already in use in the project.
 
    - create or reuse a liveblocks feed named `ai-chat`
    - keep it room-scoped
     - do not mix it with `ai-status-feed`

2. Wite the chat feed into the sidebar.

       - subscribe to `ai-chat` in the sidebar chat area 
       - render chat messages in order 
        - show sender, timestamp, and message content 
        - keep the styling consistent with the existing sidebar UI
        - use tailwind utilities and existing shadcn component where they fit 

3. Add message sending.
       - allow users un the room to send messages to `ai-chat` 
        - use the existing sidebar input and send button 
        - clear the input after a succesful send 
        - show a small error state if sending fails 

4. Add message validation.

     - define or reuse a zod schema i. `types/task.ts`
     - message shapes should include sender, role, content, and timestamp 
     - validate feed messages before rendering them