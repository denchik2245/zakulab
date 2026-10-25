# zakulab

Production runs on PHP (HostiMan). There is no Next.js and no Node.js on the server — see [docs/adr/0001-php-is-the-only-runtime.md](docs/adr/0001-php-is-the-only-runtime.md).

- `php/src`, `php/templates`, `php/public` — the server: routing, CMS API, storage, page rendering and the static page cache.
- `php/frontend` — browser entry points: `public.tsx` mounts React islands into server-rendered pages, `admin.tsx` mounts the admin panel.
- `styles` — global CSS shared by the site and the admin panel. `php/styles` — CSS modules used only by PHP templates. `components/*.module.css` belong to the React islands (templates may use them too). Class names for templates come from `php/generated/styles.json`; the build keeps the module cascade order stable.
- `components` — React islands and the admin panel. `lib` — the content schema (`content-schema.ts`, the single source of content types) and small shared helpers.
- `php/seed.json` — content used when storage is empty.
- `scripts/build-php.mjs` builds `build/beget` (bundles, CSS, images, generated schema/styles); `npm run dev` builds and serves it on http://127.0.0.1:8080; `npm test` runs lint, type checks and `scripts/test-php.py`.

Hosting and operations: [PHP-HOSTING.md](PHP-HOSTING.md), [HOSTIMAN-DEPLOYMENT.md](HOSTIMAN-DEPLOYMENT.md), [ADMIN.md](ADMIN.md).
