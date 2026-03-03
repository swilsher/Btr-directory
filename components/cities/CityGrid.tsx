'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Building2, Filter } from 'lucide-react';

interface CityData {
  name: string;
  slug: string;
  region: string;
  count: number;
  hasAreas: boolean;
}

interface CityGridProps {
  cities: CityData[];
  regions: string[];
}

export default function CityGrid({ cities, regions }: CityGridProps) {
  const [selectedRegion, setSelectedRegion] = useState('');

  const filteredCities = selectedRegion
    ? cities.filter((city) => city.region === selectedRegion)
    : cities;

  return (
    <>
      {/* Region filter */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-text-secondary" />
          <span className="text-sm font-medium text-text-secondary">Filter by Region</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedRegion('')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedRegion === ''
                ? 'bg-primary-blue text-white'
                : 'bg-white border border-border text-text-secondary hover:border-primary-blue hover:text-primary-blue'
            }`}
          >
            All Regions ({cities.length})
          </button>
          {regions.map((region) => {
            const count = cities.filter((c) => c.region === region).length;
            if (count === 0) return null;
            return (
              <button
                key={region}
                onClick={() => setSelectedRegion(region === selectedRegion ? '' : region)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedRegion === region
                    ? 'bg-primary-blue text-white'
                    : 'bg-white border border-border text-text-secondary hover:border-primary-blue hover:text-primary-blue'
                }`}
              >
                {region} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-text-secondary text-sm">
        {filteredCities.length} {filteredCities.length === 1 ? 'city' : 'cities'}
        {selectedRegion ? ` in ${selectedRegion}` : ' across the UK'}
      </div>

      {/* City cards grid */}
      {filteredCities.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary text-lg">No cities found in this region.</p>
          <button
            onClick={() => setSelectedRegion('')}
            className="mt-3 text-primary-blue hover:text-primary-blue-hover font-semibold text-sm"
          >
            Show all cities
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredCities.map((city) => (
            <Link key={city.slug} href={`/cities/${city.slug}`}>
              <div className="bg-white rounded-lg border border-border p-5 hover:border-primary-blue hover:shadow-md transition-all h-full">
                <div className="flex items-center mb-2">
                  <MapPin size={18} className="text-primary-blue mr-2 flex-shrink-0" />
                  <h2 className="text-lg font-semibold text-text-primary">{city.name}</h2>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-text-secondary text-sm">
                    <Building2 size={14} className="mr-1" />
                    <span>{city.count} {city.count === 1 ? 'development' : 'developments'}</span>
                  </div>
                  {city.hasAreas && (
                    <span className="text-xs text-primary-blue bg-primary-blue-light px-2 py-0.5 rounded-full">
                      Sub-areas
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-text-muted">{city.region}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
