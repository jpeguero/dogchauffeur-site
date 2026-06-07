# Base44 SDK Dependencies & Integration Status

This document details the active Base44 dependencies within the **Pawffeur™** codebase, outlining why they are required, how they are utilized, and a roadmap for potential removal or migration in the future.

---

## 🔌 Active Base44 Dependencies

The application relies on the Base44 BaaS (Backend-as-a-Service) for data storage, serverless functions, authentication, and core messaging integrations. 

### 1. SDK Core Client & Configuration
*   **Dependency**: `@base44/sdk` (listed in `package.json` at `^0.8.26`) and `@base44/vite-plugin` (`^1.0.10`).
*   **Active Client File**: [base44Client.js](file:///C:/Users/jpegu/.gemini/antigravity/scratch/pawffeur/src/api/base44Client.js)
    *   Creates and exports the `base44` client instance used by all pages/components.
    *   Parameters (appId, token, URLs) are loaded dynamically via [app-params.ts](file:///C:/Users/jpegu/.gemini/antigravity/scratch/pawffeur/src/lib/app-params.ts).

### 2. Database Entities (ORM)
The client accesses the database via `base44.entities` objects. The active models are:
*   `base44.entities.Trip`: Stores ride details, statuses, pick-up/drop-off addresses, passenger names, and driver assignments.
*   `base44.entities.TripUpdate`: Holds real-time operational status updates published by drivers.
*   `base44.entities.Pet`: Stores passenger dog profiles, weights, breeds, age, and behavioral/medical notes.
*   `base44.entities.Booking`: Holds initial quotes and booking requests submitted by public clients.
*   `base44.entities.Message` & `Conversation`: Power the live driver-to-owner chat feature.

### 3. Authentication & Routing Guard
*   **Active File**: [useAuth.js](file:///C:/Users/jpegu/.gemini/antigravity/scratch/pawffeur/src/components/auth/useAuth.js) and [Layout.jsx](file:///C:/Users/jpegu/.gemini/antigravity/scratch/pawffeur/src/Layout.jsx)
    *   `base44.auth.me()`: Resolves the logged-in session.
    *   `base44.auth.getEffectiveRole()`: Determines permission levels (`admin`, `driver`, `customer`) to safeguard dashboards.
    *   `base44.auth.logout()`: Terminates sessions.

### 4. Deno Serverless Functions
Located under `base44/functions/`:
*   `sendSMS/entry.ts`: Interacts with Twilio to dispatch transactional trip notifications.
*   `sendReviewRequest/entry.ts`: Runs automated follow-ups to compile customer feedback.

### 5. Integrations & Core API
*   `base44.integrations.Core.SendEmail`: Invoked client-side in `BookingRequest.jsx` and `InvoicePanel.jsx` to route customer confirmations and PDFs.

---

## 🛠️ Why They Are Required (Current Architecture)
These dependencies are vital because the application does not have a separate, custom API server or database. Base44 acts as the database engine, authentication server, and API gateway. All React pages depend on this SDK to retrieve and persist state.

---

## 🗺️ Migration Roadmap (Removing Base44 Later)
If the project needs to migrate away from Base44 in the future, the integration points are isolated and can be refactored as follows:

1.  **Database & API Layer**: Swap out `base44.entities.[Model]` calls for standard REST fetches (`fetch('/api/trips')`) or another ORM client (e.g., Supabase, Prisma, or Firebase).
2.  **Authentication**: Replace `base44.auth` with a custom auth library (e.g. NextAuth, Clerk, or Firebase Auth).
3.  **Emails & SMS**: Replace Deno functions and Deno server calls with custom server-side handlers (e.g. Node NodeMailer, Twilio Node SDK, or SendGrid integration).
