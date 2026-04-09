import React, { useState, useCallback, useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Check, LocateFixed } from "lucide-react";
import StepProgressBar from "@/components/layout/step-progress-bar";

const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

function DetailsStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [geoLoading, setGeoLoading] = useState(false);

  // Default isOwner to "Yes"
  useEffect(() => {
    if (formData.isOwner === undefined || formData.isOwner === null) {
      updateFormData("isOwner", true);
    }
  }, []);

  const validateZipcode = (zip) => /^\d{5,6}$/.test(zip);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({ ...prev, address: "Geolocation is not supported by your browser" }));
      return;
    }
    setGeoLoading(true);
    setErrors({});
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`${apiBase}/api/places/geocode?lat=${latitude}&lng=${longitude}`);
          if (!res.ok) throw new Error("Geocode failed");
          const data = await res.json();
          if (data.street) updateFormData("address", data.street);
          if (data.city) updateFormData("city", data.city);
          if (data.state) updateFormData("state", data.state.toUpperCase());
          if (data.zipcode) updateFormData("zipcode", data.zipcode);
        } catch (err) {
          console.error("Reverse geocode error:", err);
          setErrors((prev) => ({ ...prev, address: "Could not detect your location" }));
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setGeoLoading(false);
        if (err.code === 1) setErrors((prev) => ({ ...prev, address: "Location access denied" }));
        else setErrors((prev) => ({ ...prev, address: "Could not detect your location" }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const isFormValid =
    formData.firstName && formData.lastName && formData.address && formData.city && formData.state && formData.zipcode && validateZipcode(formData.zipcode);

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

  const handleAddressChange = (e) => {
    const value = e.target.value;
    updateFormData("address", value);
    debouncedFetch(value);
    if (errors.address) setErrors((prev) => ({ ...prev, address: null }));
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

  const handleZipcodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 6);
    updateFormData("zipcode", value);
    if (errors.zipcode) setErrors((prev) => ({ ...prev, zipcode: null }));
  };

  const pushFormEvent = (question, answer) => {
    if (typeof window === "undefined") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "FormEvent", question_text: question, answer_text: answer });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.address) newErrors.address = "Street address is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.zipcode) newErrors.zipcode = "Zipcode is required";
    else if (!validateZipcode(formData.zipcode)) newErrors.zipcode = "Enter a valid zipcode";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    pushFormEvent("First Name", formData.firstName);
    pushFormEvent("Last Name", formData.lastName);
    pushFormEvent("Property Address", formData.address);
    nextStep();
  };

  return (
    <div className="flex justify-center px-4 py-4 sm:py-12">
      <Card className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <StepProgressBar />
        <CardContent className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Almost Done!</h2>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="firstName" placeholder="First name" value={formData.firstName || ""}
                  onChange={(e) => { updateFormData("firstName", e.target.value); if (errors.firstName) setErrors((prev) => ({ ...prev, firstName: null })); }}
                  className={`w-full ${errors.firstName ? "border-red-300" : ""}`} required autoFocus
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="lastName" placeholder="Last name" value={formData.lastName || ""}
                  onChange={(e) => { updateFormData("lastName", e.target.value); if (errors.lastName) setErrors((prev) => ({ ...prev, lastName: null })); }}
                  className={`w-full ${errors.lastName ? "border-red-300" : ""}`} required
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div className="mb-3 relative">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Property Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-4 w-4 text-gray-400" />
                </div>
                <Input
                  id="address" placeholder="Street address" value={formData.address || ""}
                  onChange={handleAddressChange}
                  onBlur={() => setTimeout(() => setSuggestions([]), 200)}
                  className={`w-full pl-10 ${errors.address ? "border-red-300" : ""}`} required autoComplete="off"
                />
                {formData.address && formData.city && formData.state && formData.zipcode && !errors.address && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center"><Check className="h-4 w-4 text-green-500" /></div>
                )}
              </div>
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geoLoading}
                className="flex items-center gap-1.5 mt-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              >
                <LocateFixed className="h-3.5 w-3.5" />
                {geoLoading ? "Detecting location..." : "Use My Location"}
              </button>
              {loading && <p className="text-sm text-gray-400 mt-1">Loading...</p>}
              {suggestions.length > 0 && !loading && (
                <div className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-md mt-1 max-h-60 overflow-auto">
                  {suggestions.map((s, idx) => (
                    <button
                      type="button"
                      key={idx}
                      className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                      onMouseDown={(e) => { e.preventDefault(); applySuggestion(s); }}
                    >
                      {s.description}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
                <Input id="city" placeholder="City" value={formData.city || ""}
                  onChange={(e) => { updateFormData("city", e.target.value); if (errors.city) setErrors((prev) => ({ ...prev, city: null })); }}
                  className={`w-full ${errors.city ? "border-red-300" : ""}`} required
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">State <span className="text-red-500">*</span></label>
                <Input id="state" placeholder="State" value={formData.state || ""}
                  onChange={(e) => { updateFormData("state", e.target.value); if (errors.state) setErrors((prev) => ({ ...prev, state: null })); }}
                  className={`w-full ${errors.state ? "border-red-300" : ""}`} required
                />
                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="detailZip" className="block text-sm font-medium text-gray-700 mb-1">Zipcode <span className="text-red-500">*</span></label>
              <Input id="detailZip" placeholder="5-digit zipcode" value={formData.zipcode || ""}
                onChange={handleZipcodeChange} className={`w-full ${errors.zipcode ? "border-red-300" : ""}`} required maxLength={6}
              />
              {errors.zipcode && <p className="text-red-500 text-xs mt-1">{errors.zipcode}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Do you own this home?</label>
              <div className="flex gap-4">
                <button type="button" onClick={() => updateFormData("isOwner", true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${formData.isOwner === true ? "border-blue-600 bg-blue-50 text-blue-600" : "border-gray-200 bg-white text-gray-700"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.isOwner === true ? "border-blue-600" : "border-gray-300"}`}>
                    {formData.isOwner === true && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  Yes
                </button>
                <button type="button" onClick={() => updateFormData("isOwner", false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${formData.isOwner === false ? "border-blue-600 bg-blue-50 text-blue-600" : "border-gray-200 bg-white text-gray-700"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${formData.isOwner === false ? "border-blue-600" : "border-gray-300"}`}>
                    {formData.isOwner === false && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                  </div>
                  No
                </button>
              </div>
            </div>

            <div className="flex justify-center">
              <Button type="submit" disabled={!isFormValid}
                className="bg-orange-400 text-white font-semibold px-10 py-3 text-base rounded-full disabled:opacity-50"
                data-tf-element-role="submit"
              >
                Next
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default DetailsStep;
