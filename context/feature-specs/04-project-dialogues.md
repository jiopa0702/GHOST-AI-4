## Goal

Build the `/editor` home screen and add project dialogs/sidebar actions.  NO Api calls or persistence yet.

## Editor Home 

Reuse the existing  editor layout. do not modify the navbar or sidebar behaviour.

in the center of the page , add:

- heading: `Create a project or open an existing one`
- description: start a new architecture workspace, or choose a project from the sidebar.
- `New project` button with a `plus` icon:

keep the layout minimal. Do not wrap this content in cards.

Clicking `New Project` should open the create project dialog.
### Dialog`s

### Create projects

- project name input
- live slug preview based on the name
- preview updates as the user types

### Rename Project

- prefiled project name input
- current project name shown in the description
- input auto-focuses
- enter submits

### Delete projects
- destructive confirmation only
- no input
