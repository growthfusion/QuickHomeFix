import React from 'react'

function FooterSteps() {
  return (
    <footer className="w-screen -mx-[50vw] relative left-[50%] right-[50%] bg-white mt-6 border-t border-gray-200">
      {/* Footer content */}
      <div className="py-4">
        <div className="flex justify-center">
          {/* Links with improved styling */}
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-8">
            <a 
              href="/privacy-policy" 
              className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors duration-200"
            >
              Privacy Policy
            </a>
            <div className="hidden sm:block h-4 border-r border-gray-200"></div>
            <a 
              href="/terms-of-service" 
              className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors duration-200"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default FooterSteps
