import React, { useEffect } from 'react';
import CountUp from 'react-countup';
import AOS from 'aos';
import 'aos/dist/aos.css';

function StatsSection() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
      {/* Years Experience */}
      <div data-aos="fade-up" className="text-center">
        <div className="text-4xl md:text-5xl font-bold text-blue-600">
          <CountUp start={0} end={7} duration={4} redraw />+
        </div>
        <div className="text-gray-600 mt-2">Years Experience</div>
      </div>

      {/* Happy Customers */}
      <div data-aos="fade-up" data-aos-delay="100" className="text-center">
        <div className="text-4xl md:text-5xl font-bold text-blue-600">
          <CountUp start={0} end={1000} duration={4.5} redraw />+
        </div>
        <div className="text-gray-600 mt-2">Happy Customers</div>
      </div>

      {/* Satisfaction */}
      <div data-aos="fade-up" data-aos-delay="200" className="text-center">
        <div className="text-4xl md:text-5xl font-bold text-blue-600">
          <CountUp start={0} end={100} duration={4} redraw />%
        </div>
        <div className="text-gray-600 mt-2">Satisfaction</div>
      </div>

      {/* Support */}
      <div data-aos="fade-up" data-aos-delay="300" className="text-center">
        <div className="text-4xl md:text-5xl font-bold text-blue-600">
          <CountUp start={0} end={24} duration={4} redraw />/7
        </div>
        <div className="text-gray-600 mt-2">Support</div>
      </div>
    </div>
  );
}

export default StatsSection;
