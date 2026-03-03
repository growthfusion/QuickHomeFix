/**
 * Preloads all critical images in the background so they're
 * already in the browser cache when the user navigates to any page.
 * Called once on app startup.
 */

// ─── Logo & Hero ───
import logo from "@/assets/images/ChatGPT_Image_Feb_12__2026__12_32_18_PM__1_-removebg-preview.png";
import heroImg from "@/assets/images/Toolbox_team_at_work-removebg-preview.png";

// ─── Service selection icons ───
import bathIcon from "@/assets/images/bath-tub.png";
import roofIcon from "@/assets/images/roof.png";
import solarIcon from "@/assets/images/solar-panel.png";
import windowIcon from "@/assets/images/window.png";
import showerIcon from "@/assets/images/showerr.png";
import gutterIcon from "@/assets/images/round.png";
import buketIcon from "@/assets/images/buket.png";

// ─── Home page service card images ───
import roofSvg from "@/assets/images/12085683_20944179.svg";
import solarSvg from "@/assets/images/21585719_Na_Nov_23.svg";
import windowSvg from "@/assets/images/10613460_10144.svg";
import bathSvg from "@/assets/images/12291237_Plumber repairing pipe burst.svg";
import gutterJpg from "@/assets/images/12469188_Wavy_Park-02_Single-01.jpg";
import showerJpg from "@/assets/images/45256249_plumbers_clearing_blockage_in_toilet_with_plunger.jpg";
import tubJpg from "@/assets/images/23591705_cleaning_v_03.jpg";

// ─── Wizard step hero images ───
import roofHero from "@/assets/images/ChatGPT_Image_Feb_12__2026__11_09_02_AM-removebg-preview.png";
import windowHero from "@/assets/images/ChatGPT_Image_Feb_12__2026__11_24_36_AM-removebg-preview.png";
import bathHero from "@/assets/images/ChatGPT_Image_Feb_12__2026__11_37_31_AM-removebg-preview.png";
import tubHero from "@/assets/images/ChatGPT_Image_Feb_12__2026__11_52_16_AM-removebg-preview.png";

// ─── Complete step service images ───
import imgRoofing from "@/assets/images/roofing_services.webp";
import imgSolar from "@/assets/images/Solar.webp";
import imgWindow from "@/assets/images/window_services.webp";
import imgGutter from "@/assets/images/gutter_services.webp";
import imgBath from "@/assets/images/walkin_tub_services.png";
import imgShower from "@/assets/images/walkin_shower_services.png";

// ─── Landing page gallery images ───
import bath1 from "@/assets/images/landing/bath-1.jpg";
import bath2 from "@/assets/images/landing/bath-2.jpg";
import bath3 from "@/assets/images/landing/bath-3.jpg";
import tub1 from "@/assets/images/landing/tub-1.jpg";
import tub2 from "@/assets/images/landing/tub-2.jpg";
import tub3 from "@/assets/images/landing/tub-3.jpg";
import roof1 from "@/assets/images/landing/roof-1.jpg";
import roof2 from "@/assets/images/landing/roof-2.jpg";
import roof3 from "@/assets/images/landing/roof-3.jpg";
import solar1 from "@/assets/images/landing/solar-1.jpg";
import solar2 from "@/assets/images/landing/solar-2.jpg";
import solar3 from "@/assets/images/landing/solar-3.jpg";
import window1 from "@/assets/images/landing/window-1.jpg";
import window2 from "@/assets/images/landing/window-2.jpg";
import window3 from "@/assets/images/landing/window-3.jpg";
import gutter1 from "@/assets/images/landing/gutter-1.jpg";
import gutter2 from "@/assets/images/landing/gutter-2.jpg";
import gutter3 from "@/assets/images/landing/gutter-3.jpg";

// ─── Trust badge icons ───
import secure from "@/assets/images/cyber-security.png";
import guarantee from "@/assets/images/badge.png";
import verified from "@/assets/images/checkmark.png";

// Priority order: critical first, then secondary
const CRITICAL_IMAGES = [
  logo, heroImg,
  bathIcon, roofIcon, solarIcon, windowIcon, showerIcon, gutterIcon, buketIcon,
  roofSvg, solarSvg, windowSvg, bathSvg,
  roofHero, windowHero, bathHero, tubHero,
  secure, guarantee, verified,
];

const SECONDARY_IMAGES = [
  gutterJpg, showerJpg, tubJpg,
  imgRoofing, imgSolar, imgWindow, imgGutter, imgBath, imgShower,
  bath1, bath2, bath3,
  tub1, tub2, tub3,
  roof1, roof2, roof3,
  solar1, solar2, solar3,
  window1, window2, window3,
  gutter1, gutter2, gutter3,
];

function preloadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = resolve; // don't block on errors
    img.src = src;
  });
}

export function preloadAllImages() {
  // Load critical images immediately
  CRITICAL_IMAGES.forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  // Load secondary images after a short delay to not block initial render
  setTimeout(() => {
    SECONDARY_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, 1500);
}
