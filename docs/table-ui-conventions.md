# CRM table conventions

User preference, applying to all current and future record tables:

- Use one three-dot button in the last column for row actions. Use `renderRecordRowActions` and the shared menu portal; do not place separate Edit, Delete or Review buttons in the action cell.
- Include the relevant existing actions for that record. Keep status restrictions, linked-record checks and deletion review flows.
- Use horizontal row separators only. No vertical borders or dividing shadows in the header or body, including beside the action column.
- Give the action header a screen-reader label, with no visible heading. Keep the action button aligned and available during horizontal scrolling.
- Menus must stay within the viewport and support keyboard navigation, Escape, outside clicks and closing on scroll, resize or navigation.
- Keep record-name links and existing row-to-profile navigation. Opening the menu must not open the profile.
- Check client and product detail tables as well as main listing screens when changing shared table behavior. Read-only summary tables do not need an extra action column.

Implementation: `dist/app.js`, `dist/listings.css`, and the Contacts/Billing renderers in `dist/crm-ops.js` and `dist/core-workspaces.js`.
