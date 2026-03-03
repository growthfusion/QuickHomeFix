import React from "react";
import { useNavigate } from "react-router-dom";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Shield, Clock, UserCheck, Star } from "lucide-react";

import imgRoofing from "@/assets/images/roofing_services.webp";
import imgSolar from "@/assets/images/Solar.webp";
import imgWindow from "@/assets/images/window_services.webp";
import imgGutter from "@/assets/images/gutter_services.webp";
import imgBath from "@/assets/images/walkin_tub_services.png";
import imgShower from "@/assets/images/walkin_shower_services.png";

export default function CompleteStep() {
  const { formData, resetAll } = useFormStore();
  const navigate = useNavigate();

  const getServiceMessage = () => {
    const serviceMap = {
      windows: { label: "window", specialist: "window" },
      solar: { label: "solar energy", specialist: "solar" },
      bath: { label: "bath remodeling", specialist: "remodeling" },
      gutter: { label: "gutter service", specialist: "gutter" },
      "walk-in": { label: "walk-in tub/shower", specialist: "bathroom" },
      shower: { label: "walk-in shower", specialist: "bathroom" },
    };
    const s = serviceMap[formData.service] || { label: "roofing", specialist: "roofing" };
    return {
      title: "Thank You!",
      subtitle: "Your request has been submitted successfully.",
      message: `A ${s.specialist} specialist will review your ${s.label} project and contact you within 24 hours with a free, no-obligation quote.`,
    };
  };

  const getServiceCards = () => {
    const serviceDetails = {
      roofing: { name: "Roofing", image: imgRoofing, description: "Premium roofing solutions for any home", path: "/get-quotes/roof" },
      solar: { name: "Solar Energy", image: imgSolar, description: "Save on energy costs with clean solar power", path: "/get-quotes/solar" },
      windows: { name: "Windows", image: imgWindow, description: "Modern windows that improve comfort", path: "/get-quotes/windows" },
      gutter: { name: "Gutters", image: imgGutter, description: "Quality gutter systems to protect your home", path: "/get-quotes/gutter" },
      bath: { name: "Bath Remodeling", image: imgBath, description: "Modern bathroom renovations for comfort", path: "/get-quotes/bath" },
      shower: { name: "Walk-in Shower", image: imgShower, description: "Modern, accessible shower solutions", path: "/get-quotes/shower" },
    };
    const allKeys = Object.keys(serviceDetails);
    const canonical = allKeys.includes(formData.service) ? formData.service : "roofing";
    return allKeys.filter((k) => k !== canonical).slice(0, 5).map((id) => ({ id, ...serviceDetails[id] }));
  };

  const { title, subtitle, message } = getServiceMessage();
  const serviceCards = getServiceCards();

  const handleGoHome = () => {
    resetAll();
    navigate("/");
  };

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-4 sm:py-12">
      {/* Success Card */}
      <Card className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <CardContent className="p-8 sm:p-10 text-center">
          {/* Animated checkmark */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center animate-success">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
          <p className="text-green-600 font-semibold text-sm mb-4">{subtitle}</p>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">{message}</p>

          {/* What happens next */}
          <div className="bg-gray-50 rounded-xl p-5 mb-6 text-left">
            <h3 className="text-sm font-bold text-gray-800 mb-3 text-center">What Happens Next?</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Review within 24 hours</p>
                  <p className="text-xs text-gray-400">Our team will review your project details</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Matched with top professionals</p>
                  <p className="text-xs text-gray-400">We connect you with vetted local contractors</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Get your free quotes</p>
                  <p className="text-xs text-gray-400">Compare prices and choose the best offer</p>
                </div>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="flex items-center justify-center gap-4 mb-6 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Secure & Encrypted</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> 100% Free</span>
          </div>

          <button
            onClick={handleGoHome}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
          >
            ← Back to Home
          </button>
        </CardContent>
      </Card>

      {/* Other Services */}
      <div className="w-full max-w-2xl">
        <h3 className="text-base font-semibold text-gray-900 text-center mb-5">Explore Other Services</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {serviceCards.map((service) => (
            <div key={service.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => { resetAll(); navigate(service.path); }}>
              <img src={service.image} alt={service.name} className="w-full h-28 sm:h-36 object-cover" loading="lazy" decoding="async" />
              <div className="p-3">
                <h4 className="font-medium text-sm text-gray-800 mb-1">{service.name}</h4>
                <p className="text-gray-400 text-xs leading-relaxed hidden sm:block mb-2">{service.description}</p>
                <button className="bg-orange-400 hover:bg-orange-500 text-white w-full font-medium py-1.5 px-2 rounded-full text-xs transition-colors"
                  onClick={(e) => { e.stopPropagation(); resetAll(); navigate(service.path); }}>Get Quote</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
