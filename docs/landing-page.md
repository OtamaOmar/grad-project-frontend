# Landing Page Documentation

## 1. Page Overview
The **Landing Page** is the public-facing entry portal for the Nile University Academic Course Offering Planning System (ACOPS). Its primary purpose is to introduce prospective students, current students, faculty members, and academic administrators to the course planning platform, highlight institutional capabilities, and direct visitors to role-specific authentication pathways.

## 2. Target User
- **Roles**: Public unauthenticated visitors, prospective students, current students, academic coordinators, academic advisors, and administrators.
- **Access**: Open public access without authentication requirement.

## 3. Page Sections
1. **Navigation TopBar**: Institutional brand header with Nile University branding and direct login buttons.
2. **Hero Showcase Section**:
   - Primary headline and introductory mission statement.
   - High-resolution Nile University campus photography (`nu-campus-DZv1wVi3.jpg`).
   - Call-to-action (CTA) button leading directly to `/login`.
   - Live system status pill indicators (e.g. active planning term).
3. **Core Platform Capabilities Grid**: Four modular feature cards detailing:
   - *Prerequisite Satisfaction*: Automated prerequisite chain verification.
   - *Markov Demand Forecasting*: Predictive student headcount calculations.
   - *Classroom Capacity Management*: Section division thresholds and lab safety limits.
   - *Degree Audit & Compliance*: Real-time bylaw requirement tracking.
4. **Role Gateway Directory**: Four distinct entry cards representing the Student, Coordinator, Advisor, and Administrator portals with summaries of their capabilities.
5. **Institutional Footer**: University accreditation information, campus IT support contacts, and copyright notices.

## 4. Features and Functionality
- **Institutional Introduction**: Provides an overview of ACOPS and its planning cycle workflows.
- **Direct Portal Navigation**: Users can select their role from the directory to navigate directly to `/login` with pre-selected role context.
- **Language & Theme Adaptation**: Supports instant English / Arabic switching via global header controls.

## 5. UI Components
- **Buttons**: Primary CTA button (`Button.jsx`), secondary outline login triggers.
- **Cards**: Feature showcase cards and role directory cards (`Card.jsx`) with subtle borders and shadows.
- **Badges**: System status chips and feature indicator badges (`Badge.jsx`).
- **Icons**: Material Symbols Outlined (`school`, `calendar_month`, `analytics`, `security`).

## 6. Interactions
- **CTA Click**: Clicking "Enter Course Planning System" directs the user to `/login`.
- **Role Card Click**: Directs the user to the login screen with role context.
- **Language Switch**: Switches text and flips layout direction between LTR and RTL smoothly.

## 7. Technologies Used
- **React 19**: Component structure and rendering.
- **Tailwind CSS v4**: Utility-first styling with responsive design tokens.
- **React Router v8**: Navigation links (`Link`, `useNavigate`).
- **react-i18next**: Multi-language localization (`landing.json`).

## 8. Implementation Details
- **Component File**: [`src/pages/public/LandingPage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/public/LandingPage.jsx)
- **Route Path**: `PATHS.landing` (`"/"`)
- **Layout Shell**: Rendered within [`src/layouts/PublicLayout.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/layouts/PublicLayout.jsx)

## 9. Data and APIs
- **Data Source**: Static institutional content, feature descriptions, and campus media assets.
- **API Connection**: None required for the public landing view.

## 10. Responsive Design
- **Desktop (≥ 1024px)**: Side-by-side hero layout with campus photography on the right and feature cards in a 4-column grid.
- **Tablet (768px – 1023px)**: Two-column feature grid and stacked hero section.
- **Mobile (< 768px)**: Vertically stacked cards, full-width buttons, and optimized touch targets.

## 11. Implementation Status
- **Status**: **Fully Implemented and Verified**.
- **Notes**: Production bundle compiles cleanly without warnings.

