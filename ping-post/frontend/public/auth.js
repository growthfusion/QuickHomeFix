/* Ping-post auth guard.
   Loaded from index.html before the React bundle, so the dashboard never
   renders for a signed-out visitor. Shares the "dashAuth" session key
   with /dash — signing in to either reaches both.

   This only gates the UI. The API it calls is a separate origin and is
   not covered by this check: anyone who knows the backend URL can read
   the finance data directly. Protecting that needs a check on the
   backend itself. See SECURITY.md. */
(function () {
  if (sessionStorage.getItem("dashAuth") === "1") return;

  var LOGIN = "/dash/login";

  // The login page belongs to the main site and is not served by the
  // Vite dev server: redirecting there in dev lands back on this SPA,
  // which runs this script again and appends another next= each time
  // until the URL outgrows the request header limit. Dev is served from
  // the domain root, production from /ping-post, so the base tells them
  // apart without needing an env var here.
  var servedFromSite = location.pathname.indexOf("/ping-post") === 0;
  if (!servedFromSite) return;

  // Belt and braces: if the login page is ever missing in production
  // too, stop rather than build the same runaway URL.
  if (location.pathname.indexOf(LOGIN) === 0) return;

  var next = encodeURIComponent(location.pathname + location.search);
  location.replace(LOGIN + "?next=" + next);
})();
