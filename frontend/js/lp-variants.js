/* ─── QuickHomeFix – Landing Page Variants v1/v2/v3 ───
   Applies variant-specific copy, injected sections (how-it-works, trust
   chips, sticky mobile CTA) on top of the shared landing page. All visual
   theming lives in css/lp-variants.css, scoped under html.lp-v1/.lp-v2/.lp-v3.
   Compliance note: copy below intentionally avoids "Free", "licensed",
   "verified", specific match counts, and unsourced figures (Angi Exhibit A). */

(function () {
  "use strict";

  var LP_TERMS = {
    roof: "Roofing", windows: "Window Replacement", solar: "Solar",
    bath: "Bathroom Remodeling", bathroom: "Bathroom Remodeling",
    gutter: "Gutter", tub: "Walk-In Tub", shower: "Walk-In Shower"
  };

  var THEME_COLORS = { v1: "#0f2a43", v2: "#faf6ef", v3: "#3d2db7" };

  // Real photos (Unsplash License — free commercial use). Downloaded to the
  // repo and converted to AVIF/WebP by convert-images.js.
  var LP_PHOTOS = {
    roof: "images/lp-photo-roof",
    bath: "images/lp-photo-bathroom",
    bathroom: "images/lp-photo-bathroom",
    shower: "images/lp-photo-shower",
    tub: "images/lp-photo-tub",
    windows: "images/lp-photo-windows",
    solar: "images/lp-photo-solar",
    gutter: "images/lp-photo-gutter"
  };

  function photoPicture(base, extraImgStyle) {
    // ANGI EXHIBIT A COMPLIANCE: stock photo disclosure (Category 9D),
    // same pattern as the rest of get-quotes.html.
    return '<picture>' +
      '<source srcset="' + base + '.avif" type="image/avif" />' +
      '<source srcset="' + base + '.webp" type="image/webp" />' +
      '<img src="' + base + '.jpg" alt="Stock photo" loading="eager" decoding="async" fetchpriority="high"' +
        (extraImgStyle ? ' style="' + extraImgStyle + '"' : '') + ' />' +
      '</picture>' +
      '<span class="sr-only">Stock photo. Not representative of any specific contractor.</span>';
  }

  function lpVariant() {
    var cls = document.documentElement.className;
    var m = cls.match(/\blp-(v[123])\b/);
    return m ? m[1] : "";
  }

  function heroCopy(v, svc) {
    var term = LP_TERMS[svc] || "Home Improvement";
    var lower = term.toLowerCase();
    if (v === "v1") {
      return {
        eyebrow: "Local pro matching",
        title: term + " Quotes, Without the Runaround",
        subtitle: "Answer a few quick questions about your project and request quotes from " + lower + " pros that serve your area. No obligation.",
        cta: "See Local Pros",
        micro: "Takes about 2 minutes · Your info stays private"
      };
    }
    if (v === "v2") {
      return {
        eyebrow: "",
        title: "Planning a " + lower + " project?",
        subtitle: "Tell us about your project — it takes about 2 minutes.",
        cta: "Start My Match",
        micro: "No obligation · Secure & private"
      };
    }
    return {
      eyebrow: "", // v3 panel stays minimal: headline, subtitle, ZIP
      title: "Match With Local " + term + " Pros",
      subtitle: "A few quick questions. Local pros for your ZIP code. That’s it.",
      cta: "Match Me With Pros",
      micro: "About 2 minutes · No obligation"
    };
  }

  var CHIP_ICONS = {
    lock: '<svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>',
    clock: '<svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    check: '<svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'
  };

  function buildTrustChips() {
    var wrap = document.createElement("div");
    wrap.className = "lp-trust-chips";
    wrap.innerHTML =
      "<span>" + CHIP_ICONS.lock + "Secure & private</span>" +
      "<span>" + CHIP_ICONS.clock + "About 2 minutes</span>" +
      "<span>" + CHIP_ICONS.check + "No obligation</span>";
    return wrap;
  }

  function buildHowItWorks(svc) {
    var term = (LP_TERMS[svc] || "home improvement").toLowerCase();
    var sec = document.createElement("section");
    sec.className = "lp-how";
    sec.id = "lpHowItWorks";
    sec.setAttribute("aria-label", "How it works");

    // v2: arrow-flow stepper — three icon stations joined by green arrows,
    // the explicit left→right journey US fintech/insurance sites use.
    if (lpVariant() === "v2") {
      var ic2b = lpIcons();
      var vb2 = window.LP_ICONS_VIEWBOX || "0 0 256 256";
      var arrow2 = '<span class="lp-how2-arrow" aria-hidden="true"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></span>';
      var st2 = function (icon, title, desc) {
        return '<div class="lp-how2-step"><span class="lp-how2-ic" aria-hidden="true"><svg viewBox="' + vb2 + '" fill="currentColor">' + (ic2b[icon] || "") + "</svg></span><h3>" + title + "</h3><p>" + desc + "</p></div>";
      };
      sec.className = "lp-how lp-how2";
      sec.innerHTML = '<div class="lp-how-inner">' +
        "<h2>How it works</h2>" +
        '<p class="lp-how-sub">From question to quote in three quick steps.</p>' +
        '<div class="lp-how2-flow">' +
          st2("clipboard", "Tell us about your project", "A few quick questions about your home and what you need done.") +
          arrow2 +
          st2("mappin", "We check your area", "We look for " + term + " pros that serve your ZIP code.") +
          arrow2 +
          st2("check", "Compare your options", "Pros reach out, and you choose who fits your project.") +
        "</div></div>";
      return sec;
    }

    // v3: photo + vertical timeline instead of three flat cards.
    // Uses the service's SECOND gallery photo so every scroll stop shows a
    // different image than the hero.
    if (lpVariant() === "v3") {
      var g = (typeof serviceLandingData !== "undefined") && serviceLandingData[svc] && serviceLandingData[svc].gallery;
      var base = (g && g[1])
        ? g[1].replace(/\.(png|jpg|jpeg)$/i, "")
        : (LP_PHOTOS[svc] || LP_PHOTOS.roof);
      var steps = [
        ["Tell us about your project", "Answer a few quick questions about your home and what you need done."],
        ["We check your area", "We look for " + term + " pros that serve your ZIP code."],
        ["Compare your options", "Pros reach out with their options so you can choose who fits your project."]
      ];
      sec.className = "lp-how lp-how3";
      sec.innerHTML =
        '<div class="lp-how-inner">' +
          "<h2>How it works</h2>" +
          '<p class="lp-how-sub">Three quick steps from question to quote.</p>' +
          '<div class="lp-how3-grid">' +
            '<div class="lp-how3-photo"><picture>' +
              '<source srcset="' + base + '.avif" type="image/avif" />' +
              '<source srcset="' + base + '.webp" type="image/webp" />' +
              '<img src="' + base + '.jpg" alt="Stock photo" loading="lazy" decoding="async" />' +
            '</picture><span class="sr-only">Stock photo. Not representative of any specific contractor.</span></div>' +
            '<ol class="lp-how3-steps">' + steps.map(function (s, i) {
              return '<li><span class="lp-how3-n" aria-hidden="true">' + (i + 1) + "</span><div><h3>" + s[0] + "</h3><p>" + s[1] + "</p></div></li>";
            }).join("") + "</ol>" +
          "</div>" +
        "</div>";
      return sec;
    }
    sec.innerHTML =
      '<div class="lp-how-inner">' +
        "<h2>How it works</h2>" +
        '<p class="lp-how-sub">Three quick steps from question to quote.</p>' +
        '<div class="lp-how-grid">' +
          '<div class="lp-how-card"><div class="lp-how-num">1</div><h3>Tell us about your project</h3><p>Answer a few quick questions about your home and what you need done.</p></div>' +
          '<div class="lp-how-card"><div class="lp-how-num">2</div><h3>We check your area</h3><p>We look for ' + term + " pros that serve your ZIP code.</p></div>" +
          '<div class="lp-how-card"><div class="lp-how-num">3</div><h3>Compare your options</h3><p>Pros reach out with their options so you can choose who fits your project.</p></div>' +
        "</div>" +
      "</div>";
    return sec;
  }

  function buildStickyCta(ctaText) {
    var bar = document.createElement("div");
    bar.className = "lp-sticky-cta";
    bar.id = "lpStickyCta";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = ctaText;
    btn.addEventListener("click", function () {
      var zip = document.getElementById("landingZipInput");
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (zip) setTimeout(function () { try { zip.focus({ preventScroll: true }); } catch (e) { zip.focus(); } }, 450);
    });
    bar.appendChild(btn);
    return bar;
  }

  window.applyLandingVariant = function (svc) {
    var v = lpVariant();
    if (!v) return;

    var copy = heroCopy(v, svc);

    // Theme-color meta for mobile browser chrome
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEME_COLORS[v]);

    var heroContent = document.getElementById("landingHeroContent");
    var heroSection = heroContent && heroContent.closest("section");
    if (heroSection) heroSection.classList.add("lp-hero");

    // Per-variant real-photo hero
    var photoBase = LP_PHOTOS[svc] || LP_PHOTOS.roof;
    var heroImgWrap = document.getElementById("landingHeroImage");
    if (v === "v1" || v === "v2") {
      // Photo is the section background (v1: dark navy overlay; v2: warm
      // cream "wash" — Project-Allies-style faded veil, photo as atmosphere).
      // Absolute path: a relative url() inside a CSS custom property resolves
      // against the stylesheet's folder (css/), not the document.
      if (heroSection) heroSection.style.setProperty("--lp-hero-photo", 'url("/' + photoBase + '.webp")');
    } else if (heroImgWrap) {
      heroImgWrap.innerHTML = photoPicture(photoBase);
      if (v === "v3") {
        // Console-panel hero: the photo lives INSIDE the white panel (the
        // .grid), filling its right cell.
        var panelGrid = heroContent && heroContent.querySelector(".grid");
        if (panelGrid && heroImgWrap.parentNode !== panelGrid) panelGrid.appendChild(heroImgWrap);
      } else if (heroSection && heroImgWrap.parentNode !== heroSection) {
        // v2 full-bleed band: move it OUT of the content grid. As a grid item
        // its 100vw width inflates the track and shoves everything off-center.
        heroSection.appendChild(heroImgWrap);
      }
    }

    // v2's hero is light — the white header logo is invisible there.
    // Swap in the dark wizard logo (Logo2). v1/v3 heroes are dark: keep white.
    if (heroSection && v === "v2") {
      var logoPic = heroSection.querySelector("picture");
      if (logoPic && !logoPic._lpSwapped) {
        logoPic._lpSwapped = true;
        logoPic.innerHTML = '<img src="images/landing/quickhomefix_Logo2.png" alt="QuickHomeFix" class="h-12 w-auto object-contain" width="48" height="48" />';
      }
    }

    // Copy swaps
    var titleEl = document.getElementById("landingHeroTitle");
    var subEl = document.getElementById("landingHeroSubtitle");
    if (titleEl) titleEl.textContent = copy.title;
    if (subEl) subEl.textContent = copy.subtitle;

    // Eyebrow pill above the H1
    if (titleEl && copy.eyebrow && !document.getElementById("lpEyebrow")) {
      var eyebrow = document.createElement("div");
      eyebrow.id = "lpEyebrow";
      eyebrow.className = "lp-eyebrow";
      eyebrow.textContent = copy.eyebrow;
      titleEl.parentNode.insertBefore(eyebrow, titleEl);
    }

    // CTA button text (keep the arrow icon)
    var ctaBtn = heroContent && heroContent.querySelector('button[onclick^="startWizardFromLanding"]');
    if (ctaBtn) {
      // "Match Me With Pros": the tail hides on phones so the ZIP field keeps room
      ctaBtn.innerHTML = copy.cta.replace(" With Pros", '<span class="lp-cta-tail"> With Pros</span>') +
        ' <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>';
    }

    // The trust chips below carry the reassurance copy — the old microcopy
    // line would just duplicate it, so hide it.
    var microEl = heroContent && heroContent.querySelector(".text-blue-200\\/70");
    if (microEl) microEl.style.display = "none";

    // Trust chips after the ZIP card block (not v3 — its panel stays minimal)
    var ctaWrap = heroContent && heroContent.querySelector(".va-cta-wrap");
    var ctaCol = ctaWrap && ctaWrap.parentNode; // .w-full.max-w-md column
    if (v === "v1" && ctaCol && !heroContent.querySelector(".lp-trust-chips")) {
      ctaCol.appendChild(buildTrustChips());
    }

    // ZIP input: variant placeholder + a11y label + Enter-to-submit
    var zipInput = document.getElementById("landingZipInput");
    if (zipInput) {
      zipInput.placeholder = "ZIP code";
      zipInput.setAttribute("aria-label", "Enter your 5-digit ZIP code");
      if (!zipInput._lpWired) {
        zipInput._lpWired = true;
        zipInput.addEventListener("keydown", function (e) {
          if (e.key === "Enter" && zipInput.value.replace(/\D/g, "").length === 5) {
            e.preventDefault();
            startWizardFromLanding();
          }
        });
      }
    }

    // How-it-works section directly after the hero
    if (heroSection && !document.getElementById("lpHowItWorks")) {
      heroSection.parentNode.insertBefore(buildHowItWorks(svc), heroSection.nextSibling);
    }

    // Sticky mobile CTA — v1 only (v2's sentence form sits high; a second
    // button would just duplicate it, v3 has the thumb-zone hero)
    if (v === "v1" && !document.getElementById("lpStickyCta")) {
      document.body.appendChild(buildStickyCta(copy.cta));
    }

    // Value props. v1: a clean white trust strip BELOW the photo hero
    // (glass boxes on a photo read as placeholders — never again).
    // v2: checklist inside the paper card. v3: compact row on the stage.
    var PROP_ITEMS = [
      ["house", "Local pros only", "Pros that serve your ZIP code"],
      ["check", "You choose", "Compare options — you decide who to hire"],
      ["sparkle", "No account needed", "Quick questions, nothing to sign up for"]
    ];
    function lpPropHtml(withIcons) {
      var ic = lpIcons();
      return PROP_ITEMS.map(function (p) {
        var icon = withIcons && ic[p[0]]
          ? '<span class="lp-prop-ic" aria-hidden="true"><svg viewBox="' + (window.LP_ICONS_VIEWBOX || "0 0 256 256") + '" fill="currentColor">' + ic[p[0]] + "</svg></span>"
          : "";
        return "<div>" + icon + "<b>" + p[1] + "</b><span>" + p[2] + "</span></div>";
      }).join("");
    }
    var svcChipsHtml = (function () {
      var others = ["roof", "bath", "windows", "solar", "gutter"].filter(function (s) {
        return s !== svc && !(svc === "bathroom" && s === "bath");
      }).slice(0, 4);
      return "<span>Other projects:</span>" + others.map(function (s) {
        var label = { roof: "Roofing", bath: "Bathroom", windows: "Windows", solar: "Solar", gutter: "Gutters" }[s];
        return '<a href="/get-quotes/' + s + "/" + v + '">' + label + "</a>";
      }).join("");
    })();

    if (v === "v1") {
      if (heroSection && !document.getElementById("lpTrustStrip")) {
        var strip = document.createElement("section");
        strip.id = "lpTrustStrip";
        strip.className = "lp-strip";
        strip.innerHTML =
          '<div class="lp-strip-inner"><div class="lp-strip-grid">' + lpPropHtml(true) + "</div>" +
          '<div class="lp-hero-svcrow" id="lpHeroSvcRow">' + svcChipsHtml + "</div></div>";
        heroSection.parentNode.insertBefore(strip, heroSection.nextSibling);
      }
    } else if (v === "v2") {
      // v2 hero = warm filmstrip + MAD-LIB sentence form. The fill-in-the-
      // blank sentence (LukeW's mad-libs study) reads as conversation, not
      // form, and replaces the ZIP bar + button entirely.
      var term2 = (LP_TERMS[svc] || "home improvement").toLowerCase();
      var sdata = (typeof serviceLandingData !== "undefined") && serviceLandingData[svc];

      // One panoramic banner photo (calmer than a filmstrip) with a small
      // label chip — the service's strongest image gets to breathe.
      if (titleEl && !document.getElementById("lp2Banner")) {
        var bBase = LP_PHOTOS[svc] || LP_PHOTOS.roof;
        var ban = document.createElement("div");
        ban.id = "lp2Banner";
        ban.className = "lp2-banner";
        ban.innerHTML = "<picture>" +
          '<source srcset="' + bBase + '.avif" type="image/avif" />' +
          '<source srcset="' + bBase + '.webp" type="image/webp" />' +
          '<img src="' + bBase + '.jpg" alt="Stock photo" loading="eager" decoding="async" /></picture>' +
          '<span class="sr-only">Stock photo. Not representative of any specific contractor.</span>' +
          '<i class="lp2-banner-chip">' + (LP_TERMS[svc] || "Home Improvement") + "</i>";
        // direct child of the section (above the content grid): full-bleed
        // on phones and cleanly centered on desktop, no margin hacks
        if (heroSection && heroContent) heroSection.insertBefore(ban, heroContent);
        else titleEl.parentNode.insertBefore(ban, titleEl);
      }

      // Specific CTA wording on the overview button (NN/g: never vague)
      var ovBens = document.getElementById("landingOverviewBenefits");
      var ovBtn = ovBens && ovBens.parentElement.querySelector('button[onclick^="startWizardFromLanding"]');
      if (ovBtn) {
        ovBtn.innerHTML = 'Check my options <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>';
      }

      // Tiny ✓-reassurance row under the subtitle (the HomeBuddy pattern)
      var subEl2 = document.getElementById("landingHeroSubtitle");
      if (subEl2 && !document.getElementById("lp2Mini")) {
        var mini = document.createElement("div");
        mini.id = "lp2Mini";
        mini.className = "lp2-mini";
        mini.innerHTML = "<span>✓ Local pros</span><span>✓ No obligation</span><span>✓ About 2 minutes</span>";
        subEl2.parentNode.insertBefore(mini, subEl2.nextSibling);
      }

      // Mad-lib sentence: "I need <service> pros near [ZIP] (→)"
      var zipWrap2 = ctaCol && ctaCol.querySelector(".va-cta-wrap");
      var zipField = document.getElementById("landingZipInput");
      if (zipWrap2 && zipField && !document.getElementById("lp2Madlib")) {
        var mad = document.createElement("div");
        mad.id = "lp2Madlib";
        mad.className = "lp2-madlib";
        mad.innerHTML = '<label for="landingZipInput">I need <b>' + term2 + " pros</b> near</label>" +
          '<span id="lp2ZipSlot"></span>' +
          '<button type="button" class="lp2-go" aria-label="' + copy.cta + '" onclick="startWizardFromLanding()">' +
          '<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></button>' +
          '<span class="lp2-hint">Enter your 5-digit ZIP code</span>';
        zipWrap2.parentNode.insertBefore(mad, zipWrap2);
        // move the real input (keeps all its wiring) into the blank
        zipField.placeholder = "ZIP code";
        document.getElementById("lp2ZipSlot").appendChild(zipField);
        zipWrap2.style.display = "none";
      }
      // (no icon strip: the hero's ✓-row already carries the reassurance —
      // repeating it right above "How it works" broke the page rhythm)
    } else {
      // v3: no extras in the hero — the panel stays minimal
    }

    // Kill the generic template headings ("Features" / "Advantages")
    document.querySelectorAll("#landingPage section h2").forEach(function (h) {
      var t = (h.textContent || "").trim();
      if (t === "Features") h.textContent = "What’s included";
      else if (t === "Advantages") h.textContent = "Why it’s worth doing";
      else if (t === "Frequently Asked Questions") h.textContent = "Common questions";
    });

    // ── Body rebuild: photo-driven sections like the pro marketplaces,
    //    not stacked text cards. ──
    var data = (typeof serviceLandingData !== "undefined") && serviceLandingData[svc];
    var ic2 = lpIcons();

    // "What's included": real photo cards (gallery images already in repo).
    // v3 gets magazine-cover cards — full-bleed photo, text overlaid on a
    // dark gradient. Other variants keep the photo-top card.
    var featEl = document.getElementById("landingFeatures");
    if (data && data.features && data.gallery && featEl) {
      featEl.classList.remove("gap-4");
      featEl.innerHTML = data.features.map(function (f, i) {
        var img = data.gallery[i % data.gallery.length];
        var base = img.replace(/\.(png|jpg|jpeg)$/i, "");
        var pic = '<picture>' +
          '<source srcset="' + base + '.avif" type="image/avif" />' +
          '<source srcset="' + base + '.webp" type="image/webp" />' +
          '<img src="' + img + '" alt="Stock photo" loading="lazy" decoding="async" />' +
        "</picture>";
        // ANGI EXHIBIT A COMPLIANCE: stock photo disclosure (Category 9D)
        var disclosure = '<span class="sr-only">Stock photo. Not representative of any specific contractor.</span>';
        if (v === "v3") {
          return '<div class="lp3-ovcard">' + pic + disclosure +
            '<div class="lp3-ovcard-body"><h3>' + f.title + "</h3><p>" + f.desc + "</p></div></div>";
        }
        return '<div class="lp-photocard">' +
          '<div class="lp-photocard-img">' + pic + disclosure + "</div>" +
          '<div class="lp-photocard-body"><h3>' + f.title + "</h3><p>" + f.desc + "</p></div></div>";
      }).join("");
    }

    // "Why it's worth doing": compact duotone-icon grid
    var advEl = document.getElementById("landingAdvantages");
    if (data && data.advantages && advEl) {
      advEl.innerHTML = data.advantages.map(function (a) {
        var icon = lpIconFor(a.title) || ic2.check || "";
        return '<div class="lp-adv"><span class="lp-prop-ic" aria-hidden="true"><svg viewBox="' + (window.LP_ICONS_VIEWBOX || "0 0 256 256") + '" fill="currentColor">' + icon + "</svg></span>" +
          "<div><h3>" + a.title + "</h3><p>" + a.desc + "</p></div></div>";
      }).join("");
    }

    // Mid-page CTA band before the FAQ — the conversion moment every
    // marketplace page has and ours lacked.
    var faqsEl = document.getElementById("landingFaqs");
    var faqSection = faqsEl && faqsEl.closest("section");
    if (faqSection && !document.getElementById("lpCtaBand")) {
      var term2 = (LP_TERMS[svc] || "home improvement").toLowerCase();
      var band = document.createElement("section");
      band.id = "lpCtaBand";
      band.className = "lp-ctaband";
      band.innerHTML =
        '<div class="lp-ctaband-inner">' +
          "<div><h2>Ready to start your " + term2 + " project?</h2>" +
          "<p>Answer a few quick questions — it takes about 2 minutes.</p></div>" +
          '<button type="button" onclick="startWizardFromLanding()">' + copy.cta +
          ' <svg aria-hidden="true" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></button>' +
        "</div>";
      faqSection.parentNode.insertBefore(band, faqSection);
    }

    // v3 gets the full competitor-grade content depth
    if (v === "v3") lpBuildV3Body(svc, copy.cta);
    if (v === "v2") lpBuildV2Body(svc);

    // v2: floating reassurance badge layered over the arch photo (depth)
    if (v === "v2" && heroImgWrap && !document.getElementById("lpPhotoBadge")) {
      var badge = document.createElement("div");
      badge.id = "lpPhotoBadge";
      badge.className = "lp-photo-badge";
      badge.innerHTML = "<b>About 2 minutes</b><span>No obligation · You choose the pro</span>";
      heroImgWrap.appendChild(badge);
    }
  };

  /* ═══ v3 content library — the educational depth competitor pages have.
         Compliance: no "Free", no prices, no guarantees, no counts. ═══ */
  var LP_V3 = {
    roof: {
      factors: [["Roof size", "Larger roofs need more material and labor."], ["Material choice", "Asphalt, metal, and tile are priced differently."], ["Pitch & complexity", "Steeper or cut-up roofs take more time."], ["Tear-off needs", "Removing old layers adds work."], ["Permits & disposal", "Local rules and haul-away vary by area."], ["Local labor", "Rates differ from region to region."]],
      options: [["Asphalt shingles", "The most common choice for US homes.", "Common choice"], ["Metal", "Long service life, strong in harsh weather.", ""], ["Tile", "Distinctive look and very durable.", ""], ["Flat / rubber", "Made for low-slope sections.", ""]],
      signsTitle: "Signs it may be time for roof work",
      signs: ["Shingles missing, cracked, or curling", "Water stains after heavy rain", "Roof is 20+ years old", "Granules collecting in gutters", "Sagging or uneven areas", "Cooling bills creeping up"],
      faqs: [["Do I need to be home during the work?", "Usually not for the whole project — your pro will confirm what's needed."], ["How long does a replacement take?", "Many homes are done in a few days, depending on size and weather."], ["What happens to the old roof?", "Most pros include tear-off and haul-away in their plan — ask to confirm."]]
    },
    bathroom: {
      factors: [["Size of the space", "Bigger bathrooms mean more tile and labor."], ["Scope of work", "A refresh costs less than a full gut remodel."], ["Fixtures & finishes", "Vanities, tile, and hardware span a wide range."], ["Plumbing changes", "Moving pipes adds work versus keeping the layout."], ["Accessibility features", "Grab bars, seats, and low thresholds."], ["Local labor", "Rates differ from region to region."]],
      options: [["Full remodel", "Floor-to-ceiling update of the whole room.", "Most complete"], ["Tub-to-shower conversion", "Swap an old tub for an easy-entry shower.", ""], ["Walk-in tub", "Door entry, built for safer bathing.", ""], ["Accessibility upgrade", "Targeted safety improvements.", ""]],
      signsTitle: "Signs your bathroom is due",
      signs: ["Outdated fixtures and finishes", "Surfaces that are hard to keep clean", "Not enough storage", "Safety concerns stepping in and out", "Water damage or persistent mildew", "A layout that doesn't work for you"],
      faqs: [["Can I use another bathroom during the work?", "Yes — work is contained to the room being remodeled."], ["Do I pick the materials?", "Yes. Pros typically walk you through options and samples."], ["Does a remodel need permits?", "Some work does — your pro handles what applies locally."]]
    },
    shower: {
      factors: [["Shower size", "Larger enclosures need more tile and glass."], ["Entry style", "Curbless entries involve floor work."], ["Glass & tile choices", "Framed vs frameless, standard vs custom tile."], ["Plumbing relocation", "Moving the drain or valves adds work."], ["Demolition needs", "Removing an old tub or stall first."], ["Local labor", "Rates differ from region to region."]],
      options: [["Walk-in shower", "Open entry with no step.", "Common choice"], ["Tub-to-shower conversion", "Replace an unused tub with a shower.", ""], ["Curbless entry", "Flat floor entry for full accessibility.", ""], ["Glass enclosure", "Framed or frameless glass panels.", ""]],
      signsTitle: "Signs a walk-in shower makes sense",
      signs: ["Stepping over the tub feels risky", "The tub rarely gets used as a tub", "Cleaning the old enclosure is a chore", "Caulk or grout keeps failing", "You want a more open, modern look", "You want a bathroom that is easier to use"],
      faqs: [["How long does a conversion take?", "Many conversions finish in days, not weeks — your pro will confirm."], ["Can grab bars be added?", "Yes, and it's easiest to plan them from the start."], ["Is a curbless entry possible in my home?", "Often yes — a pro checks your floor structure first."]]
    },
    tub: {
      factors: [["Tub model & features", "Soaking, air jets, and hydrotherapy differ."], ["Door & seal type", "Inward vs outward door designs."], ["Plumbing adjustments", "Fill and drain speed may need upgrades."], ["Electrical work", "Jets and heaters need safe wiring."], ["Old tub removal", "Taking out the existing tub or shower."], ["Local labor", "Rates differ from region to region."]],
      options: [["Soaker walk-in", "Deep soak with door entry.", "Common choice"], ["Hydrotherapy jets", "Water jets for muscles and joints.", ""], ["Air-jet comfort", "Gentler bubble massage.", ""], ["Compact fit", "Sized for smaller bathrooms.", ""]],
      signsTitle: "Signs a walk-in tub could help",
      signs: ["Stepping over the tub wall is difficult", "You worry about slips in the bathroom", "Soaking helps aches and circulation", "A caregiver helps with bathing", "You plan to stay in your home long-term", "Standard tubs feel unsafe"],
      faqs: [["How fast do walk-in tubs drain?", "Models vary — many are designed for quick drain; ask your pro."], ["Will it fit my existing space?", "Many models install in a standard tub footprint."], ["Do jets require maintenance?", "Light periodic cleaning keeps jet systems fresh."]]
    },
    windows: {
      factors: [["Number of windows", "More openings, more material and labor."], ["Frame material", "Vinyl, wood, fiberglass, and aluminum differ."], ["Glass package", "Double vs triple pane, coatings, and gas fill."], ["Custom sizes", "Non-standard openings need made-to-order units."], ["Installation details", "Trim, flashing, and any rot repair."], ["Local labor", "Rates differ from region to region."]],
      options: [["Double-hung", "Both sashes move — easy to clean.", "Common choice"], ["Sliding", "Glides sideways, great for wide openings.", ""], ["Casement", "Cranks outward for full airflow.", ""], ["Bay & bow", "Projects outward, adds light and space.", ""]],
      signsTitle: "Signs your windows are done",
      signs: ["Drafts you can feel near the glass", "Condensation between panes", "Sashes that stick or won't stay open", "Outside noise coming through", "Rooms too hot or cold by season", "Faded floors and furniture from UV"],
      faqs: [["Can windows go in during winter?", "Yes — pros install one opening at a time to limit heat loss."], ["How long does installation take?", "Many standard replacements take under an hour per window."], ["Do new windows help with noise?", "Multi-pane glass noticeably cuts outside noise."]]
    },
    solar: {
      factors: [["System size", "More panels cover more of your usage."], ["Roof condition", "Aging roofs may need work before panels."], ["Panel type", "Efficiency and look vary by model."], ["Battery storage", "Backup power adds equipment."], ["Electrical panel", "Older panels sometimes need upgrades."], ["Local permits", "Rules and interconnection vary by utility."]],
      options: [["Grid-tied", "Standard setup, draws from the grid at night.", "Common choice"], ["With battery", "Keeps essentials running in outages.", ""], ["Roof mount", "Panels on the existing roof plane.", ""], ["Ground mount", "For open land and ideal angles.", ""]],
      signsTitle: "Signs solar is worth a look",
      signs: ["High or rising electric bills", "A roof with good sun exposure", "You plan to stay in the home", "Frequent outages in your area", "Interest in reducing grid reliance", "A roof in good condition"],
      faqs: [["Does my roof face the right way?", "South-facing is ideal, but east/west setups work too — a pro models it."], ["What happens on cloudy days?", "Panels still produce, just less — the grid or battery covers the rest."], ["Do panels need cleaning?", "Rain handles most of it; occasional cleaning helps in dusty areas."]]
    },
    gutter: {
      factors: [["Linear feet", "Longer rooflines need more material."], ["Material", "Aluminum, steel, and copper differ."], ["Gutter guards", "Covers add cost but cut cleaning."], ["Home height", "Second stories take more time and safety setup."], ["Downspouts", "Count and placement affect the job."], ["Local labor", "Rates differ from region to region."]],
      options: [["Seamless aluminum", "Formed on-site with fewer joints.", "Common choice"], ["Steel", "Extra strength for harsh weather.", ""], ["Copper", "Premium look that patinas over time.", ""], ["With guards", "Keeps leaves and debris out.", ""]],
      signsTitle: "Signs your gutters need attention",
      signs: ["Water spilling over the edges", "Sagging or pulling away from the fascia", "Peeling paint or stains on siding", "Pooling water near the foundation", "Rust spots or visible cracks", "Plants sprouting in the gutter"],
      faqs: [["How often should gutters be replaced?", "Decades for most materials — condition matters more than how old they are."], ["Are guards worth it?", "They cut cleaning dramatically in leafy areas."], ["Can gutters be repaired instead?", "Sometimes — a pro will tell you if sections can be saved."]]
    }
  };
  LP_V3.bath = LP_V3.bathroom;

  function lpBuildV3Body(svc, ctaLabel) {
    if (document.getElementById("lp3Signs")) return;
    var c = LP_V3[svc] || LP_V3.roof;
    var ic = lpIcons();
    var vb = window.LP_ICONS_VIEWBOX || "0 0 256 256";
    function icoFor(t) {
      var inner = lpIconFor(t);
      return inner ? '<span class="lp-prop-ic" aria-hidden="true"><svg viewBox="' + vb + '" fill="currentColor">' + inner + "</svg></span>" : "";
    }
    var ovEl = document.getElementById("landingOverviewBenefits");
    var featEl = document.getElementById("landingFeatures");
    var advEl = document.getElementById("landingAdvantages");
    var faqEl = document.getElementById("landingFaqs");

    // 0. Overview rebuilt as a bento mosaic: photo tile + icon benefit
    //    tiles + an indigo CTA tile. No more photo-left/checklist-right.
    var ovSec = ovEl && ovEl.closest("section");
    var ovData = (typeof serviceLandingData !== "undefined") && serviceLandingData[svc];
    if (ovSec && ovData) {
      var ovImg = ovData.overviewImage || (ovData.gallery && ovData.gallery[0]);
      var ovBase = ovImg ? ovImg.replace(/\.(png|jpg|jpeg)$/i, "") : (LP_PHOTOS[svc] || LP_PHOTOS.roof);
      var bens = (ovData.overviewBenefits || []).slice(0, 5);
      ovSec.className = "lp3-sec lp3-bento-sec";
      ovSec.innerHTML =
        '<div class="lp3-inner">' +
          "<h2>" + ovData.overviewTitle + "</h2>" +
          '<p class="lp3-sub">' + ovData.overviewSubtitle + "</p>" +
          '<div class="lp3-bento">' +
            '<div class="lp3-bento-photo"><picture>' +
              '<source srcset="' + ovBase + '.avif" type="image/avif" />' +
              '<source srcset="' + ovBase + '.webp" type="image/webp" />' +
              '<img src="' + ovBase + '.jpg" alt="Stock photo" loading="lazy" decoding="async" />' +
            '</picture><span class="sr-only">Stock photo. Not representative of any specific contractor.</span></div>' +
            bens.map(function (b) { return '<div class="lp3-bento-tile">' + icoFor(b) + "<span>" + b + "</span></div>"; }).join("") +
            '<div class="lp3-bento-cta"><b>Ready to compare your options?</b>' +
            '<button type="button" onclick="startWizardFromLanding()">Check my options ' +
            '<svg aria-hidden="true" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></button></div>' +
          "</div>" +
        "</div>";
    }
    // The owner cut the factor/option/why content entirely — the page goes
    // straight from the photo cards to the signs band. Keep it lean.
    var featSec = featEl && featEl.closest("section");
    var advSec = advEl && advEl.closest("section");
    if (featSec) featSec.classList.add("lp3-feat");
    if (advSec) advSec.style.display = "none";

    // 3. "Signs it's time" dark checklist band
    if (advSec) {
      // Lean dark band: centered heading + six signs in a tight checklist.
      // No photo (the cards above are already photographic) and no button
      // (the CTA band right below owns the conversion moment).
      var sg = document.createElement("section");
      sg.id = "lp3Signs";
      sg.className = "lp3-sec lp3-signs";
      sg.innerHTML = '<div class="lp3-inner">' +
        "<h2>" + c.signsTitle + "</h2>" +
        '<div class="lp3-signs-grid">' + c.signs.map(function (s) {
          return '<div><span aria-hidden="true"><svg viewBox="' + vb + '" fill="currentColor">' + (ic.check || "") + "</svg></span>" + s + "</div>";
        }).join("") + "</div></div>";
      advSec.parentNode.insertBefore(sg, advSec.nextSibling);
    }

    // 4. Extra FAQs (same accordion pattern/ids as the stock ones)
    var baseData = (typeof serviceLandingData !== "undefined") && serviceLandingData[svc];
    if (faqEl && baseData && baseData.faqs) {
      var base = baseData.faqs.length;
      faqEl.insertAdjacentHTML("beforeend", c.faqs.map(function (f, i) {
        var n = base + i;
        return '<div class="border border-gray-200 rounded-lg"><button type="button" onclick="toggleLandingFaq(' + n + ')" class="w-full flex items-center justify-between gap-3 px-4 sm:px-6 py-4 text-left"><span class="text-base font-semibold text-gray-900 leading-snug">' + f[0] + '</span><svg id="lfaqChevron' + n + '" class="w-5 h-5 text-gray-400 flex-shrink-0 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg></button><div id="lfaqAnswer' + n + '" class="hidden px-4 sm:px-6 pb-4 animate-expand"><p class="text-[15px] text-gray-600 leading-relaxed">' + f[1] + "</p></div></div>";
      }).join(""));
    }

    // 5. Footer: keep visitors in the v3 funnel, add a mini CTA in the
    //    brand column, then the disclosure.
    var footer = document.querySelector("#landingPage footer");
    if (footer && !footer._lp3Footer) {
      footer._lp3Footer = true;
      // service links keep the variant
      footer.querySelectorAll('a[href^="/get-quotes/"]').forEach(function (a) {
        if (!/\/v3\/?$/.test(a.getAttribute("href"))) a.setAttribute("href", a.getAttribute("href").replace(/\/?$/, "/v3"));
      });
      var brandP = footer.querySelector("p.text-sm");
      if (brandP) {
        var fcta = document.createElement("button");
        fcta.type = "button";
        fcta.className = "lp3-foot-cta";
        fcta.innerHTML = "Start your project →";
        fcta.onclick = function () { startWizardFromLanding(); };
        brandP.parentNode.insertBefore(fcta, brandP.nextSibling);
      }
    }
    if (footer && !document.getElementById("lp3Disclosure")) {
      var d = document.createElement("p");
      d.id = "lp3Disclosure";
      d.className = "lp3-disclosure";
      d.textContent = "QuickHomeFix matches homeowners with independent home improvement professionals. All work is performed by independent contractors, not by QuickHomeFix. Project details, timelines, and pricing are agreed directly between you and the professional you choose.";
      var inner = footer.querySelector(".max-w-6xl") || footer;
      inner.appendChild(d);
    }
  }

  /* ═══ Option icons: every wizard choice gets a relevant pictogram,
         matched from its label text (what Modernize/HomeBuddy-class
         wizards do — recognition beats reading). ═══ */
  // Professional icon set: Phosphor Duotone (MIT), generated into js/lp-icons.js.
  function lpIcons() { return window.LP_ICONS || {}; }
  var LP_IC_RULES = [
    // high-specificity phrases first
    [/storm|hail|wind damage/i, "storm"],
    [/battery/i, "battery"],
    [/tear.?off|removal|demolition|haul/i, "broom"],
    [/permit|disposal|paperwork|rules/i, "clipboard"],
    [/local labor|your area|region|near you|zip code/i, "mappin"],
    [/pitch|slope|angle|complex/i, "angle"],
    [/material|finishes|range of|choice|swatch|custom vanities/i, "swatches"],
    [/energy|efficien/i, "leaf"],
    [/noise|quiet/i, "earslash"],
    [/comfort|heated|temperature|relax/i, "armchair"],
    [/curb appeal|modern look|updated style|fresh|appearance|look of/i, "star"],
    [/storage|cabinet|shelv/i, "archive"],
    [/safety|safe|peace of mind|durab|protection|secure/i, "shield"],
    [/services available|maintenance|installation available|crew/i, "hardhat"],
    [/replace|conversion|convert/i, "cycle"],
    [/repair|fix|leak/i, "wrench"],
    [/install|new\b/i, "hammer"],
    [/inspect/i, "search"],
    [/asphalt|shingle/i, "shingles"],
    [/metal|steel/i, "metal"],
    [/tile/i, "tile"],
    [/slate|stone/i, "slate"],
    [/cedar|shake|wood/i, "cedar"],
    [/composite/i, "shingles"],
    [/tar|torch|flat roof|rubber/i, "roller"],
    [/slid|slider/i, "harrows"],
    [/hung|single.?hung|double.?hung/i, "varrows"],
    [/casement|entry|door/i, "doorin"],
    [/picture|bay|bow/i, "image"],
    [/window/i, "windowicon"],
    [/walk.?in/i, "doorin"],
    [/tub|bath(?!room wall)/i, "tub"],
    [/shower/i, "shower"],
    [/wall|surround/i, "wall"],
    [/solar|panel/i, "panel"],
    [/\$|bill|cost|price|savings/i, "dollar"],
    [/guard|cover/i, "shield"],
    [/gutter|downspout|drain|water/i, "drop"],
    [/seamless/i, "drop"],
    [/remodel|renovat/i, "house"],
    [/size|sq\.?\s?ft|square|linear feet/i, "ruler"],
    [/^yes/i, "check"],
    [/^no(?!t)/i, "x"],
    [/\d/, "hash"]
  ];
  function lpIconFor(label) {
    var ic = lpIcons();
    for (var i = 0; i < LP_IC_RULES.length; i++) {
      if (LP_IC_RULES[i][0].test(label) && ic[LP_IC_RULES[i][1]]) return ic[LP_IC_RULES[i][1]];
    }
    return ic.house || "";
  }
  function lpInjectOptionIcons() {
    ["radioOptions", "serviceSelectOptions"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.querySelectorAll("button").forEach(function (btn) {
        if (btn.querySelector(".lp-opt-ic")) return;
        var label = (btn.textContent || "").trim();
        if (!label) return;
        var inner = lpIconFor(label);
        if (!inner) return;
        var ic = document.createElement("span");
        ic.className = "lp-opt-ic";
        ic.setAttribute("aria-hidden", "true");
        ic.innerHTML = '<svg viewBox="' + (window.LP_ICONS_VIEWBOX || "0 0 256 256") + '" fill="currentColor">' + inner + "</svg>";
        btn.insertBefore(ic, btn.firstChild);
      });
    });
  }

  /* ═══ v2 middle: service MENU (merges overview + included) and an
         editorial "why" split. Conversational, boxless, short. ═══ */
  function lpBuildV2Body(svc) {
    if (document.getElementById("lp2Menu")) return;
    var data = (typeof serviceLandingData !== "undefined") && serviceLandingData[svc];
    if (!data) return;
    var ovEl = document.getElementById("landingOverviewBenefits");
    var featEl = document.getElementById("landingFeatures");
    var advEl = document.getElementById("landingAdvantages");
    var ovSec = ovEl && ovEl.closest("section");
    var featSec = featEl && featEl.closest("section");
    var advSec = advEl && advEl.closest("section");
    var arrowSm = '<svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>';

    // Zig-zag editorial bands (the Project-Allies middle): big photo one
    // side, content the other, alternating, a CTA in each band.
    var gal = data.gallery || [];
    function zigPhoto(i) {
      var g = gal[i % (gal.length || 1)] || "";
      if (!g) return "";
      var b = g.replace(/\.(png|jpg|jpeg)$/i, "");
      return '<div class="lp2-zigimg"><picture>' +
        '<source srcset="' + b + '.avif" type="image/avif" />' +
        '<source srcset="' + b + '.webp" type="image/webp" />' +
        '<img src="' + g + '" alt="Stock photo" loading="lazy" decoding="async" /></picture>' +
        '<span class="sr-only">Stock photo. Not representative of any specific contractor.</span></div>';
    }
    var zigBtn = function (label) {
      return '<button type="button" class="lp2-zigbtn" onclick="startWizardFromLanding()">' + label +
        ' <svg aria-hidden="true" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg></button>';
    };
    var checkSvg = '<svg aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>';

    // Band 1: photo LEFT — overview story + checks
    if (ovSec) {
      var checks = (data.overviewBenefits || []).slice(0, 4).map(function (bn) {
        return '<li>' + checkSvg + bn + "</li>";
      }).join("");
      ovSec.id = "lp2Menu"; // build-once guard
      ovSec.className = "lp2-zig-sec";
      ovSec.innerHTML = '<div class="lp3-inner lp2-zig">' +
        zigPhoto(0) +
        '<div class="lp2-zigtext"><h2>' + data.overviewTitle + "</h2>" +
        "<p>" + data.overviewSubtitle + "</p>" +
        '<ul class="lp2-zigchecks">' + checks + "</ul></div></div>";
    }

    // Band 2: photo RIGHT — what's included
    if (featSec && data.features) {
      var feats = data.features.map(function (f) {
        return "<div><b>" + f.title + "</b><p>" + f.desc + "</p></div>";
      }).join("");
      featSec.className = "lp2-zig-sec lp2-zig-alt";
      featSec.innerHTML = '<div class="lp3-inner lp2-zig lp2-rev">' +
        zigPhoto(1) +
        '<div class="lp2-zigtext"><h2>What’s included</h2>' +
        '<div class="lp2-ziglist">' + feats + "</div></div></div>";
    }

    // Band 3: photo LEFT — why it's worth doing
    if (advSec && data.advantages) {
      var items = data.advantages.map(function (a) {
        return "<div><b>" + a.title + "</b><p>" + a.desc + "</p></div>";
      }).join("");
      advSec.className = "lp2-zig-sec";
      advSec.innerHTML = '<div class="lp3-inner lp2-zig">' +
        zigPhoto(2) +
        '<div class="lp2-zigtext"><h2>Why it’s worth doing</h2>' +
        '<div class="lp2-ziglist">' + items + "</div></div></div>";
    }
  }

  /* ═══ Visible field labels (web.dev: never placeholder-only) ═══ */
  var LP_FIELD_LABELS = {
    zipInput: "ZIP code", emailInput: "Email address",
    addressInput: "Street address", cityInput: "City", stateInput: "State",
    detailZipInput: "ZIP code", firstNameInput: "First name",
    lastNameInput: "Last name", phoneInput: "Phone number"
  };
  function lpInjectFieldLabels(v) {
    if (!v) return; // visible labels in every variant
    Object.keys(LP_FIELD_LABELS).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el._lpLabeled) return;
      el._lpLabeled = true;
      // icon inputs sit inside a positioned wrapper — label goes above it
      var anchor = (el.parentElement && el.parentElement.classList.contains("relative")) ? el.parentElement : el;
      // most steps already have labels right above the field — skip those
      var prev = anchor.previousElementSibling;
      if (prev && prev.tagName === "LABEL") return;
      if (document.querySelector('label[for="' + id + '"]')) return;
      var lab = document.createElement("label");
      lab.className = "lp3-label";
      lab.setAttribute("for", id);
      lab.textContent = LP_FIELD_LABELS[id];
      anchor.parentNode.insertBefore(lab, anchor);
    });
  }

  /* ═══ v1 fast-form: autofill attributes, inline ✓ validation, ZIP
         auto-advance, Enter-to-continue. ═══ */
  var LP1_FIELDS = {
    zipInput:       { ac: "postal-code",   im: "numeric", ok: function (x) { return /^\d{5}$/.test(x); }, next: "zipNextBtn", auto: true },
    emailInput:     { ac: "email",         im: "email",   ok: function (x) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x); }, next: "emailNextBtn" },
    // addressInput keeps autocomplete="off": it runs a Google Places
    // suggestion dropdown that native autofill would fight with
    addressInput:   { ac: null,                            ok: function (x) { return x.trim().length >= 4; } },
    cityInput:      { ac: "address-level2",               ok: function (x) { return x.trim().length >= 2; } },
    stateInput:     { ac: "address-level1",               ok: function (x) { return x.trim().length >= 2; } },
    detailZipInput: { ac: "postal-code",   im: "numeric", ok: function (x) { return /^\d{5}$/.test(x); } },
    firstNameInput: { ac: "given-name",                   ok: function (x) { return x.trim().length >= 2; }, next: "nameNextBtn" },
    lastNameInput:  { ac: "family-name",                  ok: function (x) { return x.trim().length >= 2; }, next: "nameNextBtn" },
    phoneInput:     { ac: "tel",           im: "tel",     ok: function (x) { return x.replace(/\D/g, "").length === 10; } }
  };
  function lpFastForm(v) {
    if (!v) return; // all variants get the fast-form package
    Object.keys(LP1_FIELDS).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      if (el._lpFast) {
        // already wired — re-judge: steps pre-fill values programmatically
        // (ZIP lookup, resume), which fires no input events
        if (el._lpJudge) el._lpJudge();
        return;
      }
      el._lpFast = true;
      var cfg = LP1_FIELDS[id];
      // browser autofill: the #1 completion-speed lever
      if (cfg.ac) el.setAttribute("autocomplete", cfg.ac);
      if (cfg.im) el.setAttribute("inputmode", cfg.im);
      var judge = function () {
        var good = cfg.ok(el.value || "");
        el.classList.toggle("lp1-valid", good);
        // ZIP: auto-advance the moment it's complete (Modernize pattern)
        if (good && cfg.auto && cfg.next) {
          var nb = document.getElementById(cfg.next);
          if (nb && !nb.disabled && el._lpAutoLast !== el.value) {
            el._lpAutoLast = el.value;
            setTimeout(function () {
              if (cfg.ok(el.value || "") && !nb.disabled) nb.click();
            }, 350);
          }
        }
      };
      el._lpJudge = judge;
      el.addEventListener("input", judge);
      el.addEventListener("change", judge); // autofill fires change
      el._lpAutoLast = el.value; // a pre-filled ZIP must never auto-advance
      judge(); // validate pre-filled values immediately
      // Enter advances when the field is valid
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && cfg.next && cfg.ok(el.value || "")) {
          e.preventDefault();
          var nb2 = document.getElementById(cfg.next);
          if (nb2 && !nb2.disabled) nb2.click();
        }
      });
    });
  }

  /* ═══ Fast-flow: advancing the wizard on option tap (no Next hunt).
         Some flows (windows, shower) already auto-advance in their own
         onclick — the step-name check skips those to avoid double-advance. ═══ */
  function lpWireAutoAdvance() {
    ["radioOptions", "serviceSelectOptions"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el._lpAuto) return;
      el._lpAuto = true;
      el.addEventListener("click", function (e) {
        var btn = e.target && e.target.closest ? e.target.closest("button") : null;
        if (!btn) return;
        var stepBefore = store.getCurrentStepName();
        setTimeout(lpInjectOptionIcons, 60); // re-add icons if selection re-rendered rows
        setTimeout(function () {
          if (store.getCurrentStepName() !== stepBefore) return; // flow advanced itself
          try {
            if (id === "radioOptions") {
              if (typeof currentRadioValue !== "undefined" && currentRadioValue) submitRadioStep();
            } else {
              var nb = document.getElementById("svcNextBtn");
              if (nb && !nb.disabled) nb.click();
            }
          } catch (err) { /* keep the Next button as the fallback */ }
        }, 300);
      });
    });
  }

  /* ═══ Wizard enhancement: per-variant progress concept, photo banner,
         step counter, themed thank-you ═══ */

  var SVC_LABELS = {
    roof: "Roofing", windows: "Window Replacement", solar: "Solar",
    bath: "Bathroom Remodeling", bathroom: "Bathroom Remodeling",
    gutter: "Gutters", tub: "Walk-In Tub", shower: "Walk-In Shower"
  };

  function lpEnhanceWizard() {
    var v = lpVariant();
    if (!v || typeof store === "undefined") return;

    var svc = store.formData.service || "roof";
    var stepName = store.getCurrentStepName ? store.getCurrentStepName() : "";
    var flow = getServiceFlow(svc);
    var steps = (flow.steps || []).filter(function (s) { return s !== "complete"; });
    // bathroom hub is a lead-in to a ~6-step flow; don't show it as "last step"
    var total = svc === "bathroom" ? 6 : steps.length;
    var cur = Math.max(1, Math.min(store.currentStep, total));
    var photoBase = LP_PHOTOS[svc] || LP_PHOTOS.roof;

    var main = document.getElementById("wizardMain");
    if (!main) return;

    lpWireAutoAdvance();
    lpInjectOptionIcons();
    lpInjectFieldLabels(v);
    lpFastForm(v);

    // ── Photo banner with service label + step indicator ──
    var banner = document.getElementById("lpWizBanner");
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "lpWizBanner";
      banner.className = "lp-wiz-banner";
      main.parentNode.insertBefore(banner, main);
    }
    var isComplete = stepName === "complete";
    banner.style.display = isComplete ? "none" : "";
    if (!isComplete) {
      // Step indicator: a different concept per variant.
      var ind = "";
      if (v === "v1") {
        // v1: numeric counter + thin meter
        var pct = Math.round((cur / total) * 100);
        ind = '<span class="lp-ind-count">Step ' + cur + " of " + total + "</span>" +
              '<span class="lp-ind-meter" role="progressbar" aria-valuemin="1" aria-valuemax="' + total + '" aria-valuenow="' + cur + '" aria-label="Step ' + cur + " of " + total + '"><i style="width:' + pct + '%"></i></span>';
      } else if (v === "v2") {
        // v2: named-milestone tracker gets its own strip below the banner
        ind = "";
      } else {
        // v3: tracker gets its own prominent strip below the banner
        // (see lpRenderTracker) — the banner keeps just the service name.
        ind = "";
      }
      banner.innerHTML =
        '<picture aria-hidden="true">' +
          '<source srcset="' + photoBase + '.avif" type="image/avif" />' +
          '<source srcset="' + photoBase + '.webp" type="image/webp" />' +
          '<img src="' + photoBase + '.jpg" alt="" loading="eager" decoding="async" />' +
        "</picture>" +
        '<div class="lp-wiz-banner-ov">' +
          '<span class="lp-wiz-svc">' + (SVC_LABELS[svc] || "Home Project") + "</span>" +
          '<span class="lp-wiz-ind">' + ind + "</span>" +
        "</div>";
    }

    // ── v1 (Modernize model): the photo banner is replaced by a slim bar —
    //    service label, gold progress track, plain step counter. ──
    if (v === "v1") {
      banner.style.display = "none";
      var bar1 = document.getElementById("lp1Bar");
      if (!bar1) {
        bar1 = document.createElement("div");
        bar1.id = "lp1Bar";
        bar1.className = "lp1-bar";
        banner.parentNode.insertBefore(bar1, banner.nextSibling);
      }
      bar1.style.display = isComplete ? "none" : "";
      if (!isComplete) {
        var pct1 = total > 1 ? Math.round(10 + ((cur - 1) / (total - 1)) * 90) : 100;
        bar1.setAttribute("role", "progressbar");
        bar1.setAttribute("aria-valuemin", "0");
        bar1.setAttribute("aria-valuemax", "100");
        bar1.setAttribute("aria-valuenow", String(pct1));
        bar1.setAttribute("aria-label", "Step " + cur + " of " + total);
        bar1.innerHTML =
          '<span class="lp1-bar-svc">' + (SVC_LABELS[svc] || "Home Project") + "</span>" +
          '<span class="lp1-bar-track" aria-hidden="true"><i style="width:' + pct1 + '%"></i></span>' +
          '<span class="lp1-bar-count">Step ' + cur + " of " + total + "</span>";
      }
    }

    // ── v2: named-milestone tracker (Project → Details → Contact).
    //    Chunking 7 steps into 3 named phases (sub-goal effect), with a
    //    time-left estimate — checkout research's top abandonment fix. ──
    if (v === "v2") {
      var trk2 = document.getElementById("lp2Tracker");
      if (!trk2) {
        trk2 = document.createElement("div");
        trk2.id = "lp2Tracker";
        trk2.className = "lp2-trk";
        banner.parentNode.insertBefore(trk2, banner.nextSibling);
      }
      trk2.style.display = isComplete ? "none" : "";
      if (!isComplete) {
        // tail of every flow = email, details, name, final (4 steps)
        var phase = total <= 2 ? 0 : (cur <= Math.max(1, total - 4)) ? 0 : (cur <= total - 2) ? 1 : 2;
        var remaining = total - cur;
        var eta = remaining <= 1 ? "Almost done" : remaining <= 3 ? "About 30 seconds left" : "About 1 minute left";
        var PH_LONG = ["Your project", "Your home", "Contact info"];
        // endowed start (14%) → ring never begins empty
        var pct2 = total > 1 ? Math.round(14 + ((cur - 1) / (total - 1)) * 86) : 100;
        var CIRC = 2 * Math.PI * 24; // r=24 ring
        var dash = (CIRC * (100 - pct2) / 100).toFixed(1);
        trk2.setAttribute("role", "progressbar");
        trk2.setAttribute("aria-valuemin", "0");
        trk2.setAttribute("aria-valuemax", "100");
        trk2.setAttribute("aria-valuenow", String(pct2));
        trk2.setAttribute("aria-label", pct2 + "% complete — " + PH_LONG[phase] + " — " + eta);
        trk2.innerHTML =
          '<span class="lp2-ring-wrap" aria-hidden="true">' +
            '<svg class="lp2-ring" viewBox="0 0 60 60">' +
              '<defs><linearGradient id="lp2rg" x1="0" y1="0" x2="1" y2="1">' +
                '<stop offset="0" stop-color="#16a34a"/><stop offset="1" stop-color="#0e7490"/>' +
              "</linearGradient></defs>" +
              '<circle class="lp2-ring-bg" cx="30" cy="30" r="24"/>' +
              '<circle class="lp2-ring-fg" cx="30" cy="30" r="24" stroke-dasharray="' + CIRC.toFixed(1) + '" stroke-dashoffset="' + dash + '"/>' +
            "</svg>" +
            '<b class="lp2-ring-pct">' + pct2 + "%</b>" +
          "</span>" +
          '<div class="lp2-ring-text"><b>' + PH_LONG[phase] + "</b>" +
          "<span>" + eta + "</span></div>";
      }
    }

    // ── v3: big pizza-tracker-style progress strip under the banner.
    //    Endowed progress (starts pre-filled) + goal gradient (visible
    //    finish flag, momentum copy, pulsing walker). ──
    if (v === "v3") {
      var trk = document.getElementById("lpTracker");
      if (!trk) {
        trk = document.createElement("div");
        trk.id = "lpTracker";
        trk.className = "lp-trk";
        banner.parentNode.insertBefore(trk, banner.nextSibling);
      }
      trk.style.display = isComplete ? "none" : "";
      if (!isComplete) {
        // Cap at 95: the last step still has a field to fill, so "100%" there
        // read as done (matches store.getProgress, which also stops at 95).
        var pct = total > 1 ? Math.min(95, Math.round(14 + ((cur - 1) / (total - 1)) * 86)) : 95;
        var mood = pct >= 90 ? "Last step — pros are waiting!" : pct >= 65 ? "Almost there, keep going" : pct >= 40 ? "Great pace" : "Nice — you’re on your way";
        var houseIc = (window.LP_ICONS && window.LP_ICONS.house)
          ? '<svg viewBox="' + (window.LP_ICONS_VIEWBOX || "0 0 256 256") + '" fill="currentColor">' + window.LP_ICONS.house + "</svg>" : "";
        trk.setAttribute("role", "progressbar");
        trk.setAttribute("aria-valuemin", "0");
        trk.setAttribute("aria-valuemax", "100");
        trk.setAttribute("aria-valuenow", String(pct));
        trk.setAttribute("aria-label", pct + "% complete — " + mood);
        trk.innerHTML =
          '<div class="lp-trk-top"><span class="lp-trk-mood">' + mood + '</span><span class="lp-trk-pct">' + pct + "%</span></div>" +
          '<div class="lp-trk-track" aria-hidden="true">' +
            '<i class="lp-trk-fill" style="width:' + pct + '%"></i>' +
            '<b class="lp-trk-walker" style="left:' + pct + '%">' + houseIc + "</b>" +
            '<svg class="lp-trk-flag' + (pct >= 96 ? " on" : "") + '" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3a1 1 0 0 1 1 1v1.1l12.4 2.7c.9.2.9 1.5 0 1.7L6 12.2V20a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1z"/></svg>' +
          "</div>";
      }
    }

    // ── Themed thank-you: real photo ──
    if (isComplete) {
      var qImg = document.getElementById("qhfBannerImg");
      if (qImg && qImg.getAttribute("data-lp") !== "1") {
        qImg.src = photoBase + ".jpg";
        qImg.setAttribute("data-lp", "1");
        qImg.removeAttribute("style");
      }
    }
  }

  // Hook into the wizard's render loop. lp-variants.js is deferred, so the
  // inline renderCurrentStep already exists by the time this runs.
  if (typeof window.renderCurrentStep === "function" && !window._lpWizHooked) {
    window._lpWizHooked = true;
    var _lpOrigRender = window.renderCurrentStep;
    window.renderCurrentStep = function () {
      _lpOrigRender.apply(this, arguments);
      try { lpEnhanceWizard(); } catch (e) { /* never break the wizard */ }
    };
  }
})();
