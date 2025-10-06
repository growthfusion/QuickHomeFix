import React from 'react'

function FooterSteps() {
  return (
    <footer className="w-full max-w-4xl mx-auto mb-8">
      <div className="bg-white rounded-lg shadow-sm p-6 flex justify-center items-center space-x-6">
        <a href="/privacy-policy" className="text-gray-600 hover:text-gray-800 text-sm transition-colors">
          Privacy Policy
        </a>
        <span className="text-gray-300">|</span>
        <a href="/terms-of-service" className="text-gray-600 hover:text-gray-800 text-sm transition-colors">
          Terms of Service
        </a>
      </div>
    </footer>
  )
}

export default FooterSteps
