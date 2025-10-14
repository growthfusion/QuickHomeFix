import React from 'react'
import Header from '@/backend_db/components/header/Header'

function Dash() {
    const forms = [
        {form: "roof", url: "https://autopolicypro.us/get-quotes/roof", presaleUrl: ""},
        {form: "gutter", url: "https://autopolicypro.us/get-quotes/gutter", presaleUrl: ""},
        {form: "walk-in-tubs", url: "https://autopolicypro.us/get-quotes/tub", presaleUrl: ""},
        {form: "window", url: "https://autopolicypro.us/get-quotes/window", presaleUrl: ""},
        {form: "solar", url: "https://autopolicypro.us/get-quotes/solar", presaleUrl: ""},
        {form: "bath-remodel", url: "https://autopolicypro.us/get-quotes/bath", presaleUrl: ""},
        {form: "walk-in-shower", url: "https://autopolicypro.us/get-quotes/shower", presaleUrl: ""},
        {form: "multi", url: "https://autopolicypro.us/get-quotes", presaleUrl: ""},
    ]
    
    const domains = [
        {name: "quickhomefix.pro", url: "https://autopolicypro.us/"},
        {name: "autopolicypro.us", url: "https://autopolicypro.us/"}
    ]
    
    return (
        <>
            <Header />
            <div className="max-w-6xl mx-auto p-6">
                {/* Domains Section */}
                <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-bold mb-4 text-gray-800">DOMAINS</h1>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {domains.map((domain, index) => (
                            <a 
                                key={index}
                                href={domain.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline hover:bg-yellow-50 p-3 rounded transition-colors duration-200"
                            >
                                {domain.name}
                            </a>
                        ))}
                    </div>
                </div>
                
                {/* Forms Section */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h1 className="text-2xl font-bold mb-6 text-gray-800">FORM DETAILS</h1>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Form
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Form URL
                                    </th>
                                
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {forms.map((form, index) => (
                                    <tr 
                                        key={index} 
                                        className="hover:bg-yellow-50 transition-colors duration-200"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 hover:text-gray-600">
                                            {form.form}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <a 
                                                href={form.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {form.url.replace('https://autopolicypro.us', '')}
                                            </a>
                                        </td>
                                       
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                  
                </div>
            </div>
        </>
    )
}

export default Dash
