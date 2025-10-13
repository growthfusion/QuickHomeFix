// withColumnVisibility.jsx
import React from 'react';
import { useTableContext } from './TableContext';

// HOC that adds column visibility functionality to table components
export const withColumnVisibility = (WrappedComponent, tableType) => {
  return function EnhancedTableComponent(props) {
    const { getVisibleColumns } = useTableContext();
    const visibleColumns = getVisibleColumns(tableType);
    
    // Pass the visible columns data to the wrapped component
    return <WrappedComponent {...props} visibleColumns={visibleColumns} />;
  };
};
