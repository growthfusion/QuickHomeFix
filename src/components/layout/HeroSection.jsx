import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom"; 
import heroImg from '@/assets/images/img3.jpg'; // adjust path if needed

// Custom hook to detect window size
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({ width: undefined, height: undefined });

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    handleResize(); // initial size
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const HeroSection = () => {
  const { width } = useWindowSize();
  const navigate = useNavigate(); // ✅ get navigate here
  const breakpoint = 1024; // Tailwind's lg

  const handleNavigate = () => {
    navigate('/roofing'); // ✅ client-side navigation
  };

  if (width === undefined) return null;

  const content = (
    <div className="container mx-auto px-4 xs:px-3 mm:px-4">
      <div className="max-w-3xl">
        <h1 className="text-3xl xs:text-4xl mm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 xs:mb-4 mm:mb-6 md:mb-9 mm:mt-[20px] xs:mt-[20px]">
          Transform Your Home
          <span className="block text-blue-400 text-2xl xs:text-3xl mm:text-4xl md:text-5xl lg:text-6xl mt-2">
            With Expert Care
          </span>
        </h1>
        <p className="text-base xs:text-lg mm:text-xl md:text-2xl text-gray-200 mb-6 xs:mb-4 mm:mb-6 md:mb-8">
          America's trusted home improvement professionals. Quality work, guaranteed satisfaction, and unbeatable prices.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 xs:gap-2 mm:gap-3 md:gap-4">
          <button
            onClick={handleNavigate} // ✅ fixed navigation
            className="bg-blue-600 hover:bg-blue-700 transition-colors duration-300 text-white px-6 py-3 xs:px-4 xs:py-2.5 mm:px-6 mm:py-3 sm:px-8 sm:py-4 rounded-full text-sm xs:text-sm mm:text-base md:text-lg font-bold flex items-center justify-center group w-full sm:w-auto shadow-lg"
          >
            Get Free Quote
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform duration-300 group-hover:translate-x-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  const backgroundStyle = {
    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.3)), url(${heroImg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  if (width >= breakpoint) {
    return (
      <section className="relative flex py-24 md:py-32" style={backgroundStyle}>
        <div className="relative z-10 w-full">{content}</div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden flex py-24 md:py-32">
      <div className="absolute inset-0 transform scale-110 -z-10" style={backgroundStyle}></div>
      <div className="relative z-10 w-full">{content}</div>
    </section>
  );
};

export default HeroSection;
