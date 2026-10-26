ADD autosave and loading for the collaborative canvas so project state is persisted before adding AI generation Canvas JSON should be stored in vercel Blob, and the saved blob URL should be stored on the prisma project record.

## what to install

- `@vercel/blob`

## implementation

1. Check the existing project schema.
   - review `prisma/model/project.prisma`
   - add or reuse a field for the canvas blob URL
   - keep prisma responsible for meta data only 


2. Add canvas save/load API routes.
   Create: `PUT /api/projects/[projectID]/canvas`
   this route should:
   - recieve the latest canvas JSON
   - upload the JSON to vercel Blob
   - store the returned blob URL on the matching Prisma project record


   Create: `GET /Api/projects/[projectid]/canvas`
   This route should:
   - read the project's saved blob URL from prisma
   - fetch the saved canvas JSON from vercel Blob
   - return the canvas state to the editor


3. Add an autosave hook in the `/hook` folder.
  - watch the canvas nodes and edges 
  - debounce saves to avoid excessive writes
  - save through the canvas API route
  - track save status: saving, saved, error


4. load saved canvas state in the editor.
   - when the editor loads, check if the liveblocks room has any existing node or edges
   - if the room is empty and the project has a saved canvas blob url, fetch and load the saved canvas state 
   - if the room already has nodes or edges, skip the load entirely to avoid overwriting active collaborating 


5. Add a small save status indicator in the editor save button.
- show saving, saved, or error states

## storage pattern

- prisma stores project metadata and the canvas blob Url.
- vercel Blob stores the actual canvas JSON.





















