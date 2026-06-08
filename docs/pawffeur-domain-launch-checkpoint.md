# Pawffeur Domain Launch Checkpoint

This document records the official domain setup milestone for **Pawffeur™** (`pawffeur.com`), transitioning the production web application from the legacy brand and staging URLs to the newly secured domain.

---

## 1. Domain Status

* **Primary Production Domain**: [https://pawffeur.com](https://pawffeur.com) (Active, verified, and secured with SSL).
* **Redirect Subdomain**: [https://www.pawffeur.com](https://www.pawffeur.com) (Successfully redirects via a permanent 301 redirect to the apex domain `pawffeur.com`).
* **Staging URL**: [https://dogchauffeur-site.vercel.app](https://dogchauffeur-site.vercel.app) (Remains active as the default Vercel deployment preview URL for verification).
* **Legacy Domain**: `dogchauffeur.com` is retained for legacy traffic and transition support only.

---

## 2. Vercel Status

* **Domain Configurations**:
  * `pawffeur.com` is added to the Vercel dashboard and configured to point to the production branch.
  * `www.pawffeur.com` is configured in Vercel to redirect with a `301 Moved Permanently` to `pawffeur.com`.
  * DNS management is delegated to **Cloudflare** and authorized/validated by Vercel.
* **Environment Variables**:
  The following project-level environment variables are configured and active in the Vercel dashboard:
  * `PUBLIC_SITE_URL=https://pawffeur.com`
  * `VITE_PUBLIC_SITE_URL=https://pawffeur.com`
  * `VITE_PUBLIC_LEGACY_SITE_URL=https://dogchauffeur.com`
* **Metadata & SEO**:
  The latest deployment compilation (commit `4f8618b`) successfully includes:
  * Canonical link: `<link rel="canonical" href="https://pawffeur.com" />`
  * Open Graph URL: `<meta property="og:url" content="https://pawffeur.com" />`

---

## 3. Verified Live Checks

* [x] **Apex Domain Loads**: `https://pawffeur.com` resolved and successfully rendered the home page.
* [x] **Branding**: "Pawffeur" heading is displayed in place of legacy branding.
* [x] **Logo**: The Road-Paw logo is displayed correctly in the main header.
* [x] **Favicon**: The browser favicon renders as expected.
* [x] **Open Graph & SEO**: HTML structure inspects correctly with canonical tags targeting the new domain.
* [x] **Base44 Cleanup**: Verified 100% removal of legacy tracking links (`app.base44.com` and its project IDs) from the active codebase. SMS routing utilizes the dynamic environmental `PUBLIC_SITE_URL`.
* [x] **Historical Verifications**: Customer/admin notifications and `TrackRide` dynamic link builds are verified ready.

---

## 4. Pending Items Before Full Public Launch

* **Brand & Creative Assets**:
  * Finalize the professional Road-Paw logo vector refinement.
* **Twilio/SMS A2P Registration**:
  * Align the Twilio 10DLC (A2P) brand registration details to reflect the new **Pawffeur™** legal entity. Support Ticket #27391298 ("A2P 10DLC brand/campaign update after business rebrand") is open to determine if Twilio can update the existing DogChauffeur Brand/Campaign registration to Pawffeur™ or if a new one is required. SMS remains pending Pawffeur™ rebrand alignment and must not be marked production-ready until Twilio responds.
* **Redirection Settings**:
  * Finalize a decision on redirection logic for traffic landing on `dogchauffeur.com` (redirect apex/wildcards to `pawffeur.com`).
* **Final Visual and Mobile QA**:
  * Perform a complete review of social previews (Open Graph image cards) and visual compatibility on mobile web browsers.
