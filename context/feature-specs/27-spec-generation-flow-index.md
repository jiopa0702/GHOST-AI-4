Create a backend flow of AI-powered spec generation: API route, Trigger.dev task, token route, and run ownership tracking.

### Implementation

1. Spec trigger route

Create or update `post /api/ai/spec`.

it should:

 - accept `roomid`. `chatHistory`, `nodes`, and `edges`
 - authenticate the current user 
 - resolve project access from `roomId`
 -trigger the `generate-spec` task
 - save a `TaskRUN` record for ownership/access control
 - return the trigger.dev `runId`

 do not trust a client-supploed `projectId`


2. spec token route

Create or update `POST /api/ai/spec/token`.

IT should:

- accept `runid`
- authenticate the current user
- verify the `TaskRun` belongs to the user 
- issue a Trigger.dev public access token scoped to that run
- set token expiration to 1 hour
- return the token to the client 


3. spec generation task

create or update `trigger/generate-spec.ts`.
define a `generateSpec` task that:

- accepts `projectid`. `roomid`, `chathistory`, `nodes`, and `edges`
- validation inputs with zod
- uses Gemini through `@ai-sdk/google`
- generate a markdown technical spec from the canvas and chat context
- returns the generated spec content as task output

Follow the existing Trigger.dev task patterns in the codebase for retries, logging, and error handling,

### scope limits
- do not add frontend logic
- do not create spec editor UI
- 