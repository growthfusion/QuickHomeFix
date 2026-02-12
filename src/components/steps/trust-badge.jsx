import React from 'react';

import secure from '@/assets/images/cyber-security.png';
import guarantee from '@/assets/images/badge.png';
import verified from '@/assets/images/checkmark.png';

export const TrustBadge = () => {
  const currentDate = new Date();
  const formattedDate = `${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${
    currentDate.getDate().toString().padStart(2, '0')}/${
    currentDate.getFullYear()}`;

  const trustItems = [
    { icon: secure, label: "Secure", description: "256-bit encryption" },
    { icon: guarantee, label: "Guaranteed", description: "100% satisfaction" },
    { icon: verified, label: "Verified", description: "Identity confirmed" },
  ];

  return (
    <div className="border-t border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white text-[9px]">
            ✓
          </div>
          <span className="text-xs font-medium text-gray-600">Trusted Site</span>
        </div>
        <span className="text-[11px] text-gray-400">{formattedDate}</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {trustItems.map((item, index) => (
          <div key={index} className="flex flex-col items-center py-2">
            <img src={item.icon} alt={item.label} loading="lazy" decoding="async" className="w-6 h-6 object-contain mb-1.5 opacity-70" />
            <p className="text-[11px] font-medium text-gray-600">{item.label}</p>
            <p className="text-[10px] text-gray-400">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
