'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface DevelopmentFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  showRegionFilter?: boolean;
}

export interface FilterValues {
  search: string;
  region: string;
  status: string;
  minUnits: string;
  maxUnits: string;
  amenityGym: boolean;
  amenityPool: boolean;
  amenityCoworking: boolean;
  amenityConcierge: boolean;
  petsAllowed: boolean;
  wheelchairAccessible: boolean;
}

const initialFilters: FilterValues = {
  search: '',
  region: '',
  status: '',
  minUnits: '',
  maxUnits: '',
  amenityGym: false,
  amenityPool: false,
  amenityCoworking: false,
  amenityConcierge: false,
  petsAllowed: false,
  wheelchairAccessible: false,
};

const regions = [
  'London',
  'South East',
  'South West',
  'East of England',
  'West Midlands',
  'East Midlands',
  'Yorkshire and the Humber',
  'North West',
  'North East',
  'Scotland',
  'Wales',
];

const statuses = [
  'Pre-Planning',
  'In Planning',
  'Under Construction',
  'Operational',
];

export default function DevelopmentFilters({ onFilterChange, showRegionFilter = true }: DevelopmentFiltersProps) {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof FilterValues, value: string | boolean) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    onFilterChange(initialFilters);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === 'search' || key === 'region' || key === 'status' || key === 'minUnits' || key === 'maxUnits') {
      return value !== '';
    }
    return value === true;
  });

  return (
    <div className="bg-white rounded-lg border border-border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary-blue hover:text-primary-blue-hover flex items-center"
          >
            <X size={16} className="mr-1" />
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-primary mb-2">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary" size={18} />
          <input
            type="text"
            placeholder="Search by name or location..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Region Filter */}
        {showRegionFilter && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Region
            </label>
            <select
              value={filters.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="input-field"
            >
              <option value="">All Regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input-field"
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Units Range */}
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Number of Units
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.minUnits}
              onChange={(e) => handleFilterChange('minUnits', e.target.value)}
              className="input-field"
            />
            <input
              type="number"
              placeholder="Max"
              value={filters.maxUnits}
              onChange={(e) => handleFilterChange('maxUnits', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center text-sm text-primary-blue hover:text-primary-blue-hover mb-4"
      >
        <SlidersHorizontal size={16} className="mr-1" />
        {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
      </button>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-border pt-4 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Amenities</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.amenityGym}
                  onChange={(e) => handleFilterChange('amenityGym', e.target.checked)}
                  className="rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                />
                <span className="text-sm text-text-secondary">Gym</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.amenityPool}
                  onChange={(e) => handleFilterChange('amenityPool', e.target.checked)}
                  className="rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                />
                <span className="text-sm text-text-secondary">Pool</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.amenityCoworking}
                  onChange={(e) => handleFilterChange('amenityCoworking', e.target.checked)}
                  className="rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                />
                <span className="text-sm text-text-secondary">Coworking</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.amenityConcierge}
                  onChange={(e) => handleFilterChange('amenityConcierge', e.target.checked)}
                  className="rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                />
                <span className="text-sm text-text-secondary">Concierge</span>
              </label>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-3">Accessibility</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.petsAllowed}
                  onChange={(e) => handleFilterChange('petsAllowed', e.target.checked)}
                  className="rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                />
                <span className="text-sm text-text-secondary">Pet Friendly</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.wheelchairAccessible}
                  onChange={(e) => handleFilterChange('wheelchairAccessible', e.target.checked)}
                  className="rounded border-gray-300 text-primary-blue focus:ring-primary-blue"
                />
                <span className="text-sm text-text-secondary">Wheelchair Accessible</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
