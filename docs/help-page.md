# Help Page Documentation

## 1. Page Overview
The **Help Page** serves as the academic knowledgebase, FAQ directory, and student support portal. It provides role-tailored explanations of curriculum bylaws, registration procedures, prerequisite policies, and contact information for academic advisors and university IT support.

## 2. Target User
- **Roles**: All authenticated roles (**Student**, **Coordinator**, **Advisor**, and **Administrator**).
- **Access**: Protected by `AuthGuard`.

## 3. Page Sections
1. **Search & Filter Header**:
   - Page title and subtitle.
   - Interactive search bar filtering help articles and FAQs in real-time.
2. **Category Navigation Pills**:
   - Filter pills for: *All Topics*, *Academic Planning*, *Prerequisites & Bylaws*, *Registration & Credit Limits*, and *Technical Support*.
3. **Frequently Asked Questions (FAQ) Accordion**:
   - Expandable questions addressing common academic planning scenarios (e.g. "How does the 2025 bylaw affect my graduation requirements?", "What happens if a course exceeds room capacity?").
4. **Quick Guide Cards**:
   - Step-by-step visual guides explaining how to navigate degree audits, review course offerings, and contact an advisor.
5. **Support Directory Grid**:
   - Contact cards for academic advisors, department chairs, and the university registrar, featuring emails, office locations, and office hours.

## 4. Features and Functionality
- **Instant Search Filtering**: Filters FAQs and guide cards dynamically as the user types into the search box.
- **Accordion Toggle**: Expand/collapse individual questions without cluttering the screen.
- **Direct Email Links**: Contact cards include `mailto:` links to initiate direct advisor communication.

## 5. UI Components
- **Primitives**: `Button.jsx`, `Badge.jsx`, `Card.jsx`, `Field.jsx`, `Icon.jsx`, `EmptyState.jsx`.
- **Accordions**: Animated disclosure panels for FAQ questions.

## 6. Interactions
- **Typing in Search**: Live-filters the FAQ list.
- **Clicking FAQ**: Toggles the answer visibility.
- **Selecting Category**: Filters content by topic.

## 7. Technologies Used
- **React 19**: Component state and search memoization.
- **@tanstack/react-query**: Fetches role-specific help articles via `useHelp()`.
- **Tailwind CSS v4**: Fluid typography and accordion transitions.
- **react-i18next**: Localized strings from `help.json`.

## 8. Implementation Details
- **Component File**: [`src/pages/shared/HelpPage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/shared/HelpPage.jsx)
- **Feature Hook**: `src/features/help/useHelp.js`
- **Route Path**: `PATHS.help` (`"/help"`)

## 9. Data and APIs
- **Service API**: `helpApi.get({ q, category })` in `src/services/api/shared/shared.js`.
- **Mock Handlers**: `src/mocks/handlers/shared/help.js`.

## 10. Responsive Design
- Single-column stacked layout on mobile devices; dual-column grid (FAQs on left, Support Directory on right) on desktop screens.

## 11. Implementation Status
- **Status**: **Fully Implemented and Verified**.
- **Notes**: Working in production build without warnings or missing dependencies.

