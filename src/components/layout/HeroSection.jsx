import React from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  const handleNavigate = () => navigate("/quote");

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 flex flex-col justify-between lg:flex-row lg:items-center overflow-hidden">
      
      {/* 🔹 Decorative Background Shape */}
      <div className="absolute top-0 right-0 w-96 h-96 lg:w-[40rem] lg:h-[40rem] bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4 blur-3xl opacity-70 z-0"></div>
      
      {/* 🔹 Content Area (Left side on Desktop) - NO CHANGES HERE */}
      <div className="relative z-10 w-full lg:w-2/5 pt-28 pb-8 lg:py-0 px-6 sm:px-12 lg:pl-16 xl:pl-24 text-center lg:text-left">
        <h1 className="text-4xl xs:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
          Transform Your <br className="hidden xs:block" /> Home
          <span className="block text-yellow-300 mt-2 text-3xl xs:text-4xl lg:text-5xl">
            With Expert Care
          </span>
        </h1>

        <p className="mt-6 mb-10 text-white/90 text-lg lg:text-xl max-w-lg mx-auto lg:mx-0 leading-relaxed">
          Helping you find reliable local experts to handle all your home improvement needs with ease.
        </p>

        <button
          onClick={handleNavigate}
          className="bg-yellow-400 hover:bg-yellow-500 transition-all duration-300 ease-in-out text-blue-900 font-bold rounded-full py-4 px-8 flex items-center justify-center mx-auto lg:mx-0 shadow-lg group w-fit text-lg transform hover:scale-105"
        >
          Get Your Free Quote
          <svg
            className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>

      {/* 🔹 Image Area (Right side on Desktop) */}
      {/* ✅ THE ONLY CHANGE IS ON THIS LINE */}
      <div className="relative w-full lg:w-3/5 h-[40vh] lg:h-screen flex items-end justify-center lg:justify-end">
        <img
          src=""
        
          className="h-full lg:h-[75%] object-contain drop-shadow-2xl select-none z-10"
        />
      </div>
    </section>
  );
};

export default HeroSection;