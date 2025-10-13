import React, { createContext, useState, useEffect, useContext } from 'react';

// Create context
export const TableContext = createContext();

// Define column mapping for different table types
const columnMappings = {
  'form': { label: 'FORM', key: 'form' },
  'buyer': { label: 'BUYER', key: 'form' },
  'landing': { label: 'LANDING', key: 'form' },
  'source': { label: 'SOURCE', key: 'form' },
  'widget': { label: 'WIDGET', key: 'form' },
  'teaser': { label: 'TEASER', key: 'form' },
  'campaign': { label: 'CAMPAIGN', key: 'form' },
  'title': { label: 'TITLE', key: 'form' },
  'placement': { label: 'PLACEMENT', key: 'form' },
  'state': { label: 'STATE', key: 'form' },
  'device': { label: 'DEVICE', key: 'form' },
  'os': { label: 'OS', key: 'form' },
};

// Define all available columns
const availableColumns = [
  { key: 'visits', label: 'VISITS', category: 'general' },
  { key: 'ctr', label: 'CTR, %', category: 'general' },
  { key: 'clicks', label: 'CLICKS', category: 'general' },
  { key: 'cr', label: 'CR, %', category: 'general' },
  { key: 'emails', label: 'EMAILS', category: 'general' },
  { key: 'leads', label: 'LEADS', category: 'general' },
  { key: 'sold', label: 'SOLD', category: 'general' },
  { key: 'soldPct', label: '%', category: 'general' },
  { key: 'appts', label: 'APPTS', category: 'general' },
  { key: 'apptsPct', label: '%', category: 'general' },
  { key: 'upsells', label: 'UPSELLS', category: 'general' },
  { key: 'upsellsSold', label: 'SOLD', category: 'upsells' },
  { key: 'upsellsSoldPct', label: '%', category: 'upsells' },
  { key: 'upsellRate', label: 'UPSELL_RATE, %', category: 'upsells' },
  { key: 'ppc', label: 'PPC', category: 'general' },
  { key: 'ppcSold', label: 'SOLD', category: 'ppc' },
  { key: 'ppcSoldPct', label: '%', category: 'ppc' },
  { key: 'ppcRate', label: 'PPC_RATE, %', category: 'ppc' },
  { key: 'totalRevenue', label: 'TOTAL REVENUE, $', category: 'revenue' },
  { key: 'leadsValue', label: 'LEADS, $', category: 'revenue' },
  { key: 'fbFormValue', label: 'FB FORM, $', category: 'revenue' },
  { key: 'upsellsValue', label: 'UPSELLS, $', category: 'revenue' },
  { key: 'ppcValue', label: 'PPC, $', category: 'revenue' },
  { key: 'repostsValue', label: 'REPOSTS, $', category: 'revenue' },
  { key: 'adjustment', label: 'ADJUSTMENT, $', category: 'revenue' },
  { key: 'avgPerLead', label: 'AVG PER LEAD, $', category: 'metrics' },
  { key: 'avgPerSold', label: 'AVG PER SOLD, $', category: 'metrics' },
  { key: 'epc', label: 'EPC, $', category: 'metrics' },
  { key: 'epv', label: 'EPV, $', category: 'metrics' }
];

// Column categories
const columnCategories = {
  'general': 'General',
  'upsells': 'Upsells',
  'ppc': 'PPC',
  'revenue': 'Revenue',
  'metrics': 'Metrics'
};

export const TableProvider = ({ children }) => {
  // Initialize column visibility state from localStorage or with defaults
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const savedVisibility = localStorage.getItem('tableColumnVisibility');
    if (savedVisibility) {
      return JSON.parse(savedVisibility);
    }
    
    // Default: all columns visible
    return availableColumns.reduce((acc, { key }) => {
      acc[key] = true;
      return acc;
    }, {});
  });

  // Save column visibility to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('tableColumnVisibility', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Toggle visibility of a specific column
  const toggleColumnVisibility = (key) => {
    setVisibleColumns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Set all columns in a category to a specific visibility
  const setColumnCategoryVisibility = (category, isVisible) => {
    const columnsInCategory = availableColumns.filter(col => col.category === category);
    const updates = {};
    
    columnsInCategory.forEach(col => {
      updates[col.key] = isVisible;
    });
    
    setVisibleColumns(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Set all columns to a specific visibility
  const setAllColumnsVisibility = (isVisible) => {
    const updates = {};
    
    availableColumns.forEach(col => {
      updates[col.key] = isVisible;
    });
    
    setVisibleColumns(updates);
  };
  
  // Get column data for table headers and cells based on visibility
  const getVisibleColumns = (tableType) => {
    const firstColumn = columnMappings[tableType] || columnMappings.form;
    
    return [
      firstColumn,
      ...availableColumns.filter(col => visibleColumns[col.key])
    ];
  };

  // Context value
  const contextValue = {
    visibleColumns,
    toggleColumnVisibility,
    setColumnCategoryVisibility,
    setAllColumnsVisibility,
    getVisibleColumns,
    availableColumns,
    columnCategories
  };

  return (
    <TableContext.Provider value={contextValue}>
      {children}
    </TableContext.Provider>
  );
};

// Custom hook to use the table context
export const useTableContext = () => {
  const context = useContext(TableContext);
  if (!context) {
    throw new Error('useTableContext must be used within a TableProvider');
  }
  return context;
};
