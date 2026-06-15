/** Precompiled-CSS build config — mirrors the former inline `tailwind.config`
 *  that ran under the cdn.tailwindcss.com runtime. Keep theme.extend in sync
 *  with the <script>tailwind.config = {...}</script> that used to live in <head>.
 *
 *  Rebuild after editing any HTML class:
 *    npx tailwindcss@3 -c tailwind.config.js -i tailwind-input.css -o css/tailwind.css --minify
 */
module.exports = {
  content: ['./get-quotes.html'],
  theme: {
    extend: {
      fontFamily: { sans: ['DM Sans', 'Inter', 'system-ui', 'sans-serif'] },
      screens: { sm: '480px', md: '640px', lg: '1024px', xl: '1280px' },
    },
  },
};
