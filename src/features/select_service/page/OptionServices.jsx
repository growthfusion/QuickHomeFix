import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

// Theme Context
const ThemeContext = createContext(undefined);

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Theme Toggle Component
const ThemeToggle = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 transition-colors duration-500 tracking-wide">
        {isDark ? 'Dark' : 'Light'}
      </span>
      
      <button
        onClick={toggleTheme}
        className="group relative w-16 h-9 bg-gradient-to-r from-gray-200 via-gray-250 to-gray-300 dark:from-gray-700 dark:via-gray-650 dark:to-gray-600 rounded-full shadow-lg transition-all duration-500 ease-out hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/30 dark:focus:ring-blue-400/30 active:scale-95"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <div
          className={`absolute top-1 w-7 h-7 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-full shadow-xl transition-all duration-500 ease-out transform border border-gray-200/50 dark:border-gray-700/50 ${
            isDark ? 'translate-x-8' : 'translate-x-1'
          } group-hover:scale-110 group-active:scale-95`}
        />
        
        <div
          className={`absolute left-2 top-2 w-5 h-5 flex items-center justify-center transition-all duration-500 ease-out ${
            !isDark 
              ? 'text-amber-500 scale-100 rotate-0 opacity-100' 
              : 'text-gray-400 scale-75 rotate-180 opacity-30'
          }`}
        >
          <Sun size={18} className="drop-shadow-sm" strokeWidth={2.5} />
        </div>
        
        <div
          className={`absolute right-2 top-2 w-5 h-5 flex items-center justify-center transition-all duration-500 ease-out ${
            isDark 
              ? 'text-blue-400 scale-100 rotate-0 opacity-100' 
              : 'text-gray-400 scale-75 -rotate-180 opacity-30'
          }`}
        >
          <Moon size={18} className="drop-shadow-sm" strokeWidth={2.5} />
        </div>
        
        <div
          className={`absolute inset-0 rounded-full transition-all duration-500 ease-out ${
            isDark
              ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/25'
              : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 shadow-lg shadow-amber-500/25'
          } opacity-0 group-hover:opacity-100 animate-pulse`}
        />
        
        <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      </button>
    </div>
  );
};

// Service Card Component
const ServiceCard = ({ icon, title, description }) => {
  return (
    <div className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-3xl p-8 shadow-lg hover:shadow-2xl dark:shadow-gray-900/40 transition-all duration-700 ease-out hover:scale-[1.03] hover:-translate-y-3 border border-gray-200/60 dark:border-gray-700/60 overflow-hidden">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="w-20 h-20 flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-700 dark:via-gray-650 dark:to-gray-600 rounded-3xl group-hover:scale-115 group-hover:rotate-6 transition-all duration-700 ease-out shadow-md group-hover:shadow-xl backdrop-blur-sm">
          <span className="text-4xl filter group-hover:brightness-110 group-hover:saturate-150 transition-all duration-500">{icon}</span>
        </div>
        <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-500 tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-500 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/8 via-purple-500/8 to-pink-500/8 dark:from-blue-500/15 dark:via-purple-500/15 dark:to-pink-500/15 rounded-3xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
      
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1200 ease-in-out">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent skew-x-12" />
      </div>
      
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
    </div>
  );
};

// Service Grid Component
const services = [
  {
    id: 1,
    icon: '🏠',
    title: 'Roof Services',
  },
  {
    id: 2,
    icon: '🪟',
    title: 'Windows',
  },
  {
    id: 3,
    icon: '🛁',
    title: 'Bath Remodeling',
  },
  {
    id: 4,
    icon: '☀️',
    title: 'Solar Energy',
  },
  {
    id: 5,
    icon: '🏗️',
    title: 'Gutter Services',
  },
  {
    id: 6,
    icon: '🚿',
    title: 'Walk-In-Tub/Shower',
  }
];

const ServiceGrid = () => {
  return (
    <div className="grid grid-cols-2 gap-6 px-8 mt-10">
      {services.map((service, index) => (
        <div
          key={service.id}
          className="animate-fade-in-up"
          style={{
            animationDelay: `${index * 0.15}s`,
            animationFillMode: 'both'
          }}
        >
          <ServiceCard
            icon={service.icon}
            title={service.title}
            description={service.description}
          />
        </div>
      ))}
    </div>
  );
};

// Header Component
const Header = () => {
  return (
    <div className="px-8 pt-16 pb-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
      
       
         
        </div>
        <ThemeToggle />
      </div>
      
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight tracking-tight">
          Choose the home service you
        </h1>
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-300 leading-relaxed">
          get started with your free quote!
        </p>
        <div className="w-16 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full mt-6 shadow-sm"></div>
      </div>
    </div>
  );
};

// Main OptionServices Component
const OptionServices = () => {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/40 to-purple-50/40 dark:from-gray-900 dark:via-gray-850 dark:to-gray-800 transition-all duration-700 ease-in-out">
        <div className="max-w-md mx-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg min-h-screen shadow-2xl transition-all duration-700 ease-in-out border-x border-gray-200/60 dark:border-gray-700/60">
          <Header />
          <ServiceGrid />
          
       
        </div>
      </div>
    </ThemeProvider>
  );
};

export default OptionServices;