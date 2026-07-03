---
id: PIX-28
type: story
status: done
title: "web-admin: wire Pixtron brand (favicon, login + header logo)"
---

**Closed:** 2026-05-30.

Brand assets now live in repo root `brand/` (source SVGs + PNG/ICO exports). Wire them into web-admin:

1. Favicon / app icons (Next.js 14 App Router auto-conventions):
   - Add `web-admin/app/icon.svg` (copy brand/pixtron-lettermark.svg) OR app/favicon.ico (copy brand/favicon.ico)
   - Add `web-admin/app/apple-icon.png` (copy brand/apple-touch-icon.png, 180x180)
   - Confirm <head> emits the right link tags after build.
2. Login page: add the Pixtron wordmark above the auth form.
3. Dashboard header/nav: add the lettermark (or small wordmark) as the brand mark, linking home.
   - Copy display assets into web-admin/public/brand/ and reference via next/image with width/height + alt='Pixtron'.

Assets bake in a charcoal #1A1A1A bg (fine for the dark UI). Keep value-string/layout contracts untouched — pure presentational add.
Acceptance: build passes, favicon shows in tab, wordmark on login, mark in header; screenshots on light+dark if applicable.