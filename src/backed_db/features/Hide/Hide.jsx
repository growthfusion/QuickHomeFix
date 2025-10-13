import React, { useState } from 'react';

const Hide = ({ tableHeaders, visibleColumns, setVisibleColumns }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleColumn = (header) => {
    if (visibleColumns.includes(header)) {
      setVisibleColumns(visibleColumns.filter(col => col !== header));
    } else {
      setVisibleColumns([...visibleColumns, header]);
    }
  };

  const toggleAllColumns = () => {
    if (visibleColumns.length === tableHeaders.length) {
      // Keep only the FORM column visible when hiding all
      setVisibleColumns(['FORM']);
    } else {
      setVisibleColumns([...tableHeaders]);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-[#edf2fa] text-gray-600 rounded-md hover:bg-[#d8e3f8] border border-blue-200"
      >
        <span className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Columns
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 max-h-96 overflow-y-auto">
          <div className="p-2 border-b">
            <button 
              onClick={toggleAllColumns} 
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded"
            >
              {visibleColumns.length === tableHeaders.length ? 'Hide All' : 'Show All'}
            </button>
          </div>
          <div className="p-2">
            {tableHeaders.map(header => (
              <div key={header} className="flex items-center px-4 py-2 hover:bg-gray-100 rounded">
                <input
                  type="checkbox"
                  id={`column-${header}`}
                  checked={visibleColumns.includes(header)}
                  onChange={() => toggleColumn(header)}
                  className="mr-2"
                />
                <label htmlFor={`column-${header}`} className="text-sm cursor-pointer select-none">
                  {header}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Hide;
