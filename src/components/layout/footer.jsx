import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-12">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm mb-2">© 2025 QuickHomeFix. All rights reserved.</p>
        <div className="flex justify-center gap-4 text-sm">
          <a href="#" className="">
            Privacy Policy
          </a>
          <span>|</span>
          <a href="#" className="">
            Terms of Service
          </a>
          <span>|</span>
          <a href="#" className="">
            Contact Us
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
