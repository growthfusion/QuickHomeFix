import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import logo1 from "@/assets/images/ChatGPT_Image_Feb_12__2026__12_32_18_PM__1_-removebg-preview.png";
import heroImg from "@/assets/images/Toolbox_team_at_work-removebg-preview.png";

const SERVICES = [
  { value: "roof", label: "Roofing" },
  { value: "solar", label: "Solar Installation" },
  { value: "windows", label: "Window Replacement" },
  { value: "bath", label: "Bathroom Remodeling" },
  { value: "gutter", label: "Gutter Systems" },
  { value: "shower", label: "Walk-In Shower" },
  { value: "tub", label: "Walk-In Tub" },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleGetQuote = () => {
    if (!selectedService) return; // Do nothing if no service selected
    navigate(`/get-quotes/${selectedService}`);
  };

  const handleSelect = (value) => {
    setSelectedService(value);
    setIsOpen(false);
  };

  const selectedLabel = SERVICES.find((s) => s.value === selectedService)?.label || "";

  return (
    <section className="relative bg-gradient-to-br from-blue-800 via-blue-800 to-blue-900 min-h-[100dvh] sm:min-h-0 flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-white/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-blue-400/[0.06] rounded-full blur-3xl" />
      </div>

      {/* Header — inside hero, same background */}
      <div className="relative z-20 w-full">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 flex items-center h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo1} alt="Logo" className="w-20 h-20 object-contain" />
            <span className="text-xl font-extrabold text-white tracking-tight">
              QuickHomeFix<span className="text-orange-400">.</span>
            </span>
          </Link>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-6 flex-1 flex items-center py-8 sm:py-14 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center w-full">

          {/* Left — Text & Form */}
          <div className="text-center lg:text-left">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              Your Home Service
              <span className="block mt-1">
                Starts <span className="text-yellow-300">Here</span>
              </span>
            </h1>

            <p className="mt-5 mb-8 text-blue-100/90 text-lg sm:text-xl max-w-md mx-auto lg:mx-0 leading-relaxed">
              Tell us what you need — we'll connect you with top-rated local pros in minutes.
            </p>

            {/* Selector */}
            <div className="w-full max-w-lg mx-auto lg:mx-0 relative z-30">
              <div className="flex flex-col sm:flex-row items-stretch gap-2.5 bg-white/10 p-2 rounded-xl border border-white/15">
                <div className="relative flex-1 z-30">
                  <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full bg-white rounded-lg px-4 py-3.5 text-left flex items-center justify-between gap-2"
                  >
                    <span className={selectedService ? "text-gray-900 font-medium text-base" : "text-gray-400 text-base"}>
                      {selectedLabel || "Select a service"}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-dropdown">
                        {SERVICES.map((svc) => (
                          <button
                            key={svc.value}
                            type="button"
                            onClick={() => handleSelect(svc.value)}
                            className={`w-full px-5 py-3.5 text-left text-base font-medium border-b border-gray-100 last:border-b-0 ${
                              selectedService === svc.value ? "text-blue-700 font-semibold" : "text-gray-700"
                            }`}
                          >
                            {svc.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={handleGetQuote}
                  disabled={!selectedService}
                  className={`font-bold px-6 py-3.5 rounded-lg whitespace-nowrap text-base transition-colors ${
                    selectedService
                      ? "bg-orange-500 text-white cursor-pointer"
                      : "bg-orange-500/50 text-white/70 cursor-not-allowed"
                  }`}
                >
                  Get Free Quote
                </button>
              </div>
              <p className="mt-3 text-blue-200/60 text-sm">Free, no-obligation estimates. Takes less than 2 minutes.</p>
            </div>
          </div>

          {/* Right — Hero Image */}
          <div className="flex justify-center lg:justify-end">
            <img
              src={heroImg}
              alt="Home repair team at work"
              loading="eager" decoding="async" fetchPriority="high"
              className="w-full max-w-sm sm:max-w-md lg:max-w-lg h-auto object-contain drop-shadow-2xl"
            />
          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
