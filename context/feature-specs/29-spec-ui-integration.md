# Spec UI integration

The original feature file was empty. This implementation scope is inferred from the feature name, the existing Specs tab, and the completed generation and download endpoints.

## Implementation

- Replace the demo Generate Spec and Download spec controls with working behavior in the Specs tab.
- Generate a spec using the active project's room ID, current canvas nodes and edges, and available room chat history.
- Call the authenticated `POST /api/ai/spec` endpoint, then request a run-scoped token from `POST /api/ai/spec/token` and subscribe to the run.
- Show pending, success, and failure feedback. On success, keep the returned spec ID in the current workspace session and offer a download through `/api/projects/[projectId]/specs/[specId]/download`.
- Keep Blob URLs private; download only through the access-checked route.

## Scope limits

- Do not add a spec editor or change the generation/persistence backend contracts.
- Display the latest spec generated during this UI session. Loading a full persisted spec history is an open question in `context/progress-tracker.md`.
