# TODO: Add Summarized Report Email Feature

## Steps to Complete
- [x] Create new API endpoint `/api/send-report.js` for generating and sending the summarized report via email
- [x] Update `pages/dashboard.js` to add "📧 Send Report" button next to the export button
- [x] Implement button click handler in dashboard to call the new API endpoint
- [x] Test the feature by running the app and verifying email is sent (ensure SMTP env vars are set)
