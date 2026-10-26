Implement the full Ai desigb agent so a use prompt results in real-time updates on the collaborative canvas, with visible AI presence and status.a


## Implementation

1. Update the design agent task in `trigger/design-agent.ts`.

Before implementing:
- check `context/project-overview.md` and `context/architecture-context.md` for product behaviour and system rules
- before implementing, check Liveblocks and Trigger.dev agent skills for current patterns on canvas Mutation and background task execution.

- follow the existing Trigger.dev setup and agent patterns already in the project
- reuse existing livenlocks Flow and presence patterns instead of creating nee ones


Then implement:
- use ageing {`@ai-sdk/google`} to interpret the user prompt
- update the canvas using the existing collaborative flow utilities
- support actions like:
- add node
- move node
- resize node
- Update node data
- delete node
- add edge


- publish Ai activity to thr shared status feed so all users see progress
- Update AI presence ( cursor + thinking state) while the task runs
- push clear status messages at key steps ( start, processing, complete )


- ensure generated design follow:
- allowed node shapes
- color palette
- layout and spacing rules


- handles errors gracefully and update status if something falls
- clear AI presence when the task finishes


## Dependencies
All packages are already installed. `GEMINI_API_KEY` is already in `.env.local`.


## Scope limits

- Don't change canvas architecture
- dont introduce a new state system outside Liveblocks
- don't bypass existing collaborative flow utilities



## check when done

- Design task updates the canvas through the existing collaborative flow.
- AI presence and status are visible to all participants.
- status messages reflect task progress.
- Errors are handled without breaking the canvas .
- `npm run build` passes.