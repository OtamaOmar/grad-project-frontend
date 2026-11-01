# Student Study Plan Page Documentation

## 1. Page Overview
The **Student Study Plan Page** represents the curriculum roadmap detailing a student's degree progression from freshman foundation to senior graduation. In the ACOPS frontend architecture, this capability is fully realized and integrated within the **My Courses (`/student/my-courses`)** interface rather than isolated on a disconnected route.

## 2. Target User
- **Roles**: **Student** only.
- **Access**: Protected by `AuthGuard` and `RoleGuard({ allowedRoles: ["student"] })`.

## 3. Page Sections
When accessed via the degree plan view, the study plan displays:
1. **Multi-Year Curriculum Roadmap**:
   - Organized chronologically across Year 1 (Foundation), Year 2 (Sophomore Core), Year 3 (Junior Specialization), and Year 4 (Senior Capstone & Electives).
2. **Plan Horizon Status Buckets**:
   - *This Term (`this_term`)*: Courses planned for the immediate upcoming cycle.
   - *Behind (`behind`)*: Remediation courses or delayed prerequisites.
   - *Later (`later`)*: Upper-division courses scheduled for future semesters.
3. **Course Relationship Mapping**:
   - Each course card or row indicates prerequisite satisfaction chains and curriculum domain classifications (Core CS, Math/Science, Institutional Breadth).
4. **Graduation Deficit Counter**:
   - Summarizes total unpassed courses and credit deficit remaining before graduation eligibility.

## 4. Features and Functionality
- **Roadmap Visualization**: Allows students to inspect their entire degree progression at a glance.
- **Prerequisite Dependency Tracing**: Highlights which prerequisite courses unlock future major requirements.
- **Course Detail Inspection**: In-page modal overlay displaying course syllabus descriptions, credit weights, and section structures.

## 5. UI Components
- **Container**: `MyCoursesPage.jsx` integrated plan tabs (`Tabs.jsx`).
- **Primitives**: `Card.jsx`, `Badge.jsx`, `Button.jsx`, `Icon.jsx`, `Dialog.jsx`, `Skeleton.jsx`.

## 6. Interactions
- **Plan Status Switching**: Selecting "This Term", "Behind", or "Later" updates the visible course roadmap.
- **Course Card Selection**: Opens the course detail modal displaying prerequisite chains.

## 7. Technologies Used
- **React 19**: Component lifecycle and memoization.
- **@tanstack/react-query**: Fetches plan courses via `studentApi.myCourses()`.
- **Tailwind CSS v4**: Responsive grid and card styling.
- **react-i18next**: Localized strings from `studentCourses.json`.

## 8. Implementation Details
- **Integrated Implementation**: Rendered within [`src/pages/student/MyCoursesPage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/student/MyCoursesPage.jsx)
- **Route Path**: `PATHS.student.myCourses` (`"/student/my-courses"`)

## 9. Data and APIs
- **Service API**: `studentApi.myCourses()` in `src/services/api/student/student.js`.
- **Mock Handlers**: `src/mocks/handlers/student/myCourses.js` and relational derivations in `src/mocks/data/student/studyPlan.js`.

## 10. Responsive Design
- Responsive multi-column layout adapting cleanly between desktop widescreen and single-column mobile viewports.

## 11. Implementation Status
- **Status**: **Fully Implemented as an Integrated Feature**.
- **Notes**: Fully functional within the My Courses portal; eliminates fragmented navigation by unifying study plan tracking with course management.

