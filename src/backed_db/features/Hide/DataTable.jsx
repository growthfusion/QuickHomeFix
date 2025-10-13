import React, { useState, useEffect } from 'react';

// Define all possible columns
const columns = [
  { key: 'visits', label: 'VISITS' },
  { key: 'ctr', label: 'CTR, %' },
  { key: 'clicks', label: 'CLICKS' },
  { key: 'cr', label: 'CR, %' },
  { key: 'emails', label: 'EMAILS' },
  { key: 'leads', label: 'LEADS' },
  { key: 'sold', label: 'SOLD' },
  { key: 'soldPct', label: '%' },
  { key: 'appts', label: 'APPTS' },
  { key: 'apptsPct', label: '%' },
  { key: 'upsells', label: 'UPSELLS' },
  { key: 'upsellsSold', label: 'SOLD' },
  { key: 'upsellsSoldPct', label: '%' },
  { key: 'upsellRate', label: 'UPSELL_RATE, %' },
  { key: 'ppc', label: 'PPC' },
  { key: 'ppcSold', label: 'SOLD' },
  { key: 'ppcSoldPct', label: '%' },
  { key: 'ppcRate', label: 'PPC_RATE, %' },
  { key: 'totalRevenue', label: 'TOTAL REVENUE, $' },
  { key: 'leadsValue', label: 'LEADS, $' },
  { key: 'fbFormValue', label: 'FB FORM, $' },
  { key: 'upsellsValue', label: 'UPSELLS, $' },
  { key: 'ppcValue', label: 'PPC, $' },
  { key: 'repostsValue', label: 'REPOSTS, $' },
  { key: 'adjustment', label: 'ADJUSTMENT, $' },
  { key: 'avgPerLead', label: 'AVG PER LEAD, $' },
  { key: 'avgPerSold', label: 'AVG PER SOLD, $' },
  { key: 'epc', label: 'EPC, $' },
  { key: 'epv', label: 'EPV, $' }
];

// Create column groups for easier management
const columnGroups = [
  { name: 'Performance', columns: ['visits', 'ctr', 'clicks', 'cr', 'emails', 'leads', 'sold', 'soldPct'] },
  { name: 'Appointments', columns: ['appts', 'apptsPct'] },
  { name: 'Upsells', columns: ['upsells', 'upsellsSold', 'upsellsSoldPct', 'upsellRate'] },
  { name: 'PPC', columns: ['ppc', 'ppcSold', 'ppcSoldPct', 'ppcRate'] },
  { name: 'Revenue', columns: ['totalRevenue', 'leadsValue', 'fbFormValue', 'upsellsValue', 'ppcValue', 'repostsValue', 'adjustment'] },
  { name: 'Metrics', columns: ['avgPerLead', 'avgPerSold', 'epc', 'epv'] }
];

function DataTable() {
  const [showSelector, setShowSelector] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState(() => {
    
    const savedVisibility = localStorage.getItem('columnVisibility');
    if (savedVisibility) {
      return JSON.parse(savedVisibility);
    }
    
  
    return columns.reduce((acc, col) => {
      acc[col.key] = true;
      return acc;
    }, {});
  });


  useEffect(() => {
    localStorage.setItem('columnVisibility', JSON.stringify(columnVisibility));
    
    
    applyColumnVisibility();
  }, [columnVisibility]);

  const applyColumnVisibility = () => {
    setTimeout(() => {
      const tables = document.querySelectorAll('table');
      
      tables.forEach(table => {
        const headers = Array.from(table.querySelectorAll('thead th'));
        
        const headerMap = headers.map((th, index) => ({
          index,
          text: th.textContent.trim()
        }));
        
        columns.forEach(column => {
          const matchingHeaders = headerMap.filter(h => 
            h.text === column.label || 
            (column.label === '%' && h.text === '%') || 
            (column.label === 'SOLD' && h.text === 'SOLD')
          );
          
          if (!columnVisibility[column.key]) {
            matchingHeaders.forEach(header => {
              if (header.index === 0) return;
              
              headers[header.index].style.display = 'none';
              
              table.querySelectorAll('tbody tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > header.index) {
                  cells[header.index].style.display = 'none';
                }
              });
            });
          } else {
            matchingHeaders.forEach(header => {
              if (header.index === 0) return;
              
              headers[header.index].style.display = '';
              
              table.querySelectorAll('tbody tr').forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length > header.index) {
                  cells[header.index].style.display = '';
                }
              });
            });
          }
        });
      });
    }, 0);
  };

  const toggleColumn = (key) => {
    setColumnVisibility(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleGroup = (groupColumns, visibility) => {
    const updates = {};
    groupColumns.forEach(col => {
      updates[col] = visibility;
    });
    
    setColumnVisibility(prev => ({
      ...prev,
      ...updates
    }));
  };

  const toggleAll = (visibility) => {
    const updates = {};
    columns.forEach(col => {
      updates[col.key] = visibility;
    });
    
    setColumnVisibility(updates);
  };

  return (
    <div className="my-4 mx-auto max-w-7xl px-4">
      <div className="flex justify-between items-center">
        
        <div className="space-x-2">
          <button 
            onClick={() => toggleAll(true)}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm"
          >
            Show All
          </button>
          {/* <button 
            onClick={() => toggleAll(false)}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm"
          >
            Hide All
          </button> */}
          <button 
            onClick={() => setShowSelector(!showSelector)}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            {showSelector ? 'Hide Column Controls' : 'Show Column Controls'}
          </button>
        </div>
      </div>
      
      {showSelector && (
        <div className="mt-4 p-4 bg-white shadow rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {columnGroups.map(group => (
              <div key={group.name} className="border rounded-md p-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">{group.name}</h3>
                  <div className="space-x-1">
                    <button 
                      onClick={() => toggleGroup(group.columns, true)}
                      className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded"
                    >
                      All
                    </button>
                    <button 
                      onClick={() => toggleGroup(group.columns, false)}
                      className="px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded"
                    >
                      None
                    </button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  {columns
                    .filter(col => group.columns.includes(col.key))
                    .map(col => (
                      <div key={col.key} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`col-${col.key}`}
                          checked={columnVisibility[col.key] || false}
                          onChange={() => toggleColumn(col.key)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                        <label htmlFor={`col-${col.key}`} className="ml-2 text-sm text-gray-700">
                          {col.label}
                        </label>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
