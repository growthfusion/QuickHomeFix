import React, { useState } from "react";
import { useFormStore } from "@/lib/store";
import { getServiceFlow } from "@/lib/service-flows";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Mail, Lock } from "lucide-react";
import { submitLead } from "@/lib/api";
import StepProgressBar from "@/components/layout/step-progress-bar";

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
        try { await submitLead({ ...formData, state: (formData.state || "").toUpperCase() }); }
        catch (err) { console.error("Lead submission error:", err); }
      }
      nextStep();
    } catch (err) { console.error("Final step error:", err); nextStep(); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex justify-center px-4 py-8 sm:py-12">
      <Card className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <StepProgressBar />
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
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

            <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl" value="https://cert.trustedform.com/454a35b802f3e7b63ffabb4efedb7c6ebe67886c" />

            <div className="flex justify-center">
              <Button type="submit"
                className="bg-orange-400 text-white font-semibold px-10 py-3 text-base rounded-full"
                disabled={loading}
              >
                {loading ? <><span className="btn-spinner mr-2" />Submitting...</> : "Check My Prices"}
              </Button>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-3 text-gray-400 text-xs">
              <Lock className="h-3 w-3" />
              <span>Encrypted form, free and competitive quotes</span>
            </div>

            <p className="text-[10px] leading-snug text-gray-400 mt-4">
              By submitting, you authorize Modernize and up to four home improvement
              companies, to make marketing calls and texts to the phone number provided
              to discuss your home improvement project. You understand some may use
              auto-dialers, SMS messages, artificial and prerecorded voice messages to
              contact you. There is no requirement to purchase services. Please see our{" "}
              <a href="#" className="underline">Privacy Notice</a> and{" "}
              <a href="#" className="underline">Terms of Use</a>.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default FinalStep;
