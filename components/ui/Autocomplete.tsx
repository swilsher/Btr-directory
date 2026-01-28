'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface AutocompleteOption {
  id: string;
  name: string;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value: string | null;  // Selected option ID
  onChange: (id: string | null, name: string | null) => void;
  placeholder?: string;
  label?: string;
  allowCustom?: boolean;  // Allow typing new values
}

export function Autocomplete({
  options,
  value,
  onChange,
  placeholder = 'Select or type...',
  label,
  allowCustom = false,
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customValue, setCustomValue] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Get selected option name
  const selectedOption = options.find(opt => opt.id === value);
  const displayValue = selectedOption?.name || customValue || '';

  // Filter options based on search
  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.id, option.name);
    setCustomValue('');
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = () => {
    onChange(null, null);
    setCustomValue('');
    setSearch('');
  };

  const handleCustomAdd = () => {
    if (!allowCustom || !search.trim()) return;

    // Check if similar option exists
    const similarOption = options.find(
      opt => opt.name.toLowerCase() === search.toLowerCase().trim()
    );

    if (similarOption) {
      // Select existing similar option instead
      handleSelect(similarOption);
    } else {
      // Add as custom value (will need to be created in database)
      setCustomValue(search.trim());
      onChange(null, search.trim());  // null ID indicates new entry
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <label className="text-xs text-gray-500 font-medium block mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={isOpen ? search : displayValue}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {displayValue && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={14} className="text-gray-400" />
            </button>
          )}
          <ChevronDown
            size={16}
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            <ul className="py-1">
              {filteredOptions.map(option => (
                <li
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                >
                  {option.name}
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              {search ? (
                allowCustom ? (
                  <button
                    onClick={handleCustomAdd}
                    className="w-full text-left hover:bg-gray-100 px-2 py-1 rounded"
                  >
                    Add &quot;{search}&quot;
                  </button>
                ) : (
                  'No matches found'
                )
              ) : (
                'Start typing to search...'
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
