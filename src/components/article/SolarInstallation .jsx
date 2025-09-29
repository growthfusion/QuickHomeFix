import React from 'react';

const SolarInstallation = () => {
  const handleGetQuote = () => {
    // Function to handle quote request
    console.log('Quote requested');
    // Add functionality to open form or redirect to quote page
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 font-sans text-gray-800">
      <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-8">
        Harnessing the Sun: A Guide to Solar Installation
      </h1>
      
      <div className="w-full mb-8 rounded-lg overflow-hidden shadow-lg">
        <img 
          src="/Solar.jpg" 
          alt="Solar Installation on Residential Roof" 
          className="w-full h-auto object-cover"
        />
      </div>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-blue-700 border-b-2 border-yellow-400 pb-2 mb-4">
          The Bright Side of Home Energy Solutions
        </h2>
        <p className="text-gray-700 leading-relaxed">
          Solar installation has become one of the most popular home services for environmentally 
          conscious and cost-savvy homeowners. Converting your residence to solar power offers 
          numerous benefits, from reducing your carbon footprint to achieving significant 
          long-term savings on energy bills.
        </p>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-blue-700 border-b-2 border-yellow-400 pb-2 mb-4">
          Understanding Solar Installation
        </h2>
        <p className="text-gray-700 mb-3">Installing solar panels on your home involves several key steps:</p>
        <ol className="list-decimal pl-6 space-y-3 text-gray-700">
          <li><span className="font-semibold">Assessment</span> - A professional evaluates your roof's condition, orientation, and sun exposure to determine suitability</li>
          <li><span className="font-semibold">Design</span> - Creating a custom system based on your energy needs and property specifications</li>
          <li><span className="font-semibold">Permitting</span> - Obtaining necessary approvals from local authorities</li>
          <li><span className="font-semibold">Installation</span> - Mounting panels, installing inverters, and connecting to your home's electrical system</li>
          <li><span className="font-semibold">Inspection</span> - Ensuring everything meets safety and performance standards</li>
          <li><span className="font-semibold">Activation</span> - Connecting to the grid and powering up your system</li>
        </ol>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-blue-700 border-b-2 border-yellow-400 pb-2 mb-4">
          Benefits of Going Solar
        </h2>
        
        <h3 className="text-xl font-medium text-blue-600 mt-5 mb-3">
          Financial Advantages
        </h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-5">
          <li><span className="font-semibold">Reduced utility bills</span> - Generate your own electricity and reduce dependence on the grid</li>
          <li><span className="font-semibold">Tax incentives</span> - Many regions offer substantial tax credits and rebates</li>
          <li><span className="font-semibold">Increased property value</span> - Homes with solar installations typically sell for more</li>
        </ul>
        
        <h3 className="text-xl font-medium text-blue-600 mt-5 mb-3">
          Environmental Impact
        </h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li><span className="font-semibold">Reduced carbon emissions</span> - Clean, renewable energy production</li>
          <li><span className="font-semibold">Conservation of resources</span> - Less dependence on fossil fuels</li>
          <li><span className="font-semibold">Sustainability</span> - Solar energy is abundant and renewable</li>
        </ul>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-blue-700 border-b-2 border-yellow-400 pb-2 mb-4">
          Choosing the Right Solar Provider
        </h2>
        <p className="text-gray-700 mb-3">When selecting a home services company for your solar installation:</p>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>Research credentials and certifications</li>
          <li>Read customer reviews and testimonials</li>
          <li>Compare warranty offerings</li>
          <li>Evaluate financing options (purchase, lease, power purchase agreements)</li>
          <li>Ask about ongoing maintenance services</li>
        </ul>
      </section>
      
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-blue-700 border-b-2 border-yellow-400 pb-2 mb-4">
          Is Solar Right for Your Home?
        </h2>
        <p className="text-gray-700 mb-3">The ideal candidate for solar installation typically has:</p>
        <ul className="list-disc pl-6 space-y-2 text-gray-700">
          <li>A roof in good condition with significant sun exposure</li>
          <li>Sufficient space for panel installation</li>
          <li>Current electrical bills high enough to justify the investment</li>
          <li>A long-term residence plan to maximize return on investment</li>
        </ul>
      </section>
      
      <div className="bg-gray-100 rounded-lg p-6 md:p-8 mt-10 text-center shadow-md">
        <p className="text-lg md:text-xl font-medium mb-6 text-gray-800">
          Ready to brighten your home's energy future? Contact qualified solar installation 
          professionals to schedule a consultation and discover your property's solar potential.
        </p>
        <button 
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-800 font-bold py-3 px-8 rounded-md 
                    transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
                    focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
          onClick={handleGetQuote}
        >
          Get Quote
        </button>
      </div>
    </div>
  );
};

export default SolarInstallation;
