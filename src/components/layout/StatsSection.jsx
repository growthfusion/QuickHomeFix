import React, { useEffect, useRef, useState } from "react";
import CountUp from "react-countup";

function StatsSection() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const stats = [
    { end: 7, suffix: "+", label: "Years Experience" },
    { end: 1000, suffix: "+", label: "Happy Customers" },
    { end: 100, suffix: "%", label: "Satisfaction" },
    { end: 24, suffix: "/7", label: "Support" },
  ];

  return (
    <div ref={ref} className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-12 md:mt-16">
      {stats.map((stat, i) => (
        <div key={i} className="text-center">
          <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-600">
            {visible ? (
              <CountUp start={0} end={stat.end} duration={2.5} />
            ) : (
              0
            )}
            {stat.suffix}
          </div>
          <div className="text-gray-600 mt-2 text-sm sm:text-base">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

export default StatsSection;
