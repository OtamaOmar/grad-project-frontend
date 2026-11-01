# Reset Password Page Documentation

## 1. Page Overview
The **Reset Password Page** represents the password update endpoint traditionally linked in automated university reset emails (`/reset-password?token=...`). In the ACOPS frontend architecture, this route acts as an automatic forwarding controller that routes users to the unified password recovery wizard while preserving security query parameters.

## 2. Target User
- **Roles**: All university roles (**Student**, **Coordinator**, **Advisor**, **Admin**) accessing the system via an emailed password reset link.
- **Access**: Public unauthenticated access.

## 3. Page Sections
- **Architectural Behavior**: The page does not render an isolated, separate form. Instead, it utilizes a declarative React Router redirection component:
  ```jsx
  export default function ResetPasswordPage() {
    const location = useLocation();
    return <Navigate to={{ pathname: PATHS.forgotPassword, search: location.search }} replace />;
  }
  ```
- **Forwarded Destination**: Automatically mounts [`src/features/auth/ForgotPasswordForm.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/features/auth/ForgotPasswordForm.jsx) on `/forgot-password`, passing any `?token=` parameter directly to Step 3 of the recovery wizard.

## 4. Features and Functionality
- **Seamless Token Forwarding**: Automatically forwards reset tokens from URL queries to the unified recovery wizard.
- **Single Source of Truth**: Eliminates code duplication between "forgot password" and "reset password" forms.
- **Instant Replacement**: Uses `{ replace: true }` in the navigation history to prevent browser back-button loops.

## 5. UI Components
- **Router Component**: `<Navigate />` from `react-router`.
- **Rendered UI**: Delegates rendering directly to the unified `ForgotPasswordForm.jsx`.

## 6. Interactions
- Automatic instant client-side redirection upon route mounting.

## 7. Technologies Used
- **React 19**: Component lifecycle.
- **React Router v8**: `Navigate`, `useLocation`.

## 8. Implementation Details
- **Component File**: [`src/pages/public/ResetPasswordPage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/public/ResetPasswordPage.jsx)
- **Route Path**: `PATHS.resetPassword` (`"/reset-password"`)

## 9. Data and APIs
- Inherits API integration from `ForgotPasswordForm.jsx` (`authApi.resetPassword()`).

## 10. Responsive Design
- Inherits responsive layout from `ForgotPasswordPage.jsx`.

## 11. Implementation Status
- **Status**: **Fully Implemented and Verified**.
- **Notes**: Tested and verified; seamlessly routes users to the password recovery wizard with zero latency.

