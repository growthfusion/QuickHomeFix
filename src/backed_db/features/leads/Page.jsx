import React, { useEffect } from 'react'
import Header from '@/backed_db/components/header/Header';
import DatePickerToggle from "@/backed_db/components/date/DatePicker";
import FilterSelect from "@/backed_db/components/filters/Filter";
import Hide from '../Hide/DataTable';

import Form from './Form'
import Source from './Source'
import Buyer from './Buyer';
import Landing from './Landing';
import Widget from './Widget_id';
import Teaser from './Teaser_id';
import Campaign from './Campaign_id';
import Title from './Title';
import Placement from './Placement';
import State from './State';
import Device from './Device';
import Os from './Os';

function Page() {
  // Apply initial column visibility when page loads
  useEffect(() => {
    const applyInitialColumnVisibility = () => {
      const savedVisibility = localStorage.getItem('columnVisibility');
      if (savedVisibility) {
        const visibility = JSON.parse(savedVisibility);
        
        setTimeout(() => {
          const tables = document.querySelectorAll('table');
          
          tables.forEach(table => {
            const headers = Array.from(table.querySelectorAll('thead th'));
            
            // Skip the first column, hide others based on saved visibility
            headers.forEach((header, index) => {
              if (index === 0) return; // Always show first column
              
              const text = header.textContent.trim();
              const shouldHide = Object.entries(visibility).some(([key, isVisible]) => {
                const columnInfo = columns.find(col => col.key === key);
                return columnInfo && columnInfo.label === text && !isVisible;
              });
              
              if (shouldHide) {
                // Hide this column
                header.style.display = 'none';
                
                // Hide corresponding cells in each row
                table.querySelectorAll('tbody tr').forEach(row => {
                  const cells = row.querySelectorAll('td');
                  if (cells.length > index) {
                    cells[index].style.display = 'none';
                  }
                });
              }
            });
          });
        }, 500); // Delay to ensure tables are rendered
      }
    };
    
    // List of columns for reference
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
    
    applyInitialColumnVisibility();
  }, []);

  return (
    <>
      <Header/>
      <DatePickerToggle/>
      <Hide />
      <FilterSelect />
      <div className='bg-gray-50 pb-[8%]'>
        <Form />
        <Source />
        <Buyer />
        <Landing />
        <Widget />
        <Teaser />
        <Campaign />
        <Title />
        <Placement />
        <State />
        <Device />
        <Os />
      </div>
    </>
  )
}

export default Page
