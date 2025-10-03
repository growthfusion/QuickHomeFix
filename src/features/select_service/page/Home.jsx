import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import logo from '@/assets/images/logo.png';
import logo1 from '@/assets/images/logo1.png';
import '@/index.css'
import ReviewsSection  from '@/components/layout/ReviewsSection.jsx';
import HeroSection from "@/components/layout/heroSection";
import { useFormStore } from "@/lib/store";

import walkin_shower_services from '@/assets/images/walkin_shower_services.png';
import walkin_tub_services from '@/assets/images/walkin_tub_services.png';
function Home() {
    const navigate = useNavigate();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const goToRoofingEstimate = () => {
        navigate("/quote");
    };
 const initForm = useFormStore((state) => state.initForm);

  useEffect(() => {
    initForm(); // resets form + step + home page state
  }, [initForm]);
    // About section images - you can add more
    const aboutImages = [
        { src: "/furniture-998265_1280.webp", alt: "Beautiful Homes" },
        { src: "/Replacement-Window-Cost-A-Comprehensive-Guide-to-Pricing.jpeg", alt: "Professional Team" },
        { src: "/pexels-erin-d-8578847.webp", alt: "Quality Service" },
        { src: "/gutter_services.webp", alt: "Roofing Experts" },
        { src: "/roofing-contractor.webp", alt: "Window Installation" },
            { src: "/window_services.webp", alt: "Window Installation" },
    ];

    // Fake reviews data
  

    useEffect(() => {
        // Handle scroll effects
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };

        // Animate on scroll
        const animateOnScroll = () => {
            const elements = document.querySelectorAll("[data-aos]");
            elements.forEach(element => {
                const elementPosition = element.getBoundingClientRect().top;
                const screenPosition = window.innerHeight / 1.2;

                if (elementPosition < screenPosition) {
                    element.classList.add("aos-animate");
                }
            });
        };

        window.addEventListener("scroll", handleScroll);
        window.addEventListener("scroll", animateOnScroll);
        window.addEventListener("load", animateOnScroll);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("scroll", animateOnScroll);
            window.removeEventListener("load", animateOnScroll);
        };
    }, []);

    return (
        <div className="font-sans text-gray-800 overflow-x-hidden">
            <style jsx>{`
                @keyframes infiniteScroll {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-100%);
                    }
                }
                
                .infinite-scroll-container {
                    display: flex;
                    animation: infiniteScroll 40s linear infinite;
                }
                
                .infinite-scroll-container:hover {
                    animation-play-state: paused;
                }

                .aos-animate {
                    opacity: 1 !important;
                    transform: translateY(0) !important;
                }

                [data-aos] {
                    opacity: 0;
                    transform: translateY(30px);
                    transition: all 0.8s ease-out;
                }

                [data-aos].delay-100 {
                    transition-delay: 0.1s;
                }

                [data-aos].delay-200 {
                    transition-delay: 0.2s;
                }

                [data-aos].delay-300 {
                    transition-delay: 0.3s;
                }

                /* Mobile carousel styles */
                @media (max-width: 768px) {
                    .reviews-carousel {
                        display: flex;
                        overflow-x: auto;
                        scroll-snap-type: x mandatory;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                        -ms-overflow-style: none;
                    }
                    
                    .reviews-carousel::-webkit-scrollbar {
                        display: none;
                    }
                    
                    .review-card {
                        scroll-snap-align: center;
                        flex: 0 0 90%;
                        margin-right: 1rem;
                    }
                }

                /* American style button */
                .cta-button {
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
                    transition: all 0.3s ease;
                }

                .cta-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
                }

                /* Header styles */
                .header-blur {
                    backdrop-filter: blur(10px);
                    background-color: rgba(255, 255, 255, 0.95);
                }

                /* Mobile menu animation */
                .mobile-menu-enter {
                    animation: slideIn 0.3s ease-out;
                }

                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
            `}</style>

   <header className={`fixed w-full transition-all duration-300 z-50 ${
    isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
}`}>
    <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
                <img 
                    src={isScrolled ? logo : logo1} 
                    alt="Logo" 
                    className="w-10 h-10 transition-all duration-300" 
                />

               <div className={`
  text-2xl md:text-3xl font-bold 
  transition-all duration-300 
  ${isScrolled 
    ? 'text-blue-600 drop-shadow-[0_2px_4px_rgba(59,130,246,0.3)]' 
    : 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
  }
  hover:scale-105 
  cursor-pointer
  [text-shadow:_0_1px_3px_rgba(0,0,0,0.1)]
`}>
  QuickHomeFix
</div>


            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
                <Link to="/" className={`font-medium transition-colors duration-300 ${
                    isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-blue-300'
                }`}>Home</Link>
                <a href="#about" className={`font-medium transition-colors duration-300 ${
                    isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-blue-300'
                }`}>About</a>
                <a href="#services" className={`font-medium transition-colors duration-300 ${
                    isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-blue-300'
                }`}>Services</a>
                <a href="#reviews" className={`font-medium transition-colors duration-300 ${
                    isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-blue-300'
                }`}>Reviews</a>
                <a href="#contact" className={`font-medium transition-colors duration-300 ${
                    isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-blue-300'
                }`}>Contact</a>
            </nav>

            {/* Mobile Menu Button */}
            <button 
                className="lg:hidden p-2 rounded-lg transition-all duration-200 hover:opacity-70 active:opacity-50"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
                <svg className={`w-6 h-6 transition-colors duration-300 ${
                    isScrolled ? 'text-gray-900' : 'text-white'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>
        </div>
    </div>

    {/* Mobile Menu */}
    <div className={`lg:hidden absolute top-full left-0 w-full bg-white/95 backdrop-blur-md shadow-2xl transition-all duration-300 ease-in-out ${
        isMobileMenuOpen 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 -translate-y-4 pointer-events-none'
    }`}>
        <nav className="container mx-auto px-4 py-6">
            <div className="flex flex-col space-y-2">
                <Link 
                    to="/" 
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:translate-x-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    Home
                </Link>
                <a 
                    href="#about" 
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:translate-x-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    About
                </a>
                <a 
                    href="#services" 
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:translate-x-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    Services
                </a>
                <a 
                    href="#reviews" 
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:translate-x-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    Reviews
                </a>
                <a 
                    href="#contact" 
                    className="text-gray-700 hover:text-blue-600 hover:bg-blue-50 font-medium py-3 px-4 rounded-lg transition-all duration-200 hover:translate-x-1"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    Contact
                </a>
            </div>
        </nav>
    </div>
</header>


            {/* Hero Section - American Style */}
         <HeroSection/>

            {/* About Section with Proper Infinite Scroll */}
            <section id="about" className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                                                <h2 data-aos className="text-4xl md:text-5xl font-bold mb-6">
                            Why Choose QuickHomeFix?
                        </h2>
                        <p data-aos className="text-xl text-gray-600 max-w-3xl mx-auto delay-100">
                            We're not just contractors – we're your neighbors, committed to making every American home better, one project at a time.
                        </p>
                    </div>

                    {/* Infinite Scroll Gallery */}
                   <div className="relative overflow-hidden rounded-2xl">
    <div className="flex w-max animate-infinite-scroll">
        {/* First set */}
        <div className="flex">
            {aboutImages.map((image, index) => (
                <div key={`first-${index}`} className="flex-shrink-0 w-80 h-64 mx-3">
                    <img 
                        src={image.src} 
                        alt={image.alt} 
                        className="w-full h-full object-cover rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
                    />
                </div>
            ))}
        </div>
        {/* Duplicate set for seamless loop */}
        <div className="flex">
            {aboutImages.map((image, index) => (
                <div key={`second-${index}`} className="flex-shrink-0 w-80 h-64 mx-3">
                    <img 
                        src={image.src} 
                        alt={image.alt} 
                        className="w-full h-full object-cover rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
                    />
                </div>
            ))}
        </div>
    </div>
</div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
                        <div data-aos className="text-center">
                            <div className="text-4xl md:text-5xl font-bold text-blue-600">15+</div>
                            <div className="text-gray-600 mt-2">Years Experience</div>
                        </div>
                        <div data-aos className="text-center delay-100">
                            <div className="text-4xl md:text-5xl font-bold text-blue-600">10K+</div>
                            <div className="text-gray-600 mt-2">Happy Customers</div>
                        </div>
                        <div data-aos className="text-center delay-200">
                            <div className="text-4xl md:text-5xl font-bold text-blue-600">100%</div>
                            <div className="text-gray-600 mt-2">Satisfaction</div>
                        </div>
                        <div data-aos className="text-center delay-300">
                            <div className="text-4xl md:text-5xl font-bold text-blue-600">24/7</div>
                            <div className="text-gray-600 mt-2">Support</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section - American Style */}
          <section id="services" className="py-20 bg-white">
    <div className="container mx-auto px-4">
        <div className="text-center mb-12">
            <h2 data-aos className="text-4xl md:text-5xl font-bold mb-6">
                Our Premium Services
            </h2>
            <p data-aos className="text-xl text-gray-600 max-w-3xl mx-auto delay-100">
                From roof to foundation, we've got your home covered with <br />industry-leading solutions
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Service Cards */}
            <div data-aos className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <img src="/Solar.webp" alt="Solar" className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <h3 className="text-2xl font-bold text-white mb-2">Solar Installation</h3>
                    <p className="text-gray-200 mb-4">Save up to 70% on energy bills with premium solar solutions</p>
                    <button onClick={goToRoofingEstimate} className="group/btn text-white bg-blue-600 px-4 py-2 rounded-full hover:bg-blue-700 transition-colors inline-flex items-center">
                        Learn More <span className="ml-1 transform transition-transform duration-200 group-hover/btn:translate-x-1">→</span>
                    </button>
                </div>
            </div>

            <div data-aos className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 delay-100">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <img src="/roofing_services.webp" alt="Roofing" className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <h3 className="text-2xl font-bold text-white mb-2">Roofing Services</h3>
                    <p className="text-gray-200 mb-4">Complete roofing solutions with lifetime warranty</p>
                    <button onClick={goToRoofingEstimate} className="group/btn text-white bg-blue-600 px-4 py-2 rounded-full hover:bg-blue-700 transition-colors inline-flex items-center">
                        Learn More <span className="ml-1 transform transition-transform duration-200 group-hover/btn:translate-x-1">→</span>
                    </button>
                </div>
            </div>

            <div data-aos className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 delay-200">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <img src="/window_services.webp" alt="Windows" className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <h3 className="text-2xl font-bold text-white mb-2">Window Replacement</h3>
                    <p className="text-gray-200 mb-4">Energy-efficient windows that beautify your home</p>
                    <button onClick={goToRoofingEstimate} className="group/btn text-white bg-blue-600 px-4 py-2 rounded-full hover:bg-blue-700 transition-colors inline-flex items-center">
                        Learn More <span className="ml-1 transform transition-transform duration-200 group-hover/btn:translate-x-1">→</span>
                    </button>
                </div>
            </div>

            <div data-aos className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 delay-300">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <img src="/gutter_services.webp" alt="Gutters" className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <h3 className="text-2xl font-bold text-white mb-2">Gutter Systems</h3>
                    <p className="text-gray-200 mb-4">Protect your home with seamless gutter solutions</p>
                    <button onClick={goToRoofingEstimate} className="group/btn text-white bg-blue-600 px-4 py-2 rounded-full hover:bg-blue-700 transition-colors inline-flex items-center">
                        Learn More <span className="ml-1 transform transition-transform duration-200 group-hover/btn:translate-x-1">→</span>
                    </button>
                </div>
            </div>

            <div data-aos className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 delay-400">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <img src={walkin_shower_services} alt="Walk-in Shower" className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <h3 className="text-2xl font-bold text-white mb-2">Walk-In Showers</h3>
                    <p className="text-gray-200 mb-4">Luxurious, accessible bathroom transformations</p>
                    <button onClick={goToRoofingEstimate} className="group/btn text-white bg-blue-600 px-4 py-2 rounded-full hover:bg-blue-700 transition-colors inline-flex items-center">
                        Learn More <span className="ml-1 transform transition-transform duration-200 group-hover/btn:translate-x-1">→</span>
                    </button>
                </div>
            </div>

            <div data-aos className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 delay-500">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                <img src={walkin_tub_services} alt="Walk-in Tub" className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <h3 className="text-2xl font-bold text-white mb-2">Walk-In Tubs</h3>
                    <p className="text-gray-200 mb-4">Safe, therapeutic bathing solutions for all ages</p>
                    <button onClick={goToRoofingEstimate} className="group/btn text-white bg-blue-600 px-4 py-2 rounded-full hover:bg-blue-700 transition-colors inline-flex items-center">
                        Learn More <span className="ml-1 transform transition-transform duration-200 group-hover/btn:translate-x-1">→</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</section>


            {/* Reviews Section - Mobile Responsive Carousel */}
       <ReviewsSection/>

            {/* CTA Section - American Style */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-black opacity-10"></div>
                <div className="container mx-auto px-4 relative z-10">
                    <div className="text-center text-white">
                        <h2 data-aos className="text-4xl md:text-5xl font-bold mb-6">
                            Ready to Transform Your Home?
                        </h2>
                        <p data-aos className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto delay-100">
                            Get your free estimate today and save up to 30% on your next home improvement project!
                        </p>
                        <div data-aos className="flex flex-col sm:flex-row gap-4 justify-center delay-200">
                            <button 
                                onClick={goToRoofingEstimate}
                                className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-bold hover:bg-gray-100 transition-all transform hover:scale-105"
                            >
                                Get Free Quote
                            </button>
                     
                        </div>
                       
                    </div>
                </div>
            </section>

            {/* Footer - American Style */}
            <footer id="contact" className="bg-gray-900 text-white pt-16 pb-8">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        {/* Company Info */}
                        <div>
                            <div className="flex items-center mb-4">
                                <div className="text-3xl font-bold">QuickHomeFix</div>
                            </div>
                            <p className="text-gray-400 mb-6">
                                America's most trusted home improvement company. Licensed, bonded, and insured in all 50 states.
                            </p>
                            <div className="flex space-x-4">
                                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                    </svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                    </svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                                    </svg>
                                </a>
                                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Services */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Our Services</h3>
                            <ul className="space-y-2">
                                <li><a href="/quote" className="text-gray-400 hover:text-white transition-colors">Roofing Installation</a></li>
                                <li><a href="/quote" className="text-gray-400 hover:text-white transition-colors">Solar Panel Systems</a></li>
                                <li><a href="/quote" className="text-gray-400 hover:text-white transition-colors">Window Replacement</a></li>
                                <li><a href="/quote" className="text-gray-400 hover:text-white transition-colors">Gutter Services</a></li>
                                <li><a href="/quote" className="text-gray-400 hover:text-white transition-colors">Bathroom Remodeling</a></li>
                                <li><a href="/quote" className="text-gray-400 hover:text-white transition-colors">Emergency Repairs</a></li>
                            </ul>
                        </div>

                                                {/* Company */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Company</h3>
                            <ul className="space-y-2">
                                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                                <li><a href="#services" className="text-gray-400 hover:text-white transition-colors">Services</a></li>
                                <li><a href="#reviews" className="text-gray-400 hover:text-white transition-colors">Customer Reviews</a></li>
                               
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="text-lg font-bold mb-4">Get In Touch</h3>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span className="text-gray-400">(555) 123-4567</span>
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-gray-400">info@quickhomefix.com</span>
                                </div>
                                <div className="flex items-start">
                                    <svg className="w-5 h-5 mr-3 text-blue-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="text-gray-400">123 Main Street<br />Dallas, TX 75201</span>
                                </div>
                            </div>
                            
                        </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="border-t border-gray-800 pt-8 mt-8">
                        <div className="flex flex-col md:flex-row justify-between items-center">
                            <div className="text-gray-400 text-sm mb-4 md:mb-0">
                                © 2025 QuickHomeFix. All rights reserved.
                            </div>
                            <div className="flex space-x-6 text-sm">
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
                                <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
                            </div>
                        </div>
                        
                
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;