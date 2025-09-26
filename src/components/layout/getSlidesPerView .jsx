import { useState, useEffect } from 'react';

// Inside your component
const [currentSlide, setCurrentSlide] = useState(0);
const [slidesPerView, setSlidesPerView] = useState(1);

// Function to determine slides per view based on screen size
const getSlidesPerView = () => {
    if (typeof window !== 'undefined') {
        if (window.innerWidth >= 1024) return 3; // lg screens
        if (window.innerWidth >= 768) return 2;  // md screens
        return 1; // mobile
    }
    return 1;
};

useEffect(() => {
    const handleResize = () => {
        setSlidesPerView(getSlidesPerView());
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
}, []);

const totalSlides = Math.ceil(reviews.length / slidesPerView);

const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
};

const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
};

// Auto-play functionality (optional)
useEffect(() => {
    const interval = setInterval(() => {
        nextSlide();
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(interval);
}, [currentSlide, totalSlides]);
