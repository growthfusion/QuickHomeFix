import React, { useState, useMemo } from 'react';
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
  
  // The label for the button is now smarter.
  // It shows the preset label if a preset is active, otherwise shows the date range.
  const getButtonLabel = () => {
    if (selection.key) {
      const preset = PRESETS.find(p => p.value === selection.key);
      if (preset) return preset.label;
    }
    return formatDateRange(selection.startDate, selection.endDate);
  };

  return (
    <div className="relative p-4 font-sans">
      <button 
        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        onClick={() => setShowDatePicker(!showDatePicker)}
      >
        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{getButtonLabel()}</span>
      </button>
      
      {showDatePicker && (
        <DatePicker 
          initialSelection={selection}
          onApply={handleApply}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

// The DatePicker now tracks the active preset
function DatePicker({ initialSelection, onApply, onCancel }) {
  const [viewDate, setViewDate] = useState(initialSelection.startDate || new Date());
  const [startDate, setStartDate] = useState(initialSelection.startDate);
  const [endDate, setEndDate] = useState(initialSelection.endDate);
  // NEW: State to track the active preset's key
  const [activePresetKey, setActivePresetKey] = useState(initialSelection.key);

  const handleDayClick = (day) => {
    // When a user manually clicks a date, we clear the active preset.
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
    // NEW: Set the active preset key
    setActivePresetKey(preset.value);
  };
  
  const renderMonth = (dateToRender) => {
    // (This function remains unchanged)
    const monthStart = startOfMonth(dateToRender);
    const monthEnd = endOfMonth(dateToRender);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    return (
      <div className="w-72">
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
    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg p-6 w-auto z-10 border border-gray-200">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex flex-col space-y-2 w-40">
            {PRESETS.map((preset) => (
                <button
                    key={preset.value}
                    onClick={() => handlePreset(preset)}
                    className={`px-4 py-2 border rounded text-sm w-full text-left transition-colors ${ activePresetKey === preset.value ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold' : 'border-gray-300 text-gray-600 hover:bg-gray-50' }`}
                >
                    {preset.label}
                </button>
            ))}
        </div>
        <div className="flex gap-8">
            {firstCalendar}
            {secondCalendar}
        </div>
      </div>
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <div className="text-gray-700 font-medium">{formatDateRange(startDate, endDate)}</div>
        <div className="flex space-x-3">
          <button type="button" className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md" onClick={onCancel}>Cancel</button>
          <button 
            type="button"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
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