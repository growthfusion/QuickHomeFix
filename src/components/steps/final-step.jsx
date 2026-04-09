import React, { useState } from "react";
import { useFormStore } from "@/lib/store";
import { getServiceFlow } from "@/lib/service-flows";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Mail, Lock } from "lucide-react";
import { submitLead } from "@/lib/api";
import StepProgressBar from "@/components/layout/step-progress-bar";
import {
  getTrustedFormToken,
  getLeadpostAttribution,
  HOME_PHONE_CONSENT_LANGUAGE,
  LEADPOST_PARTNERS_URL,
} from "@/lib/leadpost";

function FinalStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [phoneError, setPhoneError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (phoneNumberString) => {
    const cleaned = ("" + phoneNumberString).replace(/\D/g, "");
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      let formatted = "";
      if (match[1]) { formatted = `(${match[1]}`; if (match[1].length === 3) formatted += ") "; }
      if (match[2]) { formatted += match[2]; if (match[2].length === 3) formatted += "-"; }
      if (match[3]) formatted += match[3];
      return formatted;
    }
    return phoneNumberString;
  };

  const handlePhoneChange = (e) => {
    updateFormData("phone", formatPhoneNumber(e.target.value));
    if (phoneError) setPhoneError("");
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleEmailChange = (e) => {
    updateFormData("email", e.target.value);
    if (emailError) setEmailError("");
  };

  const pushPhoneEvent = (rawPhone) => {
    if (typeof window === "undefined") return;
    const digits = (rawPhone || "").replace(/\D/g, "");
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "PhoneNumber", question_text: "Enter Your Phone Number", answer_text: rawPhone, phone_digits: digits, phone_e164: digits ? `+1${digits}` : "" });
  };

  const pushEmailEvent = (email) => {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "email", question_text: "Please Enter Your Email", answer_text: email, email_domain: (email.split("@")[1] || "").toLowerCase() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = (formData.email || "").trim();
    const phone = formData.phone || "";

    let hasError = false;
    if (!phone) { setPhoneError("Phone number is required"); hasError = true; }
    else { const digits = phone.replace(/\D/g, ""); if (digits.length < 10) { setPhoneError("Please enter a complete 10-digit phone number"); hasError = true; } }
    if (!email) { setEmailError("Email address is required"); hasError = true; }
    else if (!isValidEmail(email)) { setEmailError("Please enter a valid email address"); hasError = true; }
    if (hasError) return;

    setLoading(true);
    try {
      pushPhoneEvent(phone);
      pushEmailEvent(email);
      const flow = getServiceFlow(formData.service);
      if (!flow.steps.includes("dfaddress")) {
        try {
          const tfToken = getTrustedFormToken();
          const attribution = getLeadpostAttribution(formData);
          console.log("TrustedForm Token:", tfToken || "(empty - not loaded)");
          const clientPayload = {
            ...formData,
            ...attribution,
            state: (formData.state || "").toUpperCase(),
            trustedFormToken: tfToken,
            homePhoneConsentLanguage: HOME_PHONE_CONSENT_LANGUAGE,
          };
          const result = await submitLead(clientPayload);

          const pd = result?.partnerDelivery || {};
          const pingReq = pd.sentPayloads?.pingPayload || pd.pingPayload || null;
          const pingRes = pd.pingResponse || null;
          const postReq = pd.sentPayloads?.postPayload || pd.postPayload || pd.partnerRequest || null;
          const postRes = pd.postResponse || pd.partnerResponse || null;

          console.log("%c===== LeadPost PING =====", "color: #00bcd4; font-weight: bold");
          console.log("%cPing Request:", "color: #ff9800; font-weight: bold");
          console.log(JSON.stringify(pingReq, null, 2));
          console.log("%cPing Response:", "color: #4caf50; font-weight: bold");
          console.log(JSON.stringify(pingRes, null, 2));

          console.log("%c===== LeadPost POST =====", "color: #00bcd4; font-weight: bold");
          console.log("%cPost Request:", "color: #ff9800; font-weight: bold");
          console.log(JSON.stringify(postReq, null, 2));
          console.log("%cPost Response:", "color: #4caf50; font-weight: bold");
          console.log(JSON.stringify(postRes, null, 2));

          console.log("%c===== Full API Result =====", "color: #9c27b0; font-weight: bold");
          console.log(result);
        }
        catch (err) { console.error("Lead submission error:", err); }
      }
      nextStep();
    } catch (err) {
      console.error("Final step error:", err);
      nextStep();
    }
    finally { setLoading(false); }
  };

  return (
    <div className="flex justify-center px-4 py-4 sm:py-12">
      <Card className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <StepProgressBar />
        <CardContent className="p-4 sm:p-8">
          <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">The Last Step!</h2>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <Input id="phone" type="tel" placeholder="(123) 456-7890" value={formData.phone || ""} onChange={handlePhoneChange}
                  className={`w-full pl-10 ${phoneError ? "border-red-300" : ""}`} maxLength={14} autoFocus
                />
              </div>
              {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <Input id="email" type="email" placeholder="yourname@example.com" value={formData.email || ""} onChange={handleEmailChange}
                  className={`w-full pl-10 ${emailError ? "border-red-300" : ""}`}
                />
              </div>
              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>

            <div className="flex justify-center">
              <Button type="submit"
                className="bg-orange-400 text-white font-semibold px-10 py-3 text-base rounded-full"
                disabled={loading}
              >
                {loading ? <><span className="btn-spinner mr-2" />Submitting...</> : "Submit"}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-3 text-gray-400 text-xs">
              <Lock className="h-3 w-3" />
              <span>Encrypted form, free and competitive quotes</span>
            </div>

            <p className="text-[10px] leading-snug text-gray-400 mt-4">
              By submitting, you authorize QuickHomeFix and up to{" "}
              <a href={LEADPOST_PARTNERS_URL} target="_blank" rel="noopener noreferrer" className="underline">
                four home improvement companies
              </a>, to make marketing calls and texts to the phone number provided
              to discuss your home improvement project. You understand some may use
              auto-dialers, SMS messages, artificial and prerecorded voice messages to
              contact you. There is no requirement to purchase services. Please see our{" "}
              <a href="/privacy-policy" className="underline">Privacy Notice</a> and{" "}
              <a href="/terms-of-service" className="underline">Terms of Use</a>.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default FinalStep;
