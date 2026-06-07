# Pawffeur Domain Readiness Notes

This document captures the checklist and notes for connecting the production domain **pawffeur.com** to the Vercel-hosted application.

---

## 1. Domain Configuration

* **Vercel Staging URL**: The temporary staging URL remains [https://dogchauffeur-site.vercel.app](https://dogchauffeur-site.vercel.app) to allow testing while DNS propagates.
* **Vercel Project Domain Link**: The custom domain `pawffeur.com` must be manually added to the project settings inside the Vercel Web Dashboard (**Project Settings > Domains**).
* **DNS Settings at Registrar**:
  * **Apex Domain (`pawffeur.com`)**: Set an `A` record pointing `@` to `76.76.21.21` (or use ALIAS/ANAME pointing to `cname.vercel-dns.com` if supported).
  * **Subdomain (`www.pawffeur.com`)**: Set a `CNAME` record pointing `www` to `cname.vercel-dns.com`.
* **Redirection Strategy**: Configure `pawffeur.com` (apex) as the **Primary Domain** in Vercel. Set `www.pawffeur.com` as a redirect to the apex domain.

---

## 2. Environment Variables & App Logic

* **Serverless SMS Configuration**: The tracking link in the Twilio SMS function has been updated to dynamically read the `PUBLIC_SITE_URL` variable, falling back to `https://pawffeur.com`.
* **Vercel Dashboard Keys**: Add `PUBLIC_SITE_URL=https://pawffeur.com` in Vercel Project Settings > Environment Variables for the `Production` environment. Once the public domain is active, SMS tracking messages sent to users will automatically direct them to the custom domain.
