'use client';

import { Search, RotateCcw } from 'lucide-react';

interface MapFiltersProps {
  searchTerm: string;
  regionFilter: string;
  statusFilter: string;
  typeFilter: string;
  operatorFilter: string;
  operators: string[];
  onSearchChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onOperatorChange: (value: string) => void;
  onReset: () => void;
  totalCount: number;
  filteredCount: number;
}

const REGIONS = [
  'London', 'South East', 'South West', 'East of England',
  'East Midlands', 'West Midlands', 'North West', 'North East',
  'Yorkshire and The Humber', 'Scotland', 'Wales', 'Northern Ireland',
];

const STATUSES = ['In Planning', 'Under Construction', 'Operational'];
const TYPES = ['Multifamily', 'Single Family'];

export default function MapFilters({
  searchTerm,
  regionFilter,
  statusFilter,
  typeFilter,
  operatorFilter,
  operators,
  onSearchChange,
  onRegionChange,
  onStatusChange,
  onTypeChange,
  onOperatorChange,
  onReset,
  totalCount,
  filteredCount,
}: MapFiltersProps) {
  const hasActiveFilters = searchTerm || regionFilter || statusFilter || typeFilter || operatorFilter;

  return (
    <div className="bg-white border-b border-border px-4 lg:px-6 py-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Search developments..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue"
            />
          </div>

          {/* Type dropdown */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeChange(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue bg-white text-text-primary"
          >
            <option value="">All Types</option>
            {TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Region dropdown */}
          <select
            value={regionFilter}
            onChange={(e) => onRegionChange(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue bg-white text-text-primary"
          >
            <option value="">All Regions</option>
            {REGIONS.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          {/* Status dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue bg-white text-text-primary"
          >
            <option value="">All Statuses</option>
            {STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Operator dropdown */}
          <select
            value={operatorFilter}
            onChange={(e) => onOperatorChange(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue bg-white text-text-primary"
          >
            <option value="">All Operators</option>
            {operators.map(op => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>

          {/* Reset button */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-sm text-text-secondary hover:text-primary-blue transition-colors"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}

          {/* Result count */}
          <span className="text-sm text-text-secondary ml-auto">
            {filteredCount === totalCount
              ? `${totalCount} developments`
              : `${filteredCount} of ${totalCount} developments`}
          </span>
        </div>
      </div>
    </div>
  );
}
