// components/trust-badge.jsx
import React from 'react';

import secure from '@/assets/images/cyber-security.png';
import guarantee from '@/assets/images/badge.png';
import verified from '@/assets/images/checkmark.png';
import privacy from '@/assets/images/incognito-svgrepo-com.svg';

export const TrustBadge = () => {
  // Get current date and add one year
  const currentDate = new Date();
  const futureDate = new Date(currentDate);
  futureDate.setFullYear(currentDate.getFullYear());
  
  // Format date as MM/DD/YYYY
  const formattedDate = `${(futureDate.getMonth() + 1).toString().padStart(2, '0')}/${
    futureDate.getDate().toString().padStart(2, '0')}/${
    futureDate.getFullYear()}`;
  
  const trustItems = [
    { icon: secure, label: "Secure", description: "256-bit encryption" },
    { icon: guarantee, label: "Guaranteed", description: "100% satisfaction" },
    { icon: verified, label: "Verified", description: "Identity confirmed" },
    { icon: privacy, label: "Private", description: "Data protection" }
  ];
  
  return (
    <div className="relative bg-white rounded-lg p-4 shadow-md overflow-hidden max-w-3xl mx-auto mt-6 border border-gray-100">
      {/* Ribbon - repositioned for better visibility */}
      <div className="absolute top-3 -right-14 bg-green-500 text-white px-12 py-1 rotate-45 text-xs font-medium shadow-sm z-10">
        VERIFIED
      </div>

      {/* Header with date moved more to the left */}
      <div className="flex items-center mb-4 gap-3">
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
          ✓
        </div>
        <h3 className="text-sm font-semibold">Trusted Site</h3>
        
        {/* Date element moved to the left */}
        <div className="flex items-center bg-gray-100 px-2 py-1 rounded-md ml-2">
         
          <span className="text-xs font-medium text-gray-600">{formattedDate}</span>
        </div>
        
        <div className="ml-auto"></div> {/* This pushes everything else to the left */}
      </div>

      {/* Trust badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        {trustItems.map((item, index) => (
          <div 
            key={index} 
            className="flex flex-col items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
          >
            <div className="w-10 h-10 flex items-center justify-center mb-2 bg-white rounded-full p-1 shadow-sm">
              <img
                src={item.icon}
                alt={item.label}
                className="w-6 h-6 object-contain"
              />
            </div>
            <p className="text-xs font-bold text-gray-800 mb-1">{item.label}</p>
            <p className="text-xs text-gray-500 hidden sm:block">{item.description}</p>
          </div>
        ))}
      </div>
      
      {/* Verification status card */}
     
    </div>
  );
};
