# Forgot Password Page Documentation

## 1. Page Overview
The **Forgot Password Page** provides a secure self-service password recovery mechanism for students, faculty, and administrative staff. It allows users who have forgotten their authentication credentials to verify their university email, validate a one-time security token, and establish a new password.

## 2. Target User
- **Roles**: All university roles (**Student**, **Coordinator**, **Advisor**, **Admin**).
- **Access**: Public unauthenticated users.

## 3. Page Sections
The page is organized into a four-step progressive recovery wizard implemented inside `ForgotPasswordForm.jsx`:
1. **Step 1: Email Identification**:
   - Title & Instructions ("Reset your password").
   - University email address input field (`@nu.edu.eg`).
   - "Send Recovery Code" action button.
   - "Back to Login" navigation link.
2. **Step 2: Security Token Verification**:
   - Instructions indicating that a 6-digit confirmation code was sent to the provided address.
   - Verification code input box with numeric pattern validation.
   - "Verify Code" submission button and "Resend Code" trigger.
3. **Step 3: New Password Creation**:
   - New password and password confirmation input fields.
   - Password strength requirements checklist (minimum 8 characters, numbers, and symbols).
   - "Update Password" action button.
4. **Step 4: Completion & Success**:
   - Success confirmation card with checkmark animation.
   - "Return to Sign In" CTA button navigating to `/login`.

## 4. Features and Functionality
- **Multi-Step State Flow**: Manages active wizard steps using local state (`step`).
- **Institutional Email Validation**: Confirms valid email domain formatting before sending requests.
- **Unified Password Reset Architecture**: Handles both recovery requests and password resets on this unified page, accepting reset tokens from URL parameters if present.

## 5. UI Components
- **Form Feature**: [`src/features/auth/ForgotPasswordForm.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/features/auth/ForgotPasswordForm.jsx).
- **Primitives**: Text inputs (`Field.jsx`), primary buttons (`Button.jsx`), status badges (`Badge.jsx`), and icon indicators (`Icon.jsx`).

## 6. Interactions
- **Step Transitions**: Successfully completing each step advances the user to the next screen.
- **Resend Token**: Dispatches a new verification token to the user's email.
- **Back Navigation**: Direct links allow users to return to `/login` at any time.

## 7. Technologies Used
- **React 19**: Local state management for wizard progression.
- **Tailwind CSS v4**: Responsive card layout and smooth step transitions.
- **React Router v8**: URL parameter parsing and navigation.
- **react-i18next**: Localized strings from `auth.json`.

## 8. Implementation Details
- **Component File**: [`src/pages/public/ForgotPasswordPage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/public/ForgotPasswordPage.jsx)
- **Form Feature**: [`src/features/auth/ForgotPasswordForm.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/features/auth/ForgotPasswordForm.jsx)
- **Route Path**: `PATHS.forgotPassword` (`"/forgot-password"`)

## 9. Data and APIs
- **Service API**: `authApi.requestPasswordReset({ email })` and `authApi.resetPassword({ token, new_password })` in `src/services/api/auth.js`.
- **Mock Handlers**: `src/mocks/handlers/auth.js` simulating email delivery and token validation.

## 10. Responsive Design
- Centered card geometry with adaptive padding: full-width on mobile viewports (<640px) and a fixed max-width card (`max-w-md`) on desktop screens.

## 11. Implementation Status
- **Status**: **Fully Implemented and Verified**.
- **Notes**: Production bundle compiles cleanly without errors.

