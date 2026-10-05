the database schema is ready. Build the backend project API routes only.

## Routes

create REST endpoints for:

- `GET /api/projects` , list current user`s projects
- `POST /api/projects` , create project
- `PATCH /api/projects/[projectId]`, rename project
- `DELETE /api/projects/[projectId]`, delete project

## Rules

use the authenticated Clerk user ID as `ownerId`.

when creating:

- default missing project name to `untitled project`
- use the schema's existing ID strategy, do not add sequential IDs

security:

- unauthenricated requests return `401`
- only the project owner can rename or delete
- non-owner mutations return `403`

keep this backend-only. Do not wire the UI yet.


## Check when done

- routes exist for list/create/rename/delete
- owner checks are enforced for rename/delete
- `401` and `403` responses are handled correctly
- `npm run build` passes