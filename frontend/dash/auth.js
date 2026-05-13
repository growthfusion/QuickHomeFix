/* Dashboard auth guard.
   Include on every /dash/* page (except login.html) BEFORE rendering:
     <script src="/dash/auth.js"></script>
   If not authenticated, redirects to /dash/login?next=<current path>. */
(function () {
  if (sessionStorage.getItem("dashAuth") === "1") return;
  var next = encodeURIComponent(location.pathname + location.search);
  location.replace("/dash/login?next=" + next);
})();
