import React from 'react';
import { Link } from 'react-router-dom';
import logo from '@/assets/images/logo.png';

function Header() {
  return (
    <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src={logo} alt="QuickHomeFix Logo" className="w-10 h-10 object-contain" />
            <Link to="/" className="text-2xl font-bold text-gray-700  hover:text-gray-500 transition-colors">
              QuickHomeFix
            </Link>
          </div>
          
       
          
         
        </div>
      </div>
    </header>
  );
}

export default Header;
