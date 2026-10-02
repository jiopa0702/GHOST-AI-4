prisma is already installed. add the project data models, prisma client singleton, and first migration.

## models

create `prisma/models/project.prisma`.

Add `project`:

- owner ID mapped to clerk user
- name
- optional description
- status enum: `DRAFT` , `ARCHIEVED`
- canvasJsonPath` for future canvas blob storage
- timestamps
- indexes on owner ID and creation date 


Add `projectcolllaborator`:

- project relation with cascade delete
- collaborator email
- creation timestamp
- unique constraints on project/email
- indexes on emial and project/date

Do not add extra foelds unless required by prisma.

## prisma client

create `lib/prisma.ts` as a cached singleton.

Branch by `DATABA'SE_URL`:

- if it starts with `prisma+postgress://`, use Accelerate
- otherwise use direct `@prisma/adapter-pg`

Cache the client on `global` in development for hot reloads.

## migratio

Run the migration and generate the client.

## Dependencies

Already installed:

- `prisma`
- `@prisma/client`
- @prisma/adapter-pg`
- `pg`

### Check When Done

- schema has both models with correct relations and indexes
- `lib/prisma.ts` exports one cached prisma instance
- migration runs successfully
- `npm run build` passes