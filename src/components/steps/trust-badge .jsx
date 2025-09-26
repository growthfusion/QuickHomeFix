// components/trust-badge.jsx
import React from 'react';

import secure from '@/assets/images/cyber-security.png';
import guarantee from '@/assets/images/badge.png';
import verified from '@/assets/images/checkmark.png';
import privacy from '@/assets/images/incognito-svgrepo-com.svg';

export const TrustBadge = () => {
  return (
    <div className="relative bg-gray-50 rounded-lg p-3 shadow-md overflow-hidden max-w-3xl mx-auto mt-6">
      <div className="absolute top-2 -right-8 bg-green-500 text-white px-8 py-1 rotate-45 text-xs font-medium shadow-sm">
        VERIFIED
      </div>

      <div className="flex items-center mb-3 gap-2">
        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">
          ✓
        </div>
        <h3 className="text-sm font-semibold">Trusted Site</h3>
        <span className="text-gray-500 text-xs">09/24/2025</span>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { icon: secure, label: "Secure" },
          { icon: guarantee, label: "Guaranteed" },
          { icon: verified, label: "Verified" },
          { icon: privacy, label: "Private" }
        ].map((item, index) => (
          <div key={index} className="flex flex-col items-center">
            <img
              src={item.icon}
              alt={item.label}
              className="w-8 h-8 object-contain mb-1"
            />
            <p className="text-xs font-medium text-gray-700">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
