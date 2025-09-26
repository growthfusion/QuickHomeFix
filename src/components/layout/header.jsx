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
            <Link to="/" className="text-2xl font-bold text-blue-600 drop-shadow-[0_2px_4px_rgba(59,130,246,0.3)] hover:text-blue-700 transition-colors">
              QuickHomeFix
            </Link>
          </div>
          
       
          
          <div className="flex items-center space-x-4">
           
            <button className="md:hidden text-gray-700" aria-label="Menu">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
