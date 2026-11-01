# Profile Page Documentation

## 1. Page Overview
The **Profile Page** is a comprehensive user account management hub accessible across all authenticated roles. It allows users to view their institutional affiliation, edit personal contact details, toggle application preferences (language and theme), review active sessions, and safely sign out.

## 2. Target User
- **Roles**: All authenticated roles (**Student**, **Coordinator**, **Advisor**, and **Administrator**).
- **Access**: Protected by `AuthGuard`.

## 3. Page Sections
1. **Profile Identity Header Card**:
   - Monogram avatar circle with institutional primary background.
   - User full name and university email address.
   - Role badge color-coded by role (Primary for Student, Info for Coordinator, Success for Advisor, Danger for Admin).
   - Institutional identifier token: displays **Student ID** (`2025-0142`) for students, or **Staff Code** (`ADM-002`, `8841-CS`) for faculty.
2. **Personal Information Form**:
   - Editable Full Name text field.
   - Editable Phone Number input field with Egyptian phone format placeholder (`+20 100 123 4567`).
   - "Save Changes" primary button (with spinner state) and "Discard" draft reset button.
3. **Application Preferences Section**:
   - **Language Switcher**: Interactive radio cards for English (`en-GB`) and Arabic (`ar-EG`), triggering instant interface re-rendering with RTL/LTR direction switching.
   - **Theme Switcher**: Interactive radio cards for Light and Dark modes.
4. **Security & Session Information**:
   - Last login timestamp and session token status.
   - Single-click "Sign Out" button terminating the active session.

## 4. Features and Functionality
- **Draft State Management**: Uses local state (`fullNameDraft`, `phoneDraft`) so users can modify fields and cancel edits without losing original session data.
- **Dynamic Onboarding Updates**: Submitting the form calls `authApi.saveOnboarding()` and immediately re-synchronizes the session via `refresh()`.
- **Toast Feedback**: Displays floating success or error toasts upon saving preferences.
- **Role-Aware Identifiers**: Automatically renders the correct identifier label based on the active role.

## 5. UI Components
- **Primitives**: `Avatar.jsx`, `Badge.jsx`, `Button.jsx`, `Card.jsx`, `Icon.jsx`.
- **Forms**: Form inputs with validation labels and dirty-state tracking.
- **Toast**: Connected to `useToast()` for feedback.

## 6. Interactions
- **Save Profile**: Updates user records and triggers a success toast.
- **Reset Form**: Restores draft values to current session data.
- **Language Switch**: Changes document language (`i18n.changeLanguage`) and document direction (`dir="rtl"` / `dir="ltr"`).
- **Theme Switch**: Toggles CSS dark mode class on `<html>`.

## 7. Technologies Used
- **React 19**: Component state and memoization (`useMemo`, `useState`, `useId`).
- **Tailwind CSS v4**: Utility styling with CSS logical properties for full RTL support.
- **react-i18next**: Localized strings from `profile.json`.

## 8. Implementation Details
- **Component File**: [`src/pages/shared/ProfilePage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/shared/ProfilePage.jsx)
- **Route Path**: `PATHS.profile` (`"/profile"`)
- **Size & Verification**: Fully implemented 666-line working component.

## 9. Data and APIs
- **Service API**: `authApi.saveOnboarding(payload)` and `authApi.me()` in `src/services/api/auth.js`.
- **Mock Handlers**: `src/mocks/handlers/shared/profile.js` and `src/mocks/handlers/auth.js`.

## 10. Responsive Design
- Multi-column grid on desktop (`grid-cols-12`) that stacks into a single vertical layout on mobile screens without horizontal clipping.

## 11. Implementation Status
- **Status**: **Fully Implemented and Verified**.
- **Notes**: Working in production build without warnings or missing dependencies.

