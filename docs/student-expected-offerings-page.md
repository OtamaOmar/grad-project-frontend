# Student Expected Offerings Page Documentation

## 1. Page Overview
The **Student Expected Offerings Page** is the predictive course intelligence directory in ACOPS. It displays upcoming semester course offerings calculated from Markov progression models, automated prerequisite chains, and classroom capacity allocations, enabling students to plan their upcoming schedules before formal registration opens.

## 2. Target User
- **Roles**: **Student** only.
- **Access**: Protected by `AuthGuard` and `RoleGuard({ allowedRoles: ["student"] })`.

## 3. Page Sections
1. **Interactive Term Switcher Header**:
   - Custom accessible dropdown menu allowing students to switch between:
     - `Fall 2026 (Upcoming Planning Term)`
     - `Spring 2027 (Forecast Preview)`
     - `Fall 2025 (Previous Cycle)`
2. **Segmented Filter Tabs & Quick Chips**:
   - Elevated pill buttons with numeric chips: `All Offerings`, `Under Review`, `Approved`, and `Eligible for Me`.
   - Eligibility filter dropdown: `All Eligibility`, `Eligible`, `Not Eligible`, `Already Passed`.
   - Real-time search bar for course code and title.
3. **Predictive Offerings Table**:
   - Columns: Course Code, Course Title, Expected Headcount (with mini progress bar), Section Structure badges (`3h Lec`, `2h Tut`, `2h Lab`), Eligibility indicators, Availability status (`In review` / `Approved`), and styled `Offering Details` action chips.
4. **Three Interactive Analytical Cards**:
   - **Capacity Distribution**: Section room capacity utilization vs. projected headcount.
   - **Progression Feeder**: Gateway prerequisite student intake pipelines.
   - **Offering Protocol**: Academic bylaws, tutorial split rules, and lab workstation ceilings.
   - *(Each card opens a dedicated in-page modal dialog without navigating away)*.

## 4. Features and Functionality
- **Predictive Visibility**: Transparently discloses forecast course offerings while distinguishing predicted offerings from confirmed schedules.
- **Dynamic Eligibility Filtering**: Single-click filtering to isolate courses where the student satisfies all prerequisite chains.
- **In-Page Interactive Modals**: Clicking the bottom three analytical cards opens deep-dive dialog overlays directly over the page without route changes or scroll resetting.

## 5. UI Components
- **Primitives**: `Button.jsx`, `Dialog.jsx`, `DropdownMenu.jsx`, `EmptyState.jsx`, `ErrorState.jsx`, `Icon.jsx`, `ProgressBar.jsx`, `Skeleton.jsx`.
- **Modals**:
  - `CapacityDistributionModal`: Detailed classroom capacity utilization table, room ceilings, and seat availability.
  - `ProgressionFeederModal`: Markov transition factors, prerequisite conversion rates, and student intake numbers.
  - `OfferingProtocolModal`: Department bylaws, tutorial split ratios, and lab floor requirements.

## 6. Interactions
- **Term Switcher**: Swaps planning term context and refreshes table data.
- **Card Click**: Opens the corresponding modal dialog.
- **Modal Dismissal**: Supports close button, outside click, and `Escape` key, with background scroll locking.

## 7. Technologies Used
- **React 19**: State management and modal event listeners.
- **@tanstack/react-query**: Fetches data via `studentApi.expectedOfferings()`.
- **Tailwind CSS v4**: Fluid typography, pill buttons, and responsive grid layouts.
- **react-i18next**: Localized strings from `studentExpectedOfferings.json`.

## 8. Implementation Details
- **Component File**: [`src/pages/student/ExpectedOfferingsPage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/student/ExpectedOfferingsPage.jsx)
- **Route Path**: `PATHS.student.expectedOfferings` (`"/student/expected-offerings"`)
- **Bundle Output**: `dist/assets/ExpectedOfferingsPage-CfDu5TGw.js` (64.91 kB).

## 9. Data and APIs
- **Service API**: `studentApi.expectedOfferings(query)` in `src/services/api/student/student.js`.
- **Mock Handlers**: `src/mocks/handlers/student/expectedOfferings.js` and derivations in `derive.js`.

## 10. Responsive Design
- Desktop: Wide multi-column predictive matrix and 3-column bottom analytical grid.
- Tablet / Mobile: Stacked bottom cards, full-width pill tabs, and horizontal scroll wrappers (`overflow-x-auto`) for the data table.

## 11. Implementation Status
- **Status**: **Fully Implemented and Verified**.
- **Notes**: Passed linting with 0 errors, 0 warnings; Vite production build compiles in 2.37s.

