# Student Academic Data Page Documentation

## 1. Page Overview
The **Student Academic Data Page** is the official electronic degree audit, cumulative GPA verification, and complete academic transcript interface for university students. It allows students to track earned credits across bylaw categories, review currently active course attempts, and inspect historical grades semester by semester.

## 2. Target User
- **Roles**: **Student** only.
- **Access**: Protected by `AuthGuard` and `RoleGuard({ allowedRoles: ["student"] })`.

## 3. Page Sections
1. **Academic Header**:
   - Monogram avatar (`KA` / `ZM`), student full name, degree name (`B.Sc. Computer Science`), cohort (`Fall 2025`), bylaw version (`Regulations 2025`), and major track (`Software Systems`).
   - Planning Year badge (`Academic Year 2025/2026`) and an `Export Audit` button invoking browser print.
2. **Academic Standing & Cumulative GPA Card**:
   - Displays Cumulative GPA (`3.67 / 4.00`) and earned degree credits (`42 / 138 total credits`).
   - Progress bar showing overall degree completion percentage (`30.4%`).
   - Breakdown of credits by curriculum area:
     - **Core Computer Science**: `33 / 96 cr`
     - **Elective Courses**: `9 / 42 cr`
3. **Current In-Progress Courses Table**:
   - Lists active course attempts: Course Code, Course Title, Credits, Term Label (`Spring 2025`), Section (`Sec 01`), and `Active` status badge.
   - Computes total currently registered credits dynamically (`9.0 Credit Hours`).
4. **Historical Completed Courses & Transcript Table**:
   - Groups past terms chronologically: displays Course Code, Course Title, Credits, Letter Grade (`A`, `A-`, `B+`), and Grade Points (`4.00`, `3.70`, `3.30`).
5. **Departmental Prerequisite Rule Alerts**:
   - Displays milestone notices (e.g., "Curriculum milestone check passed for Sophomore standing").
6. **Degree Tree Navigation**:
   - Tab/segmented control allowing students to toggle between the **Transcript View** and the **Curriculum Requirement Matrix**.
7. **The AI Explanation Sidebar Integration**:
   - Decoupled from static page columns and integrated globally via the **Global AI Chat Drawer** (`AIChatSidebar`) accessible via the header `AI Chat` button, connecting to `src/services/api/explanations.js` (`POST /explain`).

## 4. Features and Functionality
- **Official Transcript Review**: Displays all graded historical terms and semester GPAs.
- **Active Semester Load**: Calculates current credit registration against credit ceilings.
- **Bylaw Progress Audit**: Automatically checks student standing against curriculum bylaws.
- **Print Export**: Formats the complete degree audit into a clean printable page.

## 5. UI Components
- **Primitives**: `Button.jsx`, `Badge.jsx`, `Card.jsx`, `Icon.jsx`, `ProgressBar.jsx`, `Skeleton.jsx`, `ErrorState.jsx`.
- **Tables**: Dense academic tables with fixed-width font-mono figures.

## 6. Interactions
- **Export Audit**: Invokes native print preview.
- **Course Row Click**: Expands course details.
- **View Toggle**: Switches between transcript history and requirement tree.

## 7. Technologies Used
- **React 19**: Component lifecycle and memoization.
- **@tanstack/react-query**: Server state management via `studentApi.academicData()`.
- **Tailwind CSS v4**: Fluid typography and responsive layout.
- **react-i18next**: Localized strings from `studentAcademicData.json`.

## 8. Implementation Details
- **Component File**: [`src/pages/student/AcademicDataPage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/student/AcademicDataPage.jsx)
- **Route Path**: `PATHS.student.academicData` (`"/student/academic-data"`)
- **Bundle Output**: `dist/assets/AcademicDataPage-BEmbeM9x.js` (19.82 kB).

## 9. Data and APIs
- **Service API**: `studentApi.academicData()` in `src/services/api/student/student.js`.
- **Mock Handlers**: `src/mocks/handlers/student/academicData.js` and derivations in `derive.js`.

## 10. Responsive Design
- Multi-column desktop grid collapsing into stacked cards on mobile devices.
- Tables wrapped in `overflow-x-auto` to prevent column truncation on small viewports.

## 11. Implementation Status
- **Status**: **Fully Implemented and Verified**.
- **Notes**: Passed linting and production build with zero errors.

