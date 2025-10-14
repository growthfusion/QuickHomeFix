import React, { useState, useMemo, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth,
  isSameDay,
  addMonths, 
  subMonths,
  isAfter,
  isBefore,
  subDays,
  startOfDay,
  startOfYear,
  endOfYear,
  subYears,
} from 'date-fns';

// CSS for handling overflow
const styles = {
  wrapper: `relative p-4 font-sans`,
  button: `flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none`,
  datepickerContainer: `fixed inset-0 z-50 flex items-center justify-center md:block md:absolute md:inset-auto md:top-full md:left-0 md:mt-2`,
  overlay: `fixed inset-0 bg-black bg-opacity-30 md:hidden`,
  datepickerContent: `bg-white rounded-lg shadow-lg max-w-[calc(100vw-32px)] md:max-w-none overflow-hidden max-h-[90vh] md:max-h-[600px] overflow-y-auto z-50 border border-gray-200`,
  calendarLayout: `p-6`,
  flexColumn: `flex flex-col md:flex-row gap-4 md:gap-8`,
  presetsContainer: `flex flex-row md:flex-col space-x-2 md:space-x-0 md:space-y-2 w-full md:w-40 overflow-x-auto pb-2 md:pb-0 mb-2 md:mb-0`,
  calendarContainer: `flex flex-col md:flex-row gap-8 overflow-x-auto pb-2`,
  calendar: `w-full md:w-72`,
  metricsContainer: `w-full overflow-x-auto -mx-6 px-6 pb-2`,
  metricsRow: `flex min-w-max`,
  metricCell: `w-20 flex-shrink-0 text-sm text-gray-600 font-medium`,
  footerContainer: `flex flex-col md:flex-row items-start md:items-center justify-between mt-6 pt-4 border-t border-gray-200 px-6 pb-4`,
  dateDisplay: `text-gray-700 font-medium mb-2 md:mb-0`,
  buttonContainer: `flex space-x-3`,
  cancelButton: `px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md`,
  applyButton: `px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300`,
  presetButton: (isActive) => `px-4 py-2 border rounded text-sm whitespace-nowrap w-full text-left transition-colors ${
    isActive ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
  }`,
};

const PRESETS = [
    { label: 'Today', value: 'today'},
    { label: 'Yesterday', value: 'yesterday'},
    { label: 'Last 3 days', value: 'last3days' },
    { label: 'Last 7 days', value: 'last7days'},
    { label: 'Last 30 days', value: 'last30days'},
    { label: 'This Month', value: 'thisMonth'},
    { label: 'Last Month', value: 'lastMonth'},
    { label: 'This Year', value: 'thisYear'},
    { label: 'Last Year', value: 'lastYear'},
];

function formatDateRange(startDate, endDate) {
  if (!startDate) return "Select a date range";
  if (!endDate || isSameDay(startDate, endDate)) {
    return format(startDate, 'MMM d, yyyy');
  }
  return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
}




function DatePickerToggle() {
  const [selection, setSelection] = useState({
    startDate: subDays(new Date(), 2),
    endDate: new Date(),
    key: 'last3days' // Initial preset key
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleApply = (newSelection) => {
    setSelection(newSelection);
    setShowDatePicker(false);
  };

  const handleCancel = () => {
    setShowDatePicker(false);
  };
  
  const getButtonLabel = () => {
    if (selection.key) {
      const preset = PRESETS.find(p => p.value === selection.key);
      if (preset) return preset.label;
    }
    return formatDateRange(selection.startDate, selection.endDate);
  };

  // Close on outside click
  useEffect(() => {
    if (!showDatePicker) return;
    
    const handleClickOutside = (e) => {
      if (!e.target.closest('.datepicker-content') && !e.target.closest('.datepicker-toggle')) {
        setShowDatePicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  return (
    <div className={styles.wrapper}>
      <button 
        className={`${styles.button} datepicker-toggle`}
        onClick={() => setShowDatePicker(!showDatePicker)}
      >
        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{getButtonLabel()}</span>
      </button>
      
      {showDatePicker && (
        <div className={styles.datepickerContainer}>
          <div className={styles.overlay} onClick={handleCancel}></div>
          <div className={`${styles.datepickerContent} datepicker-content`}>
            <DatePicker 
              initialSelection={selection}
              onApply={handleApply}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DatePicker({ initialSelection, onApply, onCancel }) {
  const [viewDate, setViewDate] = useState(initialSelection.startDate || new Date());
  const [startDate, setStartDate] = useState(initialSelection.startDate);
  const [endDate, setEndDate] = useState(initialSelection.endDate);
  const [activePresetKey, setActivePresetKey] = useState(initialSelection.key);
  const [showSecondMonth, setShowSecondMonth] = useState(window.innerWidth > 768);

  // Handle responsive calendar display
  useEffect(() => {
    function handleResize() {
      setShowSecondMonth(window.innerWidth > 768);
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDayClick = (day) => {
    setActivePresetKey(null);
    if (!startDate || (startDate && endDate)) {
      setStartDate(day);
      setEndDate(null);
    } else if (isBefore(day, startDate)) {
      setStartDate(day);
    } else {
      setEndDate(day);
    }
  };
  
  const handlePreset = (preset) => {
    const today = startOfDay(new Date());
    let newStart;
    let newEnd = today;

    switch(preset.value) {
        case 'today': newStart = today; break;
        case 'yesterday': newStart = newEnd = subDays(today, 1); break;
        case 'last3days': newStart = subDays(today, 2); break;
        case 'last7days': newStart = subDays(today, 6); break;
        case 'last30days': newStart = subDays(today, 29); break;
        case 'thisMonth': newStart = startOfMonth(today); break;
        case 'lastMonth':
            const lastMonth = subMonths(today, 1);
            newStart = startOfMonth(lastMonth);
            newEnd = endOfMonth(lastMonth);
            break;
        case 'thisYear': newStart = startOfYear(today); break;
        case 'lastYear':
            const lastYear = subYears(today, 1);
            newStart = startOfYear(lastYear);
            newEnd = endOfYear(lastYear);
            break;
        default: return;
    }
    setStartDate(newStart);
    setEndDate(newEnd);
    setViewDate(newStart);
    setActivePresetKey(preset.value);
  };
  
  const renderMonth = (dateToRender) => {
    const monthStart = startOfMonth(dateToRender);
    const monthEnd = endOfMonth(dateToRender);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    return (
      <div className={styles.calendar}>
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-1 rounded-full hover:bg-gray-100">
             <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-gray-800 font-medium">{format(dateToRender, 'MMMM yyyy')}</h2>
          <button type="button" onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-1 rounded-full hover:bg-gray-100">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => <div key={day} className="text-gray-500 font-light py-1">{day}</div>)}
          {days.map(day => {
            const isCurrentMonth = isSameMonth(day, dateToRender);
            const isStartDate = startDate && isSameDay(day, startDate);
            const isEndDate = endDate && isSameDay(day, endDate);
            const isInRange = startDate && endDate && isAfter(day, startDate) && isBefore(day, endDate);
            let buttonClass = "py-2 rounded-full transition-colors duration-150 ease-in-out ";
            if (!isCurrentMonth) buttonClass += "text-gray-300";
            else if (isStartDate || isEndDate) buttonClass += "bg-blue-600 text-white";
            else if (isInRange) buttonClass += "bg-blue-100 text-blue-800 hover:bg-blue-200";
            else buttonClass += "text-gray-800 hover:bg-gray-100";
            return <button key={day.toString()} type="button" className={buttonClass} onClick={() => isCurrentMonth && handleDayClick(day)}>{format(day, 'd')}</button>;
          })}
        </div>
      </div>
    );
  };
  
  const firstCalendar = useMemo(() => renderMonth(viewDate), [viewDate, startDate, endDate]);
  const secondCalendar = useMemo(() => renderMonth(addMonths(viewDate, 1)), [viewDate, startDate, endDate]);

  return (
    <div className={styles.calendarLayout}>
      <div className={styles.flexColumn}>
        <div className={styles.presetsContainer}>
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePreset(preset)}
              className={styles.presetButton(activePresetKey === preset.value)}
            >
              {preset.label}
            </button>
          ))}
        </div>
        
        <div className={styles.calendarContainer}>
          {firstCalendar}
          {showSecondMonth && secondCalendar}
        </div>
      </div>
      
      
      <div className={styles.footerContainer}>
        <div className={styles.dateDisplay}>{formatDateRange(startDate, endDate)}</div>
        <div className={styles.buttonContainer}>
          <button type="button" className={styles.cancelButton} onClick={onCancel}>Cancel</button>
          <button 
            type="button"
            className={styles.applyButton}
            onClick={() => onApply({ startDate, endDate, key: activePresetKey })}
            disabled={!startDate || !endDate}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

export default DatePickerToggle;
