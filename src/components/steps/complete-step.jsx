import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Phone } from "lucide-react";
import FooterSteps from '@/components/layout/footerSteps'

export default function CompleteStep() {
  const { formData } = useFormStore();
  const navigate = useNavigate();
  const [animationComplete, setAnimationComplete] = useState(false);
  const [showUpsells, setShowUpsells] = useState(false);
  const [showCallContent, setShowCallContent] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

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

  const handleShowCall = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowCallContent(true);
      setIsTransitioning(false);
    }, 300);
  };

  const handleBackToSuccess = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowCallContent(false);
      setIsTransitioning(false);
    }, 300);
  };

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
        image: "/roofing_services.webp",
     description: "We connect you to trusted local pros for premium roofing solutions for any home",
        path: "/get-quotes/roof",
      },
      solar: {
        name: "Solar Energy",
        image: "/Solar.webp",
   description: "Find verified local experts and save on energy costs with clean solar power",
        path: "/get-quotes/solar",
      },
      windows: {
        name: "Windows",
        image: "/window_services.webp",
     description: "Connect with local pros for modern windows that improve comfort and reduce costs",
        path: "/get-quotes/windows",
      },
      gutter: {
        name: "Gutters",
        image: "/gutter_services.webp",
      description: "Get quality gutter systems to protect your home through reliable local experts",
        path: "/get-quotes/gutter",
      },
      bath: {
        name: "Bath Remodeling",
        image: "/walkin_tub_services.png",
      description: "Partner with local pros for modern bathroom renovations designed for comfort",
        path: "/get-quotes/bath",
      },
      shower: {
        name: "Walk-in Shower",
        image: "/walkin_shower_services.png",
      description: "Work with trusted local experts for modern, accessible shower solutions",

        path: "/get-quotes/tub",
      },
    };

    const allServiceKeys = Object.keys(serviceDetails);
    const canonicalService = allServiceKeys.includes(formData.service)
      ? formData.service
      : "roofing";

    const servicesToShow = allServiceKeys.filter(key => key !== canonicalService);

    return servicesToShow
      .slice(0, 5)
      .map((id) => ({ id, ...serviceDetails[id] }));
  };

  const { title, message } = getServiceMessage();
  const serviceCards = getServiceCards();

  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <div className="mx-auto max-w-5xl px-4">
      <style jsx>{`
        @keyframes slideUpFromBottom {
          0% {
            transform: translateY(100%);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slideInFromLeft {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInFromRight {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes bubbleGrow {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes colorTransition {
          0% {
            background: linear-gradient(to right, #dcfce7, #bbf7d0, #dcfce7);
          }
          100% {
            background: linear-gradient(to right, #dbeafe, #bfdbfe, #dbeafe);
          }
        }

        .animate-slide-up {
          animation: slideUpFromBottom 0.8s ease-out forwards;
        }

        .animate-slide-left {
          animation: slideInFromLeft 0.5s ease-out forwards;
        }

        .animate-slide-right {
          animation: slideInFromRight 0.5s ease-out forwards;
        }

        .animate-bubble-grow {
          animation: bubbleGrow 0.5s ease-out forwards;
        }

        .animate-color-transition {
          animation: colorTransition 0.6s ease-out forwards;
        }

        .content-transition {
          transition: all 0.3s ease-in-out;
        }

        .progress-green {
          background: linear-gradient(to right, #22c55e, #16a34a);
        }

        .progress-blue {
          background: linear-gradient(to right, #3b82f6, #1d4ed8);
        }
      `}</style>

      
      <div className="relative">
        <Card className="shadow-lg border mb-12 overflow-hidden animate-slide-up"
              style={{ 
                borderColor: showCallContent ? '#BFDBFE' : '#BBF7D0',
                transition: 'border-color 0.6s ease-out' 
              }}>
          <CardContent className="p-10 text-center relative overflow-hidden">
            {/* Background with color transition */}
            <div
              className={`absolute inset-0 transition-all duration-600 ease-out ${
                showCallContent 
                  ? 'bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50' 
                  : 'bg-gradient-to-r from-green-50 via-green-100 to-green-50'
              } ${animationComplete ? "opacity-100" : "opacity-0"}`}
            />

            {/* Success Content */}
            <div className={`content-transition ${showCallContent ? 'opacity-0 transform translate-x-[-100%]' : 'opacity-100 transform translate-x-0'}`}>
              {!showCallContent && (
                <>
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
                    <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>
                    
                    <button
                      onClick={handleShowCall}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105 flex items-center gap-2 mx-auto"
                    >
                      <Phone className="w-4 h-4" />
                      Get Local Contractor Number
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Call Content */}
            <div className={`content-transition ${showCallContent ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-[100%] absolute inset-0 p-10'}`}>
              {showCallContent && (
                <>
                  <div className="relative z-10 -mt-6 mb-4 animate-bubble-grow">
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/1995/1995574.png"
                      alt="cartoon"
                      className="w-24 h-24 mx-auto rounded-full bg-white object-cover border-4 border-blue-300 shadow-lg"
                    />
                  </div>

                  <div className="relative z-10">
                    {/* Speech Bubble */}
                    <div className="relative bg-blue-100 text-blue-800 p-4 rounded-lg mb-6 inline-block max-w-md animate-bubble-grow">
                      <p className="text-base font-medium">
                        Hey! Want the contractor's number to talk right away?
                      </p>
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-t-8 border-t-blue-100 border-x-8 border-x-transparent"></div>
                    </div>

                    {/* Phone Number Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 text-center border-2 border-blue-200 shadow-md max-w-sm mx-auto animate-bubble-grow"
                         style={{ animationDelay: '0.2s' }}>
                      <p className="text-gray-700 text-sm font-medium mb-2">Call Now</p>
                      <a 
                        href="tel:5551234567"
                        className="text-blue-600 text-2xl font-bold mb-3 block hover:text-blue-700 transition-colors"
                      >
                        📞 (555) 123-4567
                      </a>
                      <p className="text-gray-600 text-xs mb-4">Available Mon-Fri, 9AM - 6PM</p>
                      
                      <button
                        onClick={() => window.location.href = 'tel:5551234567'}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg transform hover:scale-105 w-full mb-3"
                      >
                        Call Now
                      </button>

                      <button
                        onClick={handleBackToSuccess}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm underline"
                      >
                        ← Back to confirmation
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>

          {/* Progress bar with color transition */}
          <div className="h-1.5 w-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full w-full transition-all duration-600 ease-out ${
                showCallContent ? 'progress-blue' : 'progress-green'
              }`}
              style={{
                width: animationComplete ? "100%" : "0%",
                transition: animationComplete ? "background 0.6s ease-out" : "width 1s ease-out",
              }}
            ></div>
          </div>
        </Card>
      </div>

      {/* Upsells Section */}
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
      <FooterSteps />
    </div>
  );
}
