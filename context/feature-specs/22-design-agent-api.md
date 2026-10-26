Set up the backend Flow for design generation using Trigger.dev.
This unit handles triggering background jobs, tracking runs, and issuing tokens. No AI logic yet.


## Implementation 
1 Add the design trigger route. 
   
    Create: `POST /Api/ai/design`
    This route should:
    - accept the design prompt and required
     Context (`roomId`, `projectId`)
    - trigger the design task through Trigger 
      .Dev
    - create a task Run record
    - return the run ID to the client 

2 Add task run tracking.

    Create a `TaskRun` model in prism to 
     Track Trigger.dev runs and verify ownership.

     It should include 
     - `runId` (unique)
     - `projectId`
     - `userId`
     - `CreatedAt`
      Add:
      - an index on `runId`
      - a compound index on `userId` and `projectId`


3 Add the token route.
    Create : `POST /Api/ai/design/token`
This route should:
 - accept a run ID 
 - verify ownership using the taskRun record
 - generate a Trigger.dev public token scoped to that run
 - return the token To the client 

4 Create the design task:

     - check the existing Trigger. Dev setup and installed agent features first 
     - reuse the existing set up instead of creating a new pattern 
     - export a minimal design task
     - accept the expected payload (`prompt`, `roomId`)
     - log or echo the input for now 
      - don't Add AI logic yet 


## scope limits 

  - don't generate nodes or edges yet 
  - don't call any AI providers 
  - don't update the canvas 
  - keep this focused on backend task wiring only 

## check when done 

  - `POST /api/ai/design` triggers a background task.
  - Task runs are stored in prisma.
  - `POST /api/ai/design/token` returns a run-scoped token.
  - Design task exists and is callable.
  - `npm run build` passes.
