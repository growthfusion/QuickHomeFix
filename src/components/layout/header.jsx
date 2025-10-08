// components/Header.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useFormStore } from '@/lib/store';
import logo from '@/assets/images/logo.png';
import LeaveConfirmationDialog from './LeaveConfirmationDialog';

function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleHomeNavigation, showLeaveDialog } = useFormStore();

  const handleHomeClick = (e) => {
    // Only show confirmation if we're not already on home page
    if (location.pathname !== '/') {
      e.preventDefault();
      
      handleHomeNavigation(() => {
        navigate('/');
      });
    }
  };

  return (
    <>
      <header className="bg-white border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src={logo} alt="QuickHomeFix Logo" className="w-10 h-10 object-contain" />
              <Link 
                to="/" 
                onClick={handleHomeClick}
                className="text-2xl font-bold text-gray-700 hover:text-gray-500 transition-colors"
              >
                QuickHomeFix
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Render dialog */}
      <LeaveConfirmationDialog onConfirm={() => navigate('/')} />
    </>
  );
}

export default Header;
