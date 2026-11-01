# Login Page Documentation

## 1. Page Overview
The **Login Page** is the primary authentication gateway for the ACOPS application. It allows students, faculty members, and academic administrators to verify their credentials, establish secure sessions, and automatically transition to their designated role dashboards.

## 2. Target User
- **Roles**: All university roles (**Student**, **Coordinator**, **Advisor**, and **Administrator**).
- **Access**: Public unauthenticated users. If an authenticated user navigates here, `PublicOnlyGuard` automatically redirects them to their home dashboard.

## 3. Page Sections
1. **Brand Showcase Panel**: Displays the Nile University crest, institutional accreditation header, and system mission description.
2. **Authentication Card**:
   - Page title and subtitle ("Sign in with your university credentials").
   - Email/Username input field with email format validation.
   - Password input field with toggleable show/hide visibility.
   - "Remember me" persistence checkbox and "Forgot password?" hyperlink.
   - Primary "Sign In" submission button with integrated loading spinner.
3. **Development Mock Quick-Login Switcher** (in mock/dev environment): Quick buttons allowing single-click sign-in as Student, Coordinator, Advisor, or Admin for fast evaluation.

## 4. Features and Functionality
- **Credential Validation**: Validates required inputs and format constraints before dispatching login requests.
- **Session Establishment**: Dispatches sign-in requests to `useAuth().signIn(credentials)`, establishing secure HTTP cookies and user state.
- **Role-Based Redirection**: Automatically resolves target routes based on user role using `ROLE_HOME[role]` (`/student` for students, `/coordinator` for coordinators, etc.).
- **Return URL Preservation**: Preserves return query parameters (`?from=/student/my-courses`) to redirect users to their originally intended destination upon successful login.

## 5. UI Components
- **Form Component**: [`src/features/auth/LoginForm.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/features/auth/LoginForm.jsx).
- **Inputs**: Form text fields with floating labels and error states (`Field.jsx`).
- **Buttons**: Primary submission button (`Button.jsx`) supporting disabled and spinner loading states.
- **Alerts**: Inline error alerts for invalid credentials or locked accounts (`Alert.jsx`).

## 6. Interactions
- **Submit**: Submitting credentials triggers authentication and redirects to the role dashboard.
- **Show/Hide Password**: Toggles password masking dynamically.
- **Forgot Password Click**: Navigates to `PATHS.forgotPassword` (`/forgot-password`).
- **Quick-Login Buttons**: Populates credentials and authenticates instantly.

## 7. Technologies Used
- **React 19**: Component state and form handling.
- **Tailwind CSS v4**: Styling and responsive card centering.
- **React Router v8**: Navigation and redirection.
- **react-i18next**: Localized strings from `auth.json`.

## 8. Implementation Details
- **Component File**: [`src/pages/public/LoginPage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/public/LoginPage.jsx)
- **Form Feature**: [`src/features/auth/LoginForm.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/features/auth/LoginForm.jsx)
- **Route Path**: `PATHS.login` (`"/login"`)
- **Route Guard**: Guarded by `PublicOnlyGuard`.

## 9. Data and APIs
- **Service API**: `authApi.login({ username, password })` in `src/services/api/auth.js`.
- **Mock Handler**: `src/mocks/handlers/auth.js` simulating authentication and issuing session cookies.

## 10. Responsive Design
- **Desktop (≥ 1024px)**: Centered card layout with dual-column brand aesthetics.
- **Tablet / Mobile (< 1024px)**: Single-column full-width responsive form card with touch-friendly tap targets.

## 11. Implementation Status
- **Status**: **Fully Implemented and Verified**.
- **Notes**: Working end-to-end with session persistence and role redirection.

