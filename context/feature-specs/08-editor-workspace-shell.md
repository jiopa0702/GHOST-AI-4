Build the `/editor/[roomId]` workspace shell with server-side access checks. no canvas logic yet.

## Access

`/editor[roomId]` must be server component.

Before rendering:

- unauthenticated users redirect to `/sign-in`
- users without project access see `AccessDenied`
- non-existent projects also show `AccessDenied`

Create ``components/editor/access-denied.tsx` with:

- centered layouy
- lock icon
- short message 
- link back to `/editor`
## Access Helpers
Create `libproject-access.ts` with helpers for:

- getting current clerk identity; `userId` + primary email
- checking project access by owner or collaborator

## Layout

Build a full-viewport workspace layout with:

- top navbar showing the project name 
- navbar actions: share button and AI sidebar toggle
- existing `projectSidebar` on the left 
- current room highlighted in the sidebar
- central canva placeholder with dark background and centered message
- right sidebar placeholder for future AI chat

the canvas area should fill the remaining space.

## Scope

Do not add real canvas  logic, liveblocks, AI chat, or sharing behaviour yet.

## Check when done

- `/editor[roomId]` builds succesfully
- access helper exists outside the page component 
- `Access Denied` is used for missin or unauthorized projects
- workspace layout renders with current project context
- no TypeScipt errors