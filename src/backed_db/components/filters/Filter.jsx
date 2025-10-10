import React, { useState } from 'react';

const FilterSelect = ({ label, name, options, value, onChange }) => {
  const customArrow = `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`;
  
  return (
    <div className="flex flex-col">
      <label htmlFor={name} className="mb-1 text-sm font-medium text-gray-600 capitalize">
        {label.replace('_', ' ')}
      </label>
      <div className="relative">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          className="custom-select w-40 cursor-pointer appearance-none rounded-md border border-gray-300 bg-white py-2 pl-3 pr-9 text-base text-gray-800 shadow-sm transition-colors duration-150 hover:border-gray-400 focus:outline-none"
          style={{ backgroundImage: customArrow, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

function Filter() {
  const [filterValues, setFilterValues] = useState({
    form: 'all',
    source: 'all',
    buyer: 'all',
    landing: 'all',
    widget_id: 'all',
    teaser_id: 'all',
    campaign_id: 'all',
    title: 'all',
    placement: 'all',
    state: 'all',
    device: 'all',
    os: 'all',
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterValues(prevValues => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const filterConfig = [
    { name: 'form', options: [{ value: 'all', label: 'All' }, { value: 'roof', label: 'Roof' }, { value: 'windows', label: 'Windows' }] },
    { name: 'source', options: [{ value: 'all', label: 'All' }, { value: 'google', label: 'Google' }] },
    { name: 'buyer', options: [{ value: 'all', label: 'All' }, { value: 'buyer_a', label: 'Buyer A' }] },
    { name: 'landing', options: [{ value: 'all', label: 'All' }, { value: 'page_1', label: 'Page 1' }] },
    { name: 'widget_id', options: [{ value: 'all', label: 'All' }, { value: 'w_101', label: 'W-101' }] },
    { name: 'teaser_id', options: [{ value: 'all', label: 'All' }, { value: 't_201', label: 'T-201' }] },
    { name: 'campaign_id', options: [{ value: 'all', label: 'All' }, { value: 'c_301', label: 'C-301' }] },
    { name: 'title', options: [{ value: 'all', label: 'All' }, { value: 'title_x', label: 'Title X' }] },
    { name: 'placement', options: [{ value: 'all', label: 'All' }, { value: 'top', label: 'Top' }] },
    { name: 'state', options: [{ value: 'all', label: 'All' }, { value: 'ca', label: 'CA' }] },
    { name: 'device', options: [{ value: 'all', label: 'All' }, { value: 'desktop', label: 'Desktop' }] },
    { name: 'os', options: [{ value: 'all', label: 'All' }, { value: 'windows', label: 'Windows' }] },
  ];

  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-5">
        {filterConfig.map((filter) => (
          <FilterSelect
            key={filter.name}
            label={filter.name}
            name={filter.name}
            options={filter.options}
            value={filterValues[filter.name]}
            onChange={handleFilterChange}
          />
        ))}
      </div>
    </div>
  );
}

export default Filter;