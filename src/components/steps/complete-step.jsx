import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ThumbsUp } from "lucide-react";

function CompleteStep() {
  const { formData } = useFormStore();
  const navigate = useNavigate(); // ✅ Initialize navigation
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showUpsells, setShowUpsells] = useState(false);

  useEffect(() => {
    const animationTimer = setTimeout(() => {
      setAnimationComplete(true);
    }, 400);

    const upsellTimer = setTimeout(() => {
      setShowUpsells(true);
    }, 1500);

    return () => {
      clearTimeout(animationTimer);
      clearTimeout(upsellTimer);
    };
  }, []);

  const getServiceMessage = () => {
    switch (formData.service) {
      case "windows":
        return {
          title: "Thank You For Your Windows Request!",
          message:
            "Your windows service estimate request has been submitted successfully. One of our window specialists will contact you within 24 hours to discuss your project and provide a free estimate.",
        };
      case "solar":
        return {
          title: "Thank You For Your Solar Request!",
          message:
            "Your solar energy estimate request has been submitted successfully. One of our solar specialists will contact you within 24 hours to discuss your project and provide a free estimate.",
        };
      case "bath":
        return {
          title: "Thank You For Your Bath Remodeling Request!",
          message:
            "Your bath remodeling estimate request has been submitted successfully. One of our remodeling specialists will contact you within 24 hours to discuss your project and provide a free estimate.",
        };
      case "gutter":
        return {
          title: "Thank You For Your Gutter Service Request!",
          message:
            "Your gutter service estimate request has been submitted successfully. One of our gutter specialists will contact you within 24 hours to discuss your project and provide a free estimate.",
        };
      case "walk-in":
        return {
          title: "Thank You For Your Walk-in-Tub/Shower Request!",
          message:
            "Your walk-in-tub/shower estimate request has been submitted successfully. One of our bathroom specialists will contact you within 24 hours to discuss your project and provide a free estimate.",
        };
      default:
        return {
          title: "Thank You For Your Request!",
          message:
            "Your roofing service estimate request has been submitted successfully. One of our roofing specialists will contact you within 24 hours to discuss your project and provide a free estimate.",
        };
    }
  };

  const getServiceCards = () => {
    const serviceDetails = {
      roofing: {
        name: "Roofing",
        image: "/roofing_services.jpg",
        description: "Premium roofing solutions for any home",
        benefit: "50-year warranty available",
        path: "/roofing-type",
      },
      solar: {
        name: "Solar Energy",
        image: "/Solar.jpg",
        description: "Save on energy costs with clean solar power",
        benefit: "Up to 30% energy savings",
        path: "/solar-type",
      },
      windows: {
        name: "Windows",
        image: "/window_services.jpg",
        description: "Energy-efficient windows for comfort and savings",
        benefit: "Reduces energy costs by 15%",
        path: "/window-type",
      },
      gutter: {
        name: "Gutters",
        image: "/gutter_services.jpg",
        description: "Quality gutter systems to protect your home",
        benefit: "Prevents foundation damage",
        path: "/gutter-type",
      },
      bath: {
        name: "Bath Remodeling",
        image: "/walkin_tub_services.png",
        description: "Modern bathroom renovations for enhanced comfort",
        benefit: "Increases home value",
        path: "/bathroom-wall",
      },
      shower: {
        name: "Walk-in Shower",
        image: "/walkin_shower_services.png",
        description: "Modern, accessible shower solutions",
        benefit: "Quick 1-day installation",
        path: "/walkin-type",
      },
      tub: {
        name: "Walk-in Tub",
        image: "/walkin_tub_services.png",
        description: "Safe, comfortable bathing experience",
        benefit: "Enhanced safety features",
        path: "/walkin-type",
      },
    };

    const currentService = formData.service;
    let servicesToShow = [];

    if (!currentService || !serviceDetails[currentService]) {
      servicesToShow = ["windows", "solar", "gutter", "bath", "roofing"];
    } else {
      const serviceSets = {
        roofing: ["solar", "windows", "gutter", "bath", "shower"],
        solar: ["roofing", "windows", "gutter", "bath", "shower"],
        windows: ["roofing", "solar", "gutter", "bath", "shower"],
        gutter: ["roofing", "solar", "windows", "bath", "shower"],
        bath: ["roofing", "solar", "windows", "gutter", "shower"],
        shower: ["roofing", "solar", "windows", "gutter", "bath"],
        tub: ["roofing", "solar", "windows", "gutter", "bath"],
        "walk-in": ["roofing", "solar", "windows", "gutter", "bath"],
      };
      servicesToShow = serviceSets[currentService] || ["windows", "solar", "gutter", "bath", "roofing"];
    }

    return servicesToShow
      .map((id) => (serviceDetails[id] ? { id, ...serviceDetails[id] } : null))
      .filter(Boolean);
  };

  const { title, message } = getServiceMessage();
  const serviceCards = getServiceCards();

  const navigateTo = (path) => {
    navigate(path); // ✅ use react-router-dom navigation
  };

  return (
    <div className="mx-auto max-w-5xl px-4">
      <Card className="shadow-lg border border-green-100 mb-12 overflow-hidden">
        <CardContent className="p-10 text-center relative overflow-hidden">
          <div
            className={`absolute inset-0 bg-gradient-to-r from-green-50 via-green-100 to-green-50 opacity-0 transition-opacity duration-1500 ${
              animationComplete ? "opacity-100" : ""
            }`}
          />

          <div className="relative z-10 mb-6">
            <div className="success-circle">
              <svg className="w-24 h-24 mx-auto" viewBox="0 0 100 100">
                <circle
                  className="success-circle-bg"
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="#E0F2E9"
                  strokeWidth="8"
                />
                <circle
                  className="success-circle-progress"
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="#22C55E"
                  strokeWidth="8"
                  strokeDasharray="289.02652413026095"
                  strokeDashoffset={animationComplete ? "0" : "289.02652413026095"}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
              </svg>
              <CheckCircle
                className={`w-16 h-16 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-green-500 transition-all duration-500 ${
                  animationComplete ? "opacity-100 scale-100" : "opacity-0 scale-50"
                }`}
              />
            </div>
          </div>

          <div
            className="transition-all duration-700 delay-500 transform"
            style={{
              opacity: animationComplete ? 1 : 0,
              transform: animationComplete ? "translateY(0)" : "translateY(8px)",
            }}
          >
            <h2 className="text-2xl font-bold mb-3 text-gray-900">{title}</h2>
            <p className="text-gray-600 mb-0 leading-relaxed">{message}</p>
          </div>
        </CardContent>

        <div className="h-1.5 w-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-500"
            style={{
              width: animationComplete ? "100%" : "0%",
              transition: "width 1s ease-out",
            }}
          ></div>
        </div>
      </Card>

      <div
        className="transition-all duration-1000 ease-out"
        style={{
          opacity: showUpsells ? 1 : 0,
          transform: showUpsells ? "translateY(0)" : "translateY(16px)",
        }}
      >
        <div className="flex items-center justify-center mb-8">
          <div className="h-px bg-gray-200 flex-grow max-w-xs"></div>
          <h3 className="text-2xl font-bold px-6 text-center text-gray-800">Enhance Your Home</h3>
          <div className="h-px bg-gray-200 flex-grow max-w-xs"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5 mb-12">
          {serviceCards.map((service, index) => (
            <div
              className="group bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md hover:shadow-xl hover:border-green-200 transition-all duration-300 h-full flex flex-col cursor-pointer transform hover:-translate-y-1"
              key={service.id}
              style={{
                opacity: showUpsells ? 1 : 0,
                transform: showUpsells ? "translateY(0)" : "translateY(20px)",
                transition: `all 0.6s ease-out ${0.2 + index * 0.1}s`,
              }}
              onClick={() => navigateTo(service.path)}
            >
              <div className="relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-green-500 text-white py-1 px-2 rounded-bl-lg z-10 font-medium text-xs shadow-md">
                  <ThumbsUp className="inline-block w-3 h-3 mr-1" />
                  <span>{service.benefit}</span>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="text-white font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 text-center px-4">
                    <span className="bg-green-500 text-white py-2 px-4 rounded-md inline-block">
                      Request Quote
                    </span>
                  </div>
                </div>

                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-80 object-cover transform transition-transform duration-700 ease-out group-hover:scale-110"
                />
              </div>

              <div className="p-5 flex flex-col flex-grow bg-gradient-to-b from-white to-gray-50">
                <h4 className="font-bold text-lg mb-2 text-gray-800 group-hover:text-green-600 transition-colors">
                  {service.name}
                </h4>
                <p className="text-gray-600 mb-4 text-sm flex-grow">{service.description}</p>

                <button
                  className="mt-2 bg-green-600 hover:bg-green-700 text-white w-full font-medium py-2.5 px-4 rounded-md transition-colors transform group-hover:scale-105"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateTo(service.path);
                  }}
                >
                  Request Quote
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CompleteStep;
