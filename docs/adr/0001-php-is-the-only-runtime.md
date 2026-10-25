# PHP is the only runtime; Next.js and Netlify are removed

Date: 2026-10-25 · Status: accepted

## Context

The site was first built on Next.js and hosted on Netlify (CMS in Netlify Blobs). It was then ported to PHP and moved to HostiMan, where it runs today. The Next version stayed in the repository "for rollback", so every content rule, page layout, form check, rate limit and the review queue existed twice: once in TypeScript for Next and once in PHP. Changes such as the portfolio filters had to be made in up to three places.

## Decision

- PHP (`php/`) is the only server implementation. Pages are rendered by `php/templates`, data lives in `php/storage` (file or MySQL driver).
- React is used only in the browser: islands mounted by `php/frontend/public.tsx` (header, reviews slider, review form, service popups, style quiz) and the admin panel (`php/frontend/admin.tsx`).
- The Next.js app, its server modules (`lib/content-store`, `atomic-store`, `media-store`, `request-limits`, `review-queue`, `admin-auth`), its React page components and the Netlify configuration are deleted. The Netlify site, including the `zakulab.netlify.app` → `zakulab.ru` redirect, is retired.
- The content schema (`lib/content-schema.ts`, zod) remains the single description of the CMS document. It is used at build time to produce `php/generated/schema.json` and in the admin bundle; content types are inferred from it.
- The fallback content for an empty storage is a plain JSON file, `php/seed.json`.
- The last commit containing the Next version is tagged `legacy-next-final`.

## Consequences

- Rollback to Netlify is no longer possible; recovering the old implementation means checking out `legacy-next-final`.
- Do not reintroduce a second server runtime or port PHP behaviour back to TypeScript without revisiting this ADR.
- Behaviour checks live in `scripts/test-php.py` (HTTP-level, against a real PHP server).
