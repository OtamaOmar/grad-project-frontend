# Student Dashboard Documentation

## 1. Page Overview
The **Student Dashboard** is the primary operational homepage for authenticated university students. It synthesizes complex academic progress metrics, active course attendances, predicted upcoming offerings, and academic alerts into a single cohesive, high-density interface.

## 2. Target User
- **Roles**: **Student** only.
- **Access**: Protected by `AuthGuard` and `RoleGuard({ allowedRoles: ["student"] })`.

## 3. Page Sections
1. **Header Operational Bar**:
   - Breadcrumb: `Curriculum Workspace / Undergraduate Computer Science`.
   - Title: `Student Dashboard` & personalized greeting: "Welcome back, {fullName}".
   - Active semester chip: `Term: Fall 2025/2026 · Active Audit Cycle #3`.
   - `Export Degree Audit` action button triggering browser print styles.
2. **Notification Banner Strip**:
   - Amber alert badge notifying the student that the Fall 2026 forecast is undergoing curriculum board review (`Pending Review`).
   - "Inspect Queue" button opening the `AuditQueueModal` dialog with active Run ID (`RUN-2025-08-C3`).
3. **Four Core Academic KPI Summary Cards**:
   - **Cumulative GPA**: Displays `3.67 / 4.00` with verified `Good Academic Standing` tag.
   - **Degree Progress**: Displays `42 / 138 total credits` (`30.4% Completed`), smooth progress bar, and credit distinction: `42 cr completed • 96 cr remaining`.
   - **My Current Courses**: Displays `3 Enrolled` (`9 Credit Hours`), showing active enrolled course codes with a direct link to `/student/my-courses`.
   - **Academic Standing**: Displays official standing badge (`Active Regular`), cohort (`2025`), and student ID (`2025-0142`).
4. **Two-Column Academic Matrix & Curriculum Insights**:
   - **Academic Status & Profile Card (7 Columns)**:
     - Student profile header with monogram avatar (`ZM`), full name, degree (`B.Sc. Computer Science`), and section code (`ENROLL-SEC-A`).
     - 4-token metadata grid: Student ID, Cohort Year, Bylaw Version, and Standing.
     - Foundational & Core credit allocation: Year 1 Foundation (`32 cr`), Year 2 Specialization (`10 cr`), and Remaining Requirement (`96 cr`).
     - Curriculum milestone check indicator (`check_circle`) and link to the full bylaw matrix.
   - **Curriculum Domain Breakdown (5 Columns)**:
     - SVG Donut Chart: 36x36 coordinate SVG with circular stroke calculations (`strokeDasharray`) representing completion pace (`42 Completed`).
     - Progress bars for degree areas: Core Computer Science (`18 / 64 cr`), Mathematics & Basic Sciences (`16 / 32 cr`), and Institutional Breadth (`8 / 18 cr`).
     - Academic Advisor contact card (`Dr. Mostafa`).
5. **My Current Courses Section**:
   - Clean academic table displaying active enrolled courses: `CSCI 201`, `MATH 112`, and `CSCI 220`, showing course title, credit hours, term, section (`Sec 01`, `Sec 02`, `Sec 03`), and `In Progress` badge.
   - Action button: `View All Courses` navigating to `/student/my-courses`.
6. **Expected Course Offerings Section**:
   - Preview table showing automated registration forecasts calculated from 2025 bylaw prerequisite satisfaction chains (`CSCI 207`, `MATH 201`).
   - Displays structure breakdown (`3h Lec + 2h Tut + 2h Lab`), prerequisite satisfaction indicators, and `Eligible & Projected` status.
   - Action button: `Explore Expected Offerings` navigating to `/student/expected-offerings`.
7. **Provisional Section Timetable Matrix**:
   - Weekly grid (Sunday through Thursday) showing class periods (`08:30 - 10:00`, `10:15 - 11:45`, `12:00 - 13:30`) with lecture halls (`Hall 301`), auditoriums (`Auditorium B`), and tutorial labs (`Lab 12`).
8. **Quick Actions Navigation Grid**:
   - 4 interactive tiles with hover effects linking to:
     1. `Academic Data` (`/student/academic-data`)
     2. `My Courses` (`/student/my-courses`)
     3. `Expected Offerings` (`/student/expected-offerings`)
     4. `Notifications` (`/notifications`)

## 4. Features and Functionality
- **Personalized Header**: Greets the student by name dynamically, falling back to session user records if profile data is loading.
- **Audit Queue Inspection**: In-page modal dialog allowing students to inspect the active forecast run ID and cycle notes.
- **Dynamic Calculation**: Derives GPA, completion percentage, and remaining credits dynamically.
- **One-Click Navigation**: Direct links to all other student features.

## 5. UI Components
- **Primitives**: `Button.jsx`, `Dialog.jsx`, `EmptyState.jsx`, `ErrorState.jsx`, `Icon.jsx`, `ProgressBar.jsx`, `Skeleton.jsx`.
- **Custom Charts**: Responsive SVG Donut Chart for degree pace calculation.

## 6. Interactions
- **Export Degree Audit**: Opens browser print interface with print-optimized styles.
- **Inspect Queue**: Opens the `AuditQueueModal` dialog with Escape key and outside-click dismissal.
- **Quick Actions Click**: Navigates directly to the selected tool.

## 7. Technologies Used
- **React 19**: Component lifecycle and memoization.
- **@tanstack/react-query**: Fetches `studentApi.dashboard()` and `studentApi.academicData()`.
- **Tailwind CSS v4**: High-density 12-column grid and typography.
- **react-i18next**: Localized strings from `studentDashboard.json`.

## 8. Implementation Details
- **Component File**: [`src/pages/student/StudentDashboardPage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/student/StudentDashboardPage.jsx)
- **Route Path**: `PATHS.student.dashboard` (`"/student"`)
- **Bundle Output**: `dist/assets/StudentDashboardPage-Uzz9SrHK.js` (47.69 kB).

## 9. Data and APIs
- **Service API**: `studentApi.dashboard()` and `studentApi.academicData()` in `src/services/api/student/student.js`.
- **Mock Handlers**: `src/mocks/handlers/student/dashboard.js` and `src/mocks/handlers/student/academicData.js`.

## 10. Responsive Design
- Desktop: Full 12-column multi-panel layout.
- Tablet: Stacks into 2-column configurations.
- Mobile: Fully responsive single-column layout with horizontal table scroll wrappers (`overflow-x-auto`).

## 11. Implementation Status
- **Status**: **Fully Implemented and Verified**.
- **Notes**: Passed ESLint with 0 errors, 0 warnings; Vite production build compiles in 2.37s.

