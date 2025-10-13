// TableAdapter.jsx
import React, { useEffect, useRef } from 'react';
import { useTableContext } from './TableContext';

const TableAdapter = () => {
  const { visibleColumns } = useTableContext();
  const prevVisibleColumnsRef = useRef();
  
  useEffect(() => {
    // Only run this if the visibility has changed
    if (JSON.stringify(prevVisibleColumnsRef.current) !== JSON.stringify(visibleColumns)) {
      prevVisibleColumnsRef.current = visibleColumns;
      
      // Apply column visibility to all tables in the DOM
      setTimeout(() => {
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
          const headerRow = table.querySelector('thead tr');
          const bodyRows = table.querySelectorAll('tbody tr');
          
          if (!headerRow) return;
          
          // First, get all header cells to identify which columns to show/hide
          const headerCells = Array.from(headerRow.children);
          
          // Always keep the first column (index 0) visible
          headerCells.forEach((cell, cellIndex) => {
            if (cellIndex === 0) return; // Skip first column
            
            // Get column name from cell text
            const columnText = cell.textContent.trim();
            
            // Find the matching column key based on the label in your context
            const columnKey = findColumnKeyByLabel(columnText);
            
            if (columnKey) {
              // Set visibility based on the context state
              const isVisible = visibleColumns[columnKey];
              setColumnVisibility(headerCells, bodyRows, cellIndex, isVisible);
            }
          });
        });
      }, 0);
    }
  }, [visibleColumns]);
  
  // Helper function to find column key by label
  const findColumnKeyByLabel = (label) => {
    const { availableColumns } = useTableContext();
    const column = availableColumns.find(col => 
      col.label.toLowerCase() === label.toLowerCase() ||
      col.label.toLowerCase().includes(label.toLowerCase())
    );
    return column ? column.key : null;
  };
  
  // Helper function to set column visibility
  const setColumnVisibility = (headerCells, bodyRows, cellIndex, isVisible) => {
    // Set header cell visibility
    if (headerCells[cellIndex]) {
      headerCells[cellIndex].style.display = isVisible ? '' : 'none';
    }
    
    // Set body cell visibility
    bodyRows.forEach(row => {
      const cells = Array.from(row.children);
      if (cells[cellIndex]) {
        cells[cellIndex].style.display = isVisible ? '' : 'none';
      }
    });
  };
  
  // This component doesn't render anything, it just manipulates the DOM
  return null;
};

export default TableAdapter;
