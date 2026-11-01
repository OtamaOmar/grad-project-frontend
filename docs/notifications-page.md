# Notifications Page Documentation

## 1. Page Overview
The **Notifications Page** is the central inbox for academic alerts, administrative announcements, forecast approval notifications, and registration deadlines across the ACOPS platform.

## 2. Target User
- **Roles**: All authenticated roles (**Student**, **Coordinator**, **Advisor**, and **Administrator**).
- **Access**: Protected by `AuthGuard`.

## 3. Page Sections
1. **Header Action Bar**:
   - Page title and total unread count badge.
   - "Mark all as read" bulk action button.
2. **Category Filter Tabs**:
   - *All Notifications*: Complete historical list.
   - *Unread*: Displays only notifications where `is_read === false`.
   - *Action Required*: High-priority alerts requiring user confirmation.
   - *System Announcements*: General university notices.
3. **Notification List Stream**:
   - Structured feed of notifications sorted chronologically.
   - Each item displays:
     - Severity indicator icon (Info, Success, Warning, Action Required).
     - Title and detailed notification body text.
     - Timestamp (e.g. "14 Oct 2025 · 09:15 UTC").
     - Unread indicator dot.
     - Direct action link (e.g. leading to `/student/expected-offerings`).
4. **Empty State**: Friendly illustration and message when no notifications match the active filter.

## 4. Features and Functionality
- **Filter State Management**: Toggles between notification categories via tab selection.
- **Single-Click Read Toggle**: Clicking an individual notification marks it as read via `notificationsApi.markRead(id)`.
- **Bulk Dismissal**: "Mark All as Read" updates all unread notifications in a single request.
- **Deep-Link Navigation**: Notifications containing target URLs navigate directly to the relevant course or degree audit view.

## 5. UI Components
- **Primitives**: `Button.jsx`, `Badge.jsx`, `Card.jsx`, `Tabs.jsx`, `Icon.jsx`, `EmptyState.jsx`.
- **Skeleton**: Shimmering notification card placeholders during loading states.

## 6. Interactions
- **Tab Change**: Filters notification items by category.
- **Item Click**: Marks item as read and navigates to the linked page if present.
- **Mark All Read Click**: Calls `markAllRead()` and decrements the header badge count to zero.

## 7. Technologies Used
- **React 19**: Component state and event handling.
- **@tanstack/react-query**: Data fetching with automated query invalidation.
- **Tailwind CSS v4**: Fluid list layout with hover elevation.
- **react-i18next**: Localized strings from `notifications.json`.

## 8. Implementation Details
- **Component File**: [`src/pages/shared/NotificationsPage.jsx`](file:///C:/PROJECTS/%2415000%24/grad-project-frontend/src/pages/shared/NotificationsPage.jsx)
- **Feature Hook**: `src/features/notifications/useNotifications.js`
- **Route Path**: `PATHS.notifications` (`"/notifications"`)

## 9. Data and APIs
- **Service API**: `notificationsApi.list()`, `notificationsApi.markRead(id)`, `notificationsApi.markAllRead()` in `src/services/api/shared/shared.js`.
- **Mock Handlers**: `src/mocks/handlers/shared/notifications.js`.

## 10. Responsive Design
- Full-width stream on mobile viewports; contained card layout with category tabs on desktop screens.

## 11. Implementation Status
- **Status**: **Fully Implemented and Verified**.
- **Notes**: Production bundle builds cleanly in 2.37s.

