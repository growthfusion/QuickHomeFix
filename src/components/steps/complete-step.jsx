import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Phone } from "lucide-react";

import imgRoofing from "@/assets/images/roofing_services.webp";
import imgSolar from "@/assets/images/Solar.webp";
import imgWindow from "@/assets/images/window_services.webp";
import imgGutter from "@/assets/images/gutter_services.webp";
import imgBath from "@/assets/images/walkin_tub_services.png";
import imgShower from "@/assets/images/walkin_shower_services.png";

export default function CompleteStep() {
  const { formData } = useFormStore();
  const navigate = useNavigate();
  const [showCall, setShowCall] = useState(false);

  const getServiceMessage = () => {
    switch (formData.service) {
      case "windows": return { title: "Thank You For Your Windows Request!", message: "Your windows service estimate request has been submitted. A window specialist will contact you within 24 hours." };
      case "solar": return { title: "Thank You For Your Solar Request!", message: "Your solar energy estimate request has been submitted. A solar specialist will contact you within 24 hours." };
      case "bath": return { title: "Thank You For Your Bath Remodeling Request!", message: "Your bath remodeling estimate has been submitted. A remodeling specialist will contact you within 24 hours." };
      case "gutter": return { title: "Thank You For Your Gutter Service Request!", message: "Your gutter service estimate has been submitted. A gutter specialist will contact you within 24 hours." };
      case "walk-in": return { title: "Thank You For Your Walk-in Request!", message: "Your walk-in tub/shower estimate has been submitted. A bathroom specialist will contact you within 24 hours." };
      default: return { title: "Thank You For Your Request!", message: "Your roofing service estimate has been submitted. A roofing specialist will contact you within 24 hours." };
    }
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

  const { title, message } = getServiceMessage();
  const serviceCards = getServiceCards();

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-8 sm:py-12">
      {/* Success Card */}
      <Card className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-8">
        <CardContent className="p-6 sm:p-8 text-center">
          {!showCall ? (
            <>
              <div className="mb-5 animate-success">
                <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
              <p className="text-gray-500 text-sm mb-6 leading-relaxed">{message}</p>
              <button
                onClick={() => setShowCall(true)}
                className="bg-green-600 text-white px-6 py-2.5 rounded-full font-medium text-sm inline-flex items-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Get Local Contractor Number
              </button>
            </>
          ) : (
            <>
              <div className="mb-4">
                <Phone className="w-12 h-12 mx-auto text-blue-600" />
              </div>
              <p className="text-gray-600 text-sm font-medium mb-2">Call Now</p>
              <a href="tel:5551234567" className="text-blue-600 text-2xl font-bold mb-1 block">(555) 123-4567</a>
              <p className="text-gray-400 text-xs mb-5">Available Mon-Fri, 9AM - 6PM</p>
              <button onClick={() => (window.location.href = "tel:5551234567")}
                className="bg-orange-400 text-white px-6 py-2.5 rounded-full font-medium text-sm w-full max-w-xs mx-auto block mb-3">Call Now</button>
              <button onClick={() => setShowCall(false)} className="text-blue-600 font-medium text-sm">Back to confirmation</button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Other Services */}
      <div className="w-full max-w-2xl">
        <h3 className="text-base font-semibold text-gray-900 text-center mb-5">Explore Other Services</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {serviceCards.map((service) => (
            <div key={service.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer"
              onClick={() => navigate(service.path)}>
              <img src={service.image} alt={service.name} className="w-full h-28 sm:h-36 object-cover" loading="lazy" decoding="async" />
              <div className="p-3">
                <h4 className="font-medium text-sm text-gray-800 mb-1">{service.name}</h4>
                <p className="text-gray-400 text-xs leading-relaxed hidden sm:block mb-2">{service.description}</p>
                <button className="bg-orange-400 text-white w-full font-medium py-1.5 px-2 rounded-full text-xs"
                  onClick={(e) => { e.stopPropagation(); navigate(service.path); }}>Get Quote</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
