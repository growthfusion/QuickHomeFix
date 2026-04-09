import React, { useState, useEffect } from "react";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocateFixed } from "lucide-react";
import StepProgressBar from "@/components/layout/step-progress-bar";
import roofHeroImg from "@/assets/images/ChatGPT_Image_Feb_12__2026__11_09_02_AM-removebg-preview.png";
import windowHeroImg from "@/assets/images/ChatGPT_Image_Feb_12__2026__11_24_36_AM-removebg-preview.png";
import bathHeroImg from "@/assets/images/ChatGPT_Image_Feb_12__2026__11_37_31_AM-removebg-preview.png";
import tubHeroImg from "@/assets/images/ChatGPT_Image_Feb_12__2026__11_52_16_AM-removebg-preview.png";

// Map service → hero image
const serviceHeroImages = {
  roof: roofHeroImg,
  windows: windowHeroImg,
  bath: bathHeroImg,
  tub: tubHeroImg,
};

// Map service → subtitle text
const serviceSubtitles = {
  roof: "Enter your ZIP to find roofing pros near you",
  windows: "Enter your ZIP to find window pros near you",
  bath: "Enter your ZIP to find bath remodeling pros near you",
  tub: "Enter your ZIP to find walk-in tub pros near you",
};

function ZipcodeStep() {
  const { formData, updateFormData, nextStep } = useFormStore();
  const [zip, setZip] = useState(formData.zipcode || "");
  const [error, setError] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  const apiBase = import.meta.env.VITE_API_BASE_URL || "";

  // Auto-detect location on page load
  useEffect(() => {
    if (zip) return; // already has a zip, skip
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`${apiBase}/api/places/geocode?lat=${latitude}&lng=${longitude}`);
          if (!res.ok) throw new Error("Geocode failed");
          const data = await res.json();
          if (data.zipcode) {
            setZip(data.zipcode);
            updateFormData("zipcode", data.zipcode);
          }
          if (data.city) updateFormData("city", data.city);
          if (data.state) updateFormData("state", data.state.toUpperCase());
          if (data.street) updateFormData("address", data.street);
        } catch (err) {
          console.warn("Auto-detect location failed:", err);
        } finally {
          setGeoLoading(false);
        }
      },
      () => { setGeoLoading(false); },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 5);
    setZip(value);
    setError("");
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setGeoLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`${apiBase}/api/places/geocode?lat=${latitude}&lng=${longitude}`);
          if (!res.ok) throw new Error("Geocode failed");
          const data = await res.json();
          if (data.zipcode) {
            setZip(data.zipcode);
            updateFormData("zipcode", data.zipcode);
          }
          if (data.city) updateFormData("city", data.city);
          if (data.state) updateFormData("state", data.state.toUpperCase());
          if (data.street) updateFormData("address", data.street);
        } catch (err) {
          console.error("Reverse geocode error:", err);
          setError("Could not detect your location. Please enter manually.");
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        setGeoLoading(false);
        if (err.code === 1) setError("Location access denied. Please enter your ZIP manually.");
        else setError("Could not detect your location. Please enter manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const lookupZipcode = async (zipcode) => {
    try {
      const autoRes = await fetch(`${apiBase}/api/places/autocomplete?input=${zipcode}`);
      if (!autoRes.ok) throw new Error("Autocomplete failed");
      const autoData = await autoRes.json();
      const firstResult = autoData.predictions?.[0];
      if (!firstResult?.place_id) throw new Error("No results");
      const detailRes = await fetch(`${apiBase}/api/places/details?place_id=${firstResult.place_id}`);
      if (!detailRes.ok) throw new Error("Details failed");
      const detail = await detailRes.json();
      if (detail.city && detail.state) return { city: detail.city, state: detail.state.toUpperCase() };
    } catch (err) {
      console.warn("Google zip lookup failed, trying fallback:", err.message);
    }
    try {
      const baseUrl = import.meta.env.DEV ? "/zipapi" : "https://api.zippopotam.us";
      const res = await fetch(`${baseUrl}/us/${zipcode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.places?.[0]) return { city: data.places[0]["place name"], state: data.places[0]["state abbreviation"] };
      }
    } catch (err) {
      console.warn("Fallback zip lookup also failed:", err.message);
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!zip || zip.length < 5) {
      setError("Please enter a valid 5-digit zip code");
      return;
    }
    updateFormData("zipcode", zip);
    lookupZipcode(zip).then((location) => {
      if (location) {
        updateFormData("city", location.city);
        updateFormData("state", location.state);
      }
    });
    nextStep();
  };

  return (
    <div className="flex justify-center px-4 py-4 sm:py-12">
      <Card className="w-full max-w-sm sm:max-w-md lg:max-w-lg bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <StepProgressBar />
        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleSubmit}>
            {/* Service Hero Image – full width, all devices */}
            {serviceHeroImages[formData.service] && (
              <div className="flex justify-center mb-5">
                <img
                  src={serviceHeroImages[formData.service]}
                  alt={`${formData.service} service`}
                  loading="eager" decoding="async"
                  className="w-full max-h-64 sm:max-h-72 lg:max-h-80 h-auto object-contain"
                />
              </div>
            )}

            <div className="text-center mb-6">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                What is your zip code?
              </h2>
              {serviceSubtitles[formData.service] && (
                <p className="text-sm text-gray-500 mt-1">
                  {serviceSubtitles[formData.service]}
                </p>
              )}
            </div>

            <div className="mb-6 max-w-sm mx-auto">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="Enter ZIP code"
                value={zip}
                onChange={handleChange}
                maxLength={5}
                autoFocus
                className={`w-full text-center text-xl font-semibold tracking-[0.3em] py-4 rounded-xl border transition-colors ${
                  error
                    ? "border-red-400 focus:border-red-400"
                    : zip.length === 5
                    ? "border-green-400 focus:border-green-400"
                    : "border-gray-200 focus:border-blue-400"
                }`}
              />
              {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}

              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geoLoading}
                className="flex items-center justify-center gap-2 w-full mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
              >
                <LocateFixed className="h-4 w-4" />
                {geoLoading ? "Detecting location..." : "Use My Location"}
              </button>
            </div>

            <div className="flex justify-center">
              <Button
                type="submit"
                className="bg-orange-400 text-white font-semibold px-10 py-3 text-base rounded-full"
                disabled={zip.length < 5}
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

export default ZipcodeStep;
