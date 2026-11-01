# Student Courses Page Documentation

## 1. Page Overview
The **Student Courses Page** (also titled **My Courses**) serves as the student's interactive multi-year degree roadmap. It displays all required core, elective, and university breadth courses mandated for graduation, tracking which courses have been completed, which are scheduled for the current term, and which remain for future semesters.

## 2. Target User
- **Roles**: **Student** only.
- **Access**: Protected by `AuthGuard` and `RoleGuard({ allowedRoles: ["student"] })`.

## 3. Page Sections
1. **Roadmap Summary Cards**:
   - **Remaining Courses**: Total unpassed courses count (e.g. `32 Courses Remaining`).
   - **Current Term Target**: Courses recommended for the immediate upcoming semester.
   - **Credit Ceiling**: Maximum allowed credit hours based on student CGPA and academic standing (`18 cr Max`).
2. **Plan Status Tabs**:
   - **This Term (`this_term`)**: Courses planned for the active registration cycle.
   - **Behind (`behind`)**: Delayed courses or missing prerequisites needing immediate remediation.
   - **Later (`later`)**: Upper-division courses scheduled for junior/senior standing.
3. **Interactive Course Matrix Table**:
   - Columns: Course Code, Course Title, Credits, Curriculum Area, Plan Study Year & Term, Eligibility Badge (`Eligible`, `Blocked by Prereq`), and Styled Action Buttons (`View Offering Details`, `View Degree Rule`).
4. **Search and Filter Bar**:
   - Live text search across course codes and titles.
   - Quick filters for eligibility (`Eligible`, `Not Eligible`, `Already Passed`).
5. **Course Details Dialog**:
   - In-page modal dialog displaying course description, prerequisite satisfaction status, and lecture/tutorial/lab structure.

## 4. Features and Functionality
- **Plan Status Segmentation**: Categorizes degree requirements into actionable time horizons.
- **Prerequisite Validation**: Immediately identifies whether a course is blocked by an unpassed prerequisite.
- **Real-Time Filtering**: Live search bar filters the course matrix without page reloads.
- **In-Page Detail Overlays**: Clicking "View Offering Details" opens a modal overlay preserving user scroll position and filter state.

## 5. UI Components
- **Primitives**: `Button.jsx`, `Dialog.jsx`, `EmptyState.jsx`, `ErrorState.jsx`, `Icon.jsx`, `Badge.jsx`, `Skeleton.jsx`.
- **Action Buttons**: Styled interactive button chips replacing plain text links.

## 6. Interactions
- **Filter Tabs**: Toggles between `this_term`, `behind`, and `later` views.
- **Search Input**: Live filtering of table rows.
- **Details Button Click**: Opens the `CourseDetailsDialog` modal.

## 7. Technologies Used
- **React 19**: Component lifecycle and memoization.
- **@tanstack/react-query**: Fetches data via `studentApi.myCourses()`.
- **Tailwind CSS v4**: Responsive tables and pill badges.
- **react-i18next**: Localized strings from `studentCourses.json`.

## 8. Implementation Details
- **Component File**: [`src/pages/student/MyCoursesPage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/student/MyCoursesPage.jsx)
- **Route Path**: `PATHS.student.myCourses` (`"/student/my-courses"`)
- **Bundle Output**: `dist/assets/MyCoursesPage-Is4oc4Cv.js` (30.26 kB).

## 9. Data and APIs
- **Service API**: `studentApi.myCourses(query)` in `src/services/api/student/student.js`.
- **Mock Handlers**: `src/mocks/handlers/student/myCourses.js` and derivations in `derive.js`.

## 10. Responsive Design
- Desktop: Wide multi-column academic matrix with sticky headers.
- Mobile / Tablet: Card-like table rows with horizontal scroll wrappers and touch-friendly action buttons.

## 11. Implementation Status
- **Status**: **Fully Implemented and Verified**.
- **Notes**: Passed linting with 0 errors, 0 warnings; Vite production build compiles cleanly.

