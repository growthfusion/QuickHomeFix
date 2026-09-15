# Access control — known gaps

The dashboard shows affiliate payouts and buyer invoicing. Two things
about who can currently read that are worth being explicit about.

## 1. The sign-in is client-side only

`/ping-post` reuses the `/dash` guard: a `sessionStorage` flag checked in
`frontend/public/auth.js`, with the credentials compared in
`frontend/dash/login.html` on the main site.

Those credentials are in JavaScript served to every visitor. Anyone can
read them with View Source. The guard stops a casual visitor landing on
the dashboard; it stops nothing else.

## 2. The API is not behind the guard

The UI guard runs in the browser. The API is a separate Cloud Run
service deployed with `--allow-unauthenticated`, so its endpoints answer
anyone who knows the URL, signed in or not:

    curl https://<pingpost-api-url>/api/accounting

returns the ledger. No session, no credentials.

The service URL is discoverable — it appears in the dashboard's network
requests, and Cloud Run URLs follow a predictable shape.

## What would actually close this

Roughly in order of effort:

1. **Shared secret header.** Build a token into the UI, require it on
   the API. Stops drive-by access; the token is still in the bundle.
2. **Identity-Aware Proxy** in front of both. Google accounts you
   nominate, nothing in the bundle. The previous `cloudbuild.api.yaml`
   assumed this — it deployed with `--no-allow-unauthenticated`.
3. **Real sessions.** Server-side login issuing an HttpOnly cookie the
   API verifies. Replaces the `/dash` scheme rather than patching it.

Option 2 is the usual answer for an internal tool on Cloud Run: no
application code changes, and it covers the UI and the API together.

## Not addressed here

The `/dash` credentials are shared by everyone who uses it and have no
rotation path. Changing them means editing `login.html` and redeploying.
