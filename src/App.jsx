import React, { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { preloadAllImages } from "@/lib/preload-images";

// Pages
import Home from "@/pages/Home";
import QuoteWizard from "@/pages/QuoteWizard";
import MarketingPartners from "@/pages/MarketingPartners";
import TermsOfService from "@/pages/TermsOfService";
import PrivacyPolicy from "@/pages/PrivacyPolicy";

// Dashboard pages
import LeadFull from "@/backend_db/features/LeadsFull/LeadsFull";
import FormStpes from "@/backend_db/features/Forms/form_stpes/FormStpes";
import PreSales from "@/backend_db/features/Forms/pre_sales/PreSales";
import Statistics from "@/backend_db/features/Bucket_Affiliate/statistics/Statistics";
import Settings from "@/backend_db/features/Bucket_Affiliate/settings/Settings";
import Page from "@/backend_db/features/leads/Page";
import Dash from "@/backend_db/features/dash/Page";
import Login from "@/backend_db/features/Auth/login";

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

function App() {
  // Preload all images on app startup so they're cached for instant display
  useEffect(() => {
    preloadAllImages();
  }, []);

  return (
    <>
    <ScrollToTop />
    <Routes>
      {/* ─── Public ─── */}
      <Route path="/" element={<Home />} />

      {/*
        Single dynamic route handles ALL services:
          /get-quotes           → service selection
          /get-quotes/roof      → roofing wizard
          /get-quotes/solar     → solar wizard
          /get-quotes/complete  → completion screen
          ...etc.

        To add a new service, just add it to service-flows.jsx.
        No route changes needed here.
      */}
      <Route path="/get-quotes" element={<QuoteWizard />} />
      <Route path="/get-quotes/:service" element={<QuoteWizard />} />
      <Route path="/marketing-partners" element={<MarketingPartners />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />

      {/* ─── Dashboard ─── */}
      <Route path="/dash" element={<Dash />} />
      <Route path="/dash/login" element={<Login />} />
      <Route path="/dash/form_leads" element={<Page />} />
      <Route path="/dash/form_leads_full" element={<LeadFull />} />
      <Route path="/dash/forms/pre_sales" element={<FormStpes />} />
      <Route path="/dash/forms/form_steps" element={<PreSales />} />
      <Route path="/dash/bucket_affiliate_statistics" element={<Statistics />} />
      <Route path="/dash/bucket_affiliate_settings" element={<Settings />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}

export default App;
