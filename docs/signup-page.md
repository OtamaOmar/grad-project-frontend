# Sign Up Page Documentation

## 1. Page Overview
The **Sign Up Page** is the planned self-registration interface for prospective or newly admitted Nile University students. Its purpose is to allow students to create their digital credentials, match their identity against the official university student roster, and initiate first-time account setup.

## 2. Target User
- **Roles**: Unregistered or newly admitted Nile University students.
- **Access**: Public unauthenticated access.

## 3. Page Sections
- **Current Actual Render**: Renders a standard project placeholder component (`PagePlaceholder`).
- **Placeholder Details**:
  - Assigned Owner: "Hamza".
  - Designated Feature Branch: `feature/student-auth-ui`.
  - Design Specification Reference: `Shared_Pages/sign_up`.
- **Planned Production Sections**:
  1. *Student Information Section*: Name, institutional email (`@nu.edu.eg`), and national identifier.
  2. *University ID Verification Section*: Input for student matriculation ID (`2025-XXXX`) and verification against university admissions records.
  3. *Security Setup Section*: Password creation enforcing university complexity rules.

## 4. Features and Functionality
- **Current State**: Displays the feature placeholder indicating that the sign-up user interface is in progress under the auth branch.
- **Planned Functionality**:
  - Email format validation.
  - Identity matching against student roster tables (`records.js`).
  - Automatic assignment of student curriculum bylaw (e.g. 2025 bylaw) upon successful verification.

## 5. UI Components
- **Current Component**: `PagePlaceholder.jsx` from `src/components/common/PagePlaceholder.jsx`.
- **Planned Primitives**: Text fields (`Field.jsx`), primary registration button (`Button.jsx`), and status alert chips.

## 6. Interactions
- **Current**: Non-interactive placeholder view providing developer branch metadata.
- **Planned**: Step-by-step registration wizard with input validation and automated redirect to onboarding.

## 7. Technologies Used
- **React 19**: Component lifecycle.
- **Tailwind CSS v4**: Container centering and card styling.
- **react-i18next**: Internationalization key references.

## 8. Implementation Details
- **Component File**: [`src/pages/public/SignUpPage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/public/SignUpPage.jsx)
- **Route Path**: `PATHS.signUp` (`"/signup"`)
- **Route Guard**: Guarded by `PublicOnlyGuard`.

## 9. Data and APIs
- **Current Status**: No active API submission connected on this route in the current branch.
- **Backend Service Contract**: `POST /auth/signup` and `POST /auth/verify-id` in `src/services/api/auth.js`.
- **Development Workaround**: Development testing uses the pre-seeded student account (`student@nu.edu.eg`) on the Login page.

## 10. Responsive Design
- Responsive card geometry centered vertically and horizontally across desktop, tablet, and mobile screens.

## 11. Implementation Status
- **Status**: **Partially Implemented (Placeholder)**.
- **Notes**: The page component exists at its designated route but currently renders `PagePlaceholder` awaiting the merge of the registration form from `feature/student-auth-ui`.

