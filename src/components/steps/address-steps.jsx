import React, { useState, useCallback, useEffect, useRef } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Check } from "lucide-react";
import StepProgressBar from "@/components/layout/step-progress-bar";
import { submitLead } from "@/lib/api";
import {
  getTrustedFormToken,
  HOME_PHONE_CONSENT_LANGUAGE,
  LEADPOST_PARTNERS_URL,
} from "@/lib/leadpost";

const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export function AddressSteps() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addressValid, setAddressValid] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");
  const [captchaToken, setCaptchaToken] = useState(null);
  const [captchaError, setCaptchaError] = useState("");
  const recaptchaRef = useRef(null);

  const pushSummaryEvent = () => {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "AddressDetailsSummary",
      address: formData.address || "",
      city: formData.city || "",
      state: (formData.state || "").toUpperCase(),
      zipcode: formData.zipcode || "",
      isOwner: formData.isOwner === true ? "Yes" : formData.isOwner === false ? "No" : "",
      canMakeChanges: formData.canMakeChanges === true ? "Yes" : formData.canMakeChanges === false ? "No" : "",
    });
  };

  const validateZipcode = (zip) => /^\d+$/.test(zip);

  useEffect(() => {
    const valid = formData.address && formData.city && formData.state && formData.zipcode && validateZipcode(formData.zipcode);
    setAddressValid(valid);
  }, [formData.address, formData.city, formData.state, formData.zipcode]);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "";

  const fetchSuggestions = async (input) => {
    if (!input) return setSuggestions([]);
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/places/autocomplete?input=${encodeURIComponent(input)}`);
      if (!res.ok) throw new Error(`Places API error: ${res.status}`);
      const data = await res.json();
      setSuggestions(data.predictions || []);
    } catch (err) { console.error("Google suggestion error:", err); setSuggestions([]); }
    finally { setLoading(false); }
  };

  const debouncedFetch = useCallback(debounce(fetchSuggestions, 400), []);

  const handleChange = (e) => {
    const value = e.target.value;
    updateFormData("address", value);
    debouncedFetch(value);
  };

  const handleZipcodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 5);
    updateFormData("zipcode", value);
    if (errors.zipcode) setErrors({ ...errors, zipcode: null });
  };

  const applySuggestion = async (s) => {
    setLoading(true);
    updateFormData("address", s.description);
    setSuggestions([]);
    if (!s.place_id) { setLoading(false); return; }
    try {
      const res = await fetch(`${apiBase}/api/places/details?place_id=${s.place_id}`);
      if (!res.ok) throw new Error(`Places details error: ${res.status}`);
      const data = await res.json();
      if (data.street) updateFormData("address", data.street);
      if (data.city) updateFormData("city", data.city);
      if (data.state) updateFormData("state", data.state.toUpperCase());
      if (data.zipcode) updateFormData("zipcode", data.zipcode);
    } catch (err) { console.error("Details fetch error:", err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCaptchaError("");
    setSubmitting(true);
    setSubmitMsg("");

    let hasErrors = false;
    const newErrors = {};
    if (!formData.address) { hasErrors = true; newErrors.address = "Address is required"; }
    if (!formData.city) { hasErrors = true; newErrors.city = "City is required"; }
    if (!formData.state) { hasErrors = true; newErrors.state = "State is required"; }
    if (!formData.zipcode) { hasErrors = true; newErrors.zipcode = "Zipcode is required"; }
    else if (!validateZipcode(formData.zipcode)) { hasErrors = true; newErrors.zipcode = "Please enter a valid 5-digit zipcode"; }

    if (!captchaToken) {
      setCaptchaError("Please verify you are not a robot");
      hasErrors = true;
    }

    setErrors(newErrors);
    if (hasErrors) { setSubmitting(false); return; }

    try {
      const result = await submitLead({
        ...formData,
        state: (formData.state || "").toUpperCase(),
        captchaToken,
        trustedFormToken: getTrustedFormToken(),
        homePhoneConsentLanguage: HOME_PHONE_CONSENT_LANGUAGE,
      });
      console.log("[LeadPost] Address step response:", JSON.stringify(result, null, 2));
      setSubmitMsg(`Saved! Lead ID: ${result.id}`);
      pushSummaryEvent();
      nextStep();
    } catch (err) {
      console.error(err);
      setSubmitMsg(`Error: ${err.message}`);
      // Reset captcha on error
      if (recaptchaRef.current) recaptchaRef.current.reset();
      setCaptchaToken(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-4 sm:py-12">
      <Card className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <StepProgressBar />
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Enter Property Address</h2>
          </div>

          <form data-tf-element-role="offer" onSubmit={handleSubmit} noValidate>
            <div className="mb-3 relative">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Property Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <Input id="address" placeholder="Street address" value={formData.address || ""} onChange={handleChange}
                  className={`w-full pl-10 pr-10 ${errors.address ? "border-red-300" : ""}`} required autoFocus autoComplete="off" />
                {addressValid && !errors.address && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><Check className="h-4 w-4 text-green-500" /></div>
                )}
              </div>
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              {loading && <p className="text-sm text-gray-400 mt-1">Loading...</p>}
              {suggestions.length > 0 && !loading && (
                <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-md mt-1 max-h-60 overflow-auto">
                  {suggestions.map((s, idx) => (
                    <button type="button" key={idx} className="block w-full text-left px-3 py-2 text-sm" onClick={() => applySuggestion(s)}>{s.description}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                <Input id="city" placeholder="City" value={formData.city || ""} onChange={(e) => updateFormData("city", e.target.value)}
                  className={`w-full ${errors.city ? "border-red-300" : ""}`} required />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                <Input id="state" placeholder="State" value={formData.state || ""} onChange={(e) => updateFormData("state", e.target.value)}
                  className={`w-full ${errors.state ? "border-red-300" : ""}`} required />
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-1">Zipcode <span className="text-red-500">*</span></label>
              <Input id="zipcode" placeholder="5-digit zipcode" value={formData.zipcode || ""} onChange={handleZipcodeChange}
                className={`w-full ${errors.zipcode ? "border-red-300" : ""}`} required maxLength={5} />
              {errors.zipcode && <p className="text-red-500 text-xs mt-1">{errors.zipcode}</p>}
            </div>

            {/* Owner questions */}
            <div className="space-y-3 mb-5">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Are you the owner of the house? <span className="text-red-500">*</span></p>
                <div className="flex gap-2">
                  <Button onClick={() => updateFormData("isOwner", true)} type="button"
                    className={`flex-1 ${formData.isOwner === true ? "bg-blue-600 text-white" : "bg-white text-gray-700 border-gray-200"}`}
                    variant={formData.isOwner === true ? "default" : "outline"}>Yes</Button>
                  <Button onClick={() => updateFormData("isOwner", false)} type="button"
                    className={`flex-1 ${formData.isOwner === false ? "bg-blue-600 text-white" : "bg-white text-gray-700 border-gray-200"}`}
                    variant={formData.isOwner === false ? "default" : "outline"}>No</Button>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Are you entitled to make changes? <span className="text-red-500">*</span></p>
                <div className="flex gap-2">
                  <Button onClick={() => updateFormData("canMakeChanges", true)} type="button"
                    className={`flex-1 ${formData.canMakeChanges === true ? "bg-blue-600 text-white" : "bg-white text-gray-700 border-gray-200"}`}
                    variant={formData.canMakeChanges === true ? "default" : "outline"}>Yes</Button>
                  <Button onClick={() => updateFormData("canMakeChanges", false)} type="button"
                    className={`flex-1 ${formData.canMakeChanges === false ? "bg-blue-600 text-white" : "bg-white text-gray-700 border-gray-200"}`}
                    variant={formData.canMakeChanges === false ? "default" : "outline"}>No</Button>
                </div>
              </div>
            </div>

            <input type="hidden" name="xxTrustedFormCertUrl" id="xxTrustedFormCertUrl" value="https://cert.trustedform.com/454a35b802f3e7b63ffabb4efedb7c6ebe67886c" />

            {/* Google reCAPTCHA v2 */}
            <div className="mb-4 flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => { setCaptchaToken(token); setCaptchaError(""); }}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>
            {captchaError && <p className="text-red-500 text-xs text-center mb-3">{captchaError}</p>}

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button type="submit" disabled={submitting}
                className="w-full bg-purple-800 hover:bg-purple-900 text-white font-extrabold tracking-wider px-10 py-4 text-lg rounded-md uppercase" data-tf-element-role="submit">
                {submitting ? "Processing..." : "Compare Prices"}
              </Button>
            </div>

            {/* Consent Text */}
            <div className="mt-4 text-center">
              <p className="text-sm font-bold italic text-gray-800 mb-2">Encrypted form, free and competitive quotes</p>
              <p className="text-[11px] text-gray-500 leading-relaxed" data-tf-element-role="consent-language">
                By submitting, you authorize QuickHomeFix and up to{" "}
                <a href={LEADPOST_PARTNERS_URL} target="_blank" rel="noopener noreferrer" className="underline text-gray-600 hover:text-gray-800">four home improvement companies</a>, to make marketing calls and texts to the phone number provided to discuss your home improvement project. You understand some may use auto-dialers, SMS messages, artificial and prerecorded voice messages to contact you. There is no requirement to purchase services. Please see our{" "}
                <a href="/privacy-policy" className="underline text-gray-600 hover:text-gray-800">Privacy Notice</a> and{" "}
                <a href="/terms-of-service" className="underline text-gray-600 hover:text-gray-800">Terms of Use</a>.
              </p>
            </div>

            {submitMsg && (
              <p className={`text-sm mt-2 text-center ${submitMsg.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>{submitMsg}</p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
