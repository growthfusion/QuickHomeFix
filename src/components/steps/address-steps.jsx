import React, { useState, useCallback, useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Check } from "lucide-react";
import StepProgressBar from "@/components/layout/step-progress-bar";
import TFConsent from "@/components/TF/TFConsent";
import { submitLead } from "@/lib/api";

const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export function AddressSteps() {
  const { formData, updateFormData, nextStep, resetForm } = useFormStore();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addressValid, setAddressValid] = useState(false);
  const [errors, setErrors] = useState({});
  const [zipTouched, setZipTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState("");

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
    setZipTouched(true);
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
    setZipTouched(true);
    setSubmitting(true);
    setSubmitMsg("");

    let hasErrors = false;
    const newErrors = {};
    if (!formData.address) { hasErrors = true; newErrors.address = "Address is required"; }
    if (!formData.city) { hasErrors = true; newErrors.city = "City is required"; }
    if (!formData.state) { hasErrors = true; newErrors.state = "State is required"; }
    if (!formData.zipcode) { hasErrors = true; newErrors.zipcode = "Zipcode is required"; }
    else if (!validateZipcode(formData.zipcode)) { hasErrors = true; newErrors.zipcode = "Please enter a valid 5-digit zipcode"; }

    setErrors(newErrors);
    if (hasErrors) { setSubmitting(false); return; }

    try {
      const result = await submitLead({ ...formData, state: (formData.state || "").toUpperCase() });
      setSubmitMsg(`Saved! Lead ID: ${result.id}`);
      pushSummaryEvent();
      nextStep();
    } catch (err) {
      console.error(err);
      setSubmitMsg(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-8 sm:py-12">
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

            <TFConsent submitText="Get Free Quote" />

            <div className="mt-2 flex justify-center">
              <Button type="submit" disabled={submitting}
                className="bg-orange-400 text-white font-semibold px-10 py-3 text-base rounded-full" data-tf-element-role="submit">
                {submitting ? "Processing..." : "Get Free Quote"}
              </Button>
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
