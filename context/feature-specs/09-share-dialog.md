Add a `Share` button to the editor naviar that opens the share dialog.
Owners can: 

-	Invite collaborators by email
-	View current collaborators 
-	Remove collaborators 
-	Copy the project link with temporary `copied!` feedback

 Collaborators can:

 - view the collaborator list only 
 - not invite, remove, or manage access 

 ## Clerk User Data

 Collaborators are stored by email in the database.

 Only fetch a limited batch of collaborator emails per request (for example, the first 20–25 records or a paginated window) and enrich just that batch with Clerk user data.

 Use Clerk Backend API to enrich collaborator email with:

 - display name
 - avatar image

 if a Clerk user is not found for an email, fall back to showing the email only 

 ## implementation

 Add the required API logic for;

 - listing collaborators 
 - inviting collaborators 
 - removing collaborators 

 Enforce ownership server-side for an invite and remove actions.

 Do not add a local user table.

 ## check when done 

 - share dialogue opens from the workspace 
 - owners can invite and remove collaborators 
 - collaborators see read-only access 
 - `npm run build` passes 