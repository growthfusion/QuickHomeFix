import { useState, useEffect } from 'react';

const ReviewsSection = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    
    // Complete reviews data
    const originalReviews = [
        {
            id: 1,
            rating: 5,
            text: "Excellent service and quality workmanship! The team was professional and completed the job on time.",
            name: "John Doe",
            location: "New York, NY",
            avatar: "https://randomuser.me/api/portraits/men/1.jpg"
        },
        {
            id: 2,
            rating: 5,
            text: "Amazing experience from start to finish. My new roof looks fantastic and the warranty gives me peace of mind.",
            name: "Sarah Johnson",
            location: "Los Angeles, CA",
            avatar: "https://randomuser.me/api/portraits/women/2.jpg"
        },
        {
            id: 3,
            rating: 5,
            text: "Best investment we've made! Our energy bills have dropped significantly since the solar installation.",
            name: "Mike Wilson",
            location: "Chicago, IL",
            avatar: "https://randomuser.me/api/portraits/men/3.jpg"
        },
        {
            id: 4,
            rating: 5,
            text: "Professional, courteous, and efficient. The windows have transformed our home's appearance.",
            name: "Emily Davis",
            location: "Houston, TX",
            avatar: "https://randomuser.me/api/portraits/women/4.jpg"
        },
        {
            id: 5,
            rating: 5,
            text: "Outstanding service! The team went above and beyond to ensure everything was perfect.",
            name: "Robert Brown",
            location: "Phoenix, AZ",
            avatar: "https://randomuser.me/api/portraits/men/5.jpg"
        },
        {
            id: 6,
            rating: 5,
            text: "Couldn't be happier with our new gutters. No more water damage worries!",
            name: "Lisa Anderson",
            location: "Philadelphia, PA",
            avatar: "https://randomuser.me/api/portraits/women/6.jpg"
        }
    ];

    // Clone reviews for infinite scroll
    const reviews = [...originalReviews, ...originalReviews, ...originalReviews];
    
    const getSlidesPerView = () => {
        if (typeof window !== 'undefined') {
            if (window.innerWidth >= 1024) return 3;
            if (window.innerWidth >= 768) return 2;
            return 1;
        }
        return 1;
    };

    const [slidesPerView, setSlidesPerView] = useState(getSlidesPerView());

    useEffect(() => {
        const handleResize = () => {
            setSlidesPerView(getSlidesPerView());
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Handle infinite scroll
    useEffect(() => {
        if (currentSlide === originalReviews.length) {
            setTimeout(() => {
                setIsTransitioning(false);
                setCurrentSlide(0);
                setTimeout(() => setIsTransitioning(true), 50);
            }, 500);
        } else if (currentSlide === -1) {
            setTimeout(() => {
                setIsTransitioning(false);
                setCurrentSlide(originalReviews.length - 1);
                setTimeout(() => setIsTransitioning(true), 50);
            }, 500);
        }
    }, [currentSlide, originalReviews.length]);

    const nextSlide = () => {
        setCurrentSlide((prev) => prev + 1);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => prev - 1);
    };

    // Auto-play with pause on hover
    const [isPaused, setIsPaused] = useState(false);
    
    useEffect(() => {
        if (!isPaused) {
            const interval = setInterval(() => {
                nextSlide();
            }, 4000);
            
            return () => clearInterval(interval);
        }
    }, [currentSlide, isPaused]);

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    return (
        <section id="reviews" className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
            <div className="container mx-auto px-4">
                {/* Section Header with Animation */}
                <div className="text-center mb-16">
                    <h2 
                        data-aos="fade-up" 
                        className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent"
                    >
                        What Our Customers Say
                    </h2>
                    <p 
                        data-aos="fade-up" 
                        data-aos-delay="100"
                        className="text-xl text-gray-600 max-w-3xl mx-auto"
                    >
                        Join thousands of satisfied homeowners across America
                    </p>
                </div>

                {/* Carousel Container */}
                <div 
                    className="relative"
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div className="overflow-hidden">
                        <div 
                            className={`flex ${isTransitioning ? 'transition-transform duration-500 ease-in-out' : ''}`}
                            style={{ 
                                transform: `translateX(-${(currentSlide + originalReviews.length) * (100 / slidesPerView)}%)` 
                            }}
                        >
                            {reviews.map((review, index) => (
                                <div 
                                    key={`${review.id}-${index}`}
                                    className={`w-full ${
                                        slidesPerView === 3 ? 'lg:w-1/3' : 
                                        slidesPerView === 2 ? 'md:w-1/2' : 
                                        'w-full'
                                    } flex-shrink-0 px-4 pb-8`} // Added pb-8 to create bottom spacing
                                >
                                    <div 
                                        className="bg-white rounded-3xl p-8 pb-12 shadow-lg hover:shadow-xl transition-all duration-500 h-full transform hover:-translate-y-2 border border-gray-50 mb-6" // Added mb-6 for bottom margin
                                        data-aos="fade-up"
                                        data-aos-delay={`${(index % slidesPerView) * 100}`}
                                    >
                                        {/* Rating Stars */}
                                        <div className="flex mb-6 justify-center">
                                            {[...Array(review.rating)].map((_, i) => (
                                                <svg 
                                                    key={i} 
                                                    className="w-6 h-6 text-amber-400"
                                                    fill="currentColor" 
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                        
                                        {/* Review Text */}
                                        <p className="text-gray-700 mb-8 text-center leading-relaxed">
                                            {review.text}
                                        </p>
                                        
                                        {/* Divider */}
                                        <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-auto mb-6"></div>
                                        
                                        {/* Reviewer Info */}
                                        <div className="flex items-center justify-center mt-8">
                                            <img 
                                                src={review.avatar} 
                                                alt={review.name} 
                                                className="w-14 h-14 rounded-full mr-4 object-cover ring-2 ring-gray-100"
                                                onError={(e) => {
                                                    e.target.src = 'https://via.placeholder.com/56';
                                                }}
                                            />
                                            <div>
                                                <p className="font-semibold text-gray-900 text-lg">{review.name}</p>
                                                <p className="text-sm text-gray-500 flex items-center">
                                                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    {review.location}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    <button 
                        onClick={prevSlide}
                        className="absolute -left-4 md:left-0 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur p-3 rounded-full shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300 z-10 group focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Previous review"
                    >
                        <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button 
                        onClick={nextSlide}
                        className="absolute -right-4 md:right-0 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur p-3 rounded-full shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300 z-10 group focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Next review"
                    >
                        <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-700 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Carousel Indicators */}
                <div className="flex justify-center mt-10 mb-8 space-x-2"> {/* Added mb-8 for bottom margin */}
                    {originalReviews.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${
                                (currentSlide % originalReviews.length) === index 
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 w-10' 
                                    : 'bg-gray-300 w-2 hover:bg-gray-400'
                            } focus:outline-none focus:ring-2 focus:ring-blue-300`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
                
                {/* Added extra spacing div */}
                <div className="h-12"></div>
            </div>
        </section>
    );
};

export default ReviewsSection;
