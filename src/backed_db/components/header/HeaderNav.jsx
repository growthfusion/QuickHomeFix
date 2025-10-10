// HeaderNav.jsx
import React, { useState, useEffect } from "react";

const navLinks = [
    { name: "Dash", path: "/dash" },
    { name: "Leads", path: "/dash/form_leads" },
    { name: "Leads(Full)", path: "/dash/form_leads_full" },
    { name: "Forms", path: "/dash/forms",
        subLinks: [
            { name: "Form Steps / Pre-Sales", path: "/dash/forms/pre_sales" },
            { name: "Form Steps", path: "/dash/forms/form_steps" }
        ]
    },
    { name: "Bucket Affiliate", path: "/dash/ba" },
    { name: "Reports", path: "/dash/reports" },
    { name: "Buyers", path: "/dash/buyers" },
    { name: "Tools", path: "/dash/tools" },
     { name: "Settings", path: "/dash/tools" }, 
];

const HeaderNav = () => {
    const [openDropdown, setOpenDropdown] = useState(null);
    const [activeLink, setActiveLink] = useState(null);
 

    useEffect(() => {
        const path = window.location.pathname;
        const index = navLinks.findIndex(link => 
            path === link.path || path.startsWith(`${link.path}/`)
        );
        setActiveLink(index >= 0 ? index : 0);
        
       
    }, []);

   

    const handleMouseEnter = (index) => {
        setOpenDropdown(index);
    };

    const handleMouseLeave = () => {
        setOpenDropdown(null);
    };

    const handleLinkClick = (index) => {
        setActiveLink(index);
    };

    return (
        <nav className="sticky top-0 z-50 w-full bg-[#edf2fa]">
            <div className="flex justify-between items-center max-w-full 2xl:max-w-[1920px] mx-auto">
                <ul className="flex flex-row items-center h-14 md:h-20 xl:h-20 2xl:h-20">
                    {navLinks.map((link, index) => (
                        <li 
                            key={link.name}
                            className="relative h-full flex items-center"
                            onMouseEnter={() => handleMouseEnter(index)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <a 
                                href={link.path} 
                                onClick={() => handleLinkClick(index)}
                                className={`h-full flex items-center px-4 md:px-5 xl:px-6 2xl:px-7 
                                          transition-colors duration-200 ease-in-out
                                          text-sm md:text-[14px] xl:text-[14px] 2xl:text-[15px] whitespace-nowrap
                                          font-medium
                                          ${activeLink === index 
                                             ? 'text-blue-700 bg-blue-50/50' 
                                             : 'text-gray-600 hover:text-gray-800 hover:bg-blue-50/30'}`}
                            >
                                {link.name}
                                {link.subLinks && (
                                    <svg className={`w-3.5 h-3.5 ml-1.5 mt-0.5 ${activeLink === index ? 'text-blue-500' : 'text-gray-400'}`} 
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24" 
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                )}
                            </a>
                            
                            {link.subLinks && openDropdown === index && (
                                <div className="absolute top-full left-0 pt-1 w-64 z-50">
                                    <ul className="bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1 overflow-hidden">
                                        {link.subLinks.map(subLink => (
                                            <li key={subLink.name} className="hover:bg-blue-50">
                                                <a 
                                                    href={subLink.path} 
                                                    className="block px-5 py-3 text-[14px] text-gray-700 transition-colors hover:text-gray-900"
                                                >
                                                    {subLink.name}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </nav>
    );
};

export default HeaderNav;
