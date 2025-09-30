import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom"; 
import heroImg from '@/assets/images/img3.jpg';

// Custom hook to detect window size
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({ width: undefined, height: undefined });

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

const HeroSection = () => {
  const { width } = useWindowSize();
  const navigate = useNavigate();
  const breakpoint = 1024;

  const handleNavigate = () => {
    navigate('/roofing');
  };

  if (width === undefined) return null;

  const backgroundStyle = {
    backgroundImage: `linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.3)), url(${heroImg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  // For mobile
  if (width < breakpoint) {
    return (
      <section 
        className="relative min-h-screen" 
        style={backgroundStyle}
      >
        {/* Increased top padding to move content down */}
        <div className="h-[120px]"></div>
        
        {/* Content container with precise spacing */}
        <div className="px-4 xs:px-6 sm:px-8">
          {/* Main heading with tightly controlled spacing */}
          <h1 className="text-4xl xs:text-5xl font-bold text-white leading-[1.1] tracking-tight mb-[3px]">
            Transform Your <br className="hidden xs:block" />Home
          </h1>
          
          {/* Subheading with professional spacing */}
          <h2 className="text-3xl xs:text-4xl font-bold text-blue-400 leading-[1.2] mt-1 mb-[31px]">
            With Expert Care
          </h2>
          
          {/* Description text with optimal line height */}
          <p className="text-lg xs:text-xl text-gray-200 leading-[1.5] mb-[35px] max-w-lg">
            America's trusted home improvement professionals. Quality work, guaranteed satisfaction, and unbeatable prices.
          </p>
          
          {/* CTA button with perfect sizing */}
          <button
            onClick={handleNavigate}
            className="bg-blue-600 hover:bg-blue-700 transition-colors duration-300 text-white text-base font-semibold rounded-full py-3 px-8 flex items-center justify-center group w-full xs:w-auto shadow-lg"
          >
            Get Free Quote
            <svg
              className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
          
          {/* Bottom spacer */}
          <div className="h-[110px]"></div>
        </div>
      </section>
    );
  }

  // Desktop version
  return (
    <section 
      className="relative py-24 md:py-32" 
      style={backgroundStyle}
    >
      <div className="container mx-auto px-6 lg:px-8">
        <div className="max-w-3xl">
          <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
            Transform Your Home
            <span className="block text-blue-400 text-4xl lg:text-5xl mt-2">
              With Expert Care
            </span>
          </h1>
          
          <p className="text-xl text-gray-200 mt-8 mb-10 max-w-2xl">
            America's trusted home improvement professionals. Quality work, guaranteed satisfaction, and unbeatable prices.
          </p>
          
          <button
            onClick={handleNavigate}
            className="bg-blue-600 hover:bg-blue-700 transition-colors duration-300 text-white px-8 py-4 rounded-full text-lg font-semibold flex items-center justify-center group w-auto shadow-lg"
          >
            Get Free Quote
            <svg
              className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
