# TimeGen AI — Admin School Management changes

## Included in this patch

- Added an Admin-only **Schools** navigation item and School Management page.
- Added school creation through `POST /api/v1/admin/schools`.
- Added a school list from `GET /api/v1/admin/schools`.
- Added school deletion through `DELETE /api/v1/admin/schools/{school_id}`. The API refuses deletion if the school has users or academic data, to prevent accidental cascading deletion.
- Replaced the hardcoded school name in the header for Admin accounts with a database-backed school selector. The selected ID is saved in browser local storage.
- The existing **Manage Access** page continues to create Principals, assign them to a selected school, and grant/revoke feature permissions.
- No database migration is needed for these changes because no database columns or tables were added.

## Apply the patch to your local project

1. Back up your current project folder or commit your changes with Git.
2. Extract this ZIP to a new folder first and compare/merge it with your current project. Do not overwrite your `.env` files with example files.
3. The principal files changed are:
   - `backend/app/api/v1/endpoints/admin.py`
   - `frontend/src/services/adminService.ts`
   - `frontend/src/pages/SchoolsPage.tsx` (new)
   - `frontend/src/App.tsx`
   - `frontend/src/components/layout/AppLayout.tsx`
4. Start the backend in the existing Python virtual environment:

   ```powershell
   cd backend
   # activate your existing venv first
   uvicorn app.main:app --reload
   ```

5. Start the frontend in a second terminal:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

6. Sign in using an Admin account. Open **Schools**, create a school, and verify it appears in both the list and header dropdown.
7. Open **Manage Access**, create a Principal for that school, and grant the required features.
8. Try deleting an unused school. Then try deleting a school with a Principal or academic records; the API should refuse and display an error instead of cascading away the data.

## Important limitation / next phase

The header dropdown currently selects and remembers the Admin's school context, but it does **not yet scope the Teachers, Subjects, Classes & Sections, Availability, or Timetable pages to that selected school**. Those pages still need their mock/local data replaced with API calls that use school-scoped backend authorization. Do not treat the school selector alone as multi-school data isolation. The backend must enforce the selected school on every academic-data endpoint before this is production-ready.
