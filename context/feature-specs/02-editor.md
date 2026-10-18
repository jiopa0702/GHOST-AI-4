we need the base chrome component that frame every editor screen - the top navbar and the left sidebar shell. these will be reused and extended in every chapter that follows.

### editor navbar

create `components/editor/editor-navbar.tsx`.

Requirements:

- fixed-height top navbar
- left, centre, and right section
- left section contains sidebar toggle button
- use `panelleftOpen` / `panelleftClose` icons based on sidebar state
- right section stays empty for now
- dark background with sutle bottom border

### project sidebar

create `components/editor/project-sidebar.tsx`.

Requirements:

- sidebar should float above the editor canvas
- opening it should not push page content
- slides in from the left 
- accepts `projects` title + close button
- shadcn `Tabs`:                                           
  - My Projects
  - Shared
- both tabs show empty placeholder state
- full-width `New Project` button at the bottom with `plus` icon


### Dialog Pattern

use the existing color tokens from `globals.css` for dialog styling.

Support:

- title
- description  
- footer actions

Do not build actual dialogs yet.

### check when done

- new vomponents compile without typescript errors
- no lint errors
- dialog pattern is