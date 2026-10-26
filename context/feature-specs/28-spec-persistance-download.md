persist generated specs with vercel Blob and prisma, then add a secure download route so users can retrieve their generated spec files.

### implementation 

1. projectspec model

ensure a `projectspec` prisma model exists with:

- `id`
- `projectid` (relation to project)
- `filepath` (Blob url path)
- `createdAt`

use this model for metadata only. the actual spec content should live in Vercel Blob.

2. save generated spec

After a spec is generated 

- uploaded the markdown content to vercel Blob
- store the Blob Url/path in `projectspec.filepath`
- link the record to the correct project 
- follow thw same meta data _ nlon pattern used for canvas persistence 

3. download route 

create a route like `Get /api/projects/[projectid]/specs/[specid]/download`

it should:

- authenticate the user 
- verify access to the project
- verify the spec belongs to that project
- fetch the file using `projectspec.filePath`
- return it as a downloadable markdown file 
- handle not found and forbidden cases properly

### scope limits

- do not add frontend ui logic
- do not store spec content in prisma
- do not expose blob urls without access checks
- do not modify existing canvas persistence