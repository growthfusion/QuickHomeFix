import React, { useState, useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { getServiceFlow } from "@/lib/service-flows";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Lock } from "lucide-react";
import StepProgressBar from "@/components/layout/step-progress-bar";
import { submitLead } from "@/lib/api";
import {
  getTrustedFormToken,
  getLeadpostAttribution,
  HOME_PHONE_CONSENT_LANGUAGE,
} from "@/lib/leadpost";

function PhoneStep() {
  const { formData, updateFormData, nextStep, setLeadResponse } = useFormStore();
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);

  const pushPhoneEvent = (rawPhone) => {
    if (typeof window === "undefined") return;
    const digits = (rawPhone || "").replace(/\D/g, "");
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "PhoneNumber", question_text: "Enter Your Phone Number", answer_text: rawPhone, phone_digits: digits, phone_e164: digits ? `+1${digits}` : "" });
  };

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

  const validatePhone = (phone) => {
    const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
    if (!phone) return "Phone number is required";
    if (!phoneRegex.test(phone)) return "Please enter a complete 10-digit phone number";
    return "";
  };

  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhoneNumber(e.target.value);
    updateFormData("phone", formattedPhone);
  };

  useEffect(() => {
    if (formData.phone) setPhoneError(validatePhone(formData.phone));
    else setPhoneError("");
  }, [formData.phone]);

  const isPhoneValid = formData.phone && !phoneError;

  const shouldSubmitLead = () => {
    const flow = getServiceFlow(formData.service);
    return !flow.steps.includes("dfaddress");
  };

  const trySubmitLead = async () => {
    if (!shouldSubmitLead()) return;
    try {
      const attribution = getLeadpostAttribution(formData);
      const result = await submitLead({
        ...formData,
        ...attribution,
        state: (formData.state || "").toUpperCase(),
        trustedFormToken: getTrustedFormToken(),
        homePhoneConsentLanguage: HOME_PHONE_CONSENT_LANGUAGE,
      });
      setLeadResponse(result);
      const pd = result?.partnerDelivery || {};
      console.log("1. Ping Response:", pd.pingResponse || null);
      console.log("2. Ping Payload Sent:", pd.sentPayloads?.pingPayload || pd.pingPayload || null);
      console.log("3. Post Response:", pd.postResponse || null);
      console.log("4. Post Payload Sent:", pd.sentPayloads?.postPayload || pd.postPayload || null);
      console.log("Full API Result:", result);
    }
    catch (err) { console.error("Lead submission error (phone step):", err); }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const error = validatePhone(formData.phone || "");
    setPhoneError(error);
    if (error) return;

    setLoading(true);
    try {
      const cleanedNumber = formData.phone.replace(/\D/g, "");
      const apiBase = import.meta.env.VITE_API_BASE_URL || "";
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`${apiBase}/api/verify-phone?phone=${cleanedNumber}`, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const result = await response.json();

      if (result.valid && result.country_code === "US") {
        pushPhoneEvent(formData.phone);
        await trySubmitLead();
        nextStep();
      } else if (result.valid === false) {
        setPhoneError("Please enter a valid US phone number.");
      } else {
        // API returned ambiguous result — trust client-side validation
        pushPhoneEvent(formData.phone);
        await trySubmitLead();
        nextStep();
      }
    } catch (error) {
      console.warn("Phone API unavailable, using client-side validation:", error.message);
      // Client-side validation already passed — proceed
      pushPhoneEvent(formData.phone);
      await trySubmitLead();
      nextStep();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-4 sm:py-12">
      <Card className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <StepProgressBar />
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Enter Your Phone Number</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <Input id="phone" type="tel" placeholder="(123) 456-7890" value={formData.phone || ""} onChange={handlePhoneChange}
                  className={`w-full pl-10 ${phoneError && formData.phone ? "border-red-300" : ""}`} maxLength={14} required autoFocus />
              </div>
              {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
            </div>

            <div className="flex justify-center">
              <Button type="submit" disabled={!isPhoneValid || loading} className="bg-orange-400 text-white font-semibold px-10 py-3 text-base rounded-full disabled:opacity-50">
                {loading ? <><span className="btn-spinner mr-2" />Verifying...</> : "Next"}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-3 text-gray-400 text-xs">
              <Lock className="h-3 w-3" />
              <span>Your information is secure and confidential</span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default PhoneStep;
