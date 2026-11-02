# Student Academic Status Page Documentation

## 1. Page Overview
The **Student Academic Status Page** represents the official evaluation of a student's standing, academic honors, cumulative GPA band, credit compliance, and bylaw progression. In the ACOPS frontend architecture, this capability is fully realized and integrated within the **Academic Data (`/student/academic-data`)** and **Student Dashboard (`/student`)** views rather than isolated on a disconnected route.

## 2. Target User
- **Roles**: **Student** only.
- **Access**: Protected by `AuthGuard` and `RoleGuard({ allowedRoles: ["student"] })`.

## 3. Page Sections
When reviewing academic status, the following dedicated sections provide complete standing intelligence:
1. **Official Academic Standing Banner**:
   - Status badge: `Active Regular` / `Good Standing` (in emerald green `#E7F6EF`).
   - Bylaw compliance statement: "In Full Bylaw Compliance" / "Curriculum milestone check passed for Sophomore standing".
2. **Cumulative GPA & Band Card**:
   - Primary metric: Cumulative GPA (`3.67 / 4.00`).
   - Standing evaluation band (e.g. Dean's Honors List / Regular Standing).
3. **Credit Completion Meter & Graduation Deficit**:
   - Degree completion progress bar: `42 / 138 total credits` (`30.4% Completed`).
   - Breakdown of credits earned by level: Year 1 Foundation (`32 cr`), Year 2 Specialization (`10 cr`), and Remaining Requirement (`96 cr`).
4. **Curriculum Domain Pace Distribution**:
   - Core Computer Science: `18 / 64 cr` (28.1%).
   - Mathematics & Basic Sciences: `16 / 32 cr` (50.0%).
   - Institutional Breadth: `8 / 18 cr` (44.4%).
5. **Academic Advisory Affiliation**:
   - Assigned faculty advisor name (`Dr. Mostafa`) and department contact link.

## 4. Features and Functionality
- **Official Standing Evaluation**: Evaluates whether the student satisfies minimum CGPA thresholds under the applicable bylaw (e.g. 2025 bylaw).
- **Graduation Progress Tracking**: Immediately indicates remaining credit deficits across foundational and core mandates.
- **Official Audit Export**: Quick print button formatting the academic standing review for official submission.

## 5. UI Components
- **Integrated Views**: Rendered within `StudentDashboardPage.jsx` and `AcademicDataPage.jsx`.
- **Primitives**: `Card.jsx`, `Badge.jsx`, `Button.jsx`, `Icon.jsx`, `ProgressBar.jsx`, `Skeleton.jsx`.

## 6. Interactions
- **Export Audit**: Invokes print preview of official standing metrics.
- **Matrix Link**: Navigates to full bylaw requirement matrix.

## 7. Technologies Used
- **React 19**: Component state and calculations.
- **@tanstack/react-query**: Fetches data via `studentApi.academicData()` and `studentApi.dashboard()`.
- **Tailwind CSS v4**: Fluid typography and status-colored progress meters.
- **react-i18next**: Localized strings from `studentDashboard.json` and `studentAcademicData.json`.

## 8. Implementation Details
- **Integrated Implementation**: Rendered within [`src/pages/student/AcademicDataPage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/student/AcademicDataPage.jsx) and [`src/pages/student/StudentDashboardPage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/student/StudentDashboardPage.jsx)
- **Route Paths**: `PATHS.student.academicData` (`"/student/academic-data"`) and `PATHS.student.dashboard` (`"/student"`)

## 9. Data and APIs
- **Service API**: `studentApi.academicData()` and `studentApi.dashboard()` in `src/services/api/student/student.js`.
- **Mock Handlers**: `src/mocks/handlers/student/academicData.js` and derivations in `derive.js`.

## 10. Responsive Design
- Fully responsive across desktop, tablet, and mobile viewports with smooth stacked cards and non-overflowing progress tracks.

## 11. Implementation Status
- **Status**: **Fully Implemented as an Integrated Feature**.
- **Notes**: Fully functional across both the dashboard and academic data portals; unifies academic status verification directly into core student workflows.

